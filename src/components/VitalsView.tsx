import React, { useMemo } from 'react';
import { useCareChain } from '../context/CareChainContext';

/* Inline mini SVG chart */
const SparkLine: React.FC<{ values: number[]; color?: string; height?: number }> = ({ values, color = '#20D3E8', height = 48 }) => {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 180;
  const h = height;
  const pts = values.map((v, i) => `${(i / (values.length-1)) * w},${h - ((v-min)/range) * (h-8) - 4}`).join(' ');
  const area = `M0,${h} L${pts.replace(/,/g, ' L').replace(/ L/g, ',').split(' ').map((pt,i) => {
    if (i===0) return pt;
    return pt;
  }).join(' ')} L${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} fill="none" className="w-full" style={{height}}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d={`M0,${h} ${pts.split(',').map((v,i,a) => i%2===0 ? `L${v}` : `${v}`).join(',')} L${w},${h} Z`} fill={`url(#sg-${color.replace('#','')})`}/>
    </svg>
  );
};

export const VitalsView: React.FC = () => {
  const { events } = useCareChain();

  const tempReadings = useMemo(() => events.filter(e => e.metadata?.temperature).map(e => ({ t: new Date(e.timestamp).getTime(), v: Number(e.metadata!.temperature) })).sort((a,b) => a.t-b.t), [events]);
  const pulseReadings = useMemo(() => events.filter(e => e.metadata?.heartRate).map(e => ({ t: new Date(e.timestamp).getTime(), v: Number(e.metadata!.heartRate) })).sort((a,b) => a.t-b.t), [events]);
  const bpReadings = useMemo(() => events.filter(e => e.metadata?.bpSystolic).map(e => ({ t: new Date(e.timestamp).getTime(), s: Number(e.metadata!.bpSystolic), d: Number(e.metadata!.bpDiastolic) })).sort((a,b) => a.t-b.t), [events]);

  const latestTemp = tempReadings[tempReadings.length-1]?.v;
  const latestPulse = pulseReadings[pulseReadings.length-1]?.v;
  const latestBpS = bpReadings[bpReadings.length-1]?.s;
  const latestBpD = bpReadings[bpReadings.length-1]?.d;

  const tempStatus = latestTemp ? (latestTemp >= 102 ? 'critical' : latestTemp >= 100.4 ? 'warn' : 'ok') : 'ok';
  const pulseStatus = latestPulse ? (latestPulse > 100 ? 'warn' : latestPulse < 50 ? 'warn' : 'ok') : 'ok';

  const statusColor = (s: string) => s === 'critical' ? '#C5281A' : s === 'warn' ? '#D4840A' : '#14B87A';

  return (
    <div className="max-w-screen-xl mx-auto page-gutter py-12 space-y-8">

      {/* Header */}
      <div>
        <span className="label-tag text-ink-muted">VITAL SIGNS</span>
        <h1 className="headline-lg text-ink-primary mt-3">Physiological Trends</h1>
        <p className="text-sm text-ink-secondary mt-2">Last 72 hours of recorded vital sign data</p>
      </div>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'TEMPERATURE',
            value: latestTemp ? `${latestTemp}°F` : 'N/A',
            sub: latestTemp ? (latestTemp >= 100.4 ? 'Febrile' : 'Normal') : '--',
            trend: tempReadings.map(r => r.v),
            color: statusColor(tempStatus),
            trendColor: '#C5281A',
          },
          {
            label: 'PULSE',
            value: latestPulse ? `${latestPulse} bpm` : 'N/A',
            sub: latestPulse && latestPulse > 100 ? 'Tachycardic' : 'Normal',
            trend: pulseReadings.map(r => r.v),
            color: statusColor(pulseStatus),
            trendColor: '#5AA8F5',
          },
          {
            label: 'BLOOD PRESSURE',
            value: latestBpS ? `${latestBpS}/${latestBpD}` : 'N/A',
            sub: 'mmHg',
            trend: bpReadings.map(r => r.s),
            color: '#14B87A',
            trendColor: '#20D3E8',
          },
          {
            label: 'READINGS',
            value: String(tempReadings.length + pulseReadings.length + bpReadings.length),
            sub: 'Total data points',
            trend: [],
            color: '#20D3E8',
            trendColor: '#20D3E8',
          },
        ].map(m => (
          <div key={m.label} className="glass-light p-6 pressable animate-drift-up" style={{borderRadius:'1.5rem'}}>
            <span className="label-tag text-ink-muted">{m.label}</span>
            <p className="text-3xl font-light mt-3 mb-0.5" style={{letterSpacing:'-0.04em', color: m.color}}>{m.value}</p>
            <p className="text-xs text-ink-muted">{m.sub}</p>
            {m.trend.length > 1 && (
              <div className="mt-3 opacity-70">
                <SparkLine values={m.trend} color={m.trendColor} height={36}/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Temperature chart */}
        {tempReadings.length > 1 && (
          <div className="glass-light p-6 sm:p-8 animate-drift-up" style={{borderRadius:'2rem'}}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="label-tag text-ink-muted">TEMPERATURE TREND</span>
                <p className="text-lg font-light text-ink-primary mt-1" style={{letterSpacing:'-0.02em'}}>{tempReadings.length} readings</p>
              </div>
              <span className="pill pill-red text-[11px]">{latestTemp}°F</span>
            </div>
            <div className="h-48 relative">
              <SparkLine values={tempReadings.map(r=>r.v)} color="#C5281A" height={192}/>
              {/* Reference lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full border-t border-dashed border-emergency-DEFAULT/20" style={{top:'25%'}}>
                  <span className="absolute right-0 -top-3 text-[11px] text-emergency-DEFAULT/50">103°F</span>
                </div>
                <div className="absolute w-full border-t border-dashed border-warn/20" style={{top:'55%'}}>
                  <span className="absolute right-0 -top-3 text-[11px] text-warn/50">100.4°F</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              {tempReadings.slice(-3).map((r, i) => (
                <div key={i} className="text-center">
                  <span className="label-tag text-ink-muted block">{new Date(r.t).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
                  <p className="font-mono text-sm text-ink-primary mt-0.5">{r.v}°F</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pulse chart */}
        {pulseReadings.length > 1 && (
          <div className="glass-light p-6 sm:p-8 animate-drift-up animate-drift-up-delay-1" style={{borderRadius:'2rem'}}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="label-tag text-ink-muted">PULSE RATE</span>
                <p className="text-lg font-light text-ink-primary mt-1" style={{letterSpacing:'-0.02em'}}>{pulseReadings.length} readings</p>
              </div>
              <span className={`pill text-[11px] ${latestPulse && latestPulse > 100 ? 'pill-warn' : 'pill-ok'}`}>
                {latestPulse} bpm
              </span>
            </div>
            <div className="h-48">
              <SparkLine values={pulseReadings.map(r=>r.v)} color="#5AA8F5" height={192}/>
            </div>
            <div className="mt-4 flex items-center gap-4 flex-wrap">
              {pulseReadings.slice(-3).map((r, i) => (
                <div key={i} className="text-center">
                  <span className="label-tag text-ink-muted block">{new Date(r.t).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</span>
                  <p className="font-mono text-sm text-ink-primary mt-0.5">{r.v} bpm</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* All vitals table */}
      <div className="glass-light overflow-hidden animate-drift-up" style={{borderRadius:'2rem'}}>
        <div className="px-6 sm:px-8 pt-6 pb-4" style={{borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
          <span className="label-tag text-ink-muted">COMPLETE READINGS LOG</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.05]">
                {['Date/Time','Temperature','Pulse','Blood Pressure','Oxygen Sat','Source'].map(h => (
                  <th key={h} className="px-5 py-3 text-left">
                    <span className="label-tag text-ink-muted">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {events.filter(e => e.type === 'vital').sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime()).map(e => (
                <tr key={e.id} className="hover:bg-black/[0.015] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-ink-muted">
                    {new Date(e.timestamp).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td className="px-5 py-3">
                    {e.metadata?.temperature
                      ? <span className={`font-mono text-xs font-medium ${Number(e.metadata.temperature) >= 100.4 ? 'text-emergency-DEFAULT' : 'text-ok'}`}>{e.metadata.temperature}°F</span>
                      : <span className="text-ink-muted text-xs">--</span>}
                  </td>
                  <td className="px-5 py-3">
                    {e.metadata?.heartRate
                      ? <span className="font-mono text-xs text-ink-primary">{e.metadata.heartRate} bpm</span>
                      : <span className="text-ink-muted text-xs">--</span>}
                  </td>
                  <td className="px-5 py-3">
                    {e.metadata?.bpSystolic
                      ? <span className="font-mono text-xs text-ink-primary">{e.metadata.bpSystolic}/{e.metadata.bpDiastolic} mmHg</span>
                      : <span className="text-ink-muted text-xs">--</span>}
                  </td>
                  <td className="px-5 py-3">
                    {e.metadata?.oxygenSat
                      ? <span className="font-mono text-xs text-ink-primary">{e.metadata.oxygenSat}%</span>
                      : <span className="text-ink-muted text-xs">--</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-muted">{e.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
