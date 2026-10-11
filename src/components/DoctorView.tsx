import React from 'react';
import { useCareChain } from '../context/CareChainContext';
import { ArrowRight, Pill } from 'lucide-react';

export const DoctorView: React.FC = () => {
  const { activePatient, events, medications, handoverSummary, setActiveTab, openWhyModal } = useCareChain();

  const criticalEvents = events.filter(e => e.severity === 'critical' || e.severity === 'severe');
  const recentEvents = [...events].sort((a,b) => new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()).slice(0,6);
  const activeMeds = medications.filter(m => m.status === 'active');

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="label-tag text-ink-muted">CLINICAL COCKPIT</span>
          <h1 className="headline-lg text-ink-primary mt-3">Doctor View</h1>
          <p className="text-sm text-ink-secondary mt-2">Clinical-grade patient intelligence for care decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('handover')} className="btn-primary">
            <span>Open 60s Handover</span>
            <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {/* Alert bar */}
      {criticalEvents.length > 0 && (
        <div className="flex items-center gap-4 px-6 py-4 rounded-3xl border border-emergency-border bg-emergency-dim">
          <div className="w-2 h-2 rounded-full bg-emergency-DEFAULT shrink-0" style={{animation:'pulseDot 1.5s ease-in-out infinite'}}/>
          <p className="text-sm text-emergency-DEFAULT font-medium">
            {criticalEvents.length} critical event{criticalEvents.length > 1 ? 's' : ''} in patient history. Review immediately.
          </p>
          <button onClick={() => setActiveTab('emergency')} className="ml-auto pill pill-red text-[11px]">Emergency Mode</button>
        </div>
      )}

      {/* Clinical quick view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Patient identity */}
        <div className="lg:col-span-4 glass-light p-7 animate-drift-up">
          <span className="label-tag text-ink-muted block mb-4">PATIENT PROFILE</span>
          <h2 className="text-2xl font-light text-ink-primary mb-1" style={{letterSpacing:'-0.02em'}}>
            {activePatient?.fullName || 'No Patient Selected'}
          </h2>
          <p className="text-sm text-ink-secondary">
            {activePatient ? `${activePatient.age} yrs · ${activePatient.sex} · ${activePatient.bloodGroup}` : 'Awaiting patient assignment'}
          </p>

          <div className="mt-5 space-y-3">
            <div>
              <span className="label-tag text-ink-muted block mb-1.5">CONDITIONS</span>
              <div className="flex flex-wrap gap-1.5">
                {activePatient?.conditions && activePatient.conditions.length > 0 ? (
                  activePatient.conditions.map(c => <span key={c} className="pill pill-dark text-[11px]">{c}</span>)
                ) : (
                  <span className="text-xs text-ink-muted">None documented</span>
                )}
              </div>
            </div>
            <div>
              <span className="label-tag text-ink-muted block mb-1.5">ALLERGIES</span>
              <div className="flex flex-wrap gap-1.5">
                {activePatient?.allergies && activePatient.allergies.length > 0 ? (
                  activePatient.allergies.map(a => <span key={a} className="pill pill-red text-[11px]">{a}</span>)
                ) : (
                  <span className="text-xs text-ink-muted">None documented</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-black/[0.05]">
            <span className="label-tag text-ink-muted block mb-1">PRIMARY PHYSICIAN</span>
            <p className="text-sm font-medium text-ink-primary">{activePatient?.primaryPhysician || 'Unassigned'}</p>
          </div>
        </div>

        {/* Key findings */}
        <div className="lg:col-span-8 glass-light p-7 animate-drift-up animate-drift-up-delay-1">
          <div className="flex items-center justify-between mb-5">
            <span className="label-tag text-ink-muted">AI CLINICAL FINDINGS</span>
            <button onClick={() => setActiveTab('handover')} className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1">
              Full analysis <ArrowRight className="w-3 h-3"/>
            </button>
          </div>
          <div className="space-y-3">
            {handoverSummary.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-primary truncate">{f.statement}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{f.category} · {f.evidenceEventIds.length} events</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-12 h-1 rounded-full bg-black/[0.05] overflow-hidden">
                    <div className="h-full rounded-full bg-accent-cyan" style={{width:`${({'critical':100,'severe':75,'moderate':50,'mild':25,'normal':10} as Record<string,number>)[f.severity]||50}%`}}/>
                  </div>
                  <span className={`pill text-[11px] ${f.severity==='severe'||f.severity==='critical'?'pill-red':'pill-warn'}`}>{f.severity}</span>
                  <button onClick={() => openWhyModal(f as any)} className="text-xs text-accent-blue hover:text-void font-medium">Why?</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active medications */}
      <div className="glass-light p-7 animate-drift-up">
        <div className="flex items-center justify-between mb-5">
          <span className="label-tag text-ink-muted">ACTIVE MEDICATIONS ({activeMeds.length})</span>
          <button onClick={() => setActiveTab('medications')} className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1">
            Full history <ArrowRight className="w-3 h-3"/>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {activeMeds.map(m => {
            const taken = m.scheduleTimes.filter(s => s.status === 'taken').length;
            const adherence = m.scheduleTimes.length ? Math.round((taken / m.scheduleTimes.length) * 100) : null;
            return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-2xl border border-black/[0.05] bg-black/[0.015]">
              <Pill className="w-5 h-5 shrink-0 text-ink-secondary" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">{m.name}</p>
                <p className="text-xs text-ink-muted">{m.dose} · {m.frequency}</p>
              </div>
              {adherence != null && (
                <span className={`pill text-[11px] ${adherence < 70 ? 'pill-warn' : 'pill-ok'}`}>
                  {adherence}%
                </span>
              )}
            </div>
            );
          })}
          {activeMeds.length === 0 && <p className="text-sm text-ink-muted">No active medications</p>}
        </div>
      </div>

      {/* Recent events */}
      <div className="glass-light p-7 animate-drift-up">
        <div className="flex items-center justify-between mb-5">
          <span className="label-tag text-ink-muted">RECENT CLINICAL EVENTS</span>
          <button onClick={() => setActiveTab('timeline')} className="text-xs text-ink-secondary hover:text-ink-primary flex items-center gap-1">
            Full timeline <ArrowRight className="w-3 h-3"/>
          </button>
        </div>
        <div className="space-y-2">
          {recentEvents.map(e => (
            <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-black/[0.02] transition-colors">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                background: e.severity === 'critical' || e.severity === 'severe' ? '#C5281A' : e.severity === 'moderate' ? '#D4840A' : '#20D3E8'
              }}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">{e.title}</p>
                <p className="text-xs text-ink-muted">{e.description.slice(0,80)}…</p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-xs text-ink-muted">
                  {new Date(e.timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                </span>
                <p className="font-mono text-xs text-ink-muted">{new Date(e.timestamp).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              <span className={`pill text-[11px] shrink-0 ${e.severity==='critical'||e.severity==='severe'?'pill-red':e.severity==='moderate'?'pill-warn':'pill-dark'}`}>
                {e.severity}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
