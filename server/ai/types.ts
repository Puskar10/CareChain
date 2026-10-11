/**
 * Shared types for CareChain's AI layer (ChromaDB retrieval + Gemini summarisation).
 *
 * The authoritative clinical data lives in the CareChain data store (server/db.ts).
 * ChromaDB only holds a derived search index of it; Gemini only summarises what is retrieved.
 */

/** Kinds of authoritative records that are indexed for retrieval. */
export type RecordKind = 'medical_event' | 'medication' | 'vital' | 'report' | 'patient_profile';

/** Who authored a record. Kept explicit so the AI never blurs patient-reported and clinician-recorded facts. */
export type AuthorKind = 'patient_reported' | 'caregiver_reported' | 'clinician_recorded' | 'device' | 'report' | 'system';

/** A normalised, authoritative record ready to be embedded and/or shown to the summariser. */
export interface MedicalRecord {
  /** Deterministic vector ID: `<kind>:<sourceId>`, e.g. `medical_event:evt-12`. */
  id: string;
  kind: RecordKind;
  /** ID of the record in the authoritative store. */
  sourceId: string;
  patientId: string;
  /** ISO timestamp the record refers to; empty when the source record is undated. */
  occurredAt: string;
  author: AuthorKind;
  /** Short human label used in provenance listings. */
  title: string;
  /** Normalised document text (what gets embedded and sent to the summariser). Contains no names or contact details. */
  text: string;
}

/** Metadata stored next to each vector. Deliberately minimal: no clinical content, no personal details. */
export interface VectorMetadata {
  patient_id: string;
  record_type: RecordKind;
  source_id: string;
  occurred_at: string;
  author: AuthorKind;
  /** SHA-256 of the document text; lets reindexing skip unchanged records. */
  content_hash: string;
  [key: string]: string;
}

export interface VectorRecord {
  id: string;
  embedding: number[];
  document: string;
  metadata: VectorMetadata;
}

export interface RetrievedRecord {
  record: MedicalRecord;
  /** How the record entered the context. */
  via: 'semantic' | 'recent' | 'baseline';
  /** Cosine distance when retrieved semantically. */
  distance?: number;
}

export type RetrievalMode = 'semantic' | 'recency_fallback';

export interface AttentionPoint {
  statement: string;
  /** Why the records support the statement, in the model's words. */
  basis: string;
  source_record_ids: string[];
}

/** Structured, validated model output. */
export interface AIOverview {
  headline: string;
  summary: string;
  recent_events: string[];
  relevant_history: string[];
  attention_points: AttentionPoint[];
  /** Statements attributed to the patient or caregivers. */
  patient_reported: string[];
  /** Statements attributed to clinicians, devices or reports. */
  doctor_recorded: string[];
  /** Model-generated, explicitly non-diagnostic observations. */
  cautious_observations: string[];
  /** Information absent from the records that limits interpretation. */
  missing_information: string[];
  /** Clarifying questions about gaps in the documentation (never treatment advice). */
  clarifying_questions: string[];
  source_record_ids: string[];
}

export interface SourceRecordRef {
  id: string;
  kind: RecordKind;
  sourceId: string;
  occurredAt: string;
  title: string;
  author: AuthorKind;
  via: RetrievedRecord['via'];
}

export interface AIOverviewMeta {
  generatedAt: string;
  model: string;
  retrieval: RetrievalMode;
  recordsConsidered: number;
  cached: boolean;
  /** Always states that the content is an AI-generated summary of recorded information. */
  notice: string;
}

export interface AIOverviewResponse {
  success: true;
  data: {
    overview: AIOverview;
    records: SourceRecordRef[];
    meta: AIOverviewMeta;
  };
}

export type AIErrorCode =
  | 'unauthenticated'
  | 'forbidden'
  | 'bad_request'
  | 'ai_not_configured'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'invalid_ai_output';

/** Safe, client-facing error. Never carries provider messages, stack traces or internal detail. */
export interface AIError {
  success: false;
  code: AIErrorCode;
  error: string;
}

export interface IndexReport {
  scanned: number;
  upserted: number;
  skippedUnchanged: number;
  deletedStale: number;
  failed: number;
  failures: { id: string; reason: string }[];
}
