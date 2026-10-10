import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle2,
  Activity,
  HeartPulse,
  Pill,
  FileText,
  Ambulance,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
  Flame,
  Share2,
  Calendar,
  Send
} from 'lucide-react';

export const DoctorDashboardView: React.FC = () => {
  const {
    user,
    isDemoMode,
    isLoadingData,
    dataError,
    retryLoadData,
    activePatient,
    patients,
    setActivePatientId,
    setActiveTab,
    events,
    vitals,
    medications,
    reports,
    handoverSummary,
    carePlans,
    clinicalOrders,
    caregiverEscalations,
    emsCase,
    addClinicalOrder,
    addCarePlanItem,
    updateDiagnosis,
    respondToEscalation,
    openWhyModal,
    setIsAddEventModalOpen
  } = useCareChain();

  // Local form states
  const [activeQueueFilter, setActiveQueueFilter] = useState<'all' | 'needs-attention' | 'stable'>('all');
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderType, setNewOrderType] = useState<'medication' | 'lab' | 'imaging' | 'respiratory'>('medication');
  const [newOrderPriority, setNewOrderPriority] = useState<'routine' | 'urgent' | 'stat'>('urgent');
  const [newOrderDetails, setNewOrderDetails] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Diagnosis edit state
  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [newDiagnosisInput, setNewDiagnosisInput] = useState('');

  // Escalation response
  const [escalationReply, setEscalationReply] = useState<Record<string, string>>({});

  // Filtered patients for queue
  const filteredPatients = patients.filter(p => {
    if (activeQueueFilter === 'needs-attention') return p.status === 'Needs Attention' || p.status === 'Critical';
    if (activeQueueFilter === 'stable') return p.status === 'Stable';
    return true;
  });

  const patientEvents = activePatient ? events.filter(e => e.patientId === activePatient.id) : [];
  const patientVitals = activePatient ? vitals.filter(v => v.patientId === activePatient.id) : [];
  const latestVital = patientVitals[patientVitals.length - 1];

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePatient || !newOrderTitle.trim()) return;
    await addClinicalOrder({
      patientId: activePatient.id,
      title: newOrderTitle,
      type: newOrderType,
      priority: newOrderPriority,
      details: newOrderDetails || 'Ordered during emergency doctor clinical assessment'
    });
    setNewOrderTitle('');
    setNewOrderDetails('');
    setIsOrderModalOpen(false);
  };

  const handleAddDiagnosis = async () => {
    if (!activePatient || !newDiagnosisInput.trim()) return;
    const updated = [...activePatient.conditions, newDiagnosisInput.trim()];
    await updateDiagnosis(activePatient.id, updated);
    setNewDiagnosisInput('');
    setIsEditingDiagnosis(false);
  };

  const doctorDisplayName = user?.fullName || (isDemoMode ? 'Dr. Aarav Sharma, MD' : 'Attending Physician');
  const doctorTitle = user?.title || (isDemoMode ? 'Senior Attending Physician' : 'Attending Physician');
  const emergentPatients = patients.filter(p => p.status === 'Needs Attention' || p.status === 'Critical');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* Doctor Header Banner */}
      <div className="glass-hero rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 min-w-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner shrink-0">
              <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-cyan-500/20 text-cyan-300 uppercase tracking-wider border border-cyan-400/20 shrink-0">
                  Doctor Clinical Cockpit
                </span>
                <span className="text-[11px] sm:text-xs text-white/60">Emergency Department · Apex Memorial</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-bold font-carmen mt-1 text-white truncate">
                {doctorDisplayName}
              </h1>
              <p className="text-[11px] sm:text-sm text-white/70 mt-0.5 break-words">
                {doctorTitle} · Managing {patients.length} In-Queue Patients · {emergentPatients.length} Emergent Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('handover')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all pressable flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>60s Handover</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all pressable flex items-center gap-2 cursor-pointer font-bold shadow-lg shadow-cyan-500/25"
            >
              <Activity className="w-4 h-4" />
              <span>Open Patient Timeline</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 min-w-0 overflow-hidden">
            <div className="text-[11px] text-white/60 flex items-center gap-1.5 truncate">
              <Users className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Active Queue</span>
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-white truncate">{patients.length} Patients</div>
            <div className="text-[10px] text-emerald-400 mt-0.5 truncate">All monitored in real-time</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 min-w-0 overflow-hidden">
            <div className="text-[11px] text-white/60 flex items-center gap-1.5 truncate">
              <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Triage Level 2</span>
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-rose-300 truncate">{emergentPatients.length} Emergent</div>
            <div className="text-[10px] text-rose-300 mt-0.5 truncate">
              {emergentPatients[0]?.fullName ? `${emergentPatients[0].fullName} (${emergentPatients[0].status})` : 'No emergent patients'}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 min-w-0 overflow-hidden">
            <div className="text-[11px] text-white/60 flex items-center gap-1.5 truncate">
              <Ambulance className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>EMS Inbound</span>
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-amber-300 truncate">
              {emsCase && emsCase.status === 'in-transit' ? 'ETA 6 min' : 'No Inbound'}
            </div>
            <div className="text-[10px] text-amber-300 mt-0.5 truncate">
              {emsCase && emsCase.status === 'in-transit' ? `${emsCase.unitNumber} · ${emsCase.paramedicName}` : 'All units standing by'}
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 min-w-0 overflow-hidden">
            <div className="text-[11px] text-white/60 flex items-center gap-1.5 truncate">
              <ClipboardList className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span>Pending Orders</span>
            </div>
            <div className="text-xl font-bold font-carmen mt-1 text-white truncate">{clinicalOrders.length} Active</div>
            <div className="text-[10px] text-cyan-300 mt-0.5 truncate">Directives in-progress</div>
          </div>
        </div>
      </div>

      {/* Backend / Data Error Banner */}
      {dataError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Failed to synchronize clinical records: </span>
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
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary font-carmen">Loading Authorized Clinical Panel</h3>
            <p className="text-xs text-ink-muted">Querying CareChain backend for active patients...</p>
          </div>
        </div>
      )}

      {/* Empty State for Real Doctor with No Assigned Patients */}
      {!isLoadingData && !dataError && patients.length === 0 && (
        <div className="glass-light rounded-3xl p-10 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-7 h-7 text-cyan-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-ink-primary font-carmen">
              No patients are currently assigned to your account.
            </h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              When patients are admitted to your care panel or clinical cases are assigned to your authorized profile, their real-time vitals, emergency alerts, and timeline will appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={retryLoadData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-black/[0.1] hover:bg-black/[0.02] text-ink-primary transition-all pressable cursor-pointer"
            >
              Refresh Panel
            </button>
          </div>
        </div>
      )}

      {/* Critical Clinical Alerts Bar */}
      {caregiverEscalations.filter(e => e.status === 'open').length > 0 && (
        <div className="glass-emergency rounded-2xl p-4 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                  Caregiver Escalation Alert
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-semibold">
                  URGENT
                </span>
              </div>
              <p className="text-xs text-ink-primary font-medium mt-0.5 break-words">
                {caregiverEscalations[0].caregiverName} reported: "{caregiverEscalations[0].symptom}" — {caregiverEscalations[0].details}
              </p>
            </div>
          </div>
          <button
            onClick={() => respondToEscalation(caregiverEscalations[0].id, 'Attending doctor reviewing vitals; EMS transfer coordinated.')}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0 transition-colors pressable"
          >
            Acknowledge & Sign
          </button>
        </div>
      )}

      {/* Main Grid: Left Patient Queue, Right Clinical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Patient Queue (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" />
                <h2 className="text-sm font-bold text-ink-primary font-carmen">Patient Queue</h2>
              </div>
              <span className="text-[11px] text-ink-muted">{filteredPatients.length} records</span>
            </div>

            {/* Filter pills */}
            <div className="flex rounded-xl p-1 bg-black/[0.04] mb-4 text-xs font-medium">
              <button
                onClick={() => setActiveQueueFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center transition-all pressable ${
                  activeQueueFilter === 'all' ? 'bg-white text-ink-primary font-bold shadow-xs' : 'text-ink-muted'
                }`}
              >
                All ({patients.length})
              </button>
              <button
                onClick={() => setActiveQueueFilter('needs-attention')}
                className={`flex-1 py-1 rounded-lg text-center transition-all pressable ${
                  activeQueueFilter === 'needs-attention' ? 'bg-white text-rose-600 font-bold shadow-xs' : 'text-ink-muted'
                }`}
              >
                Emergent
              </button>
              <button
                onClick={() => setActiveQueueFilter('stable')}
                className={`flex-1 py-1 rounded-lg text-center transition-all pressable ${
                  activeQueueFilter === 'stable' ? 'bg-white text-emerald-600 font-bold shadow-xs' : 'text-ink-muted'
                }`}
              >
                Stable
              </button>
            </div>

            {/* Queue List */}
            <div className="space-y-2.5">
              {filteredPatients.map(p => {
                const isSelected = activePatient ? p.id === activePatient.id : false;
                const isNeedsAttention = p.status === 'Needs Attention' || p.status === 'Critical';

                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePatientId(p.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer pressable text-left ${
                      isSelected
                        ? 'bg-cyan-50/70 border-cyan-400/60 shadow-sm ring-2 ring-cyan-400/20'
                        : 'bg-white/70 border-black/[0.06] hover:bg-white hover:border-black/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isNeedsAttention ? 'bg-rose-500/15 text-rose-600' : 'bg-emerald-500/15 text-emerald-600'
                        }`}>
                          {p.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                            {p.fullName}
                            {isSelected && <span className="text-[10px] text-cyan-600 font-semibold">(Active)</span>}
                          </div>
                          <div className="text-[11px] text-ink-muted">
                            {p.age}y · {p.sex} · Blood {p.bloodGroup}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isNeedsAttention ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/[0.05] flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Conditions: {p.conditions[0] || 'None'}</span>
                      <span className="text-cyan-600 font-medium flex items-center gap-1">
                        Select <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Encounter Links */}
          <div className="glass-light rounded-3xl p-5 border border-white/80 space-y-3">
            <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">Quick Clinical Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="p-2.5 rounded-xl border border-black/[0.06] bg-white hover:bg-cyan-50 hover:border-cyan-400/40 text-ink-primary font-medium flex items-center gap-2 transition-all pressable text-left"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-600" />
                <span>Issue Order</span>
              </button>
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="p-2.5 rounded-xl border border-black/[0.06] bg-white hover:bg-cyan-50 hover:border-cyan-400/40 text-ink-primary font-medium flex items-center gap-2 transition-all pressable text-left"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-600" />
                <span>Add Note</span>
              </button>
              <button
                onClick={() => setActiveTab('doctor')}
                className="p-2.5 rounded-xl border border-black/[0.06] bg-white hover:bg-cyan-50 hover:border-cyan-400/40 text-ink-primary font-medium flex items-center gap-2 transition-all pressable text-left"
              >
                <Stethoscope className="w-3.5 h-3.5 text-cyan-600" />
                <span>Assessment</span>
              </button>
              <button
                onClick={() => setActiveTab('handover')}
                className="p-2.5 rounded-xl border border-black/[0.06] bg-white hover:bg-cyan-50 hover:border-cyan-400/40 text-ink-primary font-medium flex items-center gap-2 transition-all pressable text-left"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>Handover AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Patient Clinical Dossier (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {activePatient ? (
            <>
              {/* Active Patient Summary Card */}
              <div className="glass-light rounded-3xl p-4 sm:p-6 border border-white/80 shadow-soft min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/[0.06] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-ink-primary font-carmen">{activePatient.fullName}</h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 uppercase">
                        {activePatient.status}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5 break-words">
                      ID: {activePatient.id} · Age: {activePatient.age} · Sex: {activePatient.sex} · Blood Group: {activePatient.bloodGroup}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setActiveTab('emergency')}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors pressable cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      <span>ER Triage View</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 text-xs font-semibold flex items-center gap-1.5 transition-colors pressable cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Full Timeline</span>
                    </button>
                  </div>
                </div>

                {/* Acute Telemetry Glance */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 py-4 border-b border-black/[0.06]">
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04] min-w-0 overflow-hidden">
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold truncate">Body Temp</div>
                    <div className="text-base font-bold text-rose-600 font-carmen mt-0.5 truncate">
                      {latestVital?.temperature ? `${latestVital.temperature}°F` : '102.8°F'}
                    </div>
                    <div className="text-[10px] text-rose-500 mt-0.5 truncate">High Pyrexia Peak</div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04] min-w-0 overflow-hidden">
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold truncate">Pulse Rate</div>
                    <div className="text-base font-bold text-amber-600 font-carmen mt-0.5 truncate">
                      {latestVital?.heartRate ? `${latestVital.heartRate} bpm` : '112 bpm'}
                    </div>
                    <div className="text-[10px] text-amber-500 mt-0.5 truncate">Sinus Tachycardia</div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04] min-w-0 overflow-hidden">
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold truncate">SpO2 Oxygen</div>
                    <div className="text-base font-bold text-rose-600 font-carmen mt-0.5 truncate">
                      {latestVital?.spo2 ? `${latestVital.spo2}%` : '92%'}
                    </div>
                    <div className="text-[10px] text-rose-500 mt-0.5 truncate">Acute Desaturation</div>
                  </div>
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-black/[0.02] border border-black/[0.04] min-w-0 overflow-hidden">
                    <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold truncate">Blood Pressure</div>
                    <div className="text-base font-bold text-ink-primary font-carmen mt-0.5 truncate">
                      {latestVital?.bpSystolic ? `${latestVital.bpSystolic}/${latestVital.bpDiastolic}` : '142/92'}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5 truncate">Stage 1 Hypertensive</div>
                  </div>
                </div>

                {/* Allergies and Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900">
                    <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-800">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Documented Allergies
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activePatient.allergies.map(a => (
                        <span key={a} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-200/60 text-rose-900">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-cyan-800">
                        <ClipboardList className="w-3.5 h-3.5" />
                        Current Diagnoses
                      </span>
                      <button
                        onClick={() => setIsEditingDiagnosis(!isEditingDiagnosis)}
                        className="text-[10px] text-cyan-700 hover:underline font-semibold cursor-pointer"
                      >
                        {isEditingDiagnosis ? 'Cancel' : '+ Add Diagnosis'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activePatient.conditions.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-md text-xs font-semibold bg-cyan-200/60 text-cyan-950">
                          {c}
                        </span>
                      ))}
                    </div>

                    {isEditingDiagnosis && (
                      <div className="mt-2.5 flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Acute Bronchitis with Hypoxemia"
                          value={newDiagnosisInput}
                          onChange={e => setNewDiagnosisInput(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-cyan-300 bg-white text-ink-primary focus:outline-none"
                        />
                        <button
                          onClick={handleAddDiagnosis}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Incoming EMS Handover Review */}
              {emsCase ? (
                <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                        <Ambulance className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink-primary font-carmen">EMS Handover Intelligence</h3>
                        <p className="text-[11px] text-ink-muted">From {emsCase.paramedicName} ({emsCase.unitNumber})</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                      {emsCase.status === 'in-transit' ? 'In-Transit (ETA 6m)' : 'Handover Received'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.04] space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-ink-primary">Call Reason: </span>
                      <span className="text-ink-secondary">{emsCase.callReason}</span>
                    </div>
                    <div>
                      <span className="font-bold text-ink-primary">Emergency Interventions Administered:</span>
                      <ul className="mt-1 space-y-1 pl-4 list-disc text-ink-secondary">
                        {emsCase.interventions.map(i => (
                          <li key={i.id}>
                            <span className="font-semibold text-ink-primary">{i.name}</span> — {i.notes}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-black/[0.05] grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="font-semibold text-ink-primary">Receiving Facility:</span> {emsCase.receivingHospital}
                      </div>
                      <div>
                        <span className="font-semibold text-ink-primary">Triage Level:</span> Emergent (Level 2)
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-light rounded-3xl p-5 border border-white/80 shadow-soft space-y-1">
                  <div className="flex items-center gap-2 text-ink-muted text-xs">
                    <Ambulance className="w-4 h-4" />
                    <span className="font-semibold text-ink-secondary">No Active Pre-Hospital EMS Transport</span>
                  </div>
                  <p className="text-[11px] text-ink-muted">No in-transit paramedic cases are currently routed to this patient.</p>
                </div>
              )}

          {/* Active Clinical Orders & Treatment Plan */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Active Clinical Orders & Care Plan</h3>
                  <p className="text-[11px] text-ink-muted">{clinicalOrders.length} active physician directives</p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="btn-cyan !px-3 !py-1.5 !text-xs flex items-center gap-1.5 pressable cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Order</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {clinicalOrders.map(ord => (
                <div key={ord.id} className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-primary">{ord.title}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                        ord.priority === 'stat' ? 'bg-rose-100 text-rose-700' : ord.priority === 'urgent' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {ord.priority}
                      </span>
                    </div>
                    <p className="text-ink-secondary">{ord.details}</p>
                    <div className="text-[10px] text-ink-muted">
                      Prescribed by {ord.doctorName} · {ord.timestamp}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                    {ord.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-light rounded-3xl p-10 text-center border border-white/80 shadow-soft space-y-2">
          <Users className="w-8 h-8 text-ink-muted mx-auto" />
          <h3 className="text-base font-bold text-ink-primary font-carmen">No Patient Selected</h3>
          <p className="text-xs text-ink-muted">Select an active patient from your queue on the left to inspect their dossier.</p>
        </div>
      )}
    </div>
  </div>

  {/* Modal: Issue Clinical Order */}
  {isOrderModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="glass-light w-full max-w-lg rounded-3xl p-6 border border-white/90 shadow-2xl animate-scale-in">
        <h3 className="text-base font-bold text-ink-primary font-carmen mb-1">Issue Clinical Directive / Order</h3>
        <p className="text-xs text-ink-muted mb-4">Patient: {activePatient?.fullName} ({activePatient?.id})</p>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="label-tag text-ink-muted block mb-1">Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nebulized Salbutamol 2.5mg q4h PRN"
                  value={newOrderTitle}
                  onChange={e => setNewOrderTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-tag text-ink-muted block mb-1">Category</label>
                  <select
                    value={newOrderType}
                    onChange={e => setNewOrderType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                  >
                    <option value="medication">Medication Order</option>
                    <option value="respiratory">Respiratory Therapy</option>
                    <option value="lab">Laboratory Assay</option>
                    <option value="imaging">Radiology / Imaging</option>
                  </select>
                </div>
                <div>
                  <label className="label-tag text-ink-muted block mb-1">Priority</label>
                  <select
                    value={newOrderPriority}
                    onChange={e => setNewOrderPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-tag text-ink-muted block mb-1">Clinical Instructions & Rationale</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Administer immediately. Check vitals post-treatment for improvement in wheeze."
                  value={newOrderDetails}
                  onChange={e => setNewOrderDetails(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyan !px-4 !py-2 !text-xs font-bold"
                >
                  Commit Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
