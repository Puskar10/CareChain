import React from 'react';
import { useCareChain } from '../context/CareChainContext';

export const MedicationsView: React.FC = () => {
  const { medications, events, toggleMedicationDose } = useCareChain();

  const activeMeds = medications.filter(m => m.status === 'active');
  const otherMeds  = medications.filter(m => m.status !== 'active');

  const getAdherence = (m: typeof medications[0]) => {
    if (!m.scheduleTimes.length) return null;
    const taken = m.scheduleTimes.filter(s => s.status === 'taken').length;
    return Math.round((taken / m.scheduleTimes.length) * 100);
  };

  const getLastTaken = (medName: string) => {
    const evt = [...events]
      .filter(e => e.type === 'medication' && e.metadata?.medicineName === medName && e.metadata?.takenStatus === 'taken')
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return evt ? new Date(evt.timestamp) : null;
  };

  const adherenceColor = (n: number | null) => {
    if (n == null) return '#1ECFE0';
    return n >= 80 ? '#12B870' : n >= 60 ? '#CC7A08' : '#BE2418';
  };

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-10">

      {/* Header */}
      <div className="animate-drift-up">
        <span className="label-tag text-ink-muted">MEDICATION PROFILE</span>
        <h1 className="headline-lg text-ink-primary mt-3">{medications.length} Medications</h1>
        <p className="text-sm text-ink-secondary mt-2">{activeMeds.length} active · {otherMeds.length} historical</p>
      </div>

      {/* Active medications */}
      {activeMeds.length > 0 && (
        <div>
          <span className="label-tag text-ok block mb-5">ACTIVE PRESCRIPTIONS</span>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeMeds.map((m, idx) => {
              const adherence = getAdherence(m);
              const lastTaken = getLastTaken(m.name);
              const missedCount = m.scheduleTimes.filter(s => s.status === 'missed').length;
              const aColor = adherenceColor(adherence);

              return (
                <div
                  key={m.id}
                  className="glass-light p-6 pressable animate-drift-up"
                  style={{ borderRadius: '1.5rem', animationDelay: `${idx * 0.07}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                      style={{
                        background: 'rgba(30,207,224,0.07)',
                        border: '1px solid rgba(30,207,224,0.12)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      💊
                    </div>
                    <span className="pill pill-ok text-[10px]">Active</span>
                  </div>

                  <h3 className="text-base font-semibold text-ink-primary" style={{letterSpacing:'-0.01em'}}>{m.name}</h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { l: 'DOSE', v: m.dose },
                      { l: 'FREQUENCY', v: m.frequency },
                    ].map(d => (
                      <div key={d.l}>
                        <span className="label-tag text-ink-muted block mb-0.5">{d.l}</span>
                        <p className="text-xs text-ink-primary font-medium">{d.v}</p>
                      </div>
                    ))}
                  </div>

                  {/* Adherence bar */}
                  {adherence != null && (
                    <div
                      className="mt-5 pt-4"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="label-tag text-ink-muted">ADHERENCE</span>
                        <span className="label-tag font-bold" style={{color: aColor}}>{adherence}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${adherence}%`, background: aColor }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Last taken */}
                  {lastTaken && (
                    <p className="text-xs text-ink-muted mt-3">
                      Last taken: <strong className="text-ink-secondary">{lastTaken.toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</strong>
                    </p>
                  )}

                  {m.notes && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <p className="text-xs text-ink-muted leading-relaxed">{m.notes}</p>
                    </div>
                  )}

                  {/* Missed doses */}
                  {missedCount > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="pill pill-warn text-[9px]">{missedCount} missed dose{missedCount > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {/* Dose log */}
                  {m.scheduleTimes.length > 0 && (
                    <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <span className="label-tag text-ink-muted block mb-2">DOSE LOG</span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.scheduleTimes.map((st, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleMedicationDose(m.id, idx, st.status === 'taken' ? 'missed' : 'taken')}
                            title={`${st.time} — ${st.status}`}
                            className={`px-2 py-1 rounded-lg text-[10px] font-medium pressable transition-all ${
                              st.status === 'taken'  ? 'bg-ok/10 text-ok border border-ok/20' :
                              st.status === 'missed' ? 'bg-emergency-dim text-emergency-DEFAULT border border-emergency-border' :
                              ''
                            }`}
                            style={st.status === 'pending' ? {
                              background: 'rgba(0,0,0,0.04)',
                              color: 'var(--ink-muted)',
                              border: '1px solid rgba(0,0,0,0.07)',
                            } : {}}
                          >
                            {st.time} · {st.status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical */}
      {otherMeds.length > 0 && (
        <div>
          <span className="label-tag text-ink-muted block mb-5">HISTORICAL / PAUSED</span>
          <div
            className="glass-light"
            style={{ overflow: 'hidden' }}
          >
            {otherMeds.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center gap-4 p-5 pressable"
                style={idx > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}
              >
                <div className="text-xl opacity-40">💊</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-primary">
                    {m.name} <span className="text-ink-muted font-normal">· {m.dose}</span>
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">{m.frequency}</p>
                </div>
                <span className={`pill text-[10px] ${m.status === 'paused' ? 'pill-warn' : 'pill-dark'}`}>{m.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {medications.length === 0 && (
        <div className="glass-light p-16 text-center">
          <p className="text-sm text-ink-muted">No medications on record.</p>
        </div>
      )}
    </div>
  );
};
