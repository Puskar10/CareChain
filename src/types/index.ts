export type EventType = 'symptom' | 'medication' | 'vital' | 'visit' | 'report' | 'emergency';

export type EventSeverity = 'normal' | 'mild' | 'moderate' | 'severe' | 'critical';

export type EventSource = 'Patient' | 'Family / Caregiver' | 'Clinician' | 'Device' | 'Report';

export interface HealthEvent {
  id: string;
  patientId: string;
  type: EventType;
  timestamp: string; // ISO string
  severity: EventSeverity;
  title: string;
  description: string;
  source: EventSource;
  createdBy: string;
  metadata?: {
    temperature?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    heartRate?: number;
    spo2?: number;
    dose?: string;
    medicineName?: string;
    takenStatus?: 'taken' | 'missed' | 'delayed' | 'pending';
    missedReason?: string;
    doctorName?: string;
    clinicName?: string;
    reportType?: string;
    extractedValues?: Record<string, string>;
    emergencyLevel?: 'moderate' | 'high' | 'resuscitation';
    [key: string]: any;
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  verified?: boolean;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  conditions: string[];
  allergies: string[];
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  primaryPhysician: string;
  status: 'Stable' | 'Needs Attention' | 'Critical';
  lastUpdated: string;
}

export interface MedicationScheduleItem {
  time: string;
  status: 'taken' | 'missed' | 'pending' | 'delayed';
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  frequency: string;
  scheduleTimes: MedicationScheduleItem[];
  status: 'active' | 'paused' | 'completed';
  notes?: string;
}

export interface MedicalReport {
  id: string;
  patientId: string;
  title: string;
  reportType: 'CBC Report' | 'Prescription' | 'Discharge Summary' | 'Imaging' | 'Biochemistry' | 'Lab Report' | 'Other';
  fileName: string;
  fileUrl?: string;
  extractedData: Record<string, string>;
  summary: string;
  uploadedAt: string;
  aiVerified: boolean;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  timestamp: string;
  temperature?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  spo2?: number;
  respiratoryRate?: number;
  bloodGlucose?: number;
  notes?: string;
}

export interface HandoverEvidence {
  claim: string;
  reason: string;
  eventIds: string[];
  confidence: number;
}

export interface HandoverSummary {
  headline: string;
  coreNarrative: string;
  timespan: string;
  totalEventsAnalyzed: number;
  supportingEvidenceCount: {
    events: number;
    historyDays: number;
    medications: number;
    vitals: number;
    reports: number;
  };
  keyFindings: {
    category: 'Vitals Trend' | 'Medication Adherence' | 'Symptom Progression' | 'Lab Findings' | 'Emergency Trigger';
    statement: string;
    severity: EventSeverity;
    evidenceEventIds: string[];
    whyExplanation: string;
    factualBasis: string; // The recorded fact
  }[];
  latestVitals: {
    temperature: string;
    bp: string;
    pulse: string;
    spo2: string;
  };
  activeMedications: string[];
  allergies: string[];
  recommendedDoctorQuestions: string[];
  safetyDistinctions: {
    recordedFacts: string[];
    patientReportedSymptoms: string[];
    aiInterpretations: string[];
  };
}

export interface AuditLogItem {
  id: string;
  patientId: string;
  actorName: string;
  actorRole: 'Doctor' | 'Family Member' | 'Patient' | 'Emergency EMS' | 'System';
  action: string;
  timestamp: string;
  details?: string;
}

export type UserRole = 'patient' | 'family' | 'doctor' | 'ems' | 'admin';
export type AppTab = 'overview' | 'timeline' | 'handover' | 'emergency' | 'medications' | 'vitals' | 'reports' | 'doctor' | 'sharing';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  title?: string;
  avatar?: string;
  patientId?: string;
  createdAt?: string;
}

export interface DemoAccount {
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  title: string;
  description: string;
}
