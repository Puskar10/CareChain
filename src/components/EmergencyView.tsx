import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { Phone, AlertTriangle } from 'lucide-react';

export const EmergencyView: React.FC = () => {
  const { activePatient, handoverSummary, events, setActiveTab } = useCareChain();

  if (!activePatient) {
    return (
      <div className="min-h-screen emergency-surface flex items-center justify-center p-4">
        <div className="glass-dark p-8 rounded-3xl max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-emergency-DEFAULT mx-auto" />
          <h2 className="text-xl font-bold font-carmen text-white">No Active Patient In ER Triage</h2>
          <p className="text-sm text-white/60">
            Emergency mode requires an active patient record. Please select a patient or await incoming EMS transport.
          </p>
          <button
            onClick={() => setActiveTab('doctor-dashboard')}
            className="btn-cyan !px-4 !py-2 !text-xs mx-auto cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'severe')
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen emergency-surface">
      <div className="max-w-screen-lg mx-auto page-gutter py-12 space-y-6">

        {/* ── EMERGENCY HEADER ─────────────────────── */}
        <div className="pt-6 animate-drift-up">
          {/* Status indicator row — always centered */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-3 h-3 rounded-full bg-emergency-DEFAULT"
              style={{
                animation: 'pulseDot 1.2s ease-in-out infinite',
                boxShadow: '0 0 18px rgba(190,36,24,0.6)',
              }}
            />
            <span className="label-tag text-emergency-DEFAULT tracking-widest">EMERGENCY MODE · ACTIVE</span>
            <div
              className="w-3 h-3 rounded-full bg-emergency-DEFAULT"
              style={{
                animation: 'pulseDot 1.2s ease-in-out infinite 0.4s',
                boxShadow: '0 0 18px rgba(190,36,24,0.6)',
              }}
            />
          </div>

          {/* Hero composition: heading left, heart right on desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-0">

            {/* Left: heading + subtitle — shifted slightly left on desktop */}
            <div className="text-center md:text-left md:pl-0 md:-translate-x-4">
              <h1 className="headline-xl text-white">
                Emergency<br/>
                <span style={{color:'rgba(255,255,255,0.18)'}}>Access</span>
              </h1>
              <p className="text-sm text-white/40 mt-4 max-w-sm mx-auto md:mx-0">
                Immediate patient intelligence for responding medical personnel.
              </p>
            </div>

            {/* Right: anatomical heart video */}
            <div
              className="relative flex-shrink-0 flex items-center justify-center self-center"
              style={{ width: '260px', height: '260px' }}
              aria-hidden="true"
            >
              {/* Crimson glow orb behind the heart */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, rgba(190,36,24,0.12) 0%, rgba(190,36,24,0.04) 45%, transparent 70%)',
                }}
              />
              <video
                src="/assets/heart.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-90 pointer-events-none select-none"
                style={{
                  maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 72%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 72%)',
                  filter: 'contrast(1.15) brightness(0.95)',
                }}
              />
            </div>

          </div>
        </div>

        {/* ── PATIENT IDENTITY CARD ─────────────── */}
        <div
          className="glass-emergency p-8 sm:p-10 overflow-hidden animate-drift-up animate-drift-up-delay-1"
          style={{ borderRadius: '2.25rem' }}
        >
          <div className="absolute top-4 right-4 opacity-6 pointer-events-none">
            <AlertTriangle className="w-24 h-24 text-emergency-DEFAULT"/>
          </div>
          <span className="label-tag text-emergency-DEFAULT block mb-4">PATIENT IDENTITY</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'NAME', val: activePatient.fullName },
              { label: 'AGE', val: `${activePatient.age} years` },
              { label: 'SEX', val: activePatient.sex },
              { label: 'BLOOD TYPE', val: activePatient.bloodGroup },
            ].map(d => (
              <div key={d.label}>
                <span className="label-tag text-white/30 block mb-1">{d.label}</span>
                <p className="text-xl font-light text-white" style={{letterSpacing:'-0.02em'}}>{d.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CRITICAL ALERTS ───────────────────── */}
        {criticalEvents.length > 0 && (
          <div
            className="glass-dark p-6 sm:p-8 animate-drift-up animate-drift-up-delay-2"
            style={{ borderRadius: '1.75rem' }}
          >
            <span className="label-tag text-emergency-DEFAULT block mb-5">CRITICAL EVENTS</span>
            <div className="space-y-3">
              {criticalEvents.map(e => (
                <div
                  key={e.id}
                  className="flex items-start gap-4 p-4 rounded-2xl pressable"
                  style={{
                    border: '1px solid rgba(190,36,24,0.20)',
                    background: 'rgba(190,36,24,0.07)',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full bg-emergency-DEFAULT shrink-0 mt-1.5"
                    style={{animation:'pulseDot 1.5s ease-in-out infinite'}}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{e.title}</p>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{e.description}</p>
                  </div>
                  <span className="font-mono text-xs text-white/30 shrink-0">
                    {new Date(e.timestamp).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TWO-COL: ALLERGIES + CONTACTS ──────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Allergies */}
          <div
            className="glass-dark p-6 animate-drift-up"
            style={{ borderRadius: '1.75rem' }}
          >
            <span className="label-tag text-emergency-DEFAULT block mb-4">⚠ ALLERGIES · DO NOT ADMINISTER</span>
            <div className="space-y-2">
              {activePatient.allergies.map(a => (
                <div
                  key={a}
                  className="flex items-center gap-3 p-3 rounded-xl pressable"
                  style={{
                    border: '1px solid rgba(190,36,24,0.18)',
                    background: 'rgba(190,36,24,0.06)',
                  }}
                >
                  <span className="text-base">🚫</span>
                  <span className="text-sm font-medium text-white">{a}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div
            className="glass-dark p-6 animate-drift-up animate-drift-up-delay-1"
            style={{ borderRadius: '1.75rem' }}
          >
            <span className="label-tag text-white/30 block mb-4">EMERGENCY CONTACTS</span>
            <div className="space-y-4">
              <div>
                <span className="label-tag text-white/20 block mb-1">PRIMARY PHYSICIAN</span>
                <p className="text-sm font-medium text-white">{activePatient.primaryPhysician}</p>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
                <span className="label-tag text-white/20 block mb-1">FAMILY CONTACT</span>
                <p className="text-sm font-medium text-white">{activePatient.emergencyContact.name}</p>
                <p className="text-xs text-white/40">{activePatient.emergencyContact.relationship}</p>
                <a
                  href={`tel:${activePatient.emergencyContact.phone}`}
                  className="flex items-center gap-2 mt-2 text-accent-cyan text-sm hover:text-white transition-colors pressable"
                >
                  <Phone className="w-3.5 h-3.5"/>
                  {activePatient.emergencyContact.phone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI SUMMARY ─────────────────────────── */}
        <div
          className="glass-dark p-8 sm:p-10 animate-drift-up"
          style={{ borderRadius: '1.75rem' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" style={{animation:'pulseDot 2s ease-in-out infinite'}}/>
            <span className="label-tag text-accent-cyan">AI 60-SECOND SUMMARY</span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-6">{handoverSummary.coreNarrative}</p>

          {handoverSummary.safetyDistinctions.aiInterpretations.length > 0 && (
            <>
              <span className="label-tag text-white/30 block mb-3">AI ANALYSIS</span>
              <div className="space-y-2">
                {handoverSummary.safetyDistinctions.aiInterpretations.map((c, i) => (
                  <p key={i} className="text-sm text-white/60 flex items-start gap-3">
                    <span className="text-emergency-DEFAULT shrink-0">→</span>
                    {c}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── CONDITIONS PANEL ─────────────────── */}
        <div
          className="glass-dark p-6 animate-drift-up"
          style={{ borderRadius: '1.75rem' }}
        >
          <span className="label-tag text-white/30 block mb-4">KNOWN CONDITIONS</span>
          <div className="flex flex-wrap gap-2">
            {activePatient.conditions.map(c => (
              <span
                key={c}
                className="px-3 py-1.5 rounded-full text-xs text-white/55 pressable"
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
