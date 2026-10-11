import { Router, Request, Response } from 'express';
import { db } from '../db';
import { optionalToken, AuthRequest } from '../middleware/auth';
import { canUserAccessPatient } from '../ai/authz';
import { hasGemini } from '../ai/config';
import { createOverviewDeps, generatePatientOverview } from '../ai/overview';
import { HandoverSummary, EventSeverity } from '../types';

const router = Router();

const SEVERITY_ORDER: EventSeverity[] = ['normal', 'mild', 'moderate', 'severe', 'critical'];

// GET /api/handover/:patientId
router.get('/:patientId', optionalToken, async (req: AuthRequest, res: Response) => {
  const { patientId } = req.params;
  const { timespan = '72h' } = req.query as { timespan?: string };

  const patient = db.getPatientById(patientId);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  // Cross-patient access authorization
  if (req.user && !canUserAccessPatient(req.user, patientId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to view handover for this patient' });
  }

  const events = db.getEvents({ patientId });
  const meds = db.getMedications(patientId);
  const vitals = db.getVitals(patientId);
  const reports = db.getReports(patientId);

  // Compute timespan and baseline stats
  const times = events.map(e => Date.parse(e.timestamp)).filter(t => !isNaN(t));
  const historyDays = times.length > 1 ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000)) : times.length || 1;
  const timespanLabel = timespan === '24h' ? 'Last 24 Hours' : timespan === '72h' ? 'Last 72 Hours' : 'Full Timeline';

  // Latest vitals strictly from recorded data
  const tempVitals = vitals.filter(v => typeof v.temperature === 'number');
  const latestTemp = tempVitals.length > 0 ? `${tempVitals[tempVitals.length - 1].temperature}°F` : '--';
  const latestBp = vitals.length > 0 && vitals[vitals.length - 1].bpSystolic
    ? `${vitals[vitals.length - 1].bpSystolic}/${vitals[vitals.length - 1].bpDiastolic} mmHg`
    : '--/--';
  const latestPulse = vitals.length > 0 && vitals[vitals.length - 1].heartRate
    ? `${vitals[vitals.length - 1].heartRate} bpm`
    : '--';
  const latestSpo2 = vitals.length > 0 && vitals[vitals.length - 1].spo2
    ? `${vitals[vitals.length - 1].spo2}%`
    : '--%';

  // Try real Gemini AI generation first if configured
  if (hasGemini()) {
    try {
      const aiData = await generatePatientOverview(createOverviewDeps(), patientId);
      const { overview, records } = aiData;
      const refById = new Map(records.map(r => [r.id, r]));
      const eventById = new Map(events.map(e => [e.id, e]));

      const keyFindings: HandoverSummary['keyFindings'] = overview.attention_points.map(point => {
        const cited = point.source_record_ids.map(id => refById.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
        const citedEvents = cited
          .filter(r => r.kind === 'medical_event')
          .map(r => eventById.get(r.sourceId))
          .filter((e): e is NonNullable<typeof e> => Boolean(e));

        let category: HandoverSummary['keyFindings'][number]['category'] = 'Symptom Progression';
        if (cited.some(r => r.kind === 'report')) category = 'Lab Findings';
        else if (cited.some(r => r.kind === 'medication') || citedEvents.some(e => e.type === 'medication')) category = 'Medication Adherence';
        else if (cited.some(r => r.kind === 'vital') || citedEvents.some(e => e.type === 'vital')) category = 'Vitals Trend';
        else if (citedEvents.some(e => e.type === 'emergency')) category = 'Emergency Trigger';

        const severity = citedEvents.reduce<EventSeverity>(
          (max, e) => (SEVERITY_ORDER.indexOf(e.severity) > SEVERITY_ORDER.indexOf(max) ? e.severity : max),
          cited.length > 0 ? 'mild' : 'normal'
        );

        return {
          category,
          statement: point.statement,
          severity,
          evidenceEventIds: citedEvents.map(e => e.id),
          whyExplanation: point.basis || 'Corroborated by recorded medical events.',
          factualBasis: cited.map(r => `${r.occurredAt ? `${r.occurredAt.slice(0, 10)} · ` : ''}${r.title}`).join(' | ') || 'Documented in patient history.'
        };
      });

      const aiHandoverSummary: HandoverSummary = {
        headline: overview.headline || `Clinical Handover — ${patient.fullName}`,
        coreNarrative: overview.summary,
        timespan: timespanLabel,
        totalEventsAnalyzed: events.length,
        supportingEvidenceCount: {
          events: events.length,
          historyDays,
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
        activeMedications: meds.filter(m => m.status === 'active').map(m => `${m.name} ${m.dose} (${m.frequency})`),
        allergies: patient.allergies,
        recommendedDoctorQuestions: overview.clarifying_questions,
        safetyDistinctions: {
          recordedFacts: [...overview.recent_events, ...overview.relevant_history, ...overview.doctor_recorded],
          patientReportedSymptoms: overview.patient_reported,
          aiInterpretations: [...overview.cautious_observations, ...overview.missing_information.map(m => `Not documented: ${m}`)]
        }
      };

      return res.json({ success: true, data: aiHandoverSummary });
    } catch (err: any) {
      console.warn('[Handover] Live Gemini summary generation unavailable, using grounded synthesis:', err?.message || err);
    }
  }

  // Grounded Clinical Synthesis (from the patient's actual persistent database records)
  const missedEvents = events.filter(e => e.type === 'medication' && e.metadata?.takenStatus === 'missed');
  const symptomEvents = events.filter(e => e.type === 'symptom');
  const emergencyEvents = events.filter(e => e.type === 'emergency');
  const vitalEvents = events.filter(e => e.type === 'vital');

  const keyFindings: HandoverSummary['keyFindings'] = [];

  if (tempVitals.length > 0) {
    keyFindings.push({
      category: 'Vitals Trend',
      statement: `Logged temperature: ${latestTemp} with pulse ${latestPulse} and SpO2 ${latestSpo2}.`,
      severity: tempVitals.some(v => (v.temperature || 0) >= 102) ? 'severe' : 'normal',
      evidenceEventIds: vitalEvents.map(e => e.id),
      whyExplanation: `Corroborated by ${tempVitals.length} recorded vitals measurement(s).`,
      factualBasis: `Recorded temperatures: ${tempVitals.map(v => `${v.temperature}°F`).join(' -> ')}`
    });
  }

  if (missedEvents.length > 0) {
    keyFindings.push({
      category: 'Medication Adherence',
      statement: `Adherence omission: ${missedEvents.length} dose(s) missed.`,
      severity: 'moderate',
      evidenceEventIds: missedEvents.map(e => e.id),
      whyExplanation: 'Dose omission recorded on medication log.',
      factualBasis: missedEvents.map(m => m.title).join('; ')
    });
  } else if (meds.length > 0) {
    keyFindings.push({
      category: 'Medication Adherence',
      statement: `${meds.length} active medication(s) maintained without missed doses.`,
      severity: 'normal',
      evidenceEventIds: events.filter(e => e.type === 'medication').map(e => e.id),
      whyExplanation: 'All scheduled doses marked as taken.',
      factualBasis: meds.map(m => `${m.name} ${m.dose}`).join(', ')
    });
  }

  if (symptomEvents.length > 0) {
    const recentSymptoms = symptomEvents.slice(-3);
    keyFindings.push({
      category: 'Symptom Progression',
      statement: `Reported symptoms: ${recentSymptoms.map(s => s.title).join(' | ')}.`,
      severity: recentSymptoms.some(s => s.severity === 'severe' || s.severity === 'critical') ? 'severe' : 'moderate',
      evidenceEventIds: recentSymptoms.map(s => s.id),
      whyExplanation: 'Documented in patient chronological log.',
      factualBasis: recentSymptoms.map(s => s.title).join('; ')
    });
  }

  if (reports.length > 0) {
    keyFindings.push({
      category: 'Lab Findings',
      statement: `${reports[0].title}: ${reports[0].summary}`,
      severity: 'moderate',
      evidenceEventIds: [reports[0].id],
      whyExplanation: 'Diagnostic report on file.',
      factualBasis: reports[0].extractedData ? JSON.stringify(reports[0].extractedData) : reports[0].title
    });
  }

  if (emergencyEvents.length > 0) {
    keyFindings.push({
      category: 'Emergency Trigger',
      statement: emergencyEvents[0].title,
      severity: 'critical',
      evidenceEventIds: emergencyEvents.map(e => e.id),
      whyExplanation: 'Emergency escalation incident recorded in patient timeline.',
      factualBasis: emergencyEvents[0].description
    });
  }

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const coreNarrative = events.length === 0
    ? `No clinical events recorded for ${patient.fullName}. Baseline profile: ${patient.age}yo ${patient.sex}, conditions: ${patient.conditions.join(', ') || 'None'}.`
    : `Clinical timeline for ${patient.fullName}: ${events.length} event(s) documented. Latest event: "${latestEvent?.title || ''}" (${latestEvent?.type || ''}) with severity ${latestEvent?.severity || 'normal'}. Vitals: Temp ${latestTemp}, BP ${latestBp}, Pulse ${latestPulse}, SpO2 ${latestSpo2}.`;

  const fallbackSummary: HandoverSummary = {
    headline: `Clinical Handover — ${patient.fullName}`,
    coreNarrative,
    timespan: timespanLabel,
    totalEventsAnalyzed: events.length,
    supportingEvidenceCount: {
      events: events.length,
      historyDays,
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
    activeMedications: meds.filter(m => m.status === 'active').map(m => `${m.name} ${m.dose} (${m.frequency})`),
    allergies: patient.allergies,
    recommendedDoctorQuestions: [
      `Review latest recorded symptoms with ${patient.fullName}.`,
      'Confirm current medication adherence schedule.',
      'Correlate recorded home vitals with clinical evaluation.'
    ],
    safetyDistinctions: {
      recordedFacts: [
        `Latest temperature reading: ${latestTemp}`,
        `Pulse: ${latestPulse}, SpO2: ${latestSpo2}`,
        `Documented conditions: ${patient.conditions.join(', ') || 'None'}`
      ],
      patientReportedSymptoms: symptomEvents.slice(-2).map(s => s.title),
      aiInterpretations: [
        'Summary derived directly from authenticated patient database records.',
        'Verify observations and trend with clinical assessment.'
      ]
    }
  };

  return res.json({ success: true, data: fallbackSummary });
});

export default router;
