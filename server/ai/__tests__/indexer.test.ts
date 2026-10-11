import './setup';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Indexer } from '../indexer';
import { createMemoryFailureQueue } from '../failureQueue';
import { createFakeEmbedder, createFakeSource, createMemoryStore, event, patient } from './helpers';

function setup() {
  const source = createFakeSource({ patients: [patient('p1'), patient('p2')], events: [event('evt-1', 'p1', { title: 'Fatigue' }), event('evt-9', 'p2', { title: 'Cough' })] });
  const store = createMemoryStore();
  const embedder = createFakeEmbedder();
  const queue = createMemoryFailureQueue();
  const indexer = new Indexer({ source, embedder, store, queue, timeoutMs: 1000 });
  return { source, store, embedder, queue, indexer };
}

test('a new record is embedded and stored under its deterministic id with patient metadata', async () => {
  const { indexer, store } = setup();
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' });
  const row = store.rows.get('medical_event:evt-1')!;
  assert.equal(row.metadata.patient_id, 'p1');
  assert.equal(row.metadata.source_id, 'evt-1');
  assert.match(row.document, /Fatigue/);
  assert.equal(row.embedding.length, 64);
});

test('updating a record replaces its vector (same id, new content)', async () => {
  const { indexer, store, source } = setup();
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' });
  const before = store.rows.get('medical_event:evt-1')!.metadata.content_hash;
  source.data.events[0].title = 'Severe fatigue';
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' });
  assert.equal([...store.rows.keys()].filter(k => k === 'medical_event:evt-1').length, 1);
  assert.notEqual(store.rows.get('medical_event:evt-1')!.metadata.content_hash, before);
  assert.match(store.rows.get('medical_event:evt-1')!.document, /Severe fatigue/);
});

test('deleting a record removes its vector', async () => {
  const { indexer, store, source } = setup();
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' });
  source.data.events = source.data.events.filter(e => e.id !== 'evt-1');
  await indexer.handleChange({ type: 'delete', kind: 'event', id: 'evt-1', patientId: 'p1' });
  assert.equal(store.rows.has('medical_event:evt-1'), false);
});

test('index failure never throws, queues the job, and retry repairs it', async () => {
  const { indexer, store, queue } = setup();
  store.failing = true;
  await assert.doesNotReject(indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' }));
  assert.equal(queue.size(), 1);
  assert.equal(store.rows.size, 0);

  store.failing = false;
  assert.deepEqual(await indexer.retryFailed(), { attempted: 1, succeeded: 1 });
  assert.equal(queue.size(), 0);
  assert.ok(store.rows.has('medical_event:evt-1'));
});

test('embedder failure is handled the same way', async () => {
  const source = createFakeSource({ patients: [patient('p1')], events: [event('evt-1', 'p1')] });
  const queue = createMemoryFailureQueue();
  const indexer = new Indexer({ source, embedder: createFakeEmbedder({ failAfter: 0 }), store: createMemoryStore(), queue, timeoutMs: 1000 });
  await assert.doesNotReject(indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' }));
  assert.equal(queue.size(), 1);
});

test('a queued upsert for a record deleted in the meantime removes the vector instead', async () => {
  const { indexer, store, queue, source } = setup();
  store.failing = true;
  await indexer.handleChange({ type: 'upsert', kind: 'event', id: 'evt-1', patientId: 'p1' });
  store.failing = false;
  source.data.events = [];
  await indexer.retryFailed();
  assert.equal(store.rows.size, 0);
  assert.equal(queue.size(), 0);
});

test('reindex is idempotent: second run creates nothing and embeds nothing', async () => {
  const { indexer, store, embedder } = setup();
  const first = await indexer.reindexAll();
  assert.equal(first.upserted, 4); // 2 profiles + 2 events
  const rowsAfterFirst = store.rows.size;
  const callsAfterFirst = embedder.calls;
  const second = await indexer.reindexAll();
  assert.equal(second.upserted, 0);
  assert.equal(second.skippedUnchanged, 4);
  assert.equal(store.rows.size, rowsAfterFirst);
  assert.equal(embedder.calls, callsAfterFirst);
});

test('reindex removes stale vectors that no longer have a source record', async () => {
  const { indexer, store, source } = setup();
  await indexer.reindexAll();
  source.data.events = source.data.events.filter(e => e.id !== 'evt-1');
  const report = await indexer.reindexAll();
  assert.equal(report.deletedStale, 1);
  assert.equal(store.rows.has('medical_event:evt-1'), false);
});

test('reindex reports and queues failures without leaking record content', async () => {
  const source = createFakeSource({ patients: [patient('p1')], events: [event('evt-1', 'p1', { title: 'Fatigue' })] });
  const queue = createMemoryFailureQueue();
  const indexer = new Indexer({ source, embedder: createFakeEmbedder({ failAfter: 0 }), store: createMemoryStore(), queue, timeoutMs: 1000 });
  const report = await indexer.reindexAll();
  assert.equal(report.failed, 2);
  assert.equal(queue.size(), 2);
  assert.ok(report.failures.every(f => !/Fatigue|Secret/.test(f.reason)));
});
