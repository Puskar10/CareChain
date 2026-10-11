import type {
  AIOverviewData,
  EventSeverity,
  HandoverSummary,
  HealthEvent,
  Medication,
  MedicalReport,
  Patient,
  VitalRecord,
} from '../types';

/** Shown in the existing summary text areas while the server is working or when it cannot help. */
export const AI_OVERVIEW_LOADING_TEXT = 'Generating AI overview...';
export const AI_OVERVIEW_UNAVAILABLE_TEXT = 'AI overview is temporarily unavailable.';

const SEVERITY_ORDER: EventSeverity[] = ['normal', 'mild', 'moderate', 'severe', 'critical'];

type FindingCategory = HandoverSummary['keyFindings'][number]['category'];

export interface OverviewLocalContext {
  patient: Patient;
  events: HealthEvent[];
  medications: Medication[];
  vitals: VitalRecord[];
  reports: MedicalReport[];
}

/** Placeholder content for the existing handover UI while the overview is loading or unavailable. */
export function overviewPlaceholder(text: string, patient: Patient, ctx: Omit<OverviewLocalContext, 'patient'>): HandoverSummary {
  return {
    ...baseSummary({ patient, ...ctx }),
    coreNarrative: text,
    keyFindings: [],
    recommendedDoctorQuestions: [],
    safetyDistinctions: { recordedFacts: [], patientReportedSymptoms: [], aiInterpretations: [] },
  };
}

function baseSummary(ctx: OverviewLocalContext): HandoverSummary {
  const { patient, events, medications, vitals, reports } = ctx;
  const times = events.map(e => Date.parse(e.timestamp)).filter(t => !Number.isNaN(t));
  const historyDays = times.length > 1 ? Math.max(1, Math.round((Math.max(...times) - Math.min(...times)) / 86_400_000)) : times.length;

  // Latest vitals come only from recorded readings; absent values stay "--" (nothing is invented).
  const latest = (pick: (v: VitalRecord) => number | undefined) =>
    [...vitals].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map(pick).find(v => v !== undefined);
  const temp = latest(v => v.temperature);
  const sys = latest(v => v.bpSystolic);
  const dia = latest(v => v.bpDiastolic);
  const pulse = latest(v => v.heartRate);
  const spo2 = latest(v => v.spo2);

  return {
    headline: `Clinical Handover: ${patient.fullName}`,
    coreNarrative: '',
    timespan: 'Full Timeline',
    totalEventsAnalyzed: events.length,
    supportingEvidenceCount: {
      events: events.length,
      historyDays,
      medications: medications.length,
      vitals: vitals.length,
      reports: reports.length,
    },
    keyFindings: [],
    latestVitals: {
      temperature: temp !== undefined ? `${temp}°F` : '--',
      bp: sys !== undefined && dia !== undefined ? `${sys}/${dia} mmHg` : '--/--',
      pulse: pulse !== undefined ? `${pulse} bpm` : '--',
      spo2: spo2 !== undefined ? `${spo2}%` : '--%',
    },
    activeMedications: medications.filter(m => m.status === 'active').map(m => `${m.name} ${m.dose} (${m.frequency})`),
    allergies: patient.allergies,
    recommendedDoctorQuestions: [],
    safetyDistinctions: { recordedFacts: [], patientReportedSymptoms: [], aiInterpretations: [] },
  };
}

/**
 * Maps the server's validated AI overview onto the existing HandoverSummary shape so the current
 * handover / assessment screens render it unchanged.
 *
 * Anything that drives urgency (finding severity) or categorisation is derived from the cited
 * source records, never from the model's own judgement.
 */
export function overviewToHandoverSummary(data: AIOverviewData, ctx: OverviewLocalContext): HandoverSummary {
  const { overview, records } = data;
  const refById = new Map(records.map(r => [r.id, r]));
  const eventById = new Map(ctx.events.map(e => [e.id, e]));

  const keyFindings: HandoverSummary['keyFindings'] = overview.attention_points.map(point => {
    const cited = point.source_record_ids.map(id => refById.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r));
    const citedEvents = cited.filter(r => r.kind === 'medical_event').map(r => eventById.get(r.sourceId)).filter((e): e is HealthEvent => Boolean(e));

    let category: FindingCategory = 'Symptom Progression';
    if (cited.some(r => r.kind === 'report')) category = 'Lab Findings';
    else if (cited.some(r => r.kind === 'medication') || citedEvents.some(e => e.type === 'medication')) category = 'Medication Adherence';
    else if (cited.some(r => r.kind === 'vital') || citedEvents.some(e => e.type === 'vital')) category = 'Vitals Trend';
    else if (citedEvents.some(e => e.type === 'emergency')) category = 'Emergency Trigger';

    const severity = citedEvents.reduce<EventSeverity>(
      (max, e) => (SEVERITY_ORDER.indexOf(e.severity) > SEVERITY_ORDER.indexOf(max) ? e.severity : max),
      cited.length > 0 ? 'mild' : 'normal',
    );

    return {
      category,
      statement: point.statement,
      severity,
      evidenceEventIds: citedEvents.map(e => e.id),
      whyExplanation: point.basis || 'Based on the cited records.',
      factualBasis: cited.map(r => `${r.occurredAt ? `${r.occurredAt.slice(0, 10)} · ` : ''}${r.title} (${r.author.replace(/_/g, '-')})`).join(' | ') || 'No specific records cited.',
    };
  });

  return {
    ...baseSummary(ctx),
    headline: overview.headline || `Clinical Handover: ${ctx.patient.fullName}`,
    coreNarrative: overview.summary,
    totalEventsAnalyzed: data.meta.recordsConsidered,
    keyFindings,
    recommendedDoctorQuestions: overview.clarifying_questions,
    safetyDistinctions: {
      recordedFacts: [...overview.recent_events, ...overview.relevant_history, ...overview.doctor_recorded],
      patientReportedSymptoms: overview.patient_reported,
      aiInterpretations: [...overview.cautious_observations, ...overview.missing_information.map(m => `Not documented: ${m}`)],
    },
  };
}
