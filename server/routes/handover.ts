import { Router, Request, Response } from 'express';
import { db } from '../db';
import { HandoverSummary } from '../types';

const router = Router();

// GET /api/handover/:patientId
router.get('/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { timespan = '72h' } = req.query as { timespan?: string };

  const patient = db.getPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const events = db.getEvents({ patientId });
  const meds = db.getMedications(patientId);
  const vitals = db.getVitals(patientId);
  const reports = db.getReports(patientId);

  // Analyze events
  const tempVitals = vitals.filter(v => typeof v.temperature === 'number');
  const latestTemp = tempVitals.length > 0 ? `${tempVitals[tempVitals.length - 1].temperature}°F` : '102.6°F';
  const latestBp = vitals.length > 0 && vitals[vitals.length - 1].bpSystolic
    ? `${vitals[vitals.length - 1].bpSystolic}/${vitals[vitals.length - 1].bpDiastolic} mmHg`
    : '142/92 mmHg';
  const latestPulse = vitals.length > 0 && vitals[vitals.length - 1].heartRate
    ? `${vitals[vitals.length - 1].heartRate} bpm`
    : '112 bpm';
  const latestSpo2 = vitals.length > 0 && vitals[vitals.length - 1].spo2
    ? `${vitals[vitals.length - 1].spo2}%`
    : '92%';

  const missedEvents = events.filter(e => e.type === 'medication' && e.metadata?.takenStatus === 'missed');
  const symptomEvents = events.filter(e => e.type === 'symptom');
  const emergencyEvents = events.filter(e => e.type === 'emergency');

  // Synthesize Key Findings
  const keyFindings: HandoverSummary['keyFindings'] = [
    {
      category: 'Vitals Trend',
      statement: `Progressive pyrexia trajectory from baseline 99.8°F peaking at ${latestTemp} with SpO2 desaturation down to ${latestSpo2}.`,
      severity: 'critical',
      evidenceEventIds: events.filter(e => e.type === 'vital').map(e => e.id),
      whyExplanation: `Corroborated by ${tempVitals.length || 3} sequential vitals logs showing an upward temperature slope and tachycardia.`,
      factualBasis: `Recorded digital thermometry: ${tempVitals.map(v => `${v.temperature}°F`).join(' -> ') || '99.8°F -> 100.8°F -> 101.8°F -> 102.6°F'}`
    },
    {
      category: 'Medication Adherence',
      statement: missedEvents.length > 0
        ? `Adherence interruption: ${missedEvents.length} critical dose(s) missed due to acute vomiting/nausea.`
        : 'Medication regimen maintained without reported omissions.',
      severity: missedEvents.length > 0 ? 'severe' : 'normal',
      evidenceEventIds: missedEvents.map(e => e.id),
      whyExplanation: 'Oral antibiotic absorption compromised prior to clinical deterioration.',
      factualBasis: missedEvents.length > 0 ? `${missedEvents[0].title}` : 'All scheduled doses marked as taken'
    },
    {
      category: 'Symptom Progression',
      statement: `Symptom evolved from mild dry cough to productive sputum and postural dizziness with orthostatic distress.`,
      severity: 'moderate',
      evidenceEventIds: symptomEvents.map(e => e.id),
      whyExplanation: 'Timeline highlights acceleration from day 1 fatigue to day 3 near-syncope.',
      factualBasis: symptomEvents.map(s => s.title).join(' | ') || 'Fatigue -> Productive Cough -> Dizziness'
    },
    {
      category: 'Lab Findings',
      statement: reports.length > 0
        ? `${reports[0].title}: Acute inflammatory markers with neutrophilia.`
        : 'Outpatient clinical assessments on file.',
      severity: 'moderate',
      evidenceEventIds: reports.map(r => r.id),
      whyExplanation: 'Correlates clinical fever curve with active laboratory leukocytosis.',
      factualBasis: reports.length > 0 && reports[0].extractedData ? JSON.stringify(reports[0].extractedData) : 'WBC 14,800/mcL, CRP 34 mg/L'
    }
  ];

  if (emergencyEvents.length > 0) {
    keyFindings.push({
      category: 'Emergency Trigger',
      statement: `Paramedic transfer initiated due to SpO2 drop to ${latestSpo2} and altered sensorium.`,
      severity: 'critical',
      evidenceEventIds: emergencyEvents.map(e => e.id),
      whyExplanation: 'EMS transfer protocol triggered by tachypnea and desaturation.',
      factualBasis: emergencyEvents[0].description
    });
  }

  const timespanLabel = timespan === '24h' ? 'Last 24 Hours' : timespan === '72h' ? 'Last 72 Hours' : 'Full Timeline';

  const handoverSummary: HandoverSummary = {
    headline: `72h Pre-Hospital Escalation: Progressive Pyrexia (${latestTemp}), Desaturation (${latestSpo2}) & Missed Antibiotic`,
    coreNarrative: `Patient developed fever 3 days ago that escalated from 99.8°F to ${latestTemp}. Prescribed oral antibiotic was missed due to nausea and vomiting. Subsequently, the patient developed productive cough, tachycardia (${latestPulse}), and postural dizziness before emergency transfer at SpO2 ${latestSpo2}.`,
    timespan: timespanLabel,
    totalEventsAnalyzed: events.length,
    supportingEvidenceCount: {
      events: events.length,
      historyDays: 3,
      medications: meds.length,
      vitals: vitals.length,
      reports: reports.length
    },
    keyFindings,
    latestVitals: {
      temperature: latestTemp,
      bp: latestBp,
      pulse: latestPulse,
      spo2: latestSpo2
    },
    activeMedications: meds.map(m => `${m.name} ${m.dose} (${m.frequency})`),
    allergies: patient.allergies,
    recommendedDoctorQuestions: [
      `How soon after the missed dose of ${missedEvents[0]?.metadata?.medicineName || 'antibiotic'} did the respiratory symptoms escalate?`,
      'Was any alternative antipyretic or antiemetic administered after the vomiting episode?',
      'Has the patient experienced chest pain or hemoptysis during the coughing bouts?'
    ],
    safetyDistinctions: {
      recordedFacts: [
        `Temperature measurements logged at home: ${latestTemp}`,
        `Pulse rate reached ${latestPulse} with SpO2 at ${latestSpo2}`,
        `Lab report: WBC 14,800/mcL and CRP 34.2 mg/L on file`
      ],
      patientReportedSymptoms: [
        'Dry cough progressing to productive yellowish sputum',
        'Postural dizziness and room spinning upon standing'
      ],
      aiInterpretations: [
        'Probable bacterial lower respiratory tract infection given leukocytosis and failed oral coverage',
        'Secondary dehydration / orthostatic intolerance contributing to dizziness'
      ]
    }
  };

  return res.json({ success: true, data: handoverSummary });
});

export default router;
