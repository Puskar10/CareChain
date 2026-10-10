import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/* ── Recent event mini card ─────────────────────────────────── */
const MiniEvent: React.FC<{ time: string; title: string; value?: string; severity: string }> = ({ time, title, value, severity }) => {
  const dotColor = severity === 'critical' || severity === 'severe' ? '#BE2418' : severity === 'moderate' ? '#CC7A08' : '#1ECFE0';
  return (
    <div
      className="flex items-start gap-2.5 py-2.5 pressable group"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-125"
        style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}60` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] sm:text-xs text-white/80 font-medium truncate">{title}</p>
        <p className="label-tag text-[9px] text-white/30 mt-0.5">{time}</p>
      </div>
      {value && <span className="text-[11px] font-mono text-white/55 shrink-0">{value}</span>}
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { activePatient, events, handoverSummary, setActiveTab, startDemoStory, openWhyModal } = useCareChain();

  const recentEvents = [...events]
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div>
      {/* ── HERO COMPOSITION ───────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-3 lg:pb-8">
        <div className="max-w-screen-xl mx-auto w-full">
          <div
            className="glass-hero w-full relative overflow-hidden flex flex-col lg:flex-row items-stretch"
          >
            {/* Atmospheric background layers */}
            <div className="absolute inset-0 bg-atmo-hero pointer-events-none opacity-70"/>
            <div className="absolute inset-0 bg-noise pointer-events-none opacity-35"/>
            {/* Large glow orbs */}
            <div className="absolute top-[-20%] right-[10%] w-[600px] h-[600px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(30,207,224,0.06) 0%, transparent 70%)' }}/>
            <div className="absolute bottom-[-10%] left-[15%] w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(16,96,216,0.05) 0%, transparent 70%)' }}/>
            {/* Glass sheen stripe across top */}
            <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }}/>

            {/* LEFT: editorial headline + data */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-6 sm:p-9 lg:p-8 xl:p-10 lg:max-w-[46%] xl:max-w-[48%]">
              <div>
                {/* Status tag — glass float */}
                <div className="flex items-center gap-2.5 mb-7 lg:mb-8">
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(30,207,224,0.08)',
                      border: '1px solid rgba(30,207,224,0.20)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" style={{animation: 'pulseDot 2s ease-in-out infinite'}}/>
                    <span className="label-tag text-[9.5px] text-accent-cyan">PATIENT HEALTH INTELLIGENCE</span>
                  </div>
                  <span className="label-tag text-[9.5px] text-white/20">CARECHAIN</span>
                </div>

                {/* HEADLINE */}
                <h1 className="headline-display text-white mb-5 animate-fade-up">
                  THE STORY
                  <br />
                  <span className="text-white/20">BEHIND</span>
                  <br />
                  <span className="text-white">THE</span>
                  <br />
                  <span className="shimmer-text">EMERGENCY.</span>
                </h1>

                <p className="text-xs sm:text-[13px] text-white/40 max-w-[270px] leading-relaxed mb-7 lg:mb-8 animate-fade-up animate-fade-up-delay-1">
                  Know what happened before the patient reached the hospital.
                  72 hours of clinical context, compiled in 60 seconds.
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2.5 flex-wrap animate-fade-up animate-fade-up-delay-2">
                  <button onClick={() => setActiveTab('handover')} className="btn-cyan !px-4 !py-2 !text-xs">
                    <span>View 60s Handover</span>
                    <ArrowRight className="w-3 h-3"/>
                  </button>
                  <button
                    onClick={startDemoStory}
                    className="btn-ghost !px-4 !py-2 !text-xs"
                    style={{color: 'rgba(255,255,255,0.55)', borderColor: 'rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)'}}
                  >
                    <span>Run Demo Story</span>
                  </button>
                </div>
              </div>

              {/* Vital Metrics row */}
              <div
                className="mt-8 pt-6 lg:mt-9 lg:pt-6 grid grid-cols-3 gap-4 sm:gap-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {[
                  { label: 'TEMPERATURE', value: '102.6°F', delta: '↑ +2.2°F', color: '#BE2418' },
                  { label: 'PULSE', value: '108 bpm', delta: 'Tachycardic', color: '#CC7A08' },
                  { label: 'EVENTS', value: String(events.length), delta: 'Last 72h', color: '#1ECFE0' },
                ].map(m => (
                  <div key={m.label} className="animate-drift-up">
                    <span className="label-tag text-[9.5px]" style={{color: 'rgba(255,255,255,0.25)'}}>{m.label}</span>
                    <p className="text-xl sm:text-[1.375rem] font-light text-white mt-1 tracking-tight" style={{letterSpacing: '-0.03em'}}>{m.value}</p>
                    <p className="text-[11px] mt-0.5" style={{color: m.color, opacity: 0.85}}>{m.delta}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Anatomy + recent events */}
            <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-end xl:justify-center gap-4 lg:gap-3 xl:gap-6 p-6 sm:p-8 lg:p-6 lg:pr-8 xl:p-8 xl:pr-10 min-w-0">
              {/* Anatomy visual (Video) */}
              <div className="relative flex items-center justify-center w-full max-w-[280px] lg:max-w-[320px] xl:max-w-[360px] 2xl:max-w-[400px] aspect-[4/5] flex-shrink-0 -translate-x-1 sm:-translate-x-2 lg:-translate-x-1 xl:-translate-x-3 translate-y-1 sm:translate-y-2 lg:translate-y-3">
                <div className="absolute inset-0 rounded-full mix-blend-screen pointer-events-none"
                  style={{ background: 'radial-gradient(circle at center, rgba(30,207,224,0.09) 0%, rgba(16,96,216,0.03) 45%, transparent 70%)' }}
                />
                <video
                  src="/assets/anatomy_video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-[1.10] lg:scale-[1.14] mix-blend-screen opacity-85 pointer-events-none select-none"
                  style={{
                    maskImage: 'radial-gradient(ellipse at 50% 52%, black 30%, transparent 68%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at 50% 52%, black 30%, transparent 68%)',
                    filter: 'contrast(1.2) brightness(0.9) hue-rotate(-10deg)',
                  }}
                />

                {/* Floating chip — temperature — glass */}
                <div
                  className="chip-dark absolute top-6 lg:top-8 right-1 lg:right-2 px-2 py-1 text-right z-10"
                >
                  <span className="label-tag text-[9px] text-white/40">TEMP</span>
                  <p className="text-sm font-light text-white" style={{letterSpacing: '-0.03em'}}>102.6°F</p>
                </div>

                {/* Floating chip — pulse — glass */}
                <div
                  className="chip-dark absolute bottom-1/5 lg:bottom-1/4 -left-1 lg:left-0 px-2 py-1 z-10"
                >
                  <span className="label-tag text-[9px] text-white/40">PULSE</span>
                  <p className="text-xs font-light text-white" style={{letterSpacing: '-0.03em'}}>108 bpm</p>
                </div>
              </div>

              {/* Recent events mini list */}
              <div className="w-full lg:w-[155px] xl:w-44 2xl:w-48 flex-shrink-0">
                <span className="label-tag text-[9.5px] text-white/25 block mb-2.5">RECENT EVENTS</span>
                {recentEvents.map(e => (
                  <MiniEvent
                    key={e.id}
                    time={new Date(e.timestamp).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}
                    title={e.title}
                    value={e.metadata?.temperature ? `${e.metadata.temperature}°F` : undefined}
                    severity={e.severity}
                  />
                ))}
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="mt-3 flex items-center gap-1 text-[11px] text-accent-cyan/70 hover:text-accent-cyan transition-colors pressable"
                >
                  <span>Full timeline</span>
                  <ArrowRight className="w-3 h-3"/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PATIENT PROFILE + HANDOVER TEASER ─────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-screen-xl mx-auto">

          {/* Patient profile card — glass-light */}
          <div className="lg:col-span-4 glass-light p-8 animate-drift-up">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="label-tag text-ink-muted">ACTIVE PATIENT</span>
                <h2 className="headline-md text-ink-primary mt-2">{activePatient.fullName}</h2>
                <p className="text-sm text-ink-secondary mt-1">{activePatient.age} yrs · {activePatient.sex} · {activePatient.bloodGroup}</p>
              </div>
              <span className={`pill ${activePatient.status === 'Critical' ? 'pill-red' : activePatient.status === 'Needs Attention' ? 'pill-warn' : 'pill-ok'}`}>
                {activePatient.status}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="label-tag text-ink-muted block mb-1.5">ALLERGIES</span>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient.allergies.map(a => (
                    <span key={a} className="pill pill-red text-[10px]">{a}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="label-tag text-ink-muted block mb-1.5">CONDITIONS</span>
                <div className="flex flex-wrap gap-1.5">
                  {activePatient.conditions.map(c => (
                    <span key={c} className="pill pill-dark text-[10px]">{c}</span>
                  ))}
                </div>
              </div>
              <div
                className="pt-2"
                style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
              >
                <span className="label-tag text-ink-muted block mb-1">PHYSICIAN</span>
                <p className="text-sm text-ink-primary">{activePatient.primaryPhysician}</p>
              </div>
              <div>
                <span className="label-tag text-ink-muted block mb-1">EMERGENCY CONTACT</span>
                <p className="text-sm text-ink-primary">{activePatient.emergencyContact.name}</p>
                <p className="text-xs text-ink-secondary">{activePatient.emergencyContact.phone}</p>
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
