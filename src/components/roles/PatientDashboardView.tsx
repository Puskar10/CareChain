import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import {
  User as UserIcon,
  Heart,
  Calendar,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldCheck,
  Activity,
  Smile,
  Meh,
  Frown,
  ArrowRight,
  Info,
  MapPin,
  Sparkles
} from 'lucide-react';

export const PatientDashboardView: React.FC = () => {
  const {
    user,
    isDemoMode,
    profileState,
    isLoadingData,
    dataError,
    retryLoadData,
    activePatient,
    events,
    vitals,
    medications,
    carePlans,
    appointments,
    logPatientCheckin,
    setActiveTab
  } = useCareChain();

  const [selectedMood, setSelectedMood] = useState<'better' | 'same' | 'worse' | null>(null);
  const [checkinNote, setCheckinNote] = useState('');
  const [isCheckinSubmitted, setIsCheckinSubmitted] = useState(false);

  // Dedicated Loading State for incomplete auth / profile resolution
  if (!isDemoMode && (profileState === 'authLoading' || profileState === 'profileLoading')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 animate-fade-in">
        <div className="glass-light rounded-3xl p-12 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-ink-primary font-carmen">
              Verifying Patient Portal
            </h3>
            <p className="text-xs text-ink-muted">
              Restoring authenticated session and synchronizing profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const patientDisplayName = user?.fullName || activePatient?.fullName || (isDemoMode ? 'Rahul Sharma' : 'Verified Patient');

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;

    await logPatientCheckin(selectedMood, checkinNote);
    setIsCheckinSubmitted(true);
    setTimeout(() => {
      setSelectedMood(null);
      setCheckinNote('');
      setIsCheckinSubmitted(false);
    }, 2500);
  };

  const patientEvents = activePatient ? events.filter(e => e.patientId === activePatient.id) : [];
  const patientVitals = activePatient ? vitals.filter(v => v.patientId === activePatient.id) : [];
  const latestVital = patientVitals[patientVitals.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Patient Welcome Hero */}
      <div className="glass-light rounded-3xl p-6 sm:p-8 border border-white/80 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0">
              <UserIcon className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider border border-emerald-200">
                  Patient Health Portal
                </span>
                <span className="text-xs text-ink-muted">Personal Health Journey</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-carmen mt-1 text-ink-primary">
                Welcome, {patientDisplayName}
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                Review your current care plan, medications schedule, upcoming appointments, and recovery progress.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveTab('timeline')}
              className="btn-cyan !px-4 !py-2 !text-xs flex items-center gap-2 font-bold pressable cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>View My Health Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('medications')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/80 text-ink-primary hover:bg-white border border-black/[0.08] transition-all pressable flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Pill className="w-4 h-4 text-cyan-600" />
              <span>My Medications</span>
            </button>
          </div>
        </div>

        {/* Health Status Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-black/[0.06]">
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-500/20">
            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Status
            </div>
            <div className="text-lg font-bold font-carmen mt-1 text-emerald-900">
              {activePatient ? 'Under Active Care' : 'Account Ready'}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              {activePatient ? 'Continuous clinical monitoring' : 'Awaiting clinical linkage'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <Heart className="w-3.5 h-3.5 text-cyan-600" />
              Pulse Rate
            </div>
            <div className="text-lg font-bold font-carmen mt-1 text-ink-primary">
              {latestVital?.heartRate ? `${latestVital.heartRate} bpm` : '--'}
            </div>
            <div className="text-[10px] text-ink-muted mt-0.5">
              {latestVital?.heartRate ? 'Telemetry synced' : 'Awaiting telemetry'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              Primary Doctor
            </div>
            <div className="text-lg font-bold font-carmen mt-1 text-ink-primary truncate">
              {activePatient?.primaryPhysician || 'Care Team'}
            </div>
            <div className="text-[10px] text-purple-700 mt-0.5">Assigned Clinician</div>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 border border-black/[0.05]">
            <div className="text-[11px] text-ink-muted flex items-center gap-1.5 font-medium">
              <Pill className="w-3.5 h-3.5 text-amber-600" />
              Active Medications
            </div>
            <div className="text-lg font-bold font-carmen mt-1 text-ink-primary">
              {medications.length} Prescriptions
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">Review schedule below</div>
          </div>
        </div>
      </div>

      {/* Backend / Data Error Banner */}
      {profileState === 'error' && dataError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Failed to load patient records: </span>
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
      {profileState === 'patientProfileLoading' && (
        <div className="glass-light rounded-3xl p-12 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-primary font-carmen">Loading Patient Health Profile</h3>
            <p className="text-xs text-ink-muted">Querying CareChain verified database...</p>
          </div>
        </div>
      )}

      {/* Empty / Onboarding State for Patient with No Linked Clinical Record */}
      {profileState === 'unconfigured' && !activePatient && (
        <div className="glass-light rounded-3xl p-10 text-center border border-white/80 shadow-soft max-w-lg mx-auto space-y-4 my-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-ink-primary font-carmen">
              Your clinical profile is being configured by your care team
            </h3>
            <p className="text-xs text-ink-secondary max-w-sm mx-auto">
              Welcome to CareChain, {patientDisplayName}! Your authenticated account is active. Once your physician or clinic links your medical record number (MRN), your health timeline, care plans, and medications will automatically appear here.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.05] text-[11px] text-ink-muted text-left space-y-1">
            <div className="font-semibold text-ink-primary">Verified Account Information</div>
            <div>Name: {user?.fullName || 'Verified Patient'}</div>
            <div>Email: {user?.email || 'Authenticated User'}</div>
            <div>Status: Authenticated & Awaiting Chart Linkage</div>
          </div>
          <div className="pt-2">
            <button
              onClick={retryLoadData}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-black/[0.1] hover:bg-black/[0.02] text-ink-primary transition-all pressable cursor-pointer"
            >
              Check Status
            </button>
          </div>
        </div>
      )}

      {/* Two-Column Grid */}
      {(activePatient || isDemoMode) && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Daily Check-In & Care Plan (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* "How are you feeling today?" Check-in Widget */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Daily Health Check-In</h2>
                  <p className="text-[11px] text-ink-muted">Share how you feel with your doctor and family caregiver</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full">
                Synchronized
              </span>
            </div>

            {isCheckinSubmitted ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-3 animate-scale-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Thank you for your update!</div>
                  <div className="text-[11px] text-emerald-700">Logged to your timeline and shared with your care team.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMood('better')}
                    className={`p-3 rounded-2xl border text-center transition-all pressable cursor-pointer ${
                      selectedMood === 'better'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                        : 'bg-white/80 border-black/[0.06] hover:bg-white text-ink-secondary'
                    }`}
                  >
                    <Smile className={`w-6 h-6 mx-auto mb-1 ${selectedMood === 'better' ? 'text-emerald-600' : 'text-ink-muted'}`} />
                    <div className="text-xs font-bold">Feeling Better</div>
                    <div className="text-[10px] text-ink-muted">Improving</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMood('same')}
                    className={`p-3 rounded-2xl border text-center transition-all pressable cursor-pointer ${
                      selectedMood === 'same'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm'
                        : 'bg-white/80 border-black/[0.06] hover:bg-white text-ink-secondary'
                    }`}
                  >
                    <Meh className={`w-6 h-6 mx-auto mb-1 ${selectedMood === 'same' ? 'text-amber-600' : 'text-ink-muted'}`} />
                    <div className="text-xs font-bold">About the Same</div>
                    <div className="text-[10px] text-ink-muted">Steady</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMood('worse')}
                    className={`p-3 rounded-2xl border text-center transition-all pressable cursor-pointer ${
                      selectedMood === 'worse'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-sm'
                        : 'bg-white/80 border-black/[0.06] hover:bg-white text-ink-secondary'
                    }`}
                  >
                    <Frown className={`w-6 h-6 mx-auto mb-1 ${selectedMood === 'worse' ? 'text-rose-600' : 'text-ink-muted'}`} />
                    <div className="text-xs font-bold">Having Symptoms</div>
                    <div className="text-[10px] text-ink-muted">Discomfort</div>
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                    Describe any symptoms or observations (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mild headache, able to drink fluids, rested for 2 hours"
                    value={checkinNote}
                    onChange={e => setCheckinNote(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-black/[0.08] bg-white text-ink-primary focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!selectedMood}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all pressable cursor-pointer ${
                      selectedMood
                        ? 'btn-cyan'
                        : 'bg-black/10 text-ink-muted cursor-not-allowed'
                    }`}
                  >
                    Send Daily Update
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Current Care Plan */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-primary font-carmen">Your Doctor's Care Plan</h2>
                  <p className="text-[11px] text-ink-muted">Guidelines prescribed by Dr. Aarav Sharma, MD</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {carePlans.map(cp => (
                <div key={cp.id} className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary">{cp.title}</span>
                    <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.2 rounded-md uppercase">
                      {cp.category}
                    </span>
                  </div>
                  <p className="text-ink-secondary leading-relaxed">{cp.description}</p>
                </div>
              ))}
            </div>

            {/* Allergy Notice */}
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Medical Safety Reminder: </span>
                You have documented allergies to <strong>Penicillin</strong> and <strong>Sulfa Drugs</strong>. Always inform clinicians and emergency personnel of this sensitivity.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Medications, Appointments, Care Team (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Medications */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Your Prescribed Medications</h3>
                  <p className="text-[11px] text-ink-muted">Clear schedule & instructions</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {medications.map(med => (
                <div key={med.id} className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary">{med.name}</span>
                    <span className="text-[11px] font-mono font-semibold text-cyan-700">{med.dose}</span>
                  </div>
                  <div className="text-[11px] text-ink-muted">{med.frequency}</div>
                  {med.notes && (
                    <div className="text-[11px] text-ink-secondary bg-black/[0.02] p-2 rounded-xl">
                      {med.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-primary font-carmen">Upcoming Appointments</h3>
                  <p className="text-[11px] text-ink-muted">Confirmed clinic visits</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {appointments.map(apt => (
                <div key={apt.id} className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink-primary">{apt.doctorName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">
                      {apt.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-semibold">{apt.specialty}</div>
                  <div className="text-[11px] text-ink-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-ink-muted" />
                    {apt.facility}
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-ink-primary pt-1 border-t border-black/[0.04]">
                    {apt.dateTime}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Care Team Directory */}
          <div className="glass-light rounded-3xl p-6 border border-white/80 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">My Direct Care Team</h3>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-primary">Dr. Aarav Sharma, MD</div>
                  <div className="text-[11px] text-ink-muted">Attending Emergency Physician</div>
                </div>
                <a href="tel:5559012345" className="p-2 rounded-xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-primary">Pooja Sharma</div>
                  <div className="text-[11px] text-ink-muted">Family Caregiver (Spouse)</div>
                </div>
                <a href="tel:5552348901" className="p-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-primary">Apex Memorial Emergency Line</div>
                  <div className="text-[11px] text-ink-muted">24/7 Clinical Emergency Hotline</div>
                </div>
                <a href="tel:911" className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
