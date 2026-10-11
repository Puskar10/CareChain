import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { HeroCard } from './HeroCard';


export const DashboardView: React.FC = () => {
  const { activePatient, events, handoverSummary, setActiveTab, startDemoStory, openWhyModal } = useCareChain();


  return (
    <div>
      {/* ── HERO COMPOSITION ───────────────────────────── */}
      <HeroCard
        events={events}
        onViewHandover={() => setActiveTab('handover')}
        onRunDemo={startDemoStory}
        onViewTimeline={() => setActiveTab('timeline')}
      />

      {/* ── PATIENT PROFILE + HANDOVER TEASER ─────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-screen-xl mx-auto">

          {/* Patient profile card — glass-light */}
          <div className="lg:col-span-4 glass-light p-8 animate-drift-up">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="label-tag text-ink-muted">ACTIVE PATIENT</span>
                <h2 className="headline-md text-ink-primary mt-2">{activePatient?.fullName || 'No Patient Selected'}</h2>
                <p className="text-sm text-ink-secondary mt-1">
                  {activePatient ? `${activePatient.age} yrs · ${activePatient.sex} · ${activePatient.bloodGroup}` : 'Awaiting clinical selection'}
                </p>
              </div>
              {activePatient && (
                <span className={`pill ${activePatient.status === 'Critical' ? 'pill-red' : activePatient.status === 'Needs Attention' ? 'pill-warn' : 'pill-ok'}`}>
                  {activePatient.status}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <span className="label-tag text-ink-muted block mb-1.5">ALLERGIES</span>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient?.allergies && activePatient.allergies.length > 0 ? (
                    activePatient.allergies.map(a => (
                      <span key={a} className="pill pill-red text-[10px]">{a}</span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-muted">None documented</span>
                  )}
                </div>
              </div>
              <div>
                <span className="label-tag text-ink-muted block mb-1.5">CONDITIONS</span>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient?.conditions && activePatient.conditions.length > 0 ? (
                    activePatient.conditions.map(c => (
                      <span key={c} className="pill pill-dark text-[10px]">{c}</span>
                    ))
                  ) : (
                    <span className="text-xs text-ink-muted">None documented</span>
                  )}
                </div>
              </div>
              <div
                className="pt-2"
                style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
              >
                <span className="label-tag text-ink-muted block mb-1">PHYSICIAN</span>
                <p className="text-sm text-ink-primary">{activePatient?.primaryPhysician || 'Unassigned'}</p>
              </div>
              <div>
                <span className="label-tag text-ink-muted block mb-1">EMERGENCY CONTACT</span>
                <p className="text-sm text-ink-primary">{activePatient?.emergencyContact?.name || 'None listed'}</p>
                <p className="text-xs text-ink-secondary">{activePatient?.emergencyContact?.phone || '--'}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('emergency')}
              className="btn-primary mt-6 w-full justify-center pressable"
              style={{ background: 'linear-gradient(135deg, #BE2418 0%, #8B1710 100%)' }}
            >
              Emergency Mode
            </button>
          </div>

          {/* AI Handover teaser — glass-dark */}
          <div
            className="lg:col-span-8 glass-dark relative overflow-hidden p-8 sm:p-10 flex flex-col animate-drift-up animate-drift-up-delay-1"
            style={{ borderRadius: '1.75rem' }}
          >
            <div className="absolute inset-0 bg-atmo-hero pointer-events-none opacity-50"/>
            {/* Internal top highlight */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}/>

            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="label-tag text-accent-cyan">AI PATIENT HANDOVER</span>
                    <h3 className="text-xl font-light text-white mt-1" style={{letterSpacing: '-0.02em'}}>
                      60-Second Summary
                    </h3>
                  </div>
                  <div className="label-tag text-white/25">{handoverSummary.timespan}</div>
                </div>

                <blockquote
                  className="text-sm text-white/70 leading-relaxed max-w-2xl pl-4"
                  style={{ borderLeft: '2px solid rgba(30,207,224,0.25)' }}
                >
                  "{handoverSummary.coreNarrative}"
                </blockquote>
              </div>

              {/* Evidence row */}
              <div
                className="mt-8 pt-6 flex flex-wrap items-center gap-6 justify-between"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-6">
                  {[
                    { n: handoverSummary.supportingEvidenceCount.events, label: 'EVENTS' },
                    { n: handoverSummary.supportingEvidenceCount.historyDays, label: 'DAYS' },
                    { n: handoverSummary.supportingEvidenceCount.vitals, label: 'VITALS' },
                    { n: handoverSummary.supportingEvidenceCount.medications, label: 'MED LOGS' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-2xl font-light text-white" style={{letterSpacing: '-0.04em'}}>{s.n}</p>
                      <span className="label-tag text-white/25">{s.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('handover')} className="btn-cyan pressable">
                  <span>Open Handover</span>
                  <ArrowUpRight className="w-3.5 h-3.5"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KEY FINDINGS ─────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-screen-xl mx-auto">
          {/* Section heading */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="label-tag text-ink-muted">EXPLAINABLE AI</span>
              <h2 className="headline-md text-ink-primary mt-2">Key Findings</h2>
            </div>
            <button
              onClick={() => setActiveTab('handover')}
              className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition-colors pressable"
            >
              <span>Full analysis</span>
              <ArrowRight className="w-3 h-3"/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {handoverSummary.keyFindings.slice(0, 3).map((f, i) => (
              <div
                key={i}
                className={`glass-light p-6 cursor-pointer group pressable transition-all animate-drift-up ${
                  i === 0 ? 'md:col-span-2 xl:col-span-1' : ''
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="label-tag text-ink-muted">{f.category}</span>
                  <span className={`pill text-[10px] ${f.severity === 'severe' || f.severity === 'critical' ? 'pill-red' : 'pill-warn'}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink-primary leading-snug mb-3">{f.statement}</p>
                <p className="text-xs text-ink-muted leading-relaxed mb-4 line-clamp-2">{f.factualBasis}</p>
                <div
                  className="pt-3 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                >
                  <span className="text-xs text-ink-muted">{f.evidenceEventIds.length} linked events</span>
                  <button
                    onClick={() => openWhyModal(f as any)}
                    className="text-xs text-accent-blue hover:text-void transition-colors font-medium pressable"
                  >
                    Why this? →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
