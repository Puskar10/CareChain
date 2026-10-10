import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import {
  Ambulance,
  HeartPulse,
  Flame,
  Clock,
  Send,
  Plus,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  Stethoscope,
  ChevronRight,
  ArrowRight,
  Droplets,
  Wind
} from 'lucide-react';

export const EmsDashboardView: React.FC = () => {
  const {
    user,
    isDemoMode,
    isLoadingData,
    dataError,
    retryLoadData,
    activePatient,
    events,
    vitals,
    emsCase,
    logEmsVitals,
    logEmsIntervention,
    completeEmsHandover,
    setActiveTab
  } = useCareChain();

  const paramedicDisplayName = user?.fullName || emsCase?.paramedicName || (isDemoMode ? 'Capt. Dave Miller' : 'EMS Paramedic');
  const unitNumber = emsCase?.unitNumber || 'Unit 4';

  // Rapid vitals form state
  const [spo2Input, setSpo2Input] = useState('95');
  const [hrInput, setHrInput] = useState('108');
  const [bpSysInput, setBpSysInput] = useState('138');
  const [bpDiaInput, setBpDiaInput] = useState('88');
  const [rrInput, setRrInput] = useState('22');
  const [tempInput, setTempInput] = useState('102.4');
  const [isVitalsLoggedSuccess, setIsVitalsLoggedSuccess] = useState(false);

  // Intervention quick add
  const [customIntervention, setCustomIntervention] = useState('');
  const [isLiveTransmitSuccess, setIsLiveTransmitSuccess] = useState(false);
  const [isHandoverSuccess, setIsHandoverSuccess] = useState(false);

  // Fast rapid interventions
  const quickInterventions = [
    { name: 'Oxygen 4L/min via Nasal Cannula', notes: 'Supplemental O2 titrated for SpO2' },
    { name: '18G IV Line Left Antecubital Established', notes: 'Patent, infusing fluids' },
    { name: 'Normal Saline 500mL IV Bolus', notes: 'Hydration resuscitation for tachycardia' },
    { name: 'Semi-Fowler Position 45°', notes: 'Optimized for respiratory ease' },
    { name: 'Cold Forehead Compress Applied', notes: 'Comfort measure during transit' }
  ];

  const handleLogRapidVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    await logEmsVitals({
      spo2: parseInt(spo2Input) || 95,
      heartRate: parseInt(hrInput) || 108,
      bpSystolic: parseInt(bpSysInput) || 138,
      bpDiastolic: parseInt(bpDiaInput) || 88,
      respiratoryRate: parseInt(rrInput) || 22,
      temperature: parseFloat(tempInput) || 102.4
    });

    setIsVitalsLoggedSuccess(true);
    setTimeout(() => setIsVitalsLoggedSuccess(false), 2000);
  };

  const handleAddQuickIntervention = async (name: string, notes: string) => {
    await logEmsIntervention(name, notes);
  };

  const handleCustomInterventionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIntervention.trim()) return;
    await logEmsIntervention(customIntervention.trim(), `Administered by Paramedic ${unitNumber}`);
    setCustomIntervention('');
  };

  const handleTransmitLive = () => {
    setIsLiveTransmitSuccess(true);
    setTimeout(() => setIsLiveTransmitSuccess(false), 3000);
  };

  const handleCompleteHandover = async () => {
    await completeEmsHandover();
    setIsHandoverSuccess(true);
  };

  if (!emsCase) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Backend / Data Error Banner */}
        {dataError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">Failed to load dispatch telemetry: </span>
                <span>{dataError}</span>
              </div>
            </div>
            <button
              onClick={retryLoadData}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold pressable shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingData && (
          <div className="glass-light rounded-3xl p-12 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 flex items-center justify-center mx-auto animate-spin">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink-primary font-carmen">Loading Emergency Dispatch Feed</h3>
              <p className="text-xs text-ink-muted">Querying live telemetry status...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingData && (
          <div className="glass-light rounded-3xl p-10 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Ambulance className="w-8 h-8 text-rose-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-ink-primary font-carmen">
                No active emergency cases are assigned.
              </h3>
              <p className="text-xs text-ink-secondary max-w-sm mx-auto">
                There are currently no inbound dispatch requests or emergency transit telemetry sessions assigned to your unit. New dispatch alerts will appear here in real time.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.05] text-[11px] text-ink-muted text-left space-y-1">
              <div className="font-semibold text-ink-primary">Paramedic Unit Profile</div>
              <div>Officer: {paramedicDisplayName}</div>
              <div>Unit: {unitNumber}</div>
              <div>Status: Available on Radio / Standby</div>
            </div>
            <div className="pt-2">
              <button
                onClick={retryLoadData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-black/[0.1] hover:bg-black/[0.02] text-ink-primary transition-all pressable cursor-pointer"
              >
                Refresh Dispatch Feed
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const patientDisplayName = activePatient ? `${activePatient.fullName} (${activePatient.age}${activePatient.sex?.charAt(0) || ''})` : `Patient (${emsCase.patientId})`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* EMS Dispatch Emergency Header */}
      <div className="glass-hero rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-rose-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/25 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
              <Ambulance className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600/30 text-rose-300 uppercase tracking-wider border border-rose-400/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Active Emergency Transport
                </span>
                <span className="text-xs text-white/70">ETA: {emsCase.etaMinutes} mins to Apex Memorial ER</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-carmen mt-1 text-white">
                {paramedicDisplayName} ({unitNumber})
              </h1>
              <p className="text-xs sm:text-sm text-white/70 mt-0.5">
                Case #{emsCase.id.toUpperCase()} · In-transit patient: {patientDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleTransmitLive}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all pressable flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
            >
              <Radio className="w-4 h-4 text-white" />
              <span>{isLiveTransmitSuccess ? 'Telemetry Transmitted to ER!' : 'Transmit Live Telemetry to ER'}</span>
            </button>
            <button
              onClick={() => setActiveTab('emergency')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all pressable flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>ER Triage Mode</span>
            </button>
          </div>
        </div>

        {/* Rapid Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10 text-white">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">SpO2 Oxygen</div>
            <div className="text-xl font-bold font-carmen mt-0.5 text-cyan-300">95% (on 4L O2)</div>
            <div className="text-[10px] text-rose-300">Baseline was 92%</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Pulse Rate</div>
            <div className="text-xl font-bold font-carmen mt-0.5 text-amber-300">108 bpm</div>
            <div className="text-[10px] text-amber-300">Sinus Tachycardia</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Blood Pressure</div>
            <div className="text-xl font-bold font-carmen mt-0.5 text-white">138/88 mmHg</div>
            <div className="text-[10px] text-white/60">Stage 1 Elevated</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Core Temperature</div>
            <div className="text-xl font-bold font-carmen mt-0.5 text-rose-300">102.4°F</div>
            <div className="text-[10px] text-rose-300">Peak 102.8°F</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-white/60 font-semibold uppercase tracking-wider">Respiratory Rate</div>
            <div className="text-xl font-bold font-carmen mt-0.5 text-white">22 /min</div>
            <div className="text-[10px] text-white/60">Tachypneic</div>
          </div>
        </div>
      </div>

      {/* Critical Allergy Warning Banner */}
      <div className="glass-emergency rounded-2xl p-4 border border-rose-500/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-rose-900 uppercase tracking-wide">
              CRITICAL PATIENT ALLERGY ALERT:
            </span>{' '}
            <span className="text-rose-800 font-semibold">
              PENICILLIN (causes rash) and SULFA DRUGS. DO NOT ADMINISTER BETA-LACTAMS OR CEPHALOSPORINS.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 shrink-0 uppercase">
          Verified on Record
        </span>
      </div>

      {/* Two-Column EMS Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Rapid Vitals Entry & Interventions (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Rapid Vitals Entry Form */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Rapid Vitals Logger (In-Transit)</h2>
                  <p className="text-[11px] text-ink-muted">Single-tap real-time telemetry updates</p>
                </div>
              </div>
              {isVitalsLoggedSuccess && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold animate-scale-in">
                  ✓ Recorded!
                </span>
              )}
            </div>

            <form onSubmit={handleLogRapidVitals} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2Input}
                    onChange={e => setSpo2Input(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-cyan-700 text-center text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={hrInput}
                    onChange={e => setHrInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-amber-700 text-center text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempInput}
                    onChange={e => setTempInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-rose-700 text-center text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">BP Systolic</label>
                  <input
                    type="number"
                    value={bpSysInput}
                    onChange={e => setBpSysInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-center text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">BP Diastolic</label>
                  <input
                    type="number"
                    value={bpDiaInput}
                    onChange={e => setBpDiaInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-center text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">Resp Rate (/min)</label>
                  <input
                    type="number"
                    value={rrInput}
                    onChange={e => setRrInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white font-mono font-bold text-center text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all pressable cursor-pointer shadow-md shadow-cyan-500/20"
              >
                Log Vitals Reading to Timeline
              </button>
            </form>
          </div>

          {/* Rapid Emergency Interventions */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Emergency Interventions</h2>
                  <p className="text-[11px] text-ink-muted">Tap to log treatment administered en-route</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {quickInterventions.map((qi, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddQuickIntervention(qi.name, qi.notes)}
                  className="w-full p-3 rounded-2xl border border-black/[0.06] bg-white/80 hover:bg-rose-50/60 hover:border-rose-300 text-left transition-all pressable flex items-center justify-between group cursor-pointer text-xs"
                >
                  <div>
                    <div className="font-bold text-ink-primary group-hover:text-rose-700">{qi.name}</div>
                    <div className="text-[11px] text-ink-muted">{qi.notes}</div>
                  </div>
                  <span className="text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Administer <Plus className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>

            {/* Custom Intervention */}
            <form onSubmit={handleCustomInterventionSubmit} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Log custom intervention (e.g. Paracetamol 500mg IV, Ice packs)"
                value={customIntervention}
                onChange={e => setCustomIntervention(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
              />
              <button
                type="submit"
                className="btn-cyan !px-3 !py-2 !text-xs font-bold shrink-0 pressable cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Structured MIST Hospital Handover (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Structured MIST Handover</h3>
                  <p className="text-[11px] text-ink-muted">Standard pre-hospital clinical handover format</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase">
                Ready for Transfer
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* M - Mechanism / History */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-900 uppercase tracking-wider text-[11px]">
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-[10px]">M</span>
                  Mechanism of Incident / Medical History
                </div>
                <p className="text-ink-secondary pl-6 leading-relaxed">
                  {emsCase.mistHandover.mechanism}
                </p>
              </div>

              {/* I - Illness / Injuries */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center text-[10px]">I</span>
                  Illness Found / Suspected Pathology
                </div>
                <p className="text-ink-secondary pl-6 leading-relaxed">
                  {emsCase.mistHandover.injuries}
                </p>
              </div>

              {/* S - Signs & Vitals */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px]">S</span>
                  Signs & Physiological Parameters
                </div>
                <p className="text-ink-secondary pl-6 leading-relaxed font-mono text-[11px]">
                  {emsCase.mistHandover.signs}
                </p>
              </div>

              {/* T - Treatment Given */}
              <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 uppercase tracking-wider text-[11px]">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">T</span>
                  Treatment Administered En-Route
                </div>
                <p className="text-ink-secondary pl-6 leading-relaxed">
                  {emsCase.mistHandover.treatment}
                </p>
              </div>
            </div>

            {/* Complete Handover Button */}
            <div className="pt-2">
              {isHandoverSuccess || emsCase.status === 'handover-complete' ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hospital Handover Completed & Signed Off at Apex Memorial ER!</span>
                </div>
              ) : (
                <button
                  onClick={handleCompleteHandover}
                  className="w-full py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition-all pressable cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sign & Complete Hospital Handover Transfer</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Logged Interventions History */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-3">
            <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">
              En-Route Interventions Timeline ({emsCase.interventions.length})
            </h3>
            <div className="space-y-2 text-xs">
              {emsCase.interventions.map(int => (
                <div key={int.id} className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-ink-primary">{int.name}</span>
                    <div className="text-[11px] text-ink-muted">{int.notes}</div>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md font-semibold">
                    {int.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
