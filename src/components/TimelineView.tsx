import React, { useMemo } from 'react';
import { useCareChain } from '../context/CareChainContext';
import type { EventType, HealthEvent } from '../types';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export const TimelineView: React.FC = () => {
  const {
    events,
    activeFilterTime, setActiveFilterTime,
    activeFilterType, setActiveFilterType,
    evidenceHighlightIds,
    setIsAddEventModalOpen,
    deleteEvent,
    currentRole,
  } = useCareChain();

  const filtered = useMemo(() => {
    let list = [...events];
    if (activeFilterType !== 'all') list = list.filter(e => e.type === activeFilterType);
    const latest = Math.max(...events.map(e => new Date(e.timestamp).getTime()));
    const h = 3600000;
    if (activeFilterTime === '24h') list = list.filter(e => latest - new Date(e.timestamp).getTime() <= 24*h);
    else if (activeFilterTime === '72h') list = list.filter(e => latest - new Date(e.timestamp).getTime() <= 72*h);
    else if (activeFilterTime === '7d') list = list.filter(e => latest - new Date(e.timestamp).getTime() <= 168*h);
    return list.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [events, activeFilterTime, activeFilterType]);

  const groups = useMemo(() => {
    const g: Record<string, HealthEvent[]> = {};
    filtered.forEach(e => {
      const key = new Date(e.timestamp).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
      (g[key] ||= []).push(e);
    });
    return g;
  }, [filtered]);

  const timeFilters: ['24h','72h','7d','30d','all'] = ['24h','72h','7d','30d','all'];
  const typeFilters: ('all' | EventType)[] = ['all','symptom','medication','vital','visit','report','emergency'];

  const severityColor = (s: string) => {
    if (s === 'critical') return '#BE2418';
    if (s === 'severe')   return '#BE2418';
    if (s === 'moderate') return '#CC7A08';
    if (s === 'mild')     return '#4DA8F5';
    return '#1ECFE0';
  };

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12">
      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-drift-up">
        <div>
          <span className="label-tag text-ink-muted">PATIENT JOURNEY</span>
          <h1 className="headline-lg text-ink-primary mt-3">
            {activeFilterTime === '72h' ? 'Last 72 Hours' : activeFilterTime === '24h' ? 'Last 24 Hours' : 'Timeline'}
          </h1>
          <p className="text-sm text-ink-secondary mt-2">{filtered.length} events · chronological sequence</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time filter - glass track */}
          <div className="filter-track flex items-center gap-0.5">
            {timeFilters.map(f => (
              <button key={f} onClick={() => setActiveFilterTime(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all pressable ${
                  activeFilterTime === f ? 'filter-thumb-active' : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {currentRole !== 'patient' && (
            <button onClick={() => setIsAddEventModalOpen(true)} className="btn-primary pressable">
              <Plus className="w-3.5 h-3.5"/>
              <span>{currentRole === 'doctor' ? 'Add Clinical Note' : currentRole === 'family' ? 'Record Observation' : 'Log EMS Event'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Type filter chips - glass */}
      <div className="flex items-center gap-2 flex-wrap mb-10 animate-drift-up animate-drift-up-delay-1">
        {typeFilters.map(f => (
          <button key={f} onClick={() => setActiveFilterType(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize pressable ${
              activeFilterType === f
                ? 'filter-thumb-active'
                : ''
            }`}
            style={activeFilterType !== f ? {
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.72)',
              color: 'var(--ink-secondary)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.90)',
            } : {}}
          >
            {f === 'all' ? 'All Events' : f}
          </button>
        ))}
      </div>

      {/* Evidence highlight notice */}
      {evidenceHighlightIds.length > 0 && (
        <div
          className="mb-8 flex items-center gap-3 px-4 py-3 rounded-2xl animate-drift-up"
          style={{
            background: 'rgba(30,207,224,0.06)',
            border: '1px solid rgba(30,207,224,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.60)',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" style={{animation:'pulseDot 2s ease-in-out 3'}}/>
          <p className="text-xs text-ink-secondary">
            Highlighting <strong className="text-ink-primary">{evidenceHighlightIds.length} events</strong> referenced in the AI handover analysis.
          </p>
        </div>
      )}

      {/* Timeline stream */}
      {Object.keys(groups).length === 0 ? (
        <div className="glass-light p-16 text-center">
          <p className="text-sm text-ink-muted">No events in this view. Try widening the time filter.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="timeline-line" style={{left: '0'}}/>

          <div className="pl-8 space-y-12">
            {Object.entries(groups).map(([dateLabel, dateEvents]) => (
              <div key={dateLabel}>
                {/* Date header */}
                <div className="flex items-center gap-4 mb-6 -ml-8">
                  <div className="w-2 h-2 rounded-full bg-accent-cyan shrink-0"
                    style={{marginLeft: '-4px', border: '2px solid white'}}/>
                  <span
                    className="label-tag-lg text-ink-primary px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.75)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.85)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
                    }}
                  >
                    {dateLabel}
                  </span>
                  <div className="h-px flex-1" style={{background: 'rgba(0,0,0,0.05)'}}/>
                </div>

                {/* Events */}
                <div className="space-y-3">
                  {dateEvents.map(evt => {
                    const isHighlighted = evidenceHighlightIds.includes(evt.id);
                    const timeStr = new Date(evt.timestamp).toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'});
                    const isMajor = evt.severity === 'severe' || evt.severity === 'critical';

                    return (
                      <div
                        key={evt.id}
                        id={`event-${evt.id}`}
                        className="relative flex items-start gap-6 group -ml-[29px]"
                      >
                        {/* Node */}
                        <div
                          className={`w-4 h-4 rounded-full shrink-0 mt-4 transition-transform group-hover:scale-125 ${isHighlighted ? 'ring-4 ring-accent-cyan/20' : ''}`}
                          style={{
                            background: severityColor(evt.severity),
                            boxShadow: isHighlighted
                              ? `0 0 14px ${severityColor(evt.severity)}60`
                              : `0 0 6px ${severityColor(evt.severity)}35`,
                            border: '2px solid white',
                            marginLeft: '-2px',
                          }}
                        />

                        {/* Card - glass-light */}
                        <div
                          className={`flex-1 glass-light p-5 pressable transition-all group-hover:shadow-glass-hover ${
                            isHighlighted ? '' : isMajor ? '' : ''
                          }`}
                          style={{
                            borderRadius: '1.25rem',
                            ...(isHighlighted ? {
                              borderColor: 'rgba(30,207,224,0.30)',
                              background: 'rgba(255,255,255,0.70)',
                            } : isMajor ? {
                              borderColor: 'rgba(190,36,24,0.18)',
                              background: 'rgba(255,255,255,0.65)',
                            } : {}),
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-ink-muted">{timeStr}</span>
                              <span className="w-px h-3" style={{background: 'rgba(0,0,0,0.08)'}}/>
                              <span className="label-tag text-ink-muted capitalize">{evt.type}</span>
                              {isHighlighted && (
                                <span
                                  className="label-tag px-2 py-0.5 rounded-full"
                                  style={{
                                    color: '#0A8899',
                                    border: '1px solid rgba(30,207,224,0.22)',
                                    background: 'rgba(30,207,224,0.07)',
                                  }}
                                >
                                  AI Evidence
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`pill text-[11px] ${
                                evt.severity === 'critical' || evt.severity === 'severe' ? 'pill-red' :
                                evt.severity === 'moderate' ? 'pill-warn' : 'pill-dark'
                              }`}>{evt.severity}</span>
                              {currentRole === 'doctor' && (
                                <button
                                  onClick={() => deleteEvent(evt.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-ink-muted hover:text-emergency-DEFAULT pressable"
                                  title="Delete event (Doctor permission)"
                                >
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              )}
                            </div>
                          </div>

                          <h3 className={`font-medium text-ink-primary mt-2 ${isMajor ? 'text-base' : 'text-sm'}`}>
                            {evt.title}
                          </h3>
                          <p className="text-xs text-ink-secondary mt-1 leading-relaxed line-clamp-2">{evt.description}</p>

                          {/* Metadata chips */}
                          {evt.metadata && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {evt.metadata.temperature && (
                                <span
                                  className="font-mono text-xs px-2.5 py-1 rounded-lg"
                                  style={{
                                    background: 'rgba(190,36,24,0.08)',
                                    color: '#8B1C12',
                                    border: '1px solid rgba(190,36,24,0.15)',
                                  }}
                                >
                                  {evt.metadata.temperature}°F
                                </span>
                              )}
                              {evt.metadata.heartRate && (
                                <span
                                  className="font-mono text-xs px-2.5 py-1 rounded-lg"
                                  style={{
                                    background: 'rgba(0,0,0,0.04)',
                                    color: 'var(--ink-secondary)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                  }}
                                >
                                  {evt.metadata.heartRate} bpm
                                </span>
                              )}
                              {evt.metadata.bpSystolic && (
                                <span
                                  className="font-mono text-xs px-2.5 py-1 rounded-lg"
                                  style={{
                                    background: 'rgba(0,0,0,0.04)',
                                    color: 'var(--ink-secondary)',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                  }}
                                >
                                  {evt.metadata.bpSystolic}/{evt.metadata.bpDiastolic} mmHg
                                </span>
                              )}
                              {evt.metadata.medicineName && (
                                <span
                                  className="font-mono text-xs px-2.5 py-1 rounded-lg"
                                  style={{
                                    background: 'rgba(30,207,224,0.06)',
                                    color: '#0A8899',
                                    border: '1px solid rgba(30,207,224,0.12)',
                                  }}
                                >
                                  {evt.metadata.medicineName} {evt.metadata.dose} · {evt.metadata.takenStatus}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Extracted lab values */}
                          {evt.metadata?.extractedValues && (
                            <div
                              className="mt-3 pt-3 grid grid-cols-2 gap-2"
                              style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
                            >
                              {Object.entries(evt.metadata.extractedValues).map(([k,v]) => (
                                <div key={k} className="flex items-center justify-between text-xs">
                                  <span className="text-ink-muted">{k}</span>
                                  <span className="font-mono font-medium text-ink-primary">{String(v)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div
                            className="mt-3 pt-2 flex items-center justify-between"
                            style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
                          >
                            <span className="text-[11px] text-ink-muted">{evt.source} · {evt.createdBy}</span>
                            {evt.verified && <span className="label-tag text-ok">Verified</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Current anchor */}
            <div className="flex items-center gap-3 -ml-8 pt-4">
              <div className="w-3 h-3 rounded-full bg-emergency-DEFAULT shrink-0"
                style={{marginLeft: '-3px', animation:'pulseDot 1.5s ease-in-out infinite', boxShadow: '0 0 10px rgba(190,36,24,0.5)'}}/>
              <span className="label-tag text-emergency-DEFAULT">NOW · HOSPITAL ARRIVAL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
