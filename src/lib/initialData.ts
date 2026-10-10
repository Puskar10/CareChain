import { Patient, HealthEvent, Medication, MedicalReport, VitalRecord, AuditLogItem, HandoverSummary } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
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

export const INITIAL_EVENTS: HealthEvent[] = [
  {
    id: 'evt-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'symptom',
    timestamp: '2026-09-25T09:30:00Z',
    severity: 'mild',
    title: 'Fever started',
    description: 'Patient felt sudden chills and mild body aches after morning commute.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: {
      temperature: 100.4,
      trigger: 'Post-exposure / chills',
      duration: 'Ongoing'
    },
    verified: true
  },
  {
    id: 'evt-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-25T11:00:00Z',
    severity: 'normal',
    title: 'Paracetamol taken',
    description: 'Paracetamol 500mg administered orally with water.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: {
      medicineName: 'Paracetamol',
      dose: '500mg',
      takenStatus: 'taken'
    },
    verified: true
  },
  {
    id: 'evt-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-25T18:15:00Z',
    severity: 'normal',
    title: 'Evening Vitals Recorded',
    description: 'Oral digital thermometer recorded 100.4°F. Pulse 78 bpm.',
    source: 'Device',
    createdBy: 'Smart Thermometer Sync',
    metadata: {
      temperature: 100.4,
      heartRate: 78,
      bpSystolic: 122,
      bpDiastolic: 80,
      spo2: 98
    },
    verified: true
  },
  {
    id: 'evt-4',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-26T08:00:00Z',
    severity: 'normal',
    title: 'Paracetamol taken',
    description: 'Morning dose of Paracetamol 500mg taken.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: {
      medicineName: 'Paracetamol',
      dose: '500mg',
      takenStatus: 'taken'
    },
    verified: true
  },
  {
    id: 'evt-5',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'visit',
    timestamp: '2026-09-26T14:30:00Z',
    severity: 'moderate',
    title: 'Clinic Consult with Dr. Arvind Mehta',
    description: 'Patient presented with 24hr persistent pyrexia and sore throat. Clinician ordered CBC and prescribed Amoxicillin 500mg (Note allergy caveat reviewed).',
    source: 'Clinician',
    createdBy: 'Dr. Arvind Mehta',
    metadata: {
      doctorName: 'Dr. Arvind Mehta',
      clinicName: 'Mehta Internal Medicine Clinic',
      provisionalDiagnosis: 'Acute upper respiratory tract infection / Pyrexia of unknown origin',
      prescriptions: 'Amoxicillin 500mg BID x 5 days, Paracetamol 500mg SOS'
    },
    verified: true
  },
  {
    id: 'evt-6',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-26T19:40:00Z',
    severity: 'moderate',
    title: 'Temperature 101.8°F',
    description: 'Temperature spiking despite antipyretics. Mild diaphoresis.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: {
      temperature: 101.8,
      heartRate: 88,
      bpSystolic: 128,
      bpDiastolic: 84
    },
    verified: true
  },
  {
    id: 'evt-7',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-26T21:00:00Z',
    severity: 'normal',
    title: 'Amoxicillin taken (Dose 1)',
    description: 'Amoxicillin 500mg taken after dinner.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: {
      medicineName: 'Amoxicillin',
      dose: '500mg',
      takenStatus: 'taken'
    },
    verified: true
  },
  {
    id: 'evt-8',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-27T10:00:00Z',
    severity: 'moderate',
    title: 'Temperature 102.1°F',
    description: 'Morning temperature elevated. Pulse 92 bpm.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: {
      temperature: 102.1,
      heartRate: 92,
      spo2: 97
    },
    verified: true
  },
  {
    id: 'evt-9',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'report',
    timestamp: '2026-09-27T18:20:00Z',
    severity: 'moderate',
    title: 'Complete Blood Count (CBC) Uploaded',
    description: 'Laboratory report processed. Elevated Leukocyte count (WBC: 13,400 /µL) indicating active systemic inflammatory response.',
    source: 'Report',
    createdBy: 'Apex Diagnostics Lab',
    metadata: {
      reportType: 'CBC Report',
      extractedValues: {
        'WBC Count': '13,400 /µL (High, Ref: 4,500-11,000)',
        'Hemoglobin': '11.2 g/dL (Mild low, Ref: 13.8-17.2)',
        'Platelets': '180,000 /µL (Normal, Ref: 150,000-450,000)',
        'Neutrophils': '78% (Elevated)'
      }
    },
    verified: true
  },
  {
    id: 'evt-10',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'medication',
    timestamp: '2026-09-27T22:15:00Z',
    severity: 'moderate',
    title: 'Medication missed (Amoxicillin)',
    description: 'Evening antibiotic dose skipped because patient suffered severe nausea and gastric discomfort.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: {
      medicineName: 'Amoxicillin',
      dose: '500mg',
      takenStatus: 'missed',
      missedReason: 'Intense nausea and stomach acidity'
    },
    verified: true
  },
  {
    id: 'evt-11',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'vital',
    timestamp: '2026-09-28T08:20:00Z',
    severity: 'severe',
    title: 'Temperature 102.6°F & Tachycardia',
    description: 'Fever reached 102.6°F. Tachycardic at 108 bpm. Blood pressure elevated at 140/90 mmHg.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: {
      temperature: 102.6,
      heartRate: 108,
      bpSystolic: 140,
      bpDiastolic: 90,
      spo2: 96
    },
    verified: true
  },
  {
    id: 'evt-12',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'symptom',
    timestamp: '2026-09-28T11:45:00Z',
    severity: 'severe',
    title: 'Dizziness reported',
    description: 'Patient became dizzy upon standing from bed. Reported room spinning, weakness, and cold clammy skin.',
    source: 'Patient',
    createdBy: 'Rahul Sharma',
    metadata: {
      symptom: 'Vertigo & Postural Dizziness',
      duration: '45 mins',
      trigger: 'Orthostatic change'
    },
    verified: true
  },
  {
    id: 'evt-13',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'emergency',
    timestamp: '2026-09-28T12:15:00Z',
    severity: 'critical',
    title: 'Transport to Emergency Department',
    description: 'Family decided to take Rahul to City Memorial Hospital ER due to combination of unremitting high fever, tachycardia, missed antibiotics, and acute dizziness.',
    source: 'Family / Caregiver',
    createdBy: 'Pooja Sharma',
    metadata: {
      emergencyLevel: 'high',
      reporter: 'Pooja Sharma (Wife)',
      hospital: 'City Memorial Emergency Care'
    },
    verified: true
  },
  {
    id: 'evt-14',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    type: 'emergency',
    timestamp: '2026-09-28T12:30:00Z',
    severity: 'critical',
    title: 'CareChain 60-Second Handover Activated',
    description: 'AI compiled 72-hour trajectory into emergency handover for attending ER physician.',
    source: 'Clinician',
    createdBy: 'CareChain AI Engine',
    metadata: {
      handoverGenerated: true,
      triagePriority: 'Level 2 - Emergent'
    },
    verified: true
  }
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    name: 'Paracetamol',
    dose: '500 mg',
    frequency: 'Every 6 hrs SOS',
    scheduleTimes: [
      { time: '08:00 AM', status: 'taken' },
      { time: '02:00 PM', status: 'taken' },
      { time: '08:00 PM', status: 'pending' }
    ],
    status: 'active',
    notes: 'For fever above 100°F. Inconsistent intake over past 48h.'
  },
  {
    id: 'med-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    name: 'Amoxicillin',
    dose: '500 mg',
    frequency: '2× daily (BID)',
    scheduleTimes: [
      { time: 'Morning', status: 'taken' },
      { time: 'Evening', status: 'missed' }
    ],
    status: 'active',
    notes: 'Prescribed Sept 26 by Dr. Mehta. Evening dose missed due to nausea.'
  }
];

export const INITIAL_REPORTS: MedicalReport[] = [
  {
    id: 'rep-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Complete Blood Count (CBC) Panel',
    reportType: 'CBC Report',
    fileName: 'CBC_Report_Rahul_Sharma_Sep27.pdf',
    extractedData: {
      'Hemoglobin': '11.2 g/dL (Low, Ref: 13.5-17.5)',
      'WBC Count': '13,400 /µL (High, Ref: 4,500-11,000)',
      'Platelets': '180,000 /µL (Normal, Ref: 150,000-450,000)',
      'Neutrophils': '78% (Elevated, Bacterial indication)',
      'Lymphocytes': '16% (Relative lymphopenia)'
    },
    summary: 'Leukocytosis with neutrophil predominance suggestive of bacterial infection or acute inflammatory process.',
    uploadedAt: 'Sept 27, 2026 · 6:20 PM',
    aiVerified: true
  },
  {
    id: 'rep-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    title: 'Clinic Prescription Slip',
    reportType: 'Prescription',
    fileName: 'Dr_Mehta_Rx_Sep26.pdf',
    extractedData: {
      'Prescribing Doctor': 'Dr. Arvind Mehta, MD',
      'Diagnosis': 'Acute Febrile Illness / URTI',
      'Rx Item 1': 'Amoxicillin 500mg Capsule 1-0-1 x 5 days',
      'Rx Item 2': 'Paracetamol 500mg PRN max 4/day',
      'Advice': 'Hydration, bed rest, repeat CBC if fever persists > 48h'
    },
    summary: 'Outpatient prescription advising antibiotic course and symptom-triggered antipyretics.',
    uploadedAt: 'Sept 26, 2026 · 2:45 PM',
    aiVerified: true
  }
];

export const INITIAL_VITALS: VitalRecord[] = [
  {
    id: 'vit-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-25T18:15:00Z',
    temperature: 100.4,
    bpSystolic: 122,
    bpDiastolic: 80,
    heartRate: 78,
    spo2: 98,
    notes: 'Initial fever onset'
  },
  {
    id: 'vit-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-26T19:40:00Z',
    temperature: 101.8,
    bpSystolic: 128,
    bpDiastolic: 84,
    heartRate: 88,
    spo2: 98,
    notes: 'Temperature rising in evening'
  },
  {
    id: 'vit-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-27T10:00:00Z',
    temperature: 102.1,
    bpSystolic: 132,
    bpDiastolic: 86,
    heartRate: 92,
    spo2: 97,
    notes: 'Fever persists past 48 hours'
  },
  {
    id: 'vit-4',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    timestamp: '2026-09-28T08:20:00Z',
    temperature: 102.6,
    bpSystolic: 140,
    bpDiastolic: 90,
    heartRate: 108,
    spo2: 96,
    notes: 'Spike to 102.6°F, tachycardia detected (108 bpm)'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Dr. Arvind Mehta',
    actorRole: 'Doctor',
    action: 'Viewed patient timeline & ordered CBC lab',
    timestamp: 'Sept 26, 2:40 PM',
    details: 'Accessed via clinic portal during consultation'
  },
  {
    id: 'log-2',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Pooja Sharma',
    actorRole: 'Family Member',
    action: 'Logged missed antibiotic & recorded nausea symptom',
    timestamp: 'Sept 27, 10:15 PM',
    details: 'Evening Amoxicillin marked as missed'
  },
  {
    id: 'log-3',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Pooja Sharma',
    actorRole: 'Family Member',
    action: 'Logged temperature 102.6°F and activated Emergency Transport',
    timestamp: 'Sept 28, 8:20 AM',
    details: 'Flagged critical vitals and postural dizziness'
  },
  {
    id: 'log-4',
    patientId: 'a1111111-1111-1111-1111-111111111111',
    actorName: 'Dr. Neha Kulkarni',
    actorRole: 'Doctor',
    action: 'Viewed 60-Second Emergency Handover in ER',
    timestamp: 'Sept 28, 12:32 PM',
    details: 'ER attending clinician verified vital progression & evidence chain'
  }
];

export const INITIAL_HANDOVER_SUMMARY: HandoverSummary = {
  headline: 'Patient Handover — 60 sec',
  coreNarrative: 'Fever began approximately 3 days ago and progressively increased. Medication was taken inconsistently. Temperature reached 102.6°F this morning with sinus tachycardia (108 bpm). The patient subsequently reported severe dizziness and worsening symptoms before hospital arrival.',
  timespan: 'Last 72 Hours (Sept 25 – Sept 28)',
  totalEventsAnalyzed: 14,
  supportingEvidenceCount: {
    events: 14,
    historyDays: 3,
    medications: 4,
    vitals: 5,
    reports: 2
  },
  keyFindings: [
    {
      category: 'Vitals Trend',
      statement: 'Temperature increased progressively by +2.2°F over 72 hours (100.4°F → 101.8°F → 102.6°F).',
      severity: 'severe',
      evidenceEventIds: ['evt-1', 'evt-3', 'evt-6', 'evt-8', 'evt-11'],
      whyExplanation: '102.6°F today at 08:20 AM ↑ from 101.8°F yesterday ↑ from 100.4°F two days ago.',
      factualBasis: 'Temperature recorded as 102.6°F at 8:20 AM (Sept 28).'
    },
    {
      category: 'Medication Adherence',
      statement: 'Antibiotic therapy interrupted: Missed evening Amoxicillin dose on Sept 27 due to acute nausea.',
      severity: 'moderate',
      evidenceEventIds: ['evt-7', 'evt-10'],
      whyExplanation: 'Prescription prescribed Sept 26 (Dr. Mehta), but caregiver logged missed dose on Sept 27 at 10:15 PM.',
      factualBasis: 'Caregiver logged Amoxicillin missed due to nausea at 10:15 PM.'
    },
    {
      category: 'Lab Findings',
      statement: 'Elevated WBC count (13,400 /µL) with 78% neutrophils indicates systemic bacterial burden.',
      severity: 'moderate',
      evidenceEventIds: ['evt-9'],
      whyExplanation: 'CBC report uploaded Sept 27 showed Leukocytosis (WBC 13,400 /µL, Ref: 4,500-11,000).',
      factualBasis: 'CBC report uploaded Sept 27: WBC 13,400 /µL, Platelets 180,000 /µL.'
    },
    {
      category: 'Symptom Progression',
      statement: 'New acute postural dizziness and instability emerged today at 11:45 AM.',
      severity: 'severe',
      evidenceEventIds: ['evt-12', 'evt-13'],
      whyExplanation: 'Patient reported lightheadedness upon standing, coinciding with peak pyrexia and tachycardia (108 bpm).',
      factualBasis: 'Patient reported dizziness at 11:45 AM.'
    },
    {
      category: 'Emergency Trigger',
      statement: 'Family initiated emergency transfer at 12:15 PM following acute disorientation and rapid pulse.',
      severity: 'critical',
      evidenceEventIds: ['evt-13'],
      whyExplanation: 'Family recognized worsening trajectory and transferred patient directly to Emergency Dept.',
      factualBasis: 'Emergency transfer logged at 12:15 PM.'
    }
  ],
  latestVitals: {
    temperature: '102.6°F',
    bp: '140/90 mmHg',
    pulse: '108 bpm',
    spo2: '96%'
  },
  activeMedications: [
    'Paracetamol 500mg (Every 6 hrs SOS)',
    'Amoxicillin 500mg (2x daily - Incomplete adherence)'
  ],
  allergies: [
    'Penicillin (causes rash)',
    'Sulfa Drugs'
  ],
  recommendedDoctorQuestions: [
    'Confirm if patient exhibited neck stiffness or photophobia along with 102.6°F fever.',
    'Review alternative antibiotic to Amoxicillin given known Penicillin sensitivity notes.',
    'Evaluate orthostatic vitals and hydration status in light of morning dizziness and tachycardia.'
  ],
  safetyDistinctions: {
    recordedFacts: [
      'Temperature recorded as 102.6°F at 8:20 AM',
      'Heart rate recorded as 108 bpm at 8:20 AM',
      'CBC report showed WBC 13,400 /µL and Hemoglobin 11.2 g/dL'
    ],
    patientReportedSymptoms: [
      'Patient reported chills and fever onset on Sept 25, 09:30 AM',
      'Patient reported severe dizziness on Sept 28, 11:45 AM',
      'Caregiver reported nausea after medication'
    ],
    aiInterpretations: [
      'Symptoms appear to have worsened over the preceding 24 hours',
      'Uncontrolled pyrexia corresponds with missed antibiotic dose',
      'Tachycardia may reflect systemic inflammatory response or dehydration'
    ]
  }
};
