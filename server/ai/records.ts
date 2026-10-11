import { createHash } from 'crypto';
import { db } from '../db';
import type { HealthEvent, Medication, MedicalReport, Patient, VitalRecord } from '../types';
import type { AuthorKind, MedicalRecord, RecordKind, VectorMetadata } from './types';

/**
 * Read access to the authoritative clinical store. The AI layer only ever reads through this
 * interface, so swapping the backing store (e.g. to Postgres/Supabase) means implementing it once.
 */
export interface RecordSource {
  listPatientIds(): string[];
  getPatient(patientId: string): Patient | undefined;
  getEvents(patientId: string): HealthEvent[];
  getMedications(patientId: string): Medication[];
  getVitals(patientId: string): VitalRecord[];
  getReports(patientId: string): MedicalReport[];
}

export const dbRecordSource: RecordSource = {
  listPatientIds: () => db.getPatients().map(p => p.id),
  getPatient: id => db.getPatientById(id),
  getEvents: id => db.getEvents({ patientId: id }),
  getMedications: id => db.getMedications(id),
  getVitals: id => db.getVitals(id),
  getReports: id => db.getReports(id),
};

const MAX_FIELD_CHARS = 1500;
const MAX_DOC_CHARS = 2400;

export const makeRecordId = (kind: RecordKind, sourceId: string) => `${kind}:${sourceId}`;

export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

/** Collapses whitespace, strips control characters and caps length. */
function clean(value: unknown, max = MAX_FIELD_CHARS): string {
  if (value === null || value === undefined) return '';
  const text = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Returns an ISO timestamp, or '' when the value is not a real date (some seed data uses "Today · Just now"). */
function toIso(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const t = Date.parse(value);
  return Number.isNaN(t) ? '' : new Date(t).toISOString();
}

function formatDate(iso: string, rawFallback?: string): string {
  if (!iso) return rawFallback ? `${clean(rawFallback, 60)} (exact date not recorded)` : 'not recorded';
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

const AUTHOR_BY_SOURCE: Record<string, AuthorKind> = {
  Patient: 'patient_reported',
  'Family / Caregiver': 'caregiver_reported',
  Clinician: 'clinician_recorded',
  Device: 'device',
  Report: 'report',
};

const AUTHOR_LABEL: Record<AuthorKind, string> = {
  patient_reported: 'patient-reported',
  caregiver_reported: 'caregiver-reported',
  clinician_recorded: 'doctor-recorded',
  device: 'device reading',
  report: 'from a report',
  system: 'author not recorded',
};

/** Flattens event metadata to short "key value" pairs; skips nested objects and file references. */
function measurements(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return '';
  const parts: string[] = [];
  const add = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return;
    if (typeof value === 'object') return;
    if (/url|attachment|token|password/i.test(key)) return;
    parts.push(`${clean(key, 40)} ${clean(value, 80)}`);
  };
  for (const [key, value] of Object.entries(metadata)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [k2, v2] of Object.entries(value as Record<string, unknown>)) add(`${key}.${k2}`, v2);
    } else {
      add(key, value);
    }
  }
  return parts.slice(0, 16).join('; ');
}

function finish(lines: Array<string | false | undefined>): string {
  const text = lines.filter((l): l is string => Boolean(l)).join('\n');
  return text.length > MAX_DOC_CHARS ? `${text.slice(0, MAX_DOC_CHARS)}…` : text;
}

function eventRecord(e: HealthEvent): MedicalRecord {
  const occurredAt = toIso(e.timestamp);
  const author = AUTHOR_BY_SOURCE[e.source] ?? 'system';
  const values = measurements(e.metadata);
  return {
    id: makeRecordId('medical_event', e.id),
    kind: 'medical_event',
    sourceId: e.id,
    patientId: e.patientId,
    occurredAt,
    author,
    title: clean(e.title, 120),
    text: finish([
      `Date: ${formatDate(occurredAt, e.timestamp)}`,
      `Record type: Health event (${clean(e.type, 30)})`,
      `Recorded by: ${AUTHOR_LABEL[author]}`,
      `Severity: ${clean(e.severity, 20)}`,
      `Title: ${clean(e.title, 200)}`,
      e.description && `Details: ${clean(e.description)}`,
      values && `Recorded values: ${values}`,
      `Doctor-verified: ${e.verified ? 'yes' : 'no'}`,
    ]),
  };
}

function medicationRecord(m: Medication): MedicalRecord {
  const log = (m.scheduleTimes || []).map(s => `${clean(s.time, 20)} ${clean(s.status, 20)}`).join(', ');
  return {
    id: makeRecordId('medication', m.id),
    kind: 'medication',
    sourceId: m.id,
    patientId: m.patientId,
    occurredAt: '',
    author: 'system',
    title: clean(`${m.name} ${m.dose}`, 120),
    text: finish([
      'Date: not recorded (current medication list entry)',
      'Record type: Medication',
      `Medication: ${clean(m.name, 120)} ${clean(m.dose, 60)}`,
      `Frequency: ${clean(m.frequency, 80)}`,
      `Status: ${clean(m.status, 20)}`,
      m.notes && `Notes: ${clean(m.notes)}`,
      log && `Dose log: ${log}`,
    ]),
  };
}

function vitalRecord(v: VitalRecord): MedicalRecord {
  const occurredAt = toIso(v.timestamp);
  const readings: Array<[string, unknown, string]> = [
    ['Temperature', v.temperature, '°F'],
    ['Blood pressure', v.bpSystolic !== undefined || v.bpDiastolic !== undefined ? `${v.bpSystolic ?? '--'}/${v.bpDiastolic ?? '--'}` : undefined, ' mmHg'],
    ['Heart rate', v.heartRate, ' bpm'],
    ['SpO2', v.spo2, '%'],
    ['Respiratory rate', v.respiratoryRate, '/min'],
    ['Blood glucose', v.bloodGlucose, ' mg/dL'],
  ];
  const list = readings.filter(([, value]) => value !== undefined && value !== null).map(([k, value, unit]) => `${k} ${clean(value, 20)}${unit}`);
  return {
    id: makeRecordId('vital', v.id),
    kind: 'vital',
    sourceId: v.id,
    patientId: v.patientId,
    occurredAt,
    author: 'system',
    title: clean(`Vitals ${formatDate(occurredAt)}`, 120),
    text: finish([
      `Date: ${formatDate(occurredAt, v.timestamp)}`,
      'Record type: Vital signs reading',
      `Recorded by: ${AUTHOR_LABEL.system}`,
      list.length ? `Readings: ${list.join('; ')}` : 'Readings: none recorded',
      v.notes && `Notes: ${clean(v.notes)}`,
    ]),
  };
}

function reportRecord(r: MedicalReport): MedicalRecord {
  const occurredAt = toIso(r.uploadedAt);
  const extracted = Object.entries(r.extractedData || {}).slice(0, 20).map(([k, value]) => `${clean(k, 60)} ${clean(value, 80)}`).join('; ');
  return {
    id: makeRecordId('report', r.id),
    kind: 'report',
    sourceId: r.id,
    patientId: r.patientId,
    occurredAt,
    author: 'report',
    title: clean(r.title, 120),
    text: finish([
      `Date: ${formatDate(occurredAt, r.uploadedAt)}`,
      `Record type: Report (${clean(r.reportType, 40)})`,
      `Title: ${clean(r.title, 200)}`,
      r.summary && `Summary recorded with the report: ${clean(r.summary)}`,
      extracted && `Extracted values: ${extracted}`,
    ]),
  };
}

/** Medical history from the patient profile. The patient's name and contact details are intentionally excluded. */
function profileRecord(p: Patient): MedicalRecord {
  return {
    id: makeRecordId('patient_profile', p.id),
    kind: 'patient_profile',
    sourceId: p.id,
    patientId: p.id,
    occurredAt: '',
    author: 'system',
    title: 'Patient history profile',
    text: finish([
      'Date: not recorded (current profile)',
      'Record type: Patient history profile',
      `Age: ${clean(p.age, 4)}; Sex: ${clean(p.sex, 12)}`,
      `Known conditions: ${(p.conditions || []).map(c => clean(c, 80)).join('; ') || 'none documented'}`,
      `Documented allergies: ${(p.allergies || []).map(a => clean(a, 80)).join('; ') || 'none documented'}`,
    ]),
  };
}

/** Every indexable record for one patient, normalised from the authoritative store. */
export function buildPatientRecords(source: RecordSource, patientId: string): MedicalRecord[] {
  const patient = source.getPatient(patientId);
  if (!patient) return [];
  return [
    profileRecord(patient),
    ...source.getEvents(patientId).map(eventRecord),
    ...source.getMedications(patientId).map(medicationRecord),
    ...source.getVitals(patientId).map(vitalRecord),
    ...source.getReports(patientId).map(reportRecord),
  ];
}

const KIND_FOR_CHANGE = {
  event: 'medical_event',
  medication: 'medication',
  vital: 'vital',
  report: 'report',
  patient: 'patient_profile',
} as const;

export const recordKindForChange = (kind: keyof typeof KIND_FOR_CHANGE): RecordKind => KIND_FOR_CHANGE[kind];

/** Looks a single record up in the authoritative store; undefined when it no longer exists. */
export function buildRecord(source: RecordSource, kind: RecordKind, sourceId: string, patientId: string): MedicalRecord | undefined {
  const id = makeRecordId(kind, sourceId);
  return buildPatientRecords(source, patientId).find(r => r.id === id);
}

export function toVectorMetadata(record: MedicalRecord): VectorMetadata {
  return {
    patient_id: record.patientId,
    record_type: record.kind,
    source_id: record.sourceId,
    occurred_at: record.occurredAt,
    author: record.author,
    content_hash: sha256(record.text),
  };
}
