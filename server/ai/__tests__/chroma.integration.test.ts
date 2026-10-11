/**
 * Runs against a REAL ChromaDB. Skipped unless CHROMA_TEST_URL is set, e.g.
 *   CHROMA_TEST_URL=http://localhost:8000 npm run test:ai
 * Embeddings come from a deterministic local fake, so no Gemini key is needed here.
 */
import './setup';
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createChromaStore, type VectorStore } from '../chroma';
import { createMemoryFailureQueue } from '../failureQueue';
import { Indexer } from '../indexer';
import { clearOverviewCache, generatePatientOverview } from '../overview';
import { createFakeEmbedder, createFakeModel, createFakeSource, event, patient, validOverviewJson } from './helpers';

const url = process.env.CHROMA_TEST_URL;
const skip = url ? false : 'set CHROMA_TEST_URL to run against a real ChromaDB';

const collection = `carechain_it_${Date.now()}`;
let store: VectorStore;

before(() => {
  if (!url) return;
  process.env.CHROMA_URL = url;
  process.env.CHROMA_COLLECTION = collection;
  process.env.AI_REQUEST_TIMEOUT_MS = '10000';
  store = createChromaStore('fake-hash@64');
});
after(async () => {
  if (url) await store.reset().catch(() => undefined);
});

const world = () => createFakeSource({
  patients: [patient('p1'), patient('p2')],
  events: [
    event('a1', 'p1', { timestamp: '2026-08-15T09:00:00Z', title: 'Shortness of breath', description: 'breathless climbing stairs' }),
    event('a2', 'p1', { timestamp: '2026-09-20T09:00:00Z', title: 'Fatigue', description: 'tired all week' }),
    event('a3', 'p1', { timestamp: '2026-10-10T09:00:00Z', title: 'Dizziness', description: 'dizzy when standing, breathless' }),
    event('b1', 'p2', { timestamp: '2026-10-09T09:00:00Z', title: 'Chest pain', description: 'OTHER-PATIENT-SECRET breathless' }),
  ],
});

test('reindex writes every record to ChromaDB, then a second run is a no-op (idempotent, no duplicates)', { skip }, async () => {
  const source = world();
  const embedder = createFakeEmbedder();
  const indexer = new Indexer({ source, embedder, store, queue: createMemoryFailureQueue(), timeoutMs: 10000 });

  const first = await indexer.reindexAll({ reset: true });
  assert.equal(first.failed, 0);
  assert.equal(first.upserted, 6); // 2 profiles + 4 events
  const p1 = await store.listForPatient('p1');
  assert.deepEqual(p1.map(v => v.id).sort(), ['medical_event:a1', 'medical_event:a2', 'medical_event:a3', 'patient_profile:p1']);
  assert.ok(p1.every(v => /^[0-9a-f]{64}$/.test(v.contentHash)));

  const calls = embedder.calls;
  const second = await indexer.reindexAll();
  assert.equal(second.upserted, 0);
  assert.equal(second.skippedUnchanged, 6);
  assert.equal(embedder.calls, calls);
  assert.equal((await store.listForPatient('p1')).length, 4);
  assert.equal((await store.listForPatient('p2')).length, 2);
});

test('queries are patient-scoped: patient 1 can never retrieve patient 2\'s vectors', { skip }, async () => {
  const embedder = createFakeEmbedder();
  // The query text deliberately matches patient 2's record best.
  const q = await embedder.embedQuery('Chest pain OTHER-PATIENT-SECRET breathless');
  const hits = await store.query('p1', q, 50);
  assert.ok(hits.length > 0);
  assert.ok(hits.every(h => !h.id.includes('b1') && h.id !== 'patient_profile:p2'));
  assert.deepEqual(hits.map(h => h.id).sort(), ['medical_event:a1', 'medical_event:a2', 'medical_event:a3', 'patient_profile:p1']);
  const other = await store.query('p2', q, 50);
  assert.ok(other.every(h => h.id === 'medical_event:b1' || h.id === 'patient_profile:p2'));
  assert.equal((await store.query('nobody', q, 5)).length, 0);
});

test('semantic ranking: the most similar earlier record comes first', { skip }, async () => {
  const q = await createFakeEmbedder().embedQuery('breathless dizzy standing');
  const hits = await store.query('p1', q, 3);
  assert.equal(hits[0].id, 'medical_event:a3');
});

test('update replaces a vector in place; delete and stale cleanup remove it', { skip }, async () => {
  const source = world();
  const indexer = new Indexer({ source, embedder: createFakeEmbedder(), store, queue: createMemoryFailureQueue(), timeoutMs: 10000 });
  await indexer.reindexAll();
  const before = (await store.listForPatient('p1')).find(v => v.id === 'medical_event:a2')!.contentHash;

  source.data.events.find(e => e.id === 'a2')!.description = 'severe exhaustion';
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'a2', patientId: 'p1' });
  const afterList = await store.listForPatient('p1');
  assert.equal(afterList.filter(v => v.id === 'medical_event:a2').length, 1);
  assert.notEqual(afterList.find(v => v.id === 'medical_event:a2')!.contentHash, before);

  source.data.events = source.data.events.filter(e => e.id !== 'a1');
  await indexer.handleChange({ type: 'delete', kind: 'event', id: 'a1', patientId: 'p1' });
  assert.ok(!(await store.listForPatient('p1')).some(v => v.id === 'medical_event:a1'));

  // A vector orphaned behind the indexer's back is removed by the next reindex.
  const e = createFakeEmbedder();
  await store.upsert([{ id: 'medical_event:ghost', embedding: await e.embedQuery('ghost'), document: 'ghost', metadata: { patient_id: 'p1', record_type: 'medical_event', source_id: 'ghost', occurred_at: '', author: 'system', content_hash: 'x' } }]);
  const report = await indexer.reindexPatient('p1');
  assert.equal(report.deletedStale, 1);
  assert.ok(!(await store.listForPatient('p1')).some(v => v.id === 'medical_event:ghost'));
});

test('end to end: overview uses real ChromaDB retrieval and sees only the authorised patient', { skip }, async () => {
  clearOverviewCache();
  const source = world();
  const embedder = createFakeEmbedder();
  const indexer = new Indexer({ source, embedder, store, queue: createMemoryFailureQueue(), timeoutMs: 10000 });
  await indexer.reindexAll();
  const model = createFakeModel(() => validOverviewJson(['medical_event:a3', 'medical_event:a1']));
  const out = await generatePatientOverview({ source, model, embedder, store, timeoutMs: 10000, now: () => new Date('2026-10-11T00:00:00Z') }, 'p1');

  assert.equal(out.meta.retrieval, 'semantic');
  assert.ok(out.records.some(r => r.via === 'semantic'));
  assert.match(model.prompts[0], /Dizziness/);
  assert.doesNotMatch(model.prompts[0], /OTHER-PATIENT-SECRET/);
  assert.deepEqual(out.overview.source_record_ids.sort(), ['medical_event:a1', 'medical_event:a3']);
});

test('a collection built with a different embedding model is refused (forces a deliberate reset)', { skip }, async () => {
  const mismatched = createChromaStore('some-other-model@1024');
  await assert.rejects(mismatched.listForPatient('p1'), /embedding/);
});

test('ChromaDB unreachable: indexing is queued (record saved elsewhere) and overview falls back', { skip }, async () => {
  const saved = process.env.CHROMA_URL;
  process.env.CHROMA_URL = 'http://127.0.0.1:1'; // nothing listens here
  try {
    const dead = createChromaStore('fake-hash@64');
    const source = world();
    const queue = createMemoryFailureQueue();
    const embedder = createFakeEmbedder();
    const indexer = new Indexer({ source, embedder, store: dead, queue, timeoutMs: 3000 });
    await assert.doesNotReject(indexer.handleChange({ type: 'upsert', kind: 'event', id: 'a3', patientId: 'p1' }));
    assert.equal(queue.size(), 1);

    clearOverviewCache();
    const model = createFakeModel(() => validOverviewJson(['medical_event:a3']));
    const out = await generatePatientOverview({ source, model, embedder, store: dead, timeoutMs: 3000, now: () => new Date() }, 'p1');
    assert.equal(out.meta.retrieval, 'recency_fallback');
  } finally {
    process.env.CHROMA_URL = saved;
  }
});

test('a live store recovers when the collection is dropped and recreated behind it (ai:reindex --reset)', { skip }, async () => {
  const live = createChromaStore('fake-hash@64');
  await live.listForPatient('p1'); // caches the collection handle
  const other = createChromaStore('fake-hash@64');
  await other.reset(); // new collection with the same name, new id
  // Without recovery this throws "collection could not be found".
  await assert.doesNotReject(live.listForPatient('p1'));
  const e = createFakeEmbedder();
  await live.upsert([{ id: 'medical_event:x', embedding: await e.embedQuery('x'), document: 'x', metadata: { patient_id: 'p1', record_type: 'medical_event', source_id: 'x', occurred_at: '', author: 'system', content_hash: 'h' } }]);
  assert.deepEqual((await live.query('p1', await e.embedQuery('x'), 5)).map(h => h.id), ['medical_event:x']);
});
