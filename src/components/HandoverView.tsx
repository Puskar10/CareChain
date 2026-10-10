import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

const SEVERITY_SCORE: Record<string, number> = {
  critical: 4, severe: 3, moderate: 2, mild: 1, normal: 0
};

function deriveUrgencyLevel(findings: { severity: string }[]): string {
  const maxScore = Math.max(...findings.map(f => SEVERITY_SCORE[f.severity] || 0));
  return maxScore >= 4 ? 'CRITICAL' : maxScore >= 3 ? 'HIGH' : 'MODERATE';
}

export const HandoverView: React.FC = () => {
  const { handoverSummary, evidenceHighlightIds, setEvidenceHighlightIds, openWhyModal, setActiveTab } = useCareChain();

  const urgencyLevel = deriveUrgencyLevel(handoverSummary.keyFindings);
  const urgencyGlowColor = urgencyLevel === 'CRITICAL' ? '#FF6B6B' : urgencyLevel === 'HIGH' ? '#FFB347' : '#1ECFE0';

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-6">

      {/* ── HERO HEADER ─────────────────────────────── */}
      <div
        className="glass-hero relative overflow-hidden p-10 sm:p-14 animate-drift-up"
        style={{ borderRadius: '2.75rem' }}
      >
        <div className="absolute inset-0 bg-atmo-hero pointer-events-none opacity-65"/>
        <div className="absolute inset-0 bg-noise pointer-events-none opacity-35"/>
        {/* Top specular edge */}
        <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}/>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="label-tag text-accent-cyan">AI PATIENT HANDOVER</span>
                <span className="label-tag text-white/20">· FOR EMERGENCY TEAM</span>
              </div>
              <h1 className="headline-xl text-white mb-4">60-Second<br/>Patient Summary</h1>
              <p className="text-sm text-white/40 max-w-xs">{handoverSummary.timespan}</p>
            </div>

            {/* Urgency badge — glass */}
            <div className="shrink-0">
              <div
                className="px-8 py-6 text-center"
                style={{
                  minWidth: '160px',
                  borderRadius: '1.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.09), 0 0 30px -8px ${urgencyGlowColor}40`,
                }}
              >
                <span className="label-tag text-white/30 block mb-3">URGENCY LEVEL</span>
                <div className="text-4xl font-light tracking-tight" style={{color: urgencyGlowColor}}>
                  {urgencyLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence stats */}
          <div
            className="mt-10 pt-8 grid grid-cols-2 md:grid-cols-4 gap-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {[
              { n: handoverSummary.supportingEvidenceCount.events, l: 'EVENTS LOGGED' },
              { n: handoverSummary.supportingEvidenceCount.historyDays, l: 'DAYS HISTORY' },
              { n: handoverSummary.supportingEvidenceCount.vitals, l: 'VITAL READINGS' },
              { n: handoverSummary.supportingEvidenceCount.medications, l: 'MEDICATION LOGS' },
            ].map(s => (
              <div key={s.l} className="animate-drift-up">
                <p className="text-4xl font-extralight text-white" style={{letterSpacing:'-0.04em'}}>{s.n}</p>
                <span className="label-tag text-white/25 mt-1 block">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NARRATIVE ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 glass-light p-8 sm:p-10 animate-drift-up">
          <span className="label-tag text-ink-muted">CLINICAL NARRATIVE</span>
          <h2 className="text-xl font-light text-ink-primary mt-3 mb-6" style={{letterSpacing:'-0.02em'}}>
            What happened?
          </h2>
          <p className="text-sm text-ink-secondary leading-relaxed">
            {handoverSummary.coreNarrative}
          </p>

          {/* Doctor questions */}
          {handoverSummary.recommendedDoctorQuestions.length > 0 && (
            <div
              className="mt-8 pt-6"
              style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
            >
              <span className="label-tag text-ink-muted block mb-4">RECOMMENDED QUESTIONS FOR DOCTOR</span>
              <ul className="space-y-2">
                {handoverSummary.recommendedDoctorQuestions.map((a, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-secondary">
                    <span
                      className="w-5 h-5 rounded-full text-emergency-DEFAULT text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(190,36,24,0.08)' }}
                    >
                      {i+1}
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Concerns + timeline ref */}
        <div className="lg:col-span-2 space-y-4">
          {/* Critical concerns */}
          <div className="glass-light p-6 animate-drift-up animate-drift-up-delay-1">
            <span className="label-tag text-ink-muted block mb-4">CRITICAL CONCERNS</span>
            <div className="space-y-3">
              {handoverSummary.safetyDistinctions.recordedFacts.map((c, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-emergency-DEFAULT mt-1.5 shrink-0"
                    style={{animation:'pulseDot 2s ease-in-out infinite'}}
                  />
                  <span className="text-ink-secondary">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline shortcut */}
          <div className="glass-light p-6 animate-drift-up animate-drift-up-delay-2">
            <span className="label-tag text-ink-muted block mb-3">EVIDENCE TIMELINE</span>
            <p className="text-sm text-ink-secondary mb-4">
              Explore the {handoverSummary.supportingEvidenceCount.events} source events that generated this handover.
            </p>
            <button onClick={() => setActiveTab('timeline')} className="btn-ghost w-full justify-center pressable">
              <span>Open Timeline</span>
              <ArrowRight className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      </div>

      {/* ── KEY FINDINGS (Explainable AI) ──────────── */}
      <div>
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="label-tag text-ink-muted">EXPLAINABLE AI · {handoverSummary.keyFindings.length} FINDINGS</span>
            <h2 className="headline-md text-ink-primary mt-2">AI Evidence Chain</h2>
          </div>
          {evidenceHighlightIds.length > 0 && (
            <button onClick={() => setEvidenceHighlightIds([])} className="btn-ghost text-xs pressable">Clear highlights</button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {handoverSummary.keyFindings.map((f, i) => (
            <div
              key={i}
              className="glass-light p-6 group pressable transition-all"
              style={{ borderRadius: '1.5rem', animationDelay: `${i * 0.06}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="label-tag text-ink-muted">{f.category}</span>
                <span className={`pill text-[10px] ${f.severity === 'severe' || f.severity === 'critical' ? 'pill-red' : 'pill-warn'}`}>
                  {f.severity}
                </span>
              </div>

              <p className="text-sm font-semibold text-ink-primary leading-snug mb-2">{f.statement}</p>
              <p className="text-xs text-ink-muted leading-relaxed mb-4">{f.factualBasis}</p>

              {/* Severity bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="label-tag text-ink-muted">SEVERITY</span>
                  <span className="label-tag text-ink-primary capitalize">{f.severity}</span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(({'critical':100,'severe':75,'moderate':50,'mild':25,'normal':10} as Record<string,number>)[f.severity]||50)}%`,
                      background: 'linear-gradient(90deg, #1ECFE0, #4DA8F5)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>

              <div
                className="pt-3 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
              >
                <button
                  onClick={() => {
                    setEvidenceHighlightIds(f.evidenceEventIds);
                    setActiveTab('timeline');
                  }}
                  className="text-xs text-ink-muted hover:text-ink-primary transition-colors flex items-center gap-1 pressable"
                >
                  <ArrowUpRight className="w-3 h-3"/>
                  <span>{f.evidenceEventIds.length} events</span>
                </button>
                <button
                  onClick={() => openWhyModal(f as any)}
                  className="text-xs text-accent-blue font-medium hover:text-void transition-colors pressable"
                >
                  Why this? →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEDICATION SUMMARY ────────────────────── */}
      {handoverSummary.activeMedications.length > 0 && (
        <div className="glass-light p-8 animate-drift-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="label-tag text-ink-muted">ACTIVE MEDICATIONS</span>
              <h2 className="text-xl font-light text-ink-primary mt-1" style={{letterSpacing:'-0.02em'}}>
                {handoverSummary.activeMedications.length} Medications
              </h2>
            </div>
            <button onClick={() => setActiveTab('medications')} className="btn-ghost pressable">
              <span>Full history</span>
              <ArrowRight className="w-3.5 h-3.5"/>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {handoverSummary.activeMedications.map((med, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-2xl pressable"
                style={{
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(30,207,224,0.08)', border: '1px solid rgba(30,207,224,0.12)' }}
                >
                  <span className="text-base">💊</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary">{med}</p>
                </div>
                <span className="pill pill-ok text-[10px] shrink-0">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
