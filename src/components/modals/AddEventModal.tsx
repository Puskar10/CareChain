import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import { EventType, EventSeverity } from '../../types';
import { X, AlertTriangle, Pill, HeartPulse, Activity, FileText, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-black/[0.08] text-sm text-ink-primary bg-white focus:outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/10 transition-all placeholder:text-ink-muted";
const labelCls = "label-tag text-ink-muted block mb-1.5";

export const AddEventModal: React.FC = () => {
  const { isAddEventModalOpen, setIsAddEventModalOpen, addEvent, activePatient } = useCareChain();

  const [selectedType, setSelectedType] = useState<EventType>('symptom');
  const [severity, setSeverity] = useState<EventSeverity>('moderate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Symptom
  const [symptomDuration, setSymptomDuration] = useState('2 hours');
  const [symptomTrigger, setSymptomTrigger] = useState('Upon standing');

  // Medication
  const [medName, setMedName] = useState('Paracetamol');
  const [medDose, setMedDose] = useState('500 mg');
  const [takenStatus, setTakenStatus] = useState<'taken' | 'missed' | 'delayed'>('taken');
  const [missedReason, setMissedReason] = useState('');

  // Vital
  const [temp, setTemp] = useState('101.5');
  const [heartRate, setHeartRate] = useState('95');
  const [bpSystolic, setBpSystolic] = useState('130');
  const [bpDiastolic, setBpDiastolic] = useState('85');
  const [spo2, setSpo2] = useState('98');

  // Visit
  const [doctorName, setDoctorName] = useState('Dr. Arvind Mehta');
  const [clinicName, setClinicName] = useState('Internal Medicine Clinic');
  const [diagnosis, setDiagnosis] = useState('Acute viral pyrexia');

  if (!isAddEventModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const metadata: Record<string, any> = {};
    if (selectedType === 'symptom') { metadata.duration = symptomDuration; metadata.trigger = symptomTrigger; }
    else if (selectedType === 'medication') { metadata.medicineName = medName; metadata.dose = medDose; metadata.takenStatus = takenStatus; if (takenStatus === 'missed') metadata.missedReason = missedReason || 'Unspecified'; }
    else if (selectedType === 'vital') { metadata.temperature = parseFloat(temp) || undefined; metadata.heartRate = parseInt(heartRate) || undefined; metadata.bpSystolic = parseInt(bpSystolic) || undefined; metadata.bpDiastolic = parseInt(bpDiastolic) || undefined; metadata.oxygenSat = parseInt(spo2) || undefined; }
    else if (selectedType === 'visit') { metadata.doctorName = doctorName; metadata.clinicName = clinicName; metadata.provisionalDiagnosis = diagnosis; }

    const eventTitle = title || (
      selectedType === 'vital' ? `Vitals — Temp ${temp}°F · Pulse ${heartRate} bpm` :
      selectedType === 'medication' ? `${medName} (${medDose}) — ${takenStatus}` :
      selectedType === 'visit' ? `Consult with ${doctorName}` : 'Health Event'
    );

    await addEvent({ type: selectedType, severity, title: eventTitle, description: description || `${selectedType} event for ${activePatient.fullName}`, metadata });
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    setIsAddEventModalOpen(false);
  };

  const types: { id: EventType; label: string; icon: React.ReactNode }[] = [
    { id: 'symptom',   label: 'Symptom',   icon: <AlertTriangle className="w-3.5 h-3.5"/> },
    { id: 'medication',label: 'Medication', icon: <Pill className="w-3.5 h-3.5"/> },
    { id: 'vital',     label: 'Vital',      icon: <HeartPulse className="w-3.5 h-3.5"/> },
    { id: 'visit',     label: 'Visit',      icon: <Activity className="w-3.5 h-3.5"/> },
    { id: 'report',    label: 'Report',     icon: <FileText className="w-3.5 h-3.5"/> },
    { id: 'emergency', label: 'Emergency',  icon: <ShieldAlert className="w-3.5 h-3.5"/> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="modal-panel w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="p-7 pb-5 border-b border-black/[0.05]">
          <div className="flex items-start justify-between">
            <div>
              <span className="label-tag text-ink-muted">CARECHAIN EVENT STORE</span>
              <h2 className="text-xl font-light text-ink-primary mt-1.5" style={{letterSpacing:'-0.02em'}}>
                Log Health Event
              </h2>
              <p className="text-xs text-ink-muted mt-1">
                Adds to timeline and updates the 60s AI handover automatically.
              </p>
            </div>
            <button onClick={() => setIsAddEventModalOpen(false)} className="p-2 rounded-full text-ink-muted hover:text-ink-primary hover:bg-black/[0.04] transition-all">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-7 space-y-5">
          {/* Type selector */}
          <div>
            <span className={labelCls}>EVENT TYPE</span>
            <div className="grid grid-cols-3 gap-2">
              {types.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedType === t.id
                      ? 'bg-void text-ice border-transparent shadow-sm'
                      : 'border-black/[0.07] text-ink-secondary hover:border-black/[0.12] hover:bg-black/[0.02]'
                  } ${t.id === 'emergency' && selectedType !== t.id ? 'border-emergency-border text-emergency-DEFAULT' : ''}`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="addEventForm">
            {/* Severity + Title row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>SEVERITY</label>
                <select value={severity} onChange={e => setSeverity(e.target.value as EventSeverity)} className={inputCls}>
                  <option value="normal">Normal</option>
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>TITLE (optional)</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto-generated if blank" className={inputCls}/>
              </div>
            </div>

            {/* Dynamic fields */}
            {selectedType === 'symptom' && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-warn/5 border border-warn/15">
                <div>
                  <label className={labelCls}>DURATION</label>
                  <input type="text" value={symptomDuration} onChange={e => setSymptomDuration(e.target.value)} placeholder="e.g. 45 mins" className={inputCls}/>
                </div>
                <div>
                  <label className={labelCls}>TRIGGER / ONSET</label>
                  <input type="text" value={symptomTrigger} onChange={e => setSymptomTrigger(e.target.value)} placeholder="e.g. Upon standing" className={inputCls}/>
                </div>
              </div>
            )}

            {selectedType === 'medication' && (
              <div className="p-4 rounded-2xl bg-ok/5 border border-ok/15 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={labelCls}>MEDICINE</label>
                    <input type="text" value={medName} onChange={e => setMedName(e.target.value)} className={inputCls}/>
                  </div>
                  <div>
                    <label className={labelCls}>DOSE</label>
                    <input type="text" value={medDose} onChange={e => setMedDose(e.target.value)} className={inputCls}/>
                  </div>
                  <div>
                    <label className={labelCls}>STATUS</label>
                    <select value={takenStatus} onChange={e => setTakenStatus(e.target.value as any)} className={inputCls}>
                      <option value="taken">Taken ✓</option>
                      <option value="missed">Missed ✗</option>
                      <option value="delayed">Delayed ⏱</option>
                    </select>
                  </div>
                </div>
                {takenStatus === 'missed' && (
                  <div>
                    <label className={labelCls}>REASON FOR MISSED DOSE</label>
                    <input type="text" value={missedReason} onChange={e => setMissedReason(e.target.value)} placeholder="e.g. Nausea, vomiting, ran out" className={inputCls}/>
                  </div>
                )}
              </div>
            )}

            {selectedType === 'vital' && (
              <div className="grid grid-cols-3 gap-2 p-4 rounded-2xl bg-emergency-dim border border-emergency-border">
                {[
                  { label:'TEMP (°F)', val:temp, set:setTemp, type:'number', step:'0.1' },
                  { label:'PULSE (bpm)', val:heartRate, set:setHeartRate, type:'number', step:'1' },
                  { label:'SpO₂ (%)', val:spo2, set:setSpo2, type:'number', step:'1' },
                ].map(f => (
                  <div key={f.label}>
                    <label className={labelCls}>{f.label}</label>
                    <input type={f.type} step={f.step} value={f.val} onChange={e => f.set(e.target.value)} className={inputCls}/>
                  </div>
                ))}
              </div>
            )}

            {selectedType === 'visit' && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/15">
                <div>
                  <label className={labelCls}>CLINICIAN</label>
                  <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className={inputCls}/>
                </div>
                <div>
                  <label className={labelCls}>PROVISIONAL DIAGNOSIS</label>
                  <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className={inputCls}/>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className={labelCls}>CLINICAL NOTES</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional clinical observation or notes..."
                className={inputCls + ' resize-none'}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-black/[0.05] flex items-center justify-end gap-2">
          <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="btn-ghost">Cancel</button>
          <button type="submit" form="addEventForm" className="btn-primary">
            Commit to Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
