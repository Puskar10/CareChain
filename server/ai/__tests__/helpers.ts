import type { Embedder } from '../embeddings';
import type { OverviewModel } from '../gemini';
import type { RecordSource } from '../records';
import type { VectorStore } from '../chroma';
import type { VectorRecord } from '../types';
import type { HealthEvent, Medication, MedicalReport, Patient, VitalRecord } from '../../types';

const DIM = 64;

/** Deterministic bag-of-words hashing embedder: similar wording → similar vectors. No network. */
export function createFakeEmbedder(opts: { failAfter?: number } = {}): Embedder & { calls: number } {
  const embedOne = (text: string): number[] => {
    const v = new Array<number>(DIM).fill(0);
    for (const word of text.toLowerCase().match(/[a-z]{3,}/g) ?? []) {
      let h = 0;
      for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      v[h % DIM] += 1;
    }
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map(x => x / norm);
  };
  const self = {
    calls: 0,
    signature: 'fake-hash@64',
    async embedDocuments(texts: string[]) {
      self.calls++;
      if (opts.failAfter !== undefined && self.calls > opts.failAfter) throw new Error('embedder down');
      return texts.map(embedOne);
    },
    async embedQuery(text: string) {
      return embedOne(text);
    },
  };
  return self;
}

/** In-memory VectorStore with the same contract as the Chroma wrapper (patient-scoped query). */
export function createMemoryStore(): VectorStore & { rows: Map<string, VectorRecord>; failing: boolean; queries: string[] } {
  const rows = new Map<string, VectorRecord>();
  const self = {
    rows,
    failing: false,
    queries: [] as string[],
    async upsert(records: VectorRecord[]) {
      if (self.failing) throw new Error('chroma down');
      records.forEach(r => rows.set(r.id, r));
    },
    async deleteByIds(ids: string[]) {
      if (self.failing) throw new Error('chroma down');
      ids.forEach(id => rows.delete(id));
    },
    async listForPatient(patientId: string) {
      if (self.failing) throw new Error('chroma down');
      return [...rows.values()].filter(r => r.metadata.patient_id === patientId).map(r => ({ id: r.id, contentHash: r.metadata.content_hash }));
    },
    async query(patientId: string, embedding: number[], limit: number) {
      if (self.failing) throw new Error('chroma down');
      self.queries.push(patientId);
      return [...rows.values()]
        .filter(r => r.metadata.patient_id === patientId)
        .map(r => ({ id: r.id, distance: 1 - r.embedding.reduce((s, x, i) => s + x * embedding[i], 0) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
    },
    async reset() {
      rows.clear();
    },
  };
  return self;
}

export interface FakeData {
  patients: Patient[];
  events: HealthEvent[];
  medications: Medication[];
  vitals: VitalRecord[];
  reports: MedicalReport[];
}

export const patient = (id: string, over: Partial<Patient> = {}): Patient => ({
  id, fullName: `Secret Name ${id}`, age: 50, sex: 'Male', bloodGroup: 'O+', conditions: ['Hypertension'], allergies: ['Penicillin'],
  emergencyContact: { name: 'Contact Person', phone: '+1 555 000 1111', relationship: 'Spouse' },
  primaryPhysician: 'Dr. Someone', status: 'Stable', lastUpdated: 'now', ...over,
});

export const event = (id: string, patientId: string, over: Partial<HealthEvent> = {}): HealthEvent => ({
  id, patientId, type: 'symptom', timestamp: '2026-09-01T08:00:00Z', severity: 'mild', title: 'Event', description: '',
  source: 'Patient', createdBy: 'Some Person Name', metadata: {}, ...over,
});

export function createFakeSource(data: Partial<FakeData>): RecordSource & { data: FakeData } {
  const d: FakeData = { patients: [], events: [], medications: [], vitals: [], reports: [], ...data };
  return {
    data: d,
    listPatientIds: () => d.patients.map(p => p.id),
    getPatient: id => d.patients.find(p => p.id === id),
    getEvents: id => d.events.filter(e => e.patientId === id),
    getMedications: id => d.medications.filter(m => m.patientId === id),
    getVitals: id => d.vitals.filter(v => v.patientId === id),
    getReports: id => d.reports.filter(r => r.patientId === id),
  };
}

/** Model double: returns whatever JSON the test supplies and records the prompts it received. */
export function createFakeModel(respond: (prompt: string) => string | Promise<string>): OverviewModel & { prompts: string[]; systems: string[] } {
  const self = {
    name: 'fake-model',
    prompts: [] as string[],
    systems: [] as string[],
    async generate(system: string, prompt: string) {
      self.systems.push(system);
      self.prompts.push(prompt);
      return respond(prompt);
    },
  };
  return self;
}

export const validOverviewJson = (ids: string[]) => JSON.stringify({
  headline: 'Dizziness recorded', summary: 'The records show dizziness on the latest date.',
  recent_events: ['Dizziness'], relevant_history: ['Earlier fatigue'],
  attention_points: [{ statement: 'Recurrent symptoms are documented', basis: 'Two entries', source_record_ids: ids.slice(0, 2) }],
  patient_reported: ['Dizziness'], doctor_recorded: [], cautious_observations: ['Symptoms recur'],
  missing_information: ['No vitals'], clarifying_questions: ['When did it start?'], source_record_ids: ids.slice(0, 2),
});
