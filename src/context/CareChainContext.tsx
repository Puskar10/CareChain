import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Patient,
  HealthEvent,
  Medication,
  MedicalReport,
  VitalRecord,
  AuditLogItem,
  HandoverSummary,
  UserRole,
  AppTab,
  EventType,
  MedicationScheduleItem
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_EVENTS,
  INITIAL_MEDICATIONS,
  INITIAL_REPORTS,
  INITIAL_VITALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_HANDOVER_SUMMARY
} from '../lib/initialData';
import { supabase, checkSupabaseConnection } from '../lib/supabase';

interface CareChainContextType {
  activePatient: Patient;
  patients: Patient[];
  events: HealthEvent[];
  medications: Medication[];
  reports: MedicalReport[];
  vitals: VitalRecord[];
  auditLogs: AuditLogItem[];
  handoverSummary: HandoverSummary;
  currentRole: UserRole;
  activeTab: AppTab;
  activeFilterTime: '24h' | '72h' | '7d' | '30d' | 'all';
  activeFilterType: 'all' | EventType;
  evidenceHighlightIds: string[];
  demoScene: number; // 0 = idle, 1..6 = scenes
  isDemoPlaying: boolean;
  isAddEventModalOpen: boolean;
  isShareModalOpen: boolean;
  isWhyModalOpen: boolean;
  selectedWhyFinding: HandoverSummary['keyFindings'][0] | null;
  isSupabaseOnline: boolean;
  supabaseMessage: string;

  // Actions
  setActivePatientId: (id: string) => void;
  setCurrentRole: (role: UserRole) => void;
  setActiveTab: (tab: AppTab) => void;
  setActiveFilterTime: (filter: '24h' | '72h' | '7d' | '30d' | 'all') => void;
  setActiveFilterType: (filter: 'all' | EventType) => void;
  setEvidenceHighlightIds: (ids: string[]) => void;
  setIsAddEventModalOpen: (open: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  openWhyModal: (finding: HandoverSummary['keyFindings'][0]) => void;
  closeWhyModal: () => void;
  addEvent: (event: Partial<HealthEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleMedicationDose: (medId: string, timeIdx: number, newStatus: MedicationScheduleItem['status'], reason?: string) => Promise<void>;
  addMedication: (med: Partial<Medication>) => Promise<void>;
  uploadReport: (report: Partial<MedicalReport>) => Promise<void>;
  addVital: (vital: Partial<VitalRecord>) => Promise<void>;
  startDemoStory: () => void;
  setDemoScene: (scene: number) => void;
  stepDemoScene: (nextScene: number) => void;
  resetDemoData: () => void;
  refreshHandoverSummary: () => void;
  recheckSupabase: () => Promise<void>;
}

const CareChainContext = createContext<CareChainContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'carechain_state_v1';

export const CareChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_patients`);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [activePatientId, setActivePatientId] = useState<string>(
    INITIAL_PATIENTS[0].id
  );

  const [events, setEvents] = useState<HealthEvent[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_events`);
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [medications, setMedications] = useState<Medication[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_meds`);
    return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
  });

  const [reports, setReports] = useState<MedicalReport[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_reports`);
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [vitals, setVitals] = useState<VitalRecord[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_vitals`);
    return saved ? JSON.parse(saved) : INITIAL_VITALS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_logs`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [handoverSummary, setHandoverSummary] = useState<HandoverSummary>(INITIAL_HANDOVER_SUMMARY);

  const [currentRole, setCurrentRole] = useState<UserRole>('doctor');
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [activeFilterTime, setActiveFilterTime] = useState<'24h' | '72h' | '7d' | '30d' | 'all'>('72h');
  const [activeFilterType, setActiveFilterType] = useState<'all' | EventType>('all');
  const [evidenceHighlightIds, setEvidenceHighlightIds] = useState<string[]>([]);

  // Modals & Demo
  const [demoScene, setDemoScene] = useState<number>(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState<boolean>(false);
  const [selectedWhyFinding, setSelectedWhyFinding] = useState<HandoverSummary['keyFindings'][0] | null>(null);

  // Supabase status
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [supabaseMessage, setSupabaseMessage] = useState<string>('Checking Supabase connection...');

  // Active patient object
  const activePatient = patients.find(p => p.id === activePatientId) || patients[0];

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_patients`, JSON.stringify(patients));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_events`, JSON.stringify(events));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_meds`, JSON.stringify(medications));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_reports`, JSON.stringify(reports));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_vitals`, JSON.stringify(vitals));
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_logs`, JSON.stringify(auditLogs));
  }, [patients, events, medications, reports, vitals, auditLogs]);

  // Check Supabase connection on mount
  const recheckSupabase = useCallback(async () => {
    const res = await checkSupabaseConnection();
    setIsSupabaseOnline(res.connected);
    setSupabaseMessage(res.message);
  }, []);

  useEffect(() => {
    recheckSupabase();
  }, [recheckSupabase]);

  // Dynamic Handover recalculator based on events
  const refreshHandoverSummary = useCallback(() => {
    const patientEvents = events.filter(e => e.patientId === activePatient.id);
    const tempEvents = patientEvents.filter(e => e.type === 'vital' && e.metadata?.temperature);
    const latestTemp = tempEvents.length > 0 ? `${tempEvents[tempEvents.length - 1].metadata?.temperature}°F` : '102.6°F';
    const missedMeds = patientEvents.filter(e => e.type === 'medication' && e.metadata?.takenStatus === 'missed');
    const symptomEvents = patientEvents.filter(e => e.type === 'symptom');

    const updatedSummary: HandoverSummary = {
      ...INITIAL_HANDOVER_SUMMARY,
      timespan: activeFilterTime === '24h' ? 'Last 24 Hours' : activeFilterTime === '72h' ? 'Last 72 Hours' : 'Full Timeline',
      totalEventsAnalyzed: patientEvents.length,
      supportingEvidenceCount: {
        events: patientEvents.length,
        historyDays: 3,
        medications: patientEvents.filter(e => e.type === 'medication').length,
        vitals: patientEvents.filter(e => e.type === 'vital').length,
        reports: patientEvents.filter(e => e.type === 'report').length,
      },
      latestVitals: {
        ...INITIAL_HANDOVER_SUMMARY.latestVitals,
        temperature: latestTemp,
      },
      coreNarrative: `Fever began 3 days ago and progressively increased to ${latestTemp}. Medication was taken irregularly (${missedMeds.length} skipped dose recorded). Patient subsequently reported ${symptomEvents[symptomEvents.length - 1]?.title || 'dizziness'} before emergency transfer.`,
    };

    setHandoverSummary(updatedSummary);
  }, [events, activePatient.id, activeFilterTime]);

  const openWhyModal = (finding: HandoverSummary['keyFindings'][0]) => {
    setSelectedWhyFinding(finding);
    setEvidenceHighlightIds(finding.evidenceEventIds);
    setIsWhyModalOpen(true);
  };

  const closeWhyModal = () => {
    setIsWhyModalOpen(false);
  };

  // Add Health Event
  const addEvent = async (eventData: Partial<HealthEvent>) => {
    const newEvent: HealthEvent = {
      id: `evt-${Date.now()}`,
      patientId: activePatient.id,
      type: eventData.type || 'symptom',
      timestamp: eventData.timestamp || new Date().toISOString(),
      severity: eventData.severity || 'mild',
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      source: eventData.source || (currentRole === 'doctor' ? 'Clinician' : currentRole === 'family' ? 'Family / Caregiver' : 'Patient'),
      createdBy: eventData.createdBy || (currentRole === 'doctor' ? 'Dr. Sharma' : currentRole === 'family' ? 'Caregiver' : activePatient.fullName),
      metadata: eventData.metadata || {},
      attachments: eventData.attachments || [],
      verified: currentRole === 'doctor'
    };

    // Update local state
    setEvents(prev => [...prev, newEvent]);

    // Also update audit log
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      patientId: activePatient.id,
      actorName: newEvent.createdBy,
      actorRole: currentRole === 'doctor' ? 'Doctor' : currentRole === 'family' ? 'Family Member' : 'Patient',
      action: `Added ${newEvent.type}: ${newEvent.title}`,
      timestamp: 'Just now',
      details: newEvent.description
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Attempt to sync to Supabase if tables exist
    try {
      if (isSupabaseOnline) {
        await supabase.from('health_events').insert({
          id: newEvent.id,
          patient_id: newEvent.patientId,
          type: newEvent.type,
          timestamp: newEvent.timestamp,
          severity: newEvent.severity,
          title: newEvent.title,
          description: newEvent.description,
          source: newEvent.source,
          created_by: newEvent.createdBy,
          metadata: newEvent.metadata,
          verified: newEvent.verified
        });
      }
    } catch {
      // Gracefully silent on local fallback
    }

    refreshHandoverSummary();
  };

  // Delete Health Event
  const deleteEvent = async (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    try {
      if (isSupabaseOnline) {
        await supabase.from('health_events').delete().eq('id', id);
      }
    } catch {
      // Fallback
    }
    refreshHandoverSummary();
  };

  // Medication Dose Toggle
  const toggleMedicationDose = async (
    medId: string,
    timeIdx: number,
    newStatus: MedicationScheduleItem['status'],
    reason?: string
  ) => {
    setMedications(prev => prev.map(m => {
      if (m.id !== medId) return m;
      const updatedTimes = [...m.scheduleTimes];
      if (updatedTimes[timeIdx]) {
        updatedTimes[timeIdx] = { ...updatedTimes[timeIdx], status: newStatus };
      }
      return { ...m, scheduleTimes: updatedTimes };
    }));

    const med = medications.find(m => m.id === medId);
    if (med) {
      const scheduleTime = med.scheduleTimes[timeIdx]?.time || 'Scheduled dose';
      await addEvent({
        type: 'medication',
        title: `${med.name} marked as ${newStatus}`,
        description: newStatus === 'missed' ? `Dose at ${scheduleTime} missed. Reason: ${reason || 'Patient felt unwell'}` : `Dose at ${scheduleTime} taken on time.`,
        severity: newStatus === 'missed' ? 'moderate' : 'normal',
        metadata: {
          medicineName: med.name,
          dose: med.dose,
          takenStatus: newStatus,
          missedReason: reason
        }
      });
    }
  };

  // Add Medication
  const addMedication = async (medData: Partial<Medication>) => {
    const newMed: Medication = {
      id: `med-${Date.now()}`,
      patientId: activePatient.id,
      name: medData.name || 'New Medication',
      dose: medData.dose || '500 mg',
      frequency: medData.frequency || 'Once daily',
      scheduleTimes: medData.scheduleTimes || [{ time: '09:00 AM', status: 'pending' }],
      status: 'active',
      notes: medData.notes || ''
    };
    setMedications(prev => [...prev, newMed]);
  };

  // Upload Medical Report
  const uploadReport = async (repData: Partial<MedicalReport>) => {
    const newRep: MedicalReport = {
      id: `rep-${Date.now()}`,
      patientId: activePatient.id,
      title: repData.title || 'Diagnostic Report',
      reportType: repData.reportType || 'Lab Report' as any,
      fileName: repData.fileName || 'report.pdf',
      extractedData: repData.extractedData || { 'Status': 'Normal', 'Analysis': 'Auto-extracted' },
      summary: repData.summary || 'AI extracted clinical summary ready for doctor review.',
      uploadedAt: 'Today · Just now',
      aiVerified: true
    };
    setReports(prev => [newRep, ...prev]);

    // Also add to timeline as report event
    await addEvent({
      type: 'report',
      title: `${newRep.title} Uploaded`,
      description: newRep.summary,
      severity: 'moderate',
      metadata: {
        reportType: newRep.reportType,
        extractedValues: newRep.extractedData
      }
    });
  };

  // Add Vital
  const addVital = async (vitalData: Partial<VitalRecord>) => {
    const newVital: VitalRecord = {
      id: `vit-${Date.now()}`,
      patientId: activePatient.id,
      timestamp: new Date().toISOString(),
      temperature: vitalData.temperature,
      bpSystolic: vitalData.bpSystolic,
      bpDiastolic: vitalData.bpDiastolic,
      heartRate: vitalData.heartRate,
      spo2: vitalData.spo2,
      respiratoryRate: vitalData.respiratoryRate,
      bloodGlucose: vitalData.bloodGlucose,
      notes: vitalData.notes
    };
    setVitals(prev => [...prev, newVital]);

    // Add to timeline
    await addEvent({
      type: 'vital',
      title: `Vitals: ${newVital.temperature ? `${newVital.temperature}°F` : ''} ${newVital.heartRate ? `Pulse ${newVital.heartRate} bpm` : ''}`,
      description: `Logged vitals reading. BP: ${newVital.bpSystolic || '--'}/${newVital.bpDiastolic || '--'} mmHg, SpO2: ${newVital.spo2 || '--'}%`,
      severity: (newVital.temperature && newVital.temperature >= 102) ? 'severe' : 'normal',
      metadata: {
        temperature: newVital.temperature,
        heartRate: newVital.heartRate,
        bpSystolic: newVital.bpSystolic,
        bpDiastolic: newVital.bpDiastolic,
        spo2: newVital.spo2
      }
    });
  };

  // Reset Demo Data back to the original 14-event story
  const resetDemoData = () => {
    setPatients(INITIAL_PATIENTS);
    setActivePatientId(INITIAL_PATIENTS[0].id);
    setEvents(INITIAL_EVENTS);
    setMedications(INITIAL_MEDICATIONS);
    setReports(INITIAL_REPORTS);
    setVitals(INITIAL_VITALS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setHandoverSummary(INITIAL_HANDOVER_SUMMARY);
    setDemoScene(0);
    setIsDemoPlaying(false);
    setEvidenceHighlightIds([]);
    setActiveTab('overview');
  };

  // Interactive MVP Demo Story Controller
  const startDemoStory = () => {
    setDemoScene(1);
    setIsDemoPlaying(true);
    setActiveTab('timeline');
    setActiveFilterTime('72h');
  };

  const stepDemoScene = (sceneNum: number) => {
    setDemoScene(sceneNum);
    switch (sceneNum) {
      case 1: // Patient develops fever
        setActiveTab('timeline');
        setActiveFilterType('symptom');
        setEvidenceHighlightIds(['evt-1']);
        break;
      case 2: // Family adds medication events
        setActiveTab('medications');
        setEvidenceHighlightIds(['evt-2', 'evt-4', 'evt-7']);
        break;
      case 3: // Vitals start changing: 100.4 -> 101.8 -> 102.6
        setActiveTab('vitals');
        setEvidenceHighlightIds(['evt-3', 'evt-6', 'evt-8', 'evt-11']);
        break;
      case 4: // Patient reports dizziness
        setActiveTab('timeline');
        setActiveFilterType('all');
        setEvidenceHighlightIds(['evt-12']);
        break;
      case 5: // Family takes patient to hospital / Emergency Mode
        setActiveTab('emergency');
        setEvidenceHighlightIds(['evt-13']);
        break;
      case 6: // Doctor opens CareChain -> 60s Handover + Show Evidence
        setCurrentRole('doctor');
        setActiveTab('handover');
        // Trigger the killer evidence highlight!
        setEvidenceHighlightIds(['evt-1', 'evt-3', 'evt-6', 'evt-10', 'evt-11', 'evt-12']);
        break;
      default:
        setEvidenceHighlightIds([]);
    }
  };

  return (
    <CareChainContext.Provider
      value={{
        activePatient,
        patients,
        events,
        medications,
        reports,
        vitals,
        auditLogs,
        handoverSummary,
        currentRole,
        activeTab,
        activeFilterTime,
        activeFilterType,
        evidenceHighlightIds,
        demoScene,
        isDemoPlaying,
        isAddEventModalOpen,
        isShareModalOpen,
        isWhyModalOpen,
        selectedWhyFinding,
        isSupabaseOnline,
        supabaseMessage,

        setActivePatientId,
        setCurrentRole,
        setActiveTab,
        setActiveFilterTime,
        setActiveFilterType,
        setEvidenceHighlightIds,
        setIsAddEventModalOpen,
        setIsShareModalOpen,
        openWhyModal,
        closeWhyModal,
        addEvent,
        deleteEvent,
        toggleMedicationDose,
        addMedication,
        uploadReport,
        addVital,
        startDemoStory,
        setDemoScene,
        stepDemoScene,
        resetDemoData,
        refreshHandoverSummary,
        recheckSupabase,
      }}
    >
      {children}
    </CareChainContext.Provider>
  );
};

export const useCareChain = () => {
  const context = useContext(CareChainContext);
  if (!context) {
    throw new Error('useCareChain must be used within a CareChainProvider');
  }
  return context;
};
