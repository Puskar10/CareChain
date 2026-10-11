import './setup';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPatientRecords, makeRecordId, toVectorMetadata } from '../records';
import { createFakeSource, event, patient } from './helpers';

const source = createFakeSource({
  patients: [patient('p1')],
  events: [
    event('evt-1', 'p1', { title: 'Dizziness', description: 'Felt dizzy\n\twhen standing', metadata: { temperature: 99.8, attachmentUrl: 'http://x', nested: { bp: '140/90' } } }),
    event('evt-2', 'p1', { source: 'Clinician', title: 'Doctor note', timestamp: 'Today · Just now' }),
  ],
  medications: [{ id: 'med-1', patientId: 'p1', name: 'Amoxicillin', dose: '500mg', frequency: 'BD', scheduleTimes: [{ time: '08:00 AM', status: 'taken' }], status: 'active', notes: 'with food' }],
});

test('every record gets a deterministic <kind>:<sourceId> id', () => {
  const ids = buildPatientRecords(source, 'p1').map(r => r.id).sort();
  assert.deepEqual(ids, ['medical_event:evt-1', 'medical_event:evt-2', 'medication:med-1', 'patient_profile:p1']);
  assert.equal(makeRecordId('report', 'rep-9'), 'report:rep-9');
  assert.deepEqual(buildPatientRecords(source, 'p1').map(r => r.id), buildPatientRecords(source, 'p1').map(r => r.id));
});

test('documents contain no names, contact details or other patients', () => {
  const text = buildPatientRecords(source, 'p1').map(r => r.text).join('\n');
  assert.doesNotMatch(text, /Secret Name|Contact Person|555|Some Person Name/);
});

test('patient-reported and doctor-recorded entries stay distinguishable', () => {
  const recs = buildPatientRecords(source, 'p1');
  assert.equal(recs.find(r => r.sourceId === 'evt-1')!.author, 'patient_reported');
  assert.equal(recs.find(r => r.sourceId === 'evt-2')!.author, 'clinician_recorded');
  assert.match(recs.find(r => r.sourceId === 'evt-2')!.text, /Recorded by: doctor-recorded/);
});

test('whitespace is normalised, file references and nesting handled, undated records are not given fake dates', () => {
  const evt1 = buildPatientRecords(source, 'p1').find(r => r.sourceId === 'evt-1')!;
  assert.match(evt1.text, /Details: Felt dizzy when standing/);
  assert.match(evt1.text, /temperature 99\.8/);
  assert.match(evt1.text, /nested\.bp 140\/90/);
  assert.doesNotMatch(evt1.text, /http/);
  const undated = buildPatientRecords(source, 'p1').find(r => r.sourceId === 'evt-2')!;
  assert.equal(undated.occurredAt, '');
  assert.match(undated.text, /exact date not recorded/);
});

test('vector metadata is minimal and carries a content hash', () => {
  const meta = toVectorMetadata(buildPatientRecords(source, 'p1')[1]);
  assert.deepEqual(Object.keys(meta).sort(), ['author', 'content_hash', 'occurred_at', 'patient_id', 'record_type', 'source_id']);
  assert.match(meta.content_hash, /^[0-9a-f]{64}$/);
});

test('unknown patient yields no records', () => {
  assert.deepEqual(buildPatientRecords(source, 'nope'), []);
});
