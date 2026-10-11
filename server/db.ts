import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserWithPassword,
  User,
  Patient,
  HealthEvent,
  Medication,
  MedicalReport,
  VitalRecord,
  AuditLogItem,
  HandoverShare,
  CarePlanItem,
  ClinicalOrder
} from './types';

// Initial Patients matching front-end rich clinical dataset
const DEFAULT_PATIENTS: Patient[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    fullName: 'Rahul Sharma',
    age: 42,
    sex: 'Male',
    bloodGroup: 'B+',
    conditions: ['Mild Hypertension', 'Seasonal Asthma'],
    allergies: ['Penicillin (causes rash)', 'Sulfa Drugs'],
    emergencyContact: {
      name: 'Pooja Sharma',
      phone: '+1 (555) 234-8901',
      relationship: 'Spouse'
    },
    primaryPhysician: 'Dr. Arvind Mehta (Cardiology & Internal Med)',
    status: 'Needs Attention',
    lastUpdated: '18 minutes ago'
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    fullName: 'Elena Rostova',
    age: 68,
    sex: 'Female',
    bloodGroup: 'O+',
    conditions: ['Type 2 Diabetes', 'Atrial Fibrillation'],
    allergies: ['Aspirin', 'Iodinated Contrast'],
    emergencyContact: {
      name: 'Dmitri Rostov',
      phone: '+1 (555) 876-5432',
      relationship: 'Son'
    },
    primaryPhysician: 'Dr. Sarah Lin (Endocrinology)',
    status: 'Stable',
    lastUpdated: '2 hours ago'
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    fullName: 'Marcus Chen',
    age: 29,
    sex: 'Male',
    bloodGroup: 'A-',
    conditions: ['Post-ACL Reconstruction', 'None Chronic'],
    allergies: ['None known'],
    emergencyContact: {
      name: 'Jennifer Chen',
      phone: '+1 (555) 345-6789',
      relationship: 'Sister'
    },
    primaryPhysician: 'Dr. Robert Ross (Orthopedics)',
    status: 'Stable',
    lastUpdated: '5 hours ago'
  }
];

const DEFAULT_EVENTS: HealthEvent[] = [
  {
    id: 'evt-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'symptom',
    timestamp: '2026-09-26T08:30:00Z',
    severity: 'mild',
    title: 'Mild fever & dry cough onset',
    description: 'Patient woke up feeling fatigued with throat irritation and mild shivering.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: { temperature: 99.8 }
  },
  {
    id: 'evt-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-26T09:15:00Z',
    severity: 'normal',
    title: 'Paracetamol 650mg taken',
    description: 'First dose taken after light breakfast. Mild relief in headache noted.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: { medicineName: 'Paracetamol', dose: '650mg', takenStatus: 'taken' }
  },
  {
    id: 'evt-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-26T18:45:00Z',
    severity: 'moderate',
    title: 'Temperature spike 100.8°F, Pulse 88 bpm',
    description: 'Evening temperature elevation logged via Omron digital thermometer.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { temperature: 100.8, heartRate: 88, spo2: 98 }
  },
  {
    id: 'evt-4',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-27T10:00:00Z',
    severity: 'moderate',
    title: 'Azithromycin 500mg missed (vomiting)',
    description: 'Patient felt nauseous upon taking tablet and vomited 15 mins later. Dose skipped.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { medicineName: 'Azithromycin', dose: '500mg', takenStatus: 'missed', missedReason: 'Nausea & emesis' }
  },
  {
    id: 'evt-5',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'symptom',
    timestamp: '2026-09-27T14:20:00Z',
    severity: 'moderate',
    title: 'Persistent dry cough turning productive',
    description: 'Sputum noted yellowish. Patient reporting retrosternal chest soreness on coughing.',
    source: 'Patient',
    createdBy: 'Rahul Sharma'
  },
  {
    id: 'evt-6',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-27T21:10:00Z',
    severity: 'moderate',
    title: 'Temperature 101.8°F, SpO2 96%',
    description: 'Night sweats and shivering. Cold sponging applied by spouse.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { temperature: 101.8, heartRate: 94, spo2: 96 }
  },
  {
    id: 'evt-7',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-28T09:00:00Z',
    severity: 'normal',
    title: 'Paracetamol 650mg + ORS Sachet taken',
    description: 'Electrolyte hydration started. Morning fever suppressed temporarily to 100.2°F.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { medicineName: 'Paracetamol', dose: '650mg', takenStatus: 'taken' }
  },
  {
    id: 'evt-8',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-28T15:30:00Z',
    severity: 'severe',
    title: 'High Spike: Temp 102.6°F, HR 104 bpm, SpO2 94%',
    description: 'Patient flushed, confused when questioned about date. Tachycardia noted.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { temperature: 102.6, heartRate: 104, spo2: 94, bpSystolic: 138, bpDiastolic: 88 }
  },
  {
    id: 'evt-9',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'report',
    timestamp: '2026-09-28T17:00:00Z',
    severity: 'moderate',
    title: 'CBC & Inflammatory Markers Lab Report',
    description: 'Leukocytosis (WBC 14,800/mcL, Neutrophils 82%), CRP elevated at 34 mg/L.',
    source: 'Report',
    createdBy: 'CarePath Labs',
    metadata: {
      reportType: 'CBC Report',
      extractedValues: { 'WBC': '14,800 /mcL', 'Neutrophils': '82%', 'CRP': '34 mg/L', 'Platelets': '210,000 /mcL' }
    }
  },
  {
    id: 'evt-10',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'symptom',
    timestamp: '2026-09-28T19:40:00Z',
    severity: 'severe',
    title: 'Postural dizziness & acute breathlessness on standing',
    description: 'Patient felt faint trying to walk to bathroom. Supported by family.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma'
  },
  {
    id: 'evt-11',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-28T21:05:00Z',
    severity: 'critical',
    title: 'Critical Drop: SpO2 92%, BP 142/92, Pulse 112 bpm',
    description: 'Marked respiratory distress, tachypneic at 26 breaths/min. Emergency transfer initiated.',
    source: 'Device',
    createdBy: 'SmartPulse Wearable',
    metadata: { temperature: 102.8, heartRate: 112, spo2: 92, bpSystolic: 142, bpDiastolic: 92 }
  },
  {
    id: 'evt-12',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'emergency',
    timestamp: '2026-09-28T21:30:00Z',
    severity: 'critical',
    title: 'Emergency EMS Transfer to Apex Memorial ER',
    description: 'Spouse dialed EMS. Paramedic oxygen supplement 4L/min via nasal cannula started in transit.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: { emergencyLevel: 'high' }
  }
];

const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    name: 'Paracetamol',
    dose: '650 mg',
    frequency: 'TDS (Every 8 hours, PRN for temp > 100°F)',
    scheduleTimes: [
      { time: '08:00 AM', status: 'taken' },
      { time: '02:00 PM', status: 'taken' },
      { time: '08:00 PM', status: 'pending' }
    ],
    status: 'active',
    notes: 'Do not exceed 3000 mg in 24 hours.'
  },
  {
    id: 'med-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    name: 'Azithromycin',
    dose: '500 mg',
    frequency: 'OD (Once daily, 5-day course)',
    scheduleTimes: [
      { time: '10:00 AM', status: 'missed' }
    ],
    status: 'active',
    notes: 'Missed dose due to nausea/emesis on Day 2.'
  },
  {
    id: 'med-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    name: 'Amlodipine',
    dose: '5 mg',
    frequency: 'OD Morning (Chronic BP maintenance)',
    scheduleTimes: [
      { time: '09:00 AM', status: 'taken' }
    ],
    status: 'active',
    notes: 'Routine hypertension control.'
  }
];

const DEFAULT_REPORTS: MedicalReport[] = [
  {
    id: 'rep-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Complete Blood Count (CBC) with Differential',
    reportType: 'CBC Report',
    fileName: 'CBC_Sharma_28Sep.pdf',
    extractedData: {
      'WBC Count': '14,800 /mcL (High)',
      'Neutrophils': '82% (High)',
      'Platelet Count': '210,000 /mcL (Normal)',
      'Hemoglobin': '13.8 g/dL (Normal)',
      'CRP': '34.2 mg/L (Significantly Elevated)'
    },
    summary: 'Acute bacterial inflammatory response indicated by neutrophil-predominant leukocytosis and high CRP.',
    uploadedAt: 'Today · 5:00 PM',
    aiVerified: true
  },
  {
    id: 'rep-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Outpatient Clinic Rx & Clinical Note',
    reportType: 'Prescription',
    fileName: 'DrMehta_Rx_26Sep.pdf',
    extractedData: {
      'Prescribed by': 'Dr. Arvind Mehta',
      'Clinical Impression': 'Upper respiratory tract infection',
      'Prescribed Meds': 'Azithromycin 500mg OD x 5d, Paracetamol 650mg SOS'
    },
    summary: 'Initial clinic assessment 3 days prior. Antibiotic therapy recommended with red flag advisories.',
    uploadedAt: 'Sep 26 · 11:30 AM',
    aiVerified: true
  }
];

const DEFAULT_VITALS: VitalRecord[] = [
  {
    id: 'vit-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-26T08:30:00Z',
    temperature: 99.8,
    heartRate: 76,
    spo2: 98,
    bpSystolic: 122,
    bpDiastolic: 78,
    notes: 'Baseline morning vitals'
  },
  {
    id: 'vit-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-26T18:45:00Z',
    temperature: 100.8,
    heartRate: 88,
    spo2: 98,
    bpSystolic: 126,
    bpDiastolic: 80
  },
  {
    id: 'vit-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-27T21:10:00Z',
    temperature: 101.8,
    heartRate: 94,
    spo2: 96,
    bpSystolic: 130,
    bpDiastolic: 84
  },
  {
    id: 'vit-4',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-28T15:30:00Z',
    temperature: 102.6,
    heartRate: 104,
    spo2: 94,
    bpSystolic: 138,
    bpDiastolic: 88
  },
  {
    id: 'vit-5',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-28T21:05:00Z',
    temperature: 102.8,
    heartRate: 112,
    spo2: 92,
    bpSystolic: 142,
    bpDiastolic: 92,
    notes: 'Severe respiratory distress in transit'
  }
];

const DEFAULT_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Dr. Aarav Sharma, MD',
    actorRole: 'Doctor',
    action: 'Opened 60-second Handover Summary',
    timestamp: 'Just now',
    details: 'Reviewed synthesized 72h acute trajectory, vitals progression, and evidence breakdown.'
  },
  {
    id: 'log-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Pooja Sharma',
    actorRole: 'Family Member',
    action: 'Generated Emergency Handover Link',
    timestamp: '18 min ago',
    details: 'Created time-bounded 72h read-only handover link for ER intake.'
  },
  {
    id: 'log-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Pooja Sharma',
    actorRole: 'Family Member',
    action: 'Logged Missed Antibiotic Dose',
    timestamp: '1 day ago',
    details: 'Marked Azithromycin 500mg missed due to nausea and vomiting.'
  }
];

// Pre-hashed passwords using bcrypt (10 rounds)
// 'doctor123', 'caregiver123', 'patient123', 'ems123'
const HASHED_PASSWORDS = {
  doctor: bcrypt.hashSync('doctor123', 10),
  caregiver: bcrypt.hashSync('caregiver123', 10),
  patient: bcrypt.hashSync('patient123', 10),
  ems: bcrypt.hashSync('ems123', 10)
};

const DEFAULT_USERS: UserWithPassword[] = [
  {
    id: 'usr-doc-1',
    email: 'doctor@carechain.health',
    passwordHash: HASHED_PASSWORDS.doctor,
    fullName: 'Dr. Aarav Sharma, MD',
    role: 'doctor',
    title: 'Senior Attending Physician · Emergency Medicine',
    phone: '+1 (555) 901-2345',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-fam-1',
    email: 'caregiver@carechain.health',
    passwordHash: HASHED_PASSWORDS.caregiver,
    fullName: 'Pooja Sharma',
    role: 'family',
    title: 'Primary Family Caregiver',
    phone: '+1 (555) 234-8901',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-pat-1',
    email: 'patient@carechain.health',
    passwordHash: HASHED_PASSWORDS.patient,
    fullName: 'Rahul Sharma',
    role: 'patient',
    title: 'Patient (Self Access)',
    phone: '+1 (555) 234-8901',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr-ems-1',
    email: 'paramedic@carechain.health',
    passwordHash: HASHED_PASSWORDS.ems,
    fullName: 'Capt. Dave Miller',
    role: 'ems',
    title: 'EMS Critical Care Paramedic · Unit 4',
    phone: '+1 (555) 911-0004',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CARE_PLANS: CarePlanItem[] = [
  {
    id: 'cp-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Hydration & Antipyretic Fever Curve Monitoring',
    description: 'Ensure 2.5L oral fluid intake daily with electrolyte supplementation. Record digital temperature every 4 hours.',
    category: 'monitoring',
    status: 'active',
    prescribedBy: 'Dr. Aarav Sharma, MD',
    updatedAt: 'Today · 09:30 AM'
  },
  {
    id: 'cp-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Respiratory Warning Trigger Checklist',
    description: 'Immediate ER protocol activation if pulse oximetry SpO2 drops below 94% on room air or resting tachypnea > 22 bpm.',
    category: 'warning',
    status: 'active',
    prescribedBy: 'Dr. Aarav Sharma, MD',
    updatedAt: 'Today · 10:15 AM'
  }
];

const DEFAULT_CLINICAL_ORDERS: ClinicalOrder[] = [
  {
    id: 'ord-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    doctorName: 'Dr. Aarav Sharma, MD',
    type: 'imaging',
    title: 'High-Resolution Chest CT Scan (HRCT)',
    details: 'Evaluate bilateral lower lobe patchy opacities and rule out acute consolidation.',
    status: 'ordered',
    priority: 'urgent',
    timestamp: '2 hours ago'
  },
  {
    id: 'ord-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    doctorName: 'Dr. Aarav Sharma, MD',
    type: 'lab',
    title: 'Repeat Serum Procalcitonin & Blood Cultures x2',
    details: 'Assess bacterial pyogenic escalation prior to initiating second-line IV cephalosporin regimen.',
    status: 'ordered',
    priority: 'stat',
    timestamp: '1 hour ago'
  }
];

export interface DatabaseStore {
  users: UserWithPassword[];
  patients: Patient[];
  events: HealthEvent[];
  medications: Medication[];
  reports: MedicalReport[];
  vitals: VitalRecord[];
  auditLogs: AuditLogItem[];
  shares: HandoverShare[];
  carePlans: CarePlanItem[];
  clinicalOrders: ClinicalOrder[];
}

/**
 * Change notifications for derived indexes (e.g. the AI vector index).
 * Emitted after the store has been saved; listener failures never affect the write.
 */
export type DbChange =
  | { type: 'upsert'; kind: 'event' | 'medication' | 'vital' | 'report' | 'patient'; id: string; patientId: string }
  | { type: 'delete'; kind: 'event'; id: string; patientId: string }
  | { type: 'reset' };

class Database {
  private changeListeners: Array<(change: DbChange) => void> = [];

  onChange(listener: (change: DbChange) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  private emit(change: DbChange) {
    for (const listener of this.changeListeners) {
      try { listener(change); } catch { /* derived indexes must never break a write */ }
    }
  }

  private dataDir = path.join(process.cwd(), 'server', 'data');
  private storeFile = path.join(this.dataDir, 'store.json');
  private store: DatabaseStore;

  constructor() {
    this.store = this.loadStore();
    this.ensureDefaultRelationships();
  }

  private loadStore(): DatabaseStore {
    try {
      if (fs.existsSync(this.storeFile)) {
        const raw = fs.readFileSync(this.storeFile, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure default users exist
        if (!parsed.users || parsed.users.length === 0) {
          parsed.users = DEFAULT_USERS;
        }
        if (!parsed.carePlans) parsed.carePlans = DEFAULT_CARE_PLANS;
        if (!parsed.clinicalOrders) parsed.clinicalOrders = DEFAULT_CLINICAL_ORDERS;
        return parsed;
      }
    } catch (e) {
      console.warn('[DB] Failed to read store file, reinitializing with defaults', e);
    }

    const initial: DatabaseStore = {
      users: DEFAULT_USERS,
      patients: DEFAULT_PATIENTS,
      events: DEFAULT_EVENTS,
      medications: DEFAULT_MEDICATIONS,
      reports: DEFAULT_REPORTS,
      vitals: DEFAULT_VITALS,
      auditLogs: DEFAULT_AUDIT_LOGS,
      shares: [],
      carePlans: DEFAULT_CARE_PLANS,
      clinicalOrders: DEFAULT_CLINICAL_ORDERS
    };

    this.saveStore(initial);
    return initial;
  }

  private saveStore(storeToSave?: DatabaseStore) {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(
        this.storeFile,
        JSON.stringify(storeToSave || this.store, null, 2),
        'utf8'
      );
    } catch (e) {
      console.error('[DB] Failed to save store file', e);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.store.users.map(({ passwordHash, ...user }) => user);
  }

  findUserByEmail(email: string): UserWithPassword | undefined {
    return this.store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserBySupabaseUid(uid: string): UserWithPassword | undefined {
    return this.store.users.find(u => u.supabaseUid === uid);
  }

  findUserById(id: string): User | undefined {
    const user = this.store.users.find(u => u.id === id || (u.supabaseUid && u.supabaseUid === id));
    if (!user) return undefined;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'patient' | 'family' | 'doctor' | 'ems';
    phone?: string;
    title?: string;
    patientId?: string;
  }): User {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(userData.password, salt);
    const newUser: UserWithPassword = {
      id: `usr-${Date.now()}`,
      email: userData.email.toLowerCase(),
      passwordHash,
      fullName: userData.fullName,
      role: userData.role,
      phone: userData.phone,
      title: userData.title,
      patientId: userData.patientId,
      createdAt: new Date().toISOString()
    };

    this.store.users.push(newUser);
    if (newUser.role === 'patient') {
      this.ensurePatientForUser(newUser);
    } else if (newUser.role === 'family' && !newUser.patientId) {
      newUser.patientId = this.store.patients[0]?.id;
    }
    this.saveStore();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  ensurePatientForUser(user: UserWithPassword | User): Patient {
    if (user.patientId) {
      const existing = this.getPatientById(user.patientId);
      if (existing) return existing;
    }
    // Try finding patient with same full name or email
    let patient = this.store.patients.find(
      p => p.fullName.toLowerCase() === (user.fullName || '').toLowerCase()
    );
    if (!patient) {
      const baseName = user.fullName || (user.email ? user.email.split('@')[0] : 'Patient');
      patient = {
        id: `pat-${user.id.replace(/^usr-/, '')}`,
        fullName: baseName,
        age: 38,
        sex: 'Other',
        bloodGroup: 'O+',
        conditions: [],
        allergies: [],
        emergencyContact: {
          name: 'Emergency Contact',
          phone: user.phone || '+1 (555) 000-0000',
          relationship: 'Family'
        },
        primaryPhysician: 'Dr. Aarav Sharma, MD',
        status: 'Stable',
        lastUpdated: new Date().toISOString()
      };
      this.store.patients.push(patient);
    }
    user.patientId = patient.id;
    const userInStore = this.store.users.find(u => u.id === user.id);
    if (userInStore) {
      userInStore.patientId = patient.id;
    }
    this.saveStore();
    return patient;
  }

  ensureDefaultRelationships() {
    let changed = false;
    for (const u of this.store.users) {
      if (u.role === 'patient') {
        let pat = u.patientId ? this.store.patients.find(p => p.id === u.patientId) : undefined;
        if (!pat) {
          pat = this.store.patients.find(p => p.fullName.toLowerCase() === (u.fullName || '').toLowerCase());
          if (!pat) {
            pat = {
              id: `pat-${u.id.replace(/^usr-/, '')}`,
              fullName: u.fullName || (u.email ? u.email.split('@')[0] : 'Patient'),
              age: 38,
              sex: 'Other',
              bloodGroup: 'O+',
              conditions: [],
              allergies: [],
              emergencyContact: {
                name: 'Emergency Contact',
                phone: u.phone || '+1 (555) 000-0000',
                relationship: 'Family'
              },
              primaryPhysician: 'Dr. Aarav Sharma, MD',
              status: 'Stable',
              lastUpdated: new Date().toISOString()
            };
            this.store.patients.push(pat);
            changed = true;
          }
          u.patientId = pat.id;
          changed = true;
        }
      } else if (u.role === 'family' && !u.patientId) {
        u.patientId = this.store.patients[0]?.id;
        changed = true;
      }
    }
    if (changed) {
      this.saveStore();
    }
  }

  createOAuthUser(userData: {
    email: string;
    fullName: string;
    role: 'patient' | 'family' | 'doctor' | 'ems';
    avatar?: string;
    phone?: string;
    title?: string;
    patientId?: string;
    supabaseUid?: string;
    pendingVerification?: boolean;
  }): User {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(`oauth-google-${Date.now()}-${Math.random()}`, salt);
    const newUser: UserWithPassword = {
      id: userData.supabaseUid ? `usr-sb-${userData.supabaseUid}` : `usr-oauth-${Date.now()}`,
      supabaseUid: userData.supabaseUid,
      email: userData.email.toLowerCase(),
      passwordHash,
      fullName: userData.fullName,
      role: userData.role,
      avatar: userData.avatar,
      phone: userData.phone,
      title: userData.title,
      patientId: userData.patientId,
      authProvider: 'google',
      pendingVerification: userData.pendingVerification,
      createdAt: new Date().toISOString()
    };

    this.store.users.push(newUser);
    if (newUser.role === 'patient') {
      this.ensurePatientForUser(newUser);
    } else if (newUser.role === 'family' && !newUser.patientId) {
      newUser.patientId = this.store.patients[0]?.id;
    }
    this.saveStore();

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  updateUser(id: string, updates: Partial<UserWithPassword>): User | undefined {
    const idx = this.store.users.findIndex(u => u.id === id || (u.supabaseUid && u.supabaseUid === id));
    if (idx === -1) return undefined;
    this.store.users[idx] = { ...this.store.users[idx], ...updates };
    this.saveStore();
    const { passwordHash: _, ...safeUser } = this.store.users[idx];
    return safeUser;
  }

  // --- Patients ---
  getPatients(): Patient[] {
    return this.store.patients;
  }

  getPatientById(id: string): Patient | undefined {
    return this.store.patients.find(p => p.id === id);
  }

  createPatient(patientData: Partial<Patient>): Patient {
    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      fullName: patientData.fullName || 'Unnamed Patient',
      age: patientData.age || 40,
      sex: patientData.sex || 'Other',
      bloodGroup: patientData.bloodGroup || 'Unknown',
      conditions: patientData.conditions || [],
      allergies: patientData.allergies || [],
      emergencyContact: patientData.emergencyContact || { name: 'Emergency Contact', phone: '', relationship: 'Family' },
      primaryPhysician: patientData.primaryPhysician || 'Unassigned',
      status: patientData.status || 'Stable',
      lastUpdated: 'Just now'
    };

    this.store.patients.push(newPatient);
    this.saveStore();
    this.emit({ type: 'upsert', kind: 'patient', id: newPatient.id, patientId: newPatient.id });
    return newPatient;
  }

  updatePatient(id: string, updates: Partial<Patient>): Patient | undefined {
    const idx = this.store.patients.findIndex(p => p.id === id);
    if (idx === -1) return undefined;

    this.store.patients[idx] = {
      ...this.store.patients[idx],
      ...updates,
      lastUpdated: 'Just now'
    };
    this.saveStore();
    this.emit({ type: 'upsert', kind: 'patient', id, patientId: id });
    return this.store.patients[idx];
  }

  // --- Events ---
  getEvents(filter?: { patientId?: string; type?: string }): HealthEvent[] {
    let result = [...this.store.events];
    if (filter?.patientId) {
      result = result.filter(e => e.patientId === filter.patientId);
    }
    if (filter?.type && filter.type !== 'all') {
      result = result.filter(e => e.type === filter.type);
    }
    return result;
  }

  getEventById(id: string): HealthEvent | undefined {
    return this.store.events.find(e => e.id === id);
  }

  createEvent(eventData: Partial<HealthEvent>): HealthEvent {
    const newEvent: HealthEvent = {
      id: eventData.id || `evt-${Date.now()}`,
      patientId: eventData.patientId || this.store.patients[0].id,
      type: eventData.type || 'symptom',
      timestamp: eventData.timestamp || new Date().toISOString(),
      severity: eventData.severity || 'mild',
      title: eventData.title || 'Health Event',
      description: eventData.description || '',
      source: eventData.source || 'Patient',
      createdBy: eventData.createdBy || 'User',
      metadata: eventData.metadata || {},
      attachments: eventData.attachments || [],
      verified: !!eventData.verified
    };

    this.store.events.push(newEvent);

    // Auto-create audit log
    this.createAuditLog({
      patientId: newEvent.patientId,
      actorName: newEvent.createdBy,
      actorRole: newEvent.source === 'Clinician' ? 'Doctor' : newEvent.source === 'Family / Caregiver' ? 'Family Member' : 'Patient',
      action: `Logged ${newEvent.type}: ${newEvent.title}`,
      details: newEvent.description
    });

    this.saveStore();
    this.emit({ type: 'upsert', kind: 'event', id: newEvent.id, patientId: newEvent.patientId });
    return newEvent;
  }

  deleteEvent(id: string): boolean {
    const initialLen = this.store.events.length;
    const removed = this.store.events.find(e => e.id === id);
    this.store.events = this.store.events.filter(e => e.id !== id);
    if (this.store.events.length !== initialLen) {
      this.saveStore();
      if (removed) this.emit({ type: 'delete', kind: 'event', id, patientId: removed.patientId });
      return true;
    }
    return false;
  }

  verifyEvent(id: string, verifierName: string): HealthEvent | undefined {
    const ev = this.store.events.find(e => e.id === id);
    if (!ev) return undefined;
    ev.verified = true;
    this.createAuditLog({
      patientId: ev.patientId,
      actorName: verifierName,
      actorRole: 'Doctor',
      action: `Verified clinical event: ${ev.title}`,
      details: 'Clinician validated symptom/reading'
    });
    this.saveStore();
    this.emit({ type: 'upsert', kind: 'event', id: ev.id, patientId: ev.patientId });
    return ev;
  }

  // --- Medications ---
  getMedications(patientId?: string): Medication[] {
    if (!patientId) return this.store.medications;
    return this.store.medications.filter(m => m.patientId === patientId);
  }

  createMedication(medData: Partial<Medication>): Medication {
    const newMed: Medication = {
      id: `med-${Date.now()}`,
      patientId: medData.patientId || this.store.patients[0].id,
      name: medData.name || 'Medication',
      dose: medData.dose || '500 mg',
      frequency: medData.frequency || 'Once daily',
      scheduleTimes: medData.scheduleTimes || [{ time: '09:00 AM', status: 'pending' }],
      status: medData.status || 'active',
      notes: medData.notes || ''
    };
    this.store.medications.push(newMed);
    this.saveStore();
    this.emit({ type: 'upsert', kind: 'medication', id: newMed.id, patientId: newMed.patientId });
    return newMed;
  }

  updateMedicationDose(
    medId: string,
    timeIdx: number,
    newStatus: 'taken' | 'missed' | 'pending' | 'delayed',
    reason?: string,
    actorName = 'Caregiver'
  ): Medication | undefined {
    const med = this.store.medications.find(m => m.id === medId);
    if (!med) return undefined;

    if (med.scheduleTimes[timeIdx]) {
      med.scheduleTimes[timeIdx].status = newStatus;
    }

    // Auto-record corresponding timeline health event
    this.createEvent({
      patientId: med.patientId,
      type: 'medication',
      title: `${med.name} marked as ${newStatus}`,
      description: newStatus === 'missed' ? `Dose missed. Reason: ${reason || 'Patient felt unwell'}` : `Dose taken on time.`,
      severity: newStatus === 'missed' ? 'moderate' : 'normal',
      source: 'Family / Caregiver',
      createdBy: actorName,
      metadata: {
        medicineName: med.name,
        dose: med.dose,
        takenStatus: newStatus,
        missedReason: reason
      }
    });

    this.saveStore();
    this.emit({ type: 'upsert', kind: 'medication', id: med.id, patientId: med.patientId });
    return med;
  }

  // --- Vitals ---
  getVitals(patientId?: string): VitalRecord[] {
    if (!patientId) return this.store.vitals;
    return this.store.vitals.filter(v => v.patientId === patientId);
  }

  createVital(vitalData: Partial<VitalRecord>, actorName = 'Device'): VitalRecord {
    const newVital: VitalRecord = {
      id: `vit-${Date.now()}`,
      patientId: vitalData.patientId || this.store.patients[0].id,
      timestamp: vitalData.timestamp || new Date().toISOString(),
      temperature: vitalData.temperature,
      heartRate: vitalData.heartRate,
      spo2: vitalData.spo2,
      bpSystolic: vitalData.bpSystolic,
      bpDiastolic: vitalData.bpDiastolic,
      respiratoryRate: vitalData.respiratoryRate,
      bloodGlucose: vitalData.bloodGlucose,
      notes: vitalData.notes
    };
    this.store.vitals.push(newVital);

    // Auto-create event
    const isCritical = (newVital.temperature && newVital.temperature >= 102.5) || (newVital.spo2 && newVital.spo2 < 93);
    const isSevere = (newVital.temperature && newVital.temperature >= 101.5) || (newVital.spo2 && newVital.spo2 < 95);

    this.createEvent({
      patientId: newVital.patientId,
      type: 'vital',
      title: `Vitals: ${newVital.temperature ? `${newVital.temperature}°F` : ''} ${newVital.heartRate ? `Pulse ${newVital.heartRate} bpm` : ''}`,
      description: `Logged vitals reading. BP: ${newVital.bpSystolic || '--'}/${newVital.bpDiastolic || '--'} mmHg, SpO2: ${newVital.spo2 || '--'}%`,
      severity: isCritical ? 'critical' : isSevere ? 'severe' : 'normal',
      source: 'Device',
      createdBy: actorName,
      metadata: {
        temperature: newVital.temperature,
        heartRate: newVital.heartRate,
        spo2: newVital.spo2,
        bpSystolic: newVital.bpSystolic,
        bpDiastolic: newVital.bpDiastolic
      }
    });

    this.saveStore();
    this.emit({ type: 'upsert', kind: 'vital', id: newVital.id, patientId: newVital.patientId });
    return newVital;
  }

  // --- Reports ---
  getReports(patientId?: string): MedicalReport[] {
    if (!patientId) return this.store.reports;
    return this.store.reports.filter(r => r.patientId === patientId);
  }

  createReport(reportData: Partial<MedicalReport>, actorName = 'Lab'): MedicalReport {
    const newReport: MedicalReport = {
      id: `rep-${Date.now()}`,
      patientId: reportData.patientId || this.store.patients[0].id,
      title: reportData.title || 'Diagnostic Report',
      reportType: reportData.reportType || 'CBC Report',
      fileName: reportData.fileName || 'report.pdf',
      extractedData: reportData.extractedData || { 'Status': 'Validated' },
      summary: reportData.summary || 'AI diagnostic analysis synthesized.',
      uploadedAt: 'Today · Just now',
      aiVerified: true
    };
    this.store.reports.unshift(newReport);

    this.createEvent({
      patientId: newReport.patientId,
      type: 'report',
      title: `${newReport.title} Uploaded`,
      description: newReport.summary,
      severity: 'moderate',
      source: 'Report',
      createdBy: actorName,
      metadata: {
        reportType: newReport.reportType,
        extractedValues: newReport.extractedData
      }
    });

    this.saveStore();
    this.emit({ type: 'upsert', kind: 'report', id: newReport.id, patientId: newReport.patientId });
    return newReport;
  }

  // --- Audit Logs ---
  getAuditLogs(patientId?: string): AuditLogItem[] {
    if (!patientId) return this.store.auditLogs;
    return this.store.auditLogs.filter(l => l.patientId === patientId);
  }

  createAuditLog(logData: Partial<AuditLogItem>): AuditLogItem {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      patientId: logData.patientId || this.store.patients[0].id,
      actorName: logData.actorName || 'System',
      actorRole: logData.actorRole || 'System',
      action: logData.action || 'Performed action',
      timestamp: 'Just now',
      details: logData.details
    };
    this.store.auditLogs.unshift(newLog);
    this.saveStore();
    return newLog;
  }

  // --- Handover Shares ---
  createShare(patientId: string, scope: HandoverShare['scope'] = '72h', expiryHours = 24): HandoverShare {
    const shareToken = `cc-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    const expiresAt = new Date(Date.now() + expiryHours * 3600 * 1000).toISOString();
    const newShare: HandoverShare = {
      id: `share-${Date.now()}`,
      patientId,
      shareToken,
      scope,
      expiresAt,
      accessCount: 0,
      createdAt: new Date().toISOString()
    };
    this.store.shares.push(newShare);
    this.saveStore();
    return newShare;
  }

  getShare(token: string): HandoverShare | undefined {
    const share = this.store.shares.find(s => s.shareToken === token);
    if (share) {
      share.accessCount += 1;
      this.saveStore();
    }
    return share;
  }

  // Reset to initial
  resetDefaults(): void {
    this.store = {
      users: DEFAULT_USERS,
      patients: DEFAULT_PATIENTS,
      events: DEFAULT_EVENTS,
      medications: DEFAULT_MEDICATIONS,
      reports: DEFAULT_REPORTS,
      vitals: DEFAULT_VITALS,
      auditLogs: DEFAULT_AUDIT_LOGS,
      shares: [],
      carePlans: DEFAULT_CARE_PLANS,
      clinicalOrders: DEFAULT_CLINICAL_ORDERS
    };
    this.saveStore();
    this.emit({ type: 'reset' });
  }

  // --- Care Plans ---
  getCarePlans(patientId?: string): CarePlanItem[] {
    const list = this.store.carePlans || [];
    if (!patientId) return list;
    return list.filter(cp => cp.patientId === patientId);
  }

  createCarePlan(planData: Partial<CarePlanItem>): CarePlanItem {
    if (!this.store.carePlans) this.store.carePlans = [];
    const newPlan: CarePlanItem = {
      id: planData.id || `cp-${Date.now()}`,
      patientId: planData.patientId || this.store.patients[0].id,
      title: planData.title || 'Care Plan Instruction',
      description: planData.description || '',
      category: planData.category || 'monitoring',
      status: planData.status || 'active',
      prescribedBy: planData.prescribedBy || 'Attending Physician',
      updatedAt: planData.updatedAt || new Date().toISOString()
    };
    this.store.carePlans.unshift(newPlan);
    this.saveStore();
    return newPlan;
  }

  // --- Clinical Orders ---
  getClinicalOrders(patientId?: string): ClinicalOrder[] {
    const list = this.store.clinicalOrders || [];
    if (!patientId) return list;
    return list.filter(o => o.patientId === patientId);
  }

  createClinicalOrder(orderData: Partial<ClinicalOrder>): ClinicalOrder {
    if (!this.store.clinicalOrders) this.store.clinicalOrders = [];
    const newOrder: ClinicalOrder = {
      id: orderData.id || `ord-${Date.now()}`,
      patientId: orderData.patientId || this.store.patients[0].id,
      doctorName: orderData.doctorName || 'Attending Physician',
      type: orderData.type || 'medication',
      title: orderData.title || 'Clinical Order',
      details: orderData.details || '',
      status: orderData.status || 'ordered',
      priority: orderData.priority || 'routine',
      timestamp: orderData.timestamp || 'Just now'
    };
    this.store.clinicalOrders.unshift(newOrder);
    this.saveStore();
    return newOrder;
  }
}

export const db = new Database();
