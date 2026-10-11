import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  Thermometer,
  Pill,
  Heart,
  Droplets,
  Calendar,
  PhoneCall,
  Activity,
  ChevronRight,
  Info,
  ShieldCheck,
  FileText
} from 'lucide-react';

export const CaregiverDashboardView: React.FC = () => {
  const {
    user,
    isDemoMode,
    isLoadingData,
    dataError,
    retryLoadData,
    activePatient,
    events,
    vitals,
    careTasks,
    carePlans,
    caregiverEscalations,
    toggleCareTask,
    addCaregiverObservation,
    addCaregiverEscalation,
    setActiveTab
  } = useCareChain();

  const caregiverDisplayName = user?.fullName || (isDemoMode ? 'Pooja Sharma' : 'Caregiver');
  const caregiverRoleTitle = user?.title || (isDemoMode ? 'Primary Family Caregiver (Spouse)' : 'Family Caregiver');
  const patientName = activePatient?.fullName || 'Assigned Patient';

  // Local state for recording observation
  const [obsTitle, setObsTitle] = useState('');
  const [obsDesc, setObsDesc] = useState('');
  const [obsTemp, setObsTemp] = useState('');
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);

  // Local state for escalating concern
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escSymptom, setEscSymptom] = useState('');
  const [escUrgency, setEscUrgency] = useState<'routine' | 'urgent' | 'emergency'>('urgent');
  const [escDetails, setEscDetails] = useState('');

  // Submit Observation
  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsTitle.trim()) return;

    await addCaregiverObservation({
      title: obsTitle,
      description: obsDesc || `Logged by family caregiver ${caregiverDisplayName} during routine observation check.`,
      temp: obsTemp ? parseFloat(obsTemp) : undefined,
      severity: obsTemp && parseFloat(obsTemp) >= 102 ? 'moderate' : 'mild'
    });

    setObsTitle('');
    setObsDesc('');
    setObsTemp('');
    setIsObsModalOpen(false);
  };

  // Submit Escalation
  const handleSendEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !escSymptom.trim() || !escDetails.trim()) return;

    await addCaregiverEscalation({
      patientId: activePatient.id,
      caregiverName: caregiverDisplayName,
      symptom: escSymptom,
      urgency: escUrgency,
      details: escDetails
    });

    setEscSymptom('');
    setEscDetails('');
    setIsEscalateModalOpen(false);
  };

  const patientTasks = activePatient ? careTasks.filter(t => t.patientId === activePatient.id) : [];
  const completedCount = patientTasks.filter(t => t.status === 'completed').length;
  const pendingCount = patientTasks.filter(t => t.status === 'pending').length;

  const caregiverObservations = activePatient
    ? events.filter(
        e => e.patientId === activePatient.id && (e.source === 'Family / Caregiver' || (user?.fullName ? e.createdBy.includes(user.fullName) : false) || e.createdBy.includes('Caregiver') || e.createdBy.includes('Pooja'))
      )
    : [];

  const patientVitals = activePatient ? vitals.filter(v => v.patientId === activePatient.id) : [];
  const latestVitalTemp = patientVitals.filter(v => v.temperature).slice(-1)[0]?.temperature;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Caregiver Welcome Banner */}
      <div className="glass-light rounded-3xl p-6 sm:p-8 border border-white/80 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
              <Heart className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider border border-amber-200">
                  {caregiverRoleTitle}
                </span>
                <span className="text-xs text-ink-muted">
                  Assigned Patient: {patientName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-carmen mt-1 text-ink-primary">
                {caregiverDisplayName}
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                Managing daily home care routine, symptom observations, and clinical handovers for {patientName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsObsModalOpen(true)}
              className="btn-cyan !px-4 !py-2 !text-xs flex items-center gap-2 font-bold pressable cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Observation</span>
            </button>
            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-all pressable flex items-center gap-2 cursor-pointer shadow-md shadow-rose-600/20"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Escalate Concern to Doctor</span>
            </button>
          </div>
        </div>

        {/* Status overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-black/[0.06]">
          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Today's Care Tasks
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-ink-primary">
              {completedCount} of {patientTasks.length} Done
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">{pendingCount} remaining today</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              Patient Pyrexia
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-rose-600">
              {latestVitalTemp ? `${latestVitalTemp}°F` : '--'}
            </div>
            <div className="text-[11px] text-rose-600 mt-0.5">
              {latestVitalTemp && latestVitalTemp >= 101 ? 'Fever elevated' : 'Stable temperature'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <Droplets className="w-3.5 h-3.5 text-cyan-600" />
              Hydration Goal
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-cyan-700">1.8 / 2.5 L</div>
            <div className="text-[11px] text-cyan-700 mt-0.5">ORS fluids tolerated</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
              Doctor Hotline
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-ink-primary truncate">
              {activePatient?.primaryPhysician || 'Care Team'}
            </div>
            <div className="text-[11px] text-ink-muted mt-0.5">Direct channel active</div>
          </div>
        </div>
      </div>

      {/* Backend / Data Error Banner */}
      {dataError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Failed to synchronize caregiver assignments: </span>
              <span>{dataError}</span>
            </div>
          </div>
          <button
            onClick={retryLoadData}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold pressable shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingData && (
        <div className="glass-light rounded-3xl p-12 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary font-carmen">Loading Caregiver Assignments</h3>
            <p className="text-xs text-ink-muted">Querying CareChain backend for linked patients...</p>
          </div>
        </div>
      )}

      {/* Empty State for Real Caregiver with No Assigned Patients */}
      {!isLoadingData && !dataError && !activePatient && (
        <div className="glass-light rounded-3xl p-10 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-7 h-7 text-amber-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-ink-primary font-carmen">
              No patient assignments are available yet.
            </h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              You do not currently have any active patient profiles linked to your caregiver account. Once a patient or hospital grants access, their care plan and daily tasks will appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={retryLoadData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-black/[0.1] hover:bg-black/[0.02] text-ink-primary transition-all pressable cursor-pointer"
            >
              Refresh Assignments
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Workflow Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Daily Care Tasks & Reminders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Today's Daily Care Tasks</h2>
                  <p className="text-[11px] text-ink-muted">Check off tasks as completed or note skipped items</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">
                {completedCount} Completed
              </span>
            </div>

            <div className="space-y-3">
              {patientTasks.map(task => {
                const isCompleted = task.status === 'completed';
                const isSkipped = task.status === 'skipped';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-2xl border transition-all text-xs flex items-start justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-500/20'
                        : isSkipped
                        ? 'bg-amber-50/50 border-amber-500/20'
                        : 'bg-white/80 border-black/[0.06]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCareTask(task.id, isCompleted ? 'pending' : 'completed')}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all pressable cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : isSkipped
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-black/20 hover:border-cyan-500 bg-white'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isSkipped && <span className="font-bold text-[11px]">!</span>}
                      </button>

                      <div className="space-y-0.5">
                        <div className={`font-semibold ${isCompleted ? 'line-through text-ink-muted' : 'text-ink-primary'}`}>
                          {task.title}
                        </div>
                        <div className="text-[11px] text-ink-muted flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            {task.time}
                          </span>
                          <span>·</span>
                          <span className="capitalize">{task.category}</span>
                          {task.completedBy && <span>· Completed by {task.completedBy}</span>}
                        </div>
                        {task.notes && (
                          <p className="text-[11px] text-amber-800 bg-amber-100/60 rounded-md px-2 py-0.5 mt-1 inline-block">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleCareTask(task.id, isSkipped ? 'pending' : 'skipped', 'Patient nauseous')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all pressable ${
                          isSkipped ? 'bg-amber-200 text-amber-900 font-bold' : 'text-ink-muted hover:bg-black/5'
                        }`}
                      >
                        {isSkipped ? 'Skipped' : 'Skip'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Caregiver Observations Log */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Recent Caregiver Observations</h2>
                  <p className="text-[11px] text-ink-muted">Historical log of updates provided by Pooja</p>
                </div>
              </div>
              <button
                onClick={() => setIsObsModalOpen(true)}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-bold flex items-center gap-1"
              >
                + Add Update
              </button>
            </div>

            <div className="space-y-2.5">
              {caregiverObservations.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink-muted">No observations logged yet.</div>
              ) : (
                caregiverObservations.slice(0, 4).map(obs => (
                  <div key={obs.id} className="p-3 rounded-2xl bg-white/70 border border-black/[0.06] text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink-primary">{obs.title}</span>
                      <span className="text-[11px] text-ink-muted font-mono">{new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-ink-secondary">{obs.description}</p>
                    {obs.metadata?.temperature && (
                      <span className="inline-block text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.2 rounded-md">
                        Temp: {obs.metadata.temperature}°F
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Doctor Care Instructions & Escalation Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Doctor Active Care Guidance (Read-Only) */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Doctor's Care Plan Guidance</h3>
                  <p className="text-[11px] text-ink-muted">Prescribed by Dr. Aarav Sharma, MD</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800">
                Active Protocol
              </span>
            </div>

            <div className="space-y-3">
              {carePlans.map(cp => (
                <div key={cp.id} className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary">{cp.title}</span>
                    <span className="text-[11px] uppercase font-semibold text-cyan-700">{cp.category}</span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">{cp.description}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                Immediate Escalation Triggers
              </div>
              <p className="text-[11px] text-rose-800/90 leading-relaxed">
                Contact Dr. Sharma or tap "Escalate Concern" immediately if Rahul experiences:
                difficulty catching breath, confusion/disorientation, SpO2 below 94%, or fever continuing above 102.5°F despite paracetamol.
              </p>
            </div>
          </div>

          {/* Escalation Center */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Doctor Escalation History</h3>
                  <p className="text-[11px] text-ink-muted">Urgent alerts dispatched to physician</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {caregiverEscalations.map(esc => (
                <div key={esc.id} className="p-3.5 rounded-2xl bg-white/90 border border-black/[0.06] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary">{esc.symptom}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      esc.urgency === 'emergency' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {esc.urgency}
                    </span>
                  </div>
                  <p className="text-ink-secondary text-[11px]">{esc.details}</p>
                  {esc.doctorResponse ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-[11px]">
                      <span className="font-bold">Doctor Response: </span>
                      {esc.doctorResponse}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-700 font-semibold">
                      Awaiting physician review...
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsEscalateModalOpen(true)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors pressable flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send New Escalation to Doctor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Record Observation */}
      {isObsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="glass-light w-full max-w-lg rounded-3xl p-6 border border-white/90 shadow-2xl animate-scale-in">
            <h3 className="text-base font-bold text-ink-primary font-carmen mb-1">Record Patient Observation</h3>
            <p className="text-xs text-ink-muted mb-4">Patient: {activePatient?.fullName || 'Assigned Patient'}</p>

            <form onSubmit={handleSaveObservation} className="space-y-3.5 text-xs">
              <div>
                <label className="label-tag text-ink-muted block mb-1">What did you observe?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drank 250ml ORS electrolyte fluid, resting comfortably"
                  value={obsTitle}
                  onChange={e => setObsTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="label-tag text-ink-muted block mb-1">Home Thermometer Reading (Optional °F)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 101.4"
                  value={obsTemp}
                  onChange={e => setObsTemp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="label-tag text-ink-muted block mb-1">Additional Observations & Context</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Patient mentioned mild relief in headache. Appetite slightly improved."
                  value={obsDesc}
                  onChange={e => setObsDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsObsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyan !px-4 !py-2 !text-xs font-bold"
                >
                  Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Escalate Concern to Doctor */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="glass-light w-full max-w-lg rounded-3xl p-6 border border-white/90 shadow-2xl animate-scale-in">
            <h3 className="text-base font-bold text-rose-700 font-carmen mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Escalate Clinical Concern to {activePatient?.primaryPhysician || 'Attending Physician'}
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              Dispatches priority clinical alert directly to attending emergency physician.
            </p>

            <form onSubmit={handleSendEscalation} className="space-y-3.5 text-xs">
              <div>
                <label className="label-tag text-ink-muted block mb-1">Concerning Symptom / Issue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute dizziness on standing, room spinning, pulse 110+"
                  value={escSymptom}
                  onChange={e => setEscSymptom(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="label-tag text-ink-muted block mb-1">Urgency Level</label>
                <select
                  value={escUrgency}
                  onChange={e => setEscUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none font-semibold text-rose-700"
                >
                  <option value="urgent">Urgent: Physician Review Requested Soon</option>
                  <option value="emergency">EMERGENCY: Immediate Hospital / EMS Evaluation</option>
                  <option value="routine">Routine: Update for next rounding</option>
                </select>
              </div>

              <div>
                <label className="label-tag text-ink-muted block mb-1">Specific Details for Doctor</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Rahul tried to walk to the bathroom and felt faint. He broke into cold sweat. Oral antibiotic was missed earlier because of vomiting."
                  value={escDetails}
                  onChange={e => setEscDetails(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all pressable cursor-pointer"
                >
                  Dispatch Urgent Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
