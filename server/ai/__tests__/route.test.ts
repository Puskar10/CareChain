import './setup';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import express from 'express';
import { createFakeEmbedder, createFakeModel, createMemoryStore, validOverviewJson } from './helpers';
import { clearOverviewCache, setOverviewDepsForTesting } from '../overview';
import { dbRecordSource } from '../records';
import { Indexer } from '../indexer';
import { createMemoryFailureQueue } from '../failureQueue';
import type { User } from '../../types';

// Imported dynamically so the temp working directory from ./setup is in place first.
const { db } = await import('../../db');
const { generateToken } = await import('../../middleware/auth');
const { default: aiRoutes } = await import('../../routes/ai');
const { canUserAccessPatient } = await import('../authz');

const REAL_PATIENT = 'a1111111-1111-1111-1111-111111111111';
const OTHER_PATIENT = 'b2222222-2222-2222-2222-222222222222';

let server: ReturnType<ReturnType<typeof express>['listen']>;
let base = '';
const token = (email: string) => generateToken(db.findUserByEmail(email)!);
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });

before(() => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/ai`;
});
after(() => { server.close(); setOverviewDepsForTesting(null); });

const fakeDeps = (model = createFakeModel(() => validOverviewJson(['patient_profile:' + REAL_PATIENT]))) => {
  const embedder = createFakeEmbedder();
  const store = createMemoryStore();
  return { model, store, embedder, deps: { source: dbRecordSource, model, embedder, store, timeoutMs: 1000, now: () => new Date() } };
};

test('overview requires authentication', async () => {
  const res = await post('/patient-overview', { patientId: REAL_PATIENT });
  assert.equal(res.status, 401);
});

test('overview is doctor-only: patient, caregiver and EMS tokens are refused', async () => {
  for (const email of ['patient@carechain.health', 'caregiver@carechain.health', 'paramedic@carechain.health']) {
    const res = await post('/patient-overview', { patientId: REAL_PATIENT }, { authorization: `Bearer ${token(email)}` });
    assert.equal(res.status, 403, email);
  }
});

test('a patient-supplied or missing patientId is validated server-side', async () => {
  const auth = { authorization: `Bearer ${token('doctor@carechain.health')}` };
  assert.equal((await post('/patient-overview', {}, auth)).status, 400);
  assert.equal((await post('/patient-overview', { patientId: 123 }, auth)).status, 400);
  // Nonexistent patients and unauthorised ones look identical.
  const res = await post('/patient-overview', { patientId: 'ghost' }, auth);
  assert.equal(res.status, 403);
  assert.equal((await res.json() as { code: string }).code, 'forbidden');
});

test('authorised doctor gets a grounded overview and an audit entry is written', async () => {
  const { deps, model } = fakeDeps();
  setOverviewDepsForTesting(deps);
  clearOverviewCache();
  const before = db.getAuditLogs(REAL_PATIENT).length;
  const res = await post('/patient-overview', { patientId: REAL_PATIENT }, { authorization: `Bearer ${token('doctor@carechain.health')}` });
  assert.equal(res.status, 200);
  const body = await res.json() as { success: boolean; data: { overview: { summary: string; source_record_ids: string[] }; records: unknown[]; meta: { notice: string } } };
  assert.equal(body.success, true);
  assert.ok(body.data.overview.summary.length > 0);
  assert.ok(body.data.records.length > 0);
  assert.equal(model.prompts.length, 1);
  assert.equal(db.getAuditLogs(REAL_PATIENT).length, before + 1);
  assert.doesNotMatch(JSON.stringify(body), /GEMINI|AIza|api[_-]?key/i);
});

test('without a Gemini key the endpoint answers 503 with a generic message and nothing else breaks', async () => {
  setOverviewDepsForTesting(null);
  const saved = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const res = await post('/patient-overview', { patientId: REAL_PATIENT }, { authorization: `Bearer ${token('doctor@carechain.health')}` });
    assert.equal(res.status, 503);
    const body = await res.json() as { error: string; code: string };
    assert.equal(body.error, 'AI overview is temporarily unavailable.');
    assert.equal(body.code, 'ai_not_configured');
    // Core data is unaffected.
    assert.ok(db.getEvents({ patientId: REAL_PATIENT }).length > 0);
  } finally {
    if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
  }
});

test('model failure returns a safe 503 without leaking provider detail', async () => {
  const { deps } = fakeDeps(createFakeModel(() => { throw new Error('quota exceeded for key AIzaSECRET'); }));
  setOverviewDepsForTesting(deps);
  clearOverviewCache();
  const res = await post('/patient-overview', { patientId: REAL_PATIENT }, { authorization: `Bearer ${token('doctor@carechain.health')}` });
  assert.equal(res.status, 503);
  assert.doesNotMatch(JSON.stringify(await res.json()), /AIza|quota/);
});

test('per-user rate limit protects the model', async () => {
  const { deps } = fakeDeps(createFakeModel(() => 'not json'));
  setOverviewDepsForTesting(deps);
  const auth = { authorization: `Bearer ${token('doctor@carechain.health')}` };
  const statuses: number[] = [];
  for (let i = 0; i < 20; i++) statuses.push((await post('/patient-overview', { patientId: REAL_PATIENT }, auth)).status);
  assert.ok(statuses.includes(429));
});

test('reindex endpoint is disabled without AI_ADMIN_TOKEN and refuses wrong tokens', async () => {
  delete process.env.AI_ADMIN_TOKEN;
  assert.equal((await post('/reindex', {}, { authorization: `Bearer ${token('doctor@carechain.health')}` })).status, 404);
  process.env.AI_ADMIN_TOKEN = 'correct-horse';
  try {
    assert.equal((await post('/reindex', {})).status, 403);
    assert.equal((await post('/reindex', {}, { 'x-admin-token': 'wrong' })).status, 403);
    // Even a logged-in doctor is not an operator.
    assert.equal((await post('/reindex', {}, { authorization: `Bearer ${token('doctor@carechain.health')}` })).status, 403);
  } finally {
    delete process.env.AI_ADMIN_TOKEN;
  }
});

test('authorisation mirrors the existing patient-list rules', () => {
  const user = (over: Partial<User>): User => ({ id: 'u', email: 'x@hospital.org', fullName: 'Nobody', role: 'doctor', createdAt: '', ...over });
  // Demo doctor: all patients. Real doctor: only assigned (primary physician match). Others: only their own patient.
  assert.equal(canUserAccessPatient(user({ email: 'doctor@carechain.health' }), OTHER_PATIENT), true);
  assert.equal(canUserAccessPatient(user({ fullName: 'Arvind Mehta' }), REAL_PATIENT), true);
  assert.equal(canUserAccessPatient(user({ fullName: 'Arvind Mehta' }), OTHER_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ fullName: 'Unassigned Doctor' }), REAL_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ role: 'patient', patientId: REAL_PATIENT }), REAL_PATIENT), true);
  assert.equal(canUserAccessPatient(user({ role: 'patient', patientId: REAL_PATIENT }), OTHER_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ role: 'patient' }), REAL_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ role: 'family', patientId: REAL_PATIENT }), OTHER_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ role: 'ems' }), REAL_PATIENT), false);
  assert.equal(canUserAccessPatient(user({ email: 'doctor@carechain.health' }), 'ghost'), false);
});

test('database writes notify the indexer, including events the database derives itself', async () => {
  const store = createMemoryStore();
  const indexer = new Indexer({ source: dbRecordSource, embedder: createFakeEmbedder(), store, queue: createMemoryFailureQueue(), timeoutMs: 1000 });
  const off = db.onChange(c => void indexer.handleChange(c));
  try {
    const vital = db.createVital({ patientId: REAL_PATIENT, temperature: 101.2, heartRate: 99 }, 'Test');
    await new Promise(r => setTimeout(r, 100));
    assert.ok(store.rows.has(`vital:${vital.id}`), 'vital record indexed');
    const derived = db.getEvents({ patientId: REAL_PATIENT }).filter(e => e.type === 'vital' && e.source === 'Device').at(-1)!;
    assert.ok(store.rows.has(`medical_event:${derived.id}`), 'derived event indexed');

    db.deleteEvent(derived.id);
    await new Promise(r => setTimeout(r, 100));
    assert.equal(store.rows.has(`medical_event:${derived.id}`), false, 'deleted event vector removed');
  } finally {
    off();
  }
});
