import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  MedicationScheduleItem,
  User,
  DemoAccount,
  CarePlanItem,
  ClinicalOrder,
  CareTask,
  CaregiverEscalation,
  EmsCase,
  Appointment,
  RolePermissions,
  ProfileLoadingState
} from '../types';
import {
  DEMO_PATIENTS,
  DEMO_EVENTS,
  DEMO_MEDICATIONS,
  DEMO_REPORTS,
  DEMO_VITALS,
  DEMO_AUDIT_LOGS,
  DEMO_HANDOVER_SUMMARY,
  DEMO_CARE_PLANS,
  DEMO_CLINICAL_ORDERS,
  DEMO_CARE_TASKS,
  DEMO_CAREGIVER_ESCALATIONS,
  DEMO_EMS_CASE,
  DEMO_APPOINTMENTS,
  DEMO_PERSONAS
} from '../data/demoData';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { api } from '../lib/api';
import {
  AI_OVERVIEW_LOADING_TEXT,
  AI_OVERVIEW_UNAVAILABLE_TEXT,
  overviewPlaceholder,
  overviewToHandoverSummary,
} from '../lib/aiOverview';

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'doctor':
      return {
        canSwitchPatient: true,
        canEditDiagnosis: true,
        canIssueClinicalOrders: true,
        canCreateCarePlan: true,
        canExportEHR: true,
        canRecordObservations: true,
        canManageCareTasks: true,
        canEscalateConcern: false,
        canLogEmergencyInterventions: true,
        canTransmitHospitalHandover: true,
        canLogPatientCheckin: false,
        canViewInternalClinicalNotes: true,
        canAccessSharingAudit: true,
      };
    case 'family':
      return {
        canSwitchPatient: false,
        canEditDiagnosis: false,
        canIssueClinicalOrders: false,
        canCreateCarePlan: false,
        canExportEHR: false,
        canRecordObservations: true,
        canManageCareTasks: true,
        canEscalateConcern: true,
        canLogEmergencyInterventions: false,
        canTransmitHospitalHandover: false,
        canLogPatientCheckin: false,
        canViewInternalClinicalNotes: false,
        canAccessSharingAudit: false,
      };
    case 'patient':
      return {
        canSwitchPatient: false,
        canEditDiagnosis: false,
        canIssueClinicalOrders: false,
        canCreateCarePlan: false,
        canExportEHR: false,
        canRecordObservations: false,
        canManageCareTasks: false,
        canEscalateConcern: false,
        canLogEmergencyInterventions: false,
        canTransmitHospitalHandover: false,
        canLogPatientCheckin: true,
        canViewInternalClinicalNotes: false,
        canAccessSharingAudit: false,
      };
    case 'ems':
      return {
        canSwitchPatient: false,
        canEditDiagnosis: false,
        canIssueClinicalOrders: false,
        canCreateCarePlan: false,
        canExportEHR: false,
        canRecordObservations: true,
        canManageCareTasks: false,
        canEscalateConcern: false,
        canLogEmergencyInterventions: true,
        canTransmitHospitalHandover: true,
        canLogPatientCheckin: false,
        canViewInternalClinicalNotes: false,
        canAccessSharingAudit: false,
      };
    default:
      return {
        canSwitchPatient: true,
        canEditDiagnosis: true,
        canIssueClinicalOrders: true,
        canCreateCarePlan: true,
        canExportEHR: true,
        canRecordObservations: true,
        canManageCareTasks: true,
        canEscalateConcern: true,
        canLogEmergencyInterventions: true,
        canTransmitHospitalHandover: true,
        canLogPatientCheckin: true,
        canViewInternalClinicalNotes: true,
        canAccessSharingAudit: true,
      };
  }
}

interface CareChainContextType {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  demoAccounts: DemoAccount[];
  isBackendOnline: boolean;
  backendMessage: string;
  isSupabaseOnline: boolean;
  supabaseMessage: string;

  // Explicit Demo vs Normal Mode
  isDemoMode: boolean;
  enterDemoMode: (role?: UserRole) => void;
  exitDemoMode: () => void;
  profileState: ProfileLoadingState;
  isLoadingData: boolean;
  dataError: string | null;
  retryLoadData: () => Promise<void>;

  // Clinical data state
  activePatient: Patient | null;
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
  demoScene: number;
  isDemoPlaying: boolean;
  isAddEventModalOpen: boolean;
  isShareModalOpen: boolean;
  isWhyModalOpen: boolean;
  selectedWhyFinding: HandoverSummary['keyFindings'][0] | null;

  // Role workflow models & permissions
  carePlans: CarePlanItem[];
  clinicalOrders: ClinicalOrder[];
  careTasks: CareTask[];
  caregiverEscalations: CaregiverEscalation[];
  emsCase: EmsCase | null;
  appointments: Appointment[];
  permissions: RolePermissions;

  // Actions
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  recheckBackend: () => Promise<void>;

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

  // Role-specific actions
  updateDiagnosis: (patientId: string, conditions: string[]) => Promise<void>;
  addClinicalOrder: (order: Partial<ClinicalOrder>) => Promise<void>;
  addCarePlanItem: (item: Partial<CarePlanItem>) => Promise<void>;
  toggleCareTask: (taskId: string, status: CareTask['status'], notes?: string) => Promise<void>;
  addCareTask: (task: Partial<CareTask>) => Promise<void>;
  addCaregiverObservation: (obs: { title: string; description: string; temp?: number; severity?: any }) => Promise<void>;
  addCaregiverEscalation: (esc: Partial<CaregiverEscalation>) => Promise<void>;
  respondToEscalation: (id: string, response: string) => Promise<void>;
  logEmsVitals: (vitals: Partial<VitalRecord>) => Promise<void>;
  logEmsIntervention: (name: string, notes?: string) => Promise<void>;
  completeEmsHandover: (mist?: any) => Promise<void>;
  logPatientCheckin: (feeling: 'better' | 'same' | 'worse', note?: string) => Promise<void>;
}

const CareChainContext = createContext<CareChainContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'carechain_state_v1';

const EMPTY_HANDOVER_SUMMARY: HandoverSummary = {
  headline: 'Clinical Handover',
  coreNarrative: 'No clinical events recorded for this patient.',
  timespan: 'Last 72 Hours',
  totalEventsAnalyzed: 0,
  supportingEvidenceCount: {
    events: 0,
    historyDays: 0,
    medications: 0,
    vitals: 0,
    reports: 0
  },
  keyFindings: [],
  latestVitals: {
    temperature: '--',
    bp: '--/--',
    pulse: '--',
    spo2: '--%'
  },
  activeMedications: [],
  allergies: [],
  recommendedDoctorQuestions: [],
  safetyDistinctions: {
    recordedFacts: [],
    patientReportedSymptoms: [],
    aiInterpretations: []
  }
};

export const CareChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ─── EXPLICIT MODE STATE ──────────────────────────────────────────────────
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem('carechain_demo_mode') === 'true';
  });
  const [demoRole, setDemoRole] = useState<UserRole>(() => {
    return (sessionStorage.getItem('carechain_demo_role') as UserRole) || 'doctor';
  });

  // ─── AUTH & PROFILE STATE MACHINE ─────────────────────────────────────────
  const [realUser, setRealUser] = useState<User | null>(null);
  const [profileState, setProfileState] = useState<ProfileLoadingState>(() => {
    const isDemo = sessionStorage.getItem('carechain_demo_mode') === 'true';
    return isDemo ? 'ready' : 'authLoading';
  });
  const [dataError, setDataError] = useState<string | null>(null);

  // Synchronization and request-tracking refs (prevents infinite fetch loops & stale overwrites)
  const activeSessionUidRef = useRef<string | null>(null);
  const activeRequestIdRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);
  // Doctor AI overview bookkeeping: which record state was last requested, and the latest request id.
  const aiOverviewKeyRef = useRef<string | null>(null);
  const aiOverviewRequestRef = useRef<number>(0);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [backendMessage, setBackendMessage] = useState('Checking backend API...');
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);
  const [supabaseMessage, setSupabaseMessage] = useState('Checking Supabase connection...');

  // ─── REAL MODE CLINICAL STATE (NORMAL MODE) ──────────────────────────────
  const [realPatients, setRealPatients] = useState<Patient[]>([]);
  const [realActivePatientId, setRealActivePatientId] = useState<string>('');
  const [realEvents, setRealEvents] = useState<HealthEvent[]>([]);
  const [realMedications, setRealMedications] = useState<Medication[]>([]);
  const [realReports, setRealReports] = useState<MedicalReport[]>([]);
  const [realVitals, setRealVitals] = useState<VitalRecord[]>([]);
  const [realAuditLogs, setRealAuditLogs] = useState<AuditLogItem[]>([]);
  const [realCarePlans, setRealCarePlans] = useState<CarePlanItem[]>([]);
  const [realClinicalOrders, setRealClinicalOrders] = useState<ClinicalOrder[]>([]);
  const [realCareTasks, setRealCareTasks] = useState<CareTask[]>([]);
  const [realCaregiverEscalations, setRealCaregiverEscalations] = useState<CaregiverEscalation[]>([]);
  const [realEmsCase, setRealEmsCase] = useState<EmsCase | null>(null);
  const [realAppointments, setRealAppointments] = useState<Appointment[]>([]);
  const [realHandoverSummary, setRealHandoverSummary] = useState<HandoverSummary>(EMPTY_HANDOVER_SUMMARY);

  const clearRealClinicalState = useCallback(() => {
    aiOverviewKeyRef.current = null;
    aiOverviewRequestRef.current++;
    setRealPatients([]);
    setRealActivePatientId('');
    setRealEvents([]);
    setRealMedications([]);
    setRealReports([]);
    setRealVitals([]);
    setRealAuditLogs([]);
    setRealCarePlans([]);
    setRealClinicalOrders([]);
    setRealCareTasks([]);
    setRealCaregiverEscalations([]);
    setRealEmsCase(null);
    setRealAppointments([]);
    setRealHandoverSummary(EMPTY_HANDOVER_SUMMARY);
  }, []);

  // ─── DEMO MODE SANDBOXED STATE ────────────────────────────────────────────
  const [demoPatients, setDemoPatients] = useState<Patient[]>(() => DEMO_PATIENTS);
  const [demoActivePatientId, setDemoActivePatientId] = useState<string>(() => DEMO_PATIENTS[0].id);
  const [demoEvents, setDemoEvents] = useState<HealthEvent[]>(() => DEMO_EVENTS);
  const [demoMedications, setDemoMedications] = useState<Medication[]>(() => DEMO_MEDICATIONS);
  const [demoReports, setDemoReports] = useState<MedicalReport[]>(() => DEMO_REPORTS);
  const [demoVitals, setDemoVitals] = useState<VitalRecord[]>(() => DEMO_VITALS);
  const [demoAuditLogs, setDemoAuditLogs] = useState<AuditLogItem[]>(() => DEMO_AUDIT_LOGS);
  const [demoCarePlans, setDemoCarePlans] = useState<CarePlanItem[]>(() => DEMO_CARE_PLANS);
  const [demoClinicalOrders, setDemoClinicalOrders] = useState<ClinicalOrder[]>(() => DEMO_CLINICAL_ORDERS);
  const [demoCareTasks, setDemoCareTasks] = useState<CareTask[]>(() => DEMO_CARE_TASKS);
  const [demoCaregiverEscalations, setDemoCaregiverEscalations] = useState<CaregiverEscalation[]>(() => DEMO_CAREGIVER_ESCALATIONS);
  const [demoEmsCase, setDemoEmsCase] = useState<EmsCase | null>(() => DEMO_EMS_CASE);
  const [demoAppointments, setDemoAppointments] = useState<Appointment[]>(() => DEMO_APPOINTMENTS);
  const [demoHandoverSummary, setDemoHandoverSummary] = useState<HandoverSummary>(() => DEMO_HANDOVER_SUMMARY);

  // ─── ACTIVE VIEW & TABS ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AppTab>('doctor-dashboard');
  const [activeFilterTime, setActiveFilterTime] = useState<'24h' | '72h' | '7d' | '30d' | 'all'>('72h');
  const [activeFilterType, setActiveFilterType] = useState<'all' | EventType>('all');
  const [evidenceHighlightIds, setEvidenceHighlightIds] = useState<string[]>([]);

  // Interactive Demo Story State
  const [demoScene, setDemoScene] = useState<number>(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState<boolean>(false);
  const [selectedWhyFinding, setSelectedWhyFinding] = useState<HandoverSummary['keyFindings'][0] | null>(null);

  // ─── RESOLVED UNIFIED STATE BASED ON ACTIVE MODE ──────────────────────────
  const resolvedDemoPersona = (demoRole in DEMO_PERSONAS ? DEMO_PERSONAS[demoRole as keyof typeof DEMO_PERSONAS] : DEMO_PERSONAS.doctor);
  const user: User | null = isDemoMode
    ? {
        id: `demo-usr-${demoRole}`,
        email: resolvedDemoPersona.email,
        fullName: resolvedDemoPersona.fullName,
        role: demoRole,
        title: resolvedDemoPersona.title,
        avatar: resolvedDemoPersona.avatar,
        authProvider: 'password'
      }
    : realUser;

  const currentRole: UserRole = isDemoMode
    ? demoRole
    : (realUser ? realUser.role : 'doctor');

  const patients = isDemoMode ? demoPatients : realPatients;

  const activePatientId = isDemoMode ? demoActivePatientId : realActivePatientId;

  const activePatient: Patient | null = isDemoMode
    ? (demoPatients.find(p => p.id === demoActivePatientId) || demoPatients[0] || null)
    : (realPatients.find(p => p.id === realActivePatientId) || realPatients[0] || null);

  const events = isDemoMode ? demoEvents : realEvents;
  const medications = isDemoMode ? demoMedications : realMedications;
  const reports = isDemoMode ? demoReports : realReports;
  const vitals = isDemoMode ? demoVitals : realVitals;
  const auditLogs = isDemoMode ? demoAuditLogs : realAuditLogs;
  const carePlans = isDemoMode ? demoCarePlans : realCarePlans;
  const clinicalOrders = isDemoMode ? demoClinicalOrders : realClinicalOrders;
  const careTasks = isDemoMode ? demoCareTasks : realCareTasks;
  const caregiverEscalations = isDemoMode ? demoCaregiverEscalations : realCaregiverEscalations;
  const emsCase = isDemoMode ? demoEmsCase : realEmsCase;
  const appointments = isDemoMode ? demoAppointments : realAppointments;
  const handoverSummary = isDemoMode ? demoHandoverSummary : realHandoverSummary;

  const permissions = getRolePermissions(currentRole);

  const isLoadingData = !isDemoMode && (
    profileState === 'authLoading' ||
    profileState === 'profileLoading' ||
    profileState === 'patientProfileLoading'
  );

  // ─── AUTHORIZED PATIENT & CLINICAL DATA LOADER ─────────────────────────────
  const fetchPatientData = useCallback(async (targetUser: User, requestId: number) => {
    setProfileState('patientProfileLoading');
    setDataError(null);

    try {
      const remotePatients = await api.patients.getAll();
      if (activeRequestIdRef.current !== requestId) return;

      if (remotePatients && remotePatients.length > 0) {
        setRealPatients(remotePatients);
        const firstId = remotePatients[0].id;
        setRealActivePatientId(firstId);

        // Fetch patient-specific clinical records in parallel
        const [evts, meds, vts, reps, logs, cps, ords] = await Promise.all([
          api.events.getAll(firstId),
          api.medications.getAll(firstId),
          api.vitals.getAll(firstId),
          api.reports.getAll(firstId),
          api.audit.getAll(firstId),
          api.patients.getCarePlans(firstId),
          api.patients.getClinicalOrders(firstId)
        ]);
        if (activeRequestIdRef.current !== requestId) return;

        setRealEvents(evts || []);
        setRealMedications(meds || []);
        setRealVitals(vts || []);
        setRealReports(reps || []);
        setRealAuditLogs(logs || []);
        setRealCarePlans(cps || []);
        setRealClinicalOrders(ords || []);
        setProfileState('ready');
      } else {
        // Zero patients returned from backend
        setRealPatients([]);
        setRealActivePatientId('');
        setRealEvents([]);
        setRealMedications([]);
        setRealVitals([]);
        setRealReports([]);
        setRealAuditLogs([]);
        setRealCarePlans([]);
        setRealClinicalOrders([]);

        if (targetUser.role === 'patient') {
          // Genuine patient account with no assigned patient chart yet
          setProfileState('unconfigured');
        } else {
          // Doctor, Caregiver, or EMS with 0 queue assignments
          setProfileState('ready');
        }
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== requestId) return;
      setDataError(err?.message || 'Unable to connect to clinical database.');
      setProfileState('error');
    }
  }, []);

  // ─── OAUTH SESSION RESOLUTION (IDEMPOTENT & ISOLATED) ─────────────────────
  const syncAndLoadSupabaseSession = useCallback(async (session: any, forceRefresh = false) => {
    if (!session?.user) {
      activeSessionUidRef.current = null;
      setRealUser(null);
      clearRealClinicalState();
      setProfileState('ready');
      return;
    }

    const sbUser = session.user;
    const email = sbUser.email || '';
    if (!email) return;

    // Avoid redundant OAuth sync loops for the already loaded session
    if (!forceRefresh && activeSessionUidRef.current === sbUser.id && realUser) {
      return;
    }

    if (isSyncingRef.current && !forceRefresh) {
      return;
    }

    // Detect Account Switching: immediately wipe previous account's cached state
    if (activeSessionUidRef.current && activeSessionUidRef.current !== sbUser.id) {
      setRealUser(null);
      clearRealClinicalState();
    }

    activeSessionUidRef.current = sbUser.id;
    const requestId = ++activeRequestIdRef.current;
    isSyncingRef.current = true;
    setProfileState('profileLoading');
    setDataError(null);

    const rawFullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
    const avatar = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture;

    let intent: { mode?: 'login' | 'register'; role?: UserRole; fullName?: string } = {};
    try {
      const rawIntent = sessionStorage.getItem('carechain_oauth_intent');
      if (rawIntent) {
        intent = JSON.parse(rawIntent);
        sessionStorage.removeItem('carechain_oauth_intent');
      }
    } catch {}

    try {
      const syncRes = await api.auth.oauthSync({
        email,
        fullName: intent.fullName || rawFullName,
        avatar,
        requestedRole: intent.role,
        supabaseUid: sbUser.id
      });

      if (activeRequestIdRef.current !== requestId) {
        isSyncingRef.current = false;
        return;
      }

      if (syncRes.success && syncRes.user) {
        const resolvedUser = syncRes.user;
        setRealUser(resolvedUser);
        setIsDemoMode(false);
        sessionStorage.removeItem('carechain_demo_mode');
        setIsAuthModalOpen(false);

        // Clean OAuth token from URL hash if present
        if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        isSyncingRef.current = false;
        // Proceed to load authorized patient records for this verified identity
        await fetchPatientData(resolvedUser, requestId);
      } else {
        isSyncingRef.current = false;
        setDataError(syncRes.error || 'Failed to synchronize OAuth session with clinical database.');
        setProfileState('error');
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== requestId) {
        isSyncingRef.current = false;
        return;
      }
      isSyncingRef.current = false;
      setDataError(err?.message || 'Failed to synchronize OAuth session with clinical database.');
      setProfileState('error');
    }
  }, [clearRealClinicalState, fetchPatientData, realUser]);

  // ─── LOCAL JWT TOKEN SESSION LOADER ───────────────────────────────────────
  const loadLocalTokenSession = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      activeSessionUidRef.current = null;
      setRealUser(null);
      clearRealClinicalState();
      setProfileState('ready');
      return;
    }

    const requestId = ++activeRequestIdRef.current;
    setProfileState('profileLoading');
    setDataError(null);

    try {
      const meRes = await api.auth.me();
      if (activeRequestIdRef.current !== requestId) return;

      if (meRes.success && meRes.user) {
        const resolvedUser = meRes.user;
        activeSessionUidRef.current = resolvedUser.supabaseUid || resolvedUser.id;
        setRealUser(resolvedUser);
        await fetchPatientData(resolvedUser, requestId);
      } else {
        api.setToken(null);
        activeSessionUidRef.current = null;
        setRealUser(null);
        clearRealClinicalState();
        setProfileState('ready');
      }
    } catch (err: any) {
      if (activeRequestIdRef.current !== requestId) return;
      setDataError(err?.message || 'Failed to verify session.');
      setProfileState('error');
    }
  }, [clearRealClinicalState, fetchPatientData]);

  // ─── APPLICATION LIFECYCLE (MOUNT ONCE) ──────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    // 1. Check existing Supabase session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        syncAndLoadSupabaseSession(session);
      } else {
        loadLocalTokenSession();
      }
    });

    // 2. Stable listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        activeSessionUidRef.current = null;
        setRealUser(null);
        clearRealClinicalState();
        setProfileState('ready');
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        syncAndLoadSupabaseSession(session);
      }
    });

    // 3. Health & demo accounts check
    api.checkHealth().then(health => {
      if (!isMounted) return;
      setIsBackendOnline(health.online);
      setBackendMessage(health.online ? 'CareChain Live Backend Online' : 'Backend offline');
    }).catch(() => {
      if (!isMounted) return;
      setIsBackendOnline(false);
      setBackendMessage('Backend offline');
    });

    api.auth.getDemoAccounts().then(accounts => {
      if (!isMounted) return;
      if (accounts.length > 0) setDemoAccounts(accounts);
    }).catch(() => {});

    checkSupabaseConnection().then(res => {
      if (!isMounted) return;
      setIsSupabaseOnline(res.connected);
      setSupabaseMessage(res.message);
    }).catch(() => {});

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Synchronize active tab whenever currentRole or user changes
  useEffect(() => {
    if (isDemoMode) {
      if (demoRole === 'doctor') setActiveTab('doctor-dashboard');
      else if (demoRole === 'family') setActiveTab('caregiver-dashboard');
      else if (demoRole === 'patient') setActiveTab('patient-dashboard');
      else if (demoRole === 'ems') setActiveTab('ems-dashboard');
    } else if (realUser) {
      if (realUser.role === 'doctor') setActiveTab('doctor-dashboard');
      else if (realUser.role === 'family') setActiveTab('caregiver-dashboard');
      else if (realUser.role === 'patient') setActiveTab('patient-dashboard');
      else if (realUser.role === 'ems') setActiveTab('ems-dashboard');
    }
  }, [isDemoMode, demoRole, realUser]);

  // ─── DEMO MODE ENTRY & EXIT LIFECYCLE ─────────────────────────────────────
  const enterDemoMode = useCallback((role: UserRole = 'doctor') => {
    setIsDemoMode(true);
    setDemoRole(role);
    sessionStorage.setItem('carechain_demo_mode', 'true');
    sessionStorage.setItem('carechain_demo_role', role);
    setDemoActivePatientId(DEMO_PATIENTS[0].id);
    setProfileState('ready');

    if (role === 'doctor') setActiveTab('doctor-dashboard');
    else if (role === 'family') setActiveTab('caregiver-dashboard');
    else if (role === 'patient') setActiveTab('patient-dashboard');
    else if (role === 'ems') setActiveTab('ems-dashboard');
  }, []);

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    sessionStorage.removeItem('carechain_demo_mode');
    sessionStorage.removeItem('carechain_demo_role');
    setDemoScene(0);
    setIsDemoPlaying(false);

    if (realUser) {
      const requestId = ++activeRequestIdRef.current;
      fetchPatientData(realUser, requestId);
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          syncAndLoadSupabaseSession(session);
        } else {
          loadLocalTokenSession();
        }
      });
    }
  }, [realUser, fetchPatientData, syncAndLoadSupabaseSession, loadLocalTokenSession]);

  const retryLoadData = useCallback(async () => {
    if (isDemoMode) return;
    if (realUser) {
      const requestId = ++activeRequestIdRef.current;
      await fetchPatientData(realUser, requestId);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await syncAndLoadSupabaseSession(session, true);
      } else {
        await loadLocalTokenSession();
      }
    }
  }, [isDemoMode, realUser, fetchPatientData, syncAndLoadSupabaseSession, loadLocalTokenSession]);

  const recheckBackend = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      setIsBackendOnline(health.online);
      setBackendMessage(health.online ? 'CareChain Live Backend Online' : 'Backend offline');
      const accounts = await api.auth.getDemoAccounts();
      if (accounts.length > 0) setDemoAccounts(accounts);
    } catch {
      setIsBackendOnline(false);
      setBackendMessage('Backend connection error');
    }
  }, []);

  const recheckSupabase = useCallback(async () => {
    const res = await checkSupabaseConnection();
    setIsSupabaseOnline(res.connected);
    setSupabaseMessage(res.message);
  }, []);

  // Role switching
  const setCurrentRole = useCallback((role: UserRole) => {
    if (isDemoMode) {
      setDemoRole(role);
      sessionStorage.setItem('carechain_demo_role', role);
      if (role === 'doctor') {
        setActiveTab('doctor-dashboard');
      } else if (role === 'family') {
        setActiveTab('caregiver-dashboard');
        setDemoActivePatientId(DEMO_PATIENTS[0].id);
      } else if (role === 'patient') {
        setActiveTab('patient-dashboard');
        setDemoActivePatientId(DEMO_PATIENTS[0].id);
      } else if (role === 'ems') {
        setActiveTab('ems-dashboard');
        setDemoActivePatientId(DEMO_PATIENTS[0].id);
      }
    } else {
      // In Real mode, only allowed if user has that authorized role or is admin
      if (realUser && (realUser.role === role || realUser.role === 'admin')) {
        if (role === 'doctor') setActiveTab('doctor-dashboard');
        else if (role === 'family') setActiveTab('caregiver-dashboard');
        else if (role === 'patient') setActiveTab('patient-dashboard');
        else if (role === 'ems') setActiveTab('ems-dashboard');
      }
    }
  }, [isDemoMode, realUser]);

  // Set active patient
  const setActivePatientId = useCallback(async (id: string) => {
    if (isDemoMode) {
      setDemoActivePatientId(id);
    } else {
      setRealActivePatientId(id);
      try {
        const [evts, meds, vts, reps, logs, cps, ords] = await Promise.all([
          api.events.getAll(id),
          api.medications.getAll(id),
          api.vitals.getAll(id),
          api.reports.getAll(id),
          api.audit.getAll(id),
          api.patients.getCarePlans(id),
          api.patients.getClinicalOrders(id)
        ]);
        setRealEvents(evts || []);
        setRealMedications(meds || []);
        setRealVitals(vts || []);
        setRealReports(reps || []);
        setRealAuditLogs(logs || []);
        setRealCarePlans(cps || []);
        setRealClinicalOrders(ords || []);
      } catch (err) {
        console.warn('Failed to load patient records for', id, err);
      }
    }
  }, [isDemoMode]);

  // ─── AUTHENTICATION ACTIONS ──────────────────────────────────────────────
  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithGoogle = async () => {
    try {
      const redirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Google authentication failed' };
    }
  };

  const login = async (email: string, pass: string) => {
    setProfileState('profileLoading');
    setDataError(null);
    const res = await api.auth.login(email, pass);
    if (res.success && res.user) {
      setRealUser(res.user);
      activeSessionUidRef.current = res.user.id;
      setIsDemoMode(false);
      sessionStorage.removeItem('carechain_demo_mode');
      const requestId = ++activeRequestIdRef.current;
      await fetchPatientData(res.user, requestId);
      return { success: true, user: res.user };
    }
    setProfileState('ready');
    return { success: false, error: res.error || 'Authentication failed' };
  };

  const register = async (userData: any) => {
    setProfileState('profileLoading');
    setDataError(null);
    const res = await api.auth.register(userData);
    if (res.success && res.user) {
      setRealUser(res.user);
      activeSessionUidRef.current = res.user.id;
      setIsDemoMode(false);
      sessionStorage.removeItem('carechain_demo_mode');
      const requestId = ++activeRequestIdRef.current;
      await fetchPatientData(res.user, requestId);
      return { success: true, user: res.user };
    }
    setProfileState('ready');
    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signout notice', e);
    }
    await api.auth.logout();

    // Cancel all in-flight requests and clear session ref
    activeRequestIdRef.current++;
    activeSessionUidRef.current = null;
    isSyncingRef.current = false;

    // Completely wipe all account state
    setRealUser(null);
    clearRealClinicalState();
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_role`);
    sessionStorage.removeItem('carechain_demo_mode');
    setIsDemoMode(false);
    setProfileState('ready');
    setActiveTab('doctor-dashboard');
  };

  // ─── HANDOVER RECALCULATION ──────────────────────────────────────────────
  const refreshHandoverSummary = useCallback(async () => {
    if (!activePatient) {
      if (isDemoMode) setDemoHandoverSummary(EMPTY_HANDOVER_SUMMARY);
      else setRealHandoverSummary(EMPTY_HANDOVER_SUMMARY);
      return;
    }

    // Doctors get the AI overview (see effect below); the legacy server summary is template text, so it is not used for them.
    if (!isDemoMode && isBackendOnline && currentRole !== 'doctor') {
      const summary = await api.handover.getSummary(activePatient.id, activeFilterTime);
      if (summary) {
        setRealHandoverSummary(summary);
        return;
      }
    }

    const patientEvents = events.filter(e => e.patientId === activePatient.id);
    const tempEvents = patientEvents.filter(e => e.type === 'vital' && e.metadata?.temperature);
    const latestTemp = tempEvents.length > 0 ? `${tempEvents[tempEvents.length - 1].metadata?.temperature}°F` : '--';
    const missedMeds = patientEvents.filter(e => e.type === 'medication' && e.metadata?.takenStatus === 'missed');
    const symptomEvents = patientEvents.filter(e => e.type === 'symptom');

    const updatedSummary: HandoverSummary = {
      headline: `Clinical Handover: ${activePatient.fullName}`,
      coreNarrative: patientEvents.length > 0
        ? `Patient trajectory analyzed across ${patientEvents.length} events. Latest temperature recorded: ${latestTemp}. ${missedMeds.length} missed doses identified.`
        : 'No acute events logged in the selected window.',
      timespan: activeFilterTime === '24h' ? 'Last 24 Hours' : activeFilterTime === '72h' ? 'Last 72 Hours' : 'Full Timeline',
      totalEventsAnalyzed: patientEvents.length,
      supportingEvidenceCount: {
        events: patientEvents.length,
        historyDays: 3,
        medications: patientEvents.filter(e => e.type === 'medication').length,
        vitals: patientEvents.filter(e => e.type === 'vital').length,
        reports: patientEvents.filter(e => e.type === 'report').length,
      },
      keyFindings: [],
      latestVitals: {
        temperature: latestTemp,
        bp: '--/--',
        pulse: '--',
        spo2: '--%'
      },
      activeMedications: [],
      allergies: activePatient.allergies,
      recommendedDoctorQuestions: [],
      safetyDistinctions: {
        recordedFacts: [],
        patientReportedSymptoms: symptomEvents.map(s => s.title),
        aiInterpretations: []
      }
    };

    if (isDemoMode) {
      setDemoHandoverSummary({
        ...DEMO_HANDOVER_SUMMARY,
        timespan: activeFilterTime === '24h' ? 'Last 24 Hours' : activeFilterTime === '72h' ? 'Last 72 Hours' : 'Full Timeline',
      });
    } else {
      aiOverviewKeyRef.current = null; // the local baseline replaced any AI overview; allow a fresh one
      setRealHandoverSummary(updatedSummary);
    }
  }, [activePatient, isDemoMode, isBackendOnline, activeFilterTime, events, currentRole]);

  // ─── AI PATIENT OVERVIEW (REAL MODE, DOCTOR ONLY) ─────────────────────────
  // Gemini + ChromaDB run on the server. This only asks for an overview when a screen that shows it
  // is open, and only when the patient's records have changed since the last request.
  useEffect(() => {
    if (isDemoMode || currentRole !== 'doctor' || !isBackendOnline || !activePatient || isLoadingData) return;
    if (!['handover', 'doctor', 'doctor-assessment', 'emergency'].includes(activeTab)) return;

    const patient = activePatient;
    // While a patient switch is loading, `events` still belongs to the previous patient: wait for the new records.
    if (events.some(e => e.patientId !== patient.id)) return;

    const latestEvent = events.reduce((max, e) => (e.timestamp > max ? e.timestamp : max), '');
    const key = [patient.id, events.length, latestEvent, medications.length, vitals.length, reports.length].join('|');
    if (aiOverviewKeyRef.current === key) return;

    // Debounced so several quick state changes (patient switch + records arriving) become one request.
    const timer = setTimeout(() => {
      aiOverviewKeyRef.current = key;
      const requestId = ++aiOverviewRequestRef.current;
      const ctx = { events, medications, vitals, reports };
      setRealHandoverSummary(overviewPlaceholder(AI_OVERVIEW_LOADING_TEXT, patient, ctx));

      api.ai.patientOverview(patient.id).then(res => {
        if (aiOverviewRequestRef.current !== requestId) return; // superseded by a newer request or a sign-out
        if (res.success && res.data) {
          setRealHandoverSummary(overviewToHandoverSummary(res.data, { patient, ...ctx }));
        } else {
          aiOverviewKeyRef.current = null; // let the next visit retry
          setRealHandoverSummary(overviewPlaceholder(AI_OVERVIEW_UNAVAILABLE_TEXT, patient, ctx));
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [isDemoMode, currentRole, isBackendOnline, activePatient, isLoadingData, activeTab, events, medications, vitals, reports]);

  const openWhyModal = (finding: HandoverSummary['keyFindings'][0]) => {
    setSelectedWhyFinding(finding);
    setEvidenceHighlightIds(finding.evidenceEventIds);
    setIsWhyModalOpen(true);
  };

  const closeWhyModal = () => {
    setIsWhyModalOpen(false);
  };

  // ─── CLINICAL MUTATIONS (ISOLATED) ────────────────────────────────────────
  const addEvent = async (eventData: Partial<HealthEvent>) => {
    const targetPatientId =
      eventData.patientId ||
      activePatient?.id ||
      (user?.role === 'patient' ? user.patientId : undefined) ||
      patients[0]?.id ||
      '';

    if (!targetPatientId) {
      console.warn('[MedicalEvent] No target patient available for health event');
      throw new Error('Please select or configure a patient chart before adding an event.');
    }

    const creatorName = user?.fullName || (currentRole === 'doctor' ? 'Dr. Sharma' : currentRole === 'family' ? 'Caregiver' : 'Patient');
    const eventSource = currentRole === 'doctor' ? 'Clinician' : currentRole === 'family' ? 'Family / Caregiver' : 'Patient';

    const newEvent: HealthEvent = {
      id: `evt-${Date.now()}`,
      patientId: targetPatientId,
      type: eventData.type || 'symptom',
      timestamp: eventData.timestamp || new Date().toISOString(),
      severity: eventData.severity || 'mild',
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      source: eventData.source || eventSource,
      createdBy: eventData.createdBy || creatorName,
      metadata: eventData.metadata || {},
      attachments: eventData.attachments || [],
      verified: eventData.verified || (currentRole === 'doctor')
    };

    if (isDemoMode) {
      setDemoEvents(prev => [newEvent, ...prev]);
    } else {
      setRealEvents(prev => [newEvent, ...prev]);
      if (isBackendOnline) {
        try {
          const savedEvent = await api.events.create(newEvent);
          if (savedEvent) {
            setRealEvents(prev => [savedEvent, ...prev.filter(e => e.id !== newEvent.id && e.id !== savedEvent.id)]);
          }
        } catch (err) {
          console.error('[MedicalEvent] Backend sync failed for event', err);
          setRealEvents(prev => prev.filter(e => e.id !== newEvent.id));
          throw err;
        }
      }
    }

    refreshHandoverSummary();
  };

  const deleteEvent = async (id: string) => {
    if (isDemoMode) {
      setDemoEvents(prev => prev.filter(e => e.id !== id));
    } else {
      setRealEvents(prev => prev.filter(e => e.id !== id));
      if (isBackendOnline) {
        try {
          await api.events.delete(id);
        } catch (e) {
          console.warn('Backend delete error', e);
        }
      }
    }
    refreshHandoverSummary();
  };

  const toggleMedicationDose = async (
    medId: string,
    timeIdx: number,
    newStatus: MedicationScheduleItem['status'],
    reason?: string
  ) => {
    const updateFn = (list: Medication[]) =>
      list.map(m => {
        if (m.id !== medId) return m;
        const updatedTimes = [...m.scheduleTimes];
        if (updatedTimes[timeIdx]) {
          updatedTimes[timeIdx] = { ...updatedTimes[timeIdx], status: newStatus };
        }
        return { ...m, scheduleTimes: updatedTimes };
      });

    if (isDemoMode) {
      setDemoMedications(updateFn);
    } else {
      setRealMedications(updateFn);
      if (isBackendOnline) {
        try {
          await api.medications.toggleDose(medId, timeIdx, newStatus, reason);
        } catch (e) {
          console.warn('Backend medication toggle error', e);
        }
      }
    }

    const med = medications.find(m => m.id === medId);
    if (med) {
      const scheduleTime = med.scheduleTimes[timeIdx]?.time || 'Scheduled dose';
      await addEvent({
        patientId: med.patientId,
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

  const addMedication = async (medData: Partial<Medication>) => {
    if (!activePatient && !medData.patientId) return;
    const targetPatientId = medData.patientId || activePatient?.id || '';

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      patientId: targetPatientId,
      name: medData.name || 'New Medication',
      dose: medData.dose || '1 tablet',
      frequency: medData.frequency || 'Once daily',
      scheduleTimes: medData.scheduleTimes || [{ time: '08:00 AM', status: 'pending' }],
      status: 'active',
      notes: medData.notes
    };

    if (isDemoMode) {
      setDemoMedications(prev => [...prev, newMed]);
    } else {
      setRealMedications(prev => [...prev, newMed]);
      if (isBackendOnline) {
        try {
          await api.medications.create(newMed);
        } catch (e) {
          console.warn('Backend medication create error', e);
        }
      }
    }
  };

  const uploadReport = async (repData: Partial<MedicalReport>) => {
    if (!activePatient && !repData.patientId) return;
    const targetPatientId = repData.patientId || activePatient?.id || '';

    const newRep: MedicalReport = {
      id: `rep-${Date.now()}`,
      patientId: targetPatientId,
      title: repData.title || 'Diagnostic Report',
      reportType: repData.reportType || 'Lab Report' as any,
      fileName: repData.fileName || 'report.pdf',
      extractedData: repData.extractedData || { 'Status': 'Normal', 'Analysis': 'Auto-extracted' },
      summary: repData.summary || 'AI extracted clinical summary ready for doctor review.',
      uploadedAt: 'Today · Just now',
      aiVerified: true
    };

    if (isDemoMode) {
      setDemoReports(prev => [newRep, ...prev]);
    } else {
      setRealReports(prev => [newRep, ...prev]);
      if (isBackendOnline) {
        try {
          await api.reports.create(newRep);
        } catch (e) {
          console.warn('Backend report create error', e);
        }
      }
    }

    await addEvent({
      patientId: targetPatientId,
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

  const addVital = async (vitalData: Partial<VitalRecord>) => {
    if (!activePatient && !vitalData.patientId) return;
    const targetPatientId = vitalData.patientId || activePatient?.id || '';

    const newVital: VitalRecord = {
      id: `vit-${Date.now()}`,
      patientId: targetPatientId,
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

    if (isDemoMode) {
      setDemoVitals(prev => [...prev, newVital]);
    } else {
      setRealVitals(prev => [...prev, newVital]);
      if (isBackendOnline) {
        try {
          await api.vitals.create(newVital);
        } catch (e) {
          console.warn('Backend vital create error', e);
        }
      }
    }

    await addEvent({
      patientId: targetPatientId,
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

  // Reset Demo Data: resets in-memory demo sandbox only
  const resetDemoData = () => {
    setDemoPatients(DEMO_PATIENTS);
    setDemoActivePatientId(DEMO_PATIENTS[0].id);
    setDemoEvents(DEMO_EVENTS);
    setDemoMedications(DEMO_MEDICATIONS);
    setDemoReports(DEMO_REPORTS);
    setDemoVitals(DEMO_VITALS);
    setDemoAuditLogs(DEMO_AUDIT_LOGS);
    setDemoHandoverSummary(DEMO_HANDOVER_SUMMARY);
    setDemoCarePlans(DEMO_CARE_PLANS);
    setDemoClinicalOrders(DEMO_CLINICAL_ORDERS);
    setDemoCareTasks(DEMO_CARE_TASKS);
    setDemoCaregiverEscalations(DEMO_CAREGIVER_ESCALATIONS);
    setDemoEmsCase(DEMO_EMS_CASE);
    setDemoAppointments(DEMO_APPOINTMENTS);
    setDemoScene(0);
    setIsDemoPlaying(false);
    setEvidenceHighlightIds([]);
    setActiveTab('doctor-dashboard');
  };

  // Demo Story Controller
  const startDemoStory = () => {
    enterDemoMode('doctor');
    setDemoScene(1);
    setIsDemoPlaying(true);
    setActiveTab('timeline');
    setActiveFilterTime('72h');
  };

  const stepDemoScene = (sceneNum: number) => {
    setDemoScene(sceneNum);
    switch (sceneNum) {
      case 1:
        setActiveTab('timeline');
        setActiveFilterType('symptom');
        setEvidenceHighlightIds(['evt-1']);
        break;
      case 2:
        setActiveTab('medications');
        setEvidenceHighlightIds(['evt-2', 'evt-4', 'evt-7']);
        break;
      case 3:
        setActiveTab('vitals');
        setEvidenceHighlightIds(['evt-3', 'evt-6', 'evt-8', 'evt-11']);
        break;
      case 4:
        setActiveTab('timeline');
        setActiveFilterType('all');
        setEvidenceHighlightIds(['evt-12']);
        break;
      case 5:
        setActiveTab('emergency');
        setEvidenceHighlightIds(['evt-13']);
        break;
      case 6:
        setCurrentRole('doctor');
        setActiveTab('handover');
        setEvidenceHighlightIds(['evt-1', 'evt-3', 'evt-6', 'evt-10', 'evt-11', 'evt-12']);
        break;
      default:
        break;
    }
  };

  // --- Role Specific Actions ---
  const updateDiagnosis = async (patientId: string, conditions: string[]) => {
    const updateFn = (list: Patient[]) => list.map(p => p.id === patientId ? { ...p, conditions, lastUpdated: 'Just now' } : p);
    if (isDemoMode) {
      setDemoPatients(updateFn);
    } else {
      setRealPatients(updateFn);
      if (isBackendOnline) {
        try {
          await api.patients.update(patientId, { conditions });
        } catch (e) {
          console.warn('Update diagnosis error', e);
        }
      }
    }

    await addEvent({
      patientId,
      type: 'visit',
      title: 'Diagnosis & Assessment Updated',
      description: `Primary clinical conditions updated: ${conditions.join(', ')}`,
      severity: 'moderate',
      source: 'Clinician',
      createdBy: user?.fullName || 'Physician',
      verified: true
    });
  };

  const addClinicalOrder = async (orderData: Partial<ClinicalOrder>) => {
    if (!activePatient && !orderData.patientId) return;
    const targetPatientId = orderData.patientId || activePatient?.id || '';

    const newOrder: ClinicalOrder = {
      id: `ord-${Date.now()}`,
      patientId: targetPatientId,
      doctorName: user?.fullName || 'Attending Physician',
      type: orderData.type || 'medication',
      title: orderData.title || 'Clinical Order',
      details: orderData.details || '',
      status: 'ordered',
      priority: orderData.priority || 'routine',
      timestamp: 'Just now'
    };

    if (isDemoMode) {
      setDemoClinicalOrders(prev => [newOrder, ...prev]);
    } else {
      setRealClinicalOrders(prev => [newOrder, ...prev]);
      if (isBackendOnline) {
        try {
          const savedOrder = await api.patients.createClinicalOrder(targetPatientId, newOrder);
          if (savedOrder) {
            setRealClinicalOrders(prev => [savedOrder, ...prev.filter(o => o.id !== newOrder.id)]);
          }
        } catch (err) {
          console.warn('Backend sync failed for clinical order', err);
        }
      }
    }

    await addEvent({
      patientId: targetPatientId,
      type: 'visit',
      title: `Clinical Order: ${newOrder.title}`,
      description: `${newOrder.priority.toUpperCase()} priority order by ${newOrder.doctorName}: ${newOrder.details}`,
      severity: newOrder.priority === 'stat' ? 'critical' : newOrder.priority === 'urgent' ? 'moderate' : 'normal',
      source: 'Clinician',
      createdBy: newOrder.doctorName,
      verified: true
    });
  };

  const addCarePlanItem = async (itemData: Partial<CarePlanItem>) => {
    if (!activePatient && !itemData.patientId) return;
    const targetPatientId = itemData.patientId || activePatient?.id || '';

    const newItem: CarePlanItem = {
      id: `cp-${Date.now()}`,
      patientId: targetPatientId,
      title: itemData.title || 'Care Plan Instruction',
      description: itemData.description || '',
      category: itemData.category || 'monitoring',
      status: 'active',
      prescribedBy: user?.fullName || 'Attending Physician',
      updatedAt: 'Just now'
    };

    if (isDemoMode) {
      setDemoCarePlans(prev => [newItem, ...prev]);
    } else {
      setRealCarePlans(prev => [newItem, ...prev]);
      if (isBackendOnline) {
        try {
          const savedPlan = await api.patients.createCarePlan(targetPatientId, newItem);
          if (savedPlan) {
            setRealCarePlans(prev => [savedPlan, ...prev.filter(p => p.id !== newItem.id)]);
          }
        } catch (err) {
          console.warn('Backend sync failed for care plan', err);
        }
      }
    }

    await addEvent({
      patientId: targetPatientId,
      type: 'visit',
      title: `Care Plan Updated: ${newItem.title}`,
      description: newItem.description,
      severity: 'normal',
      source: 'Clinician',
      createdBy: newItem.prescribedBy,
      verified: true
    });
  };

  const toggleCareTask = async (taskId: string, status: CareTask['status'], notes?: string) => {
    const updateFn = (list: CareTask[]) => list.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status,
        notes: notes !== undefined ? notes : t.notes,
        completedAt: status === 'completed' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        completedBy: status === 'completed' ? (user?.fullName || 'Caregiver') : undefined
      };
    });

    if (isDemoMode) {
      setDemoCareTasks(updateFn);
    } else {
      setRealCareTasks(updateFn);
    }

    const task = careTasks.find(t => t.id === taskId);
    if (task) {
      await addEvent({
        patientId: task.patientId,
        type: task.category === 'medication' ? 'medication' : 'vital',
        title: `Care Task ${status === 'completed' ? 'Completed' : 'Updated'}: ${task.title}`,
        description: notes || `Logged status as ${status} at ${task.time}.`,
        severity: status === 'skipped' ? 'moderate' : 'normal',
        source: 'Family / Caregiver',
        createdBy: user?.fullName || 'Caregiver',
      });
    }
  };

  const addCareTask = async (taskData: Partial<CareTask>) => {
    if (!activePatient && !taskData.patientId) return;
    const targetPatientId = taskData.patientId || activePatient?.id || '';

    const newTask: CareTask = {
      id: `tsk-${Date.now()}`,
      patientId: targetPatientId,
      title: taskData.title || 'New Daily Task',
      time: taskData.time || '12:00 PM',
      category: taskData.category || 'vital',
      status: 'pending',
      notes: taskData.notes
    };

    if (isDemoMode) {
      setDemoCareTasks(prev => [...prev, newTask]);
    } else {
      setRealCareTasks(prev => [...prev, newTask]);
    }
  };

  const addCaregiverObservation = async (obs: { title: string; description: string; temp?: number; severity?: any }) => {
    if (!activePatient) return;
    await addEvent({
      patientId: activePatient.id,
      type: 'symptom',
      title: obs.title,
      description: obs.description,
      severity: obs.severity || 'mild',
      source: 'Family / Caregiver',
      createdBy: user?.fullName || 'Caregiver',
      metadata: obs.temp ? { temperature: obs.temp } : undefined
    });
    if (obs.temp) {
      await addVital({ temperature: obs.temp, notes: obs.title });
    }
  };

  const addCaregiverEscalation = async (escData: Partial<CaregiverEscalation>) => {
    if (!activePatient && !escData.patientId) return;
    const targetPatientId = escData.patientId || activePatient?.id || '';

    const newEsc: CaregiverEscalation = {
      id: `esc-${Date.now()}`,
      patientId: targetPatientId,
      caregiverName: user?.fullName || 'Caregiver',
      urgency: escData.urgency || 'urgent',
      symptom: escData.symptom || 'Concerning Change Noted',
      details: escData.details || '',
      timestamp: 'Just now',
      status: 'open'
    };

    if (isDemoMode) {
      setDemoCaregiverEscalations(prev => [newEsc, ...prev]);
    } else {
      setRealCaregiverEscalations(prev => [newEsc, ...prev]);
    }

    await addEvent({
      patientId: targetPatientId,
      type: 'emergency',
      title: `Caregiver Escalation: ${newEsc.symptom}`,
      description: `[URGENCY: ${newEsc.urgency.toUpperCase()}] ${newEsc.details}`,
      severity: newEsc.urgency === 'emergency' ? 'critical' : 'severe',
      source: 'Family / Caregiver',
      createdBy: newEsc.caregiverName,
      metadata: { urgency: newEsc.urgency }
    });
  };

  const respondToEscalation = async (id: string, response: string) => {
    const updateFn = (list: CaregiverEscalation[]) => list.map(e => e.id === id ? { ...e, status: 'reviewed' as const, doctorResponse: response } : e);
    if (isDemoMode) {
      setDemoCaregiverEscalations(updateFn);
    } else {
      setRealCaregiverEscalations(updateFn);
    }

    const esc = caregiverEscalations.find(e => e.id === id);
    if (esc) {
      await addEvent({
        patientId: esc.patientId,
        type: 'visit',
        title: `Doctor Responded to Escalation`,
        description: `Attending physician response: ${response}`,
        severity: 'moderate',
        source: 'Clinician',
        createdBy: user?.fullName || 'Attending Physician',
        verified: true
      });
    }
  };

  const logEmsVitals = async (vitalData: Partial<VitalRecord>) => {
    await addVital(vitalData);
  };

  const logEmsIntervention = async (name: string, notes?: string) => {
    if (!activePatient) return;
    const interventionItem = {
      id: `int-${Date.now()}`,
      name,
      timestamp: 'Just now',
      notes
    };

    if (isDemoMode && demoEmsCase) {
      setDemoEmsCase({
        ...demoEmsCase,
        interventions: [...demoEmsCase.interventions, interventionItem]
      });
    } else if (realEmsCase) {
      setRealEmsCase({
        ...realEmsCase,
        interventions: [...realEmsCase.interventions, interventionItem]
      });
    }

    await addEvent({
      patientId: activePatient.id,
      type: 'emergency',
      title: `EMS Intervention: ${name}`,
      description: notes || `Emergency intervention administered in transit by Paramedic.`,
      severity: 'severe',
      source: 'Clinician',
      createdBy: user?.fullName || 'EMS Paramedic',
      metadata: { interventionName: name }
    });
  };

  const completeEmsHandover = async (mist?: any) => {
    if (!activePatient) return;
    if (isDemoMode && demoEmsCase) {
      setDemoEmsCase({
        ...demoEmsCase,
        status: 'handover-complete',
        handoverCompletedAt: new Date().toISOString(),
        mistHandover: mist || demoEmsCase.mistHandover
      });
    } else if (realEmsCase) {
      setRealEmsCase({
        ...realEmsCase,
        status: 'handover-complete',
        handoverCompletedAt: new Date().toISOString(),
        mistHandover: mist || realEmsCase.mistHandover
      });
    }

    await addEvent({
      patientId: activePatient.id,
      type: 'emergency',
      title: 'Paramedic Hospital Handover Transmitted',
      description: 'MIST telemetry package and pre-hospital vital progression securely handed over to Apex Memorial ER team.',
      severity: 'moderate',
      source: 'Clinician',
      createdBy: user?.fullName || 'EMS Paramedic',
      verified: true
    });
  };

  const logPatientCheckin = async (feeling: 'better' | 'same' | 'worse', note?: string) => {
    if (!activePatient) return;
    await addEvent({
      patientId: activePatient.id,
      type: 'symptom',
      title: `Daily Check-In: Feeling ${feeling.toUpperCase()}`,
      description: note || `Patient completed regular daily check-in report. Logged general feeling as ${feeling}.`,
      severity: feeling === 'worse' ? 'moderate' : 'normal',
      source: 'Patient',
      createdBy: user?.fullName || activePatient.fullName || 'Patient'
    });
  };

  return (
    <CareChainContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        demoAccounts,
        isBackendOnline,
        backendMessage,
        isSupabaseOnline,
        supabaseMessage,

        isDemoMode,
        enterDemoMode,
        exitDemoMode,
        profileState,
        isLoadingData,
        dataError,
        retryLoadData,

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

        carePlans,
        clinicalOrders,
        careTasks,
        caregiverEscalations,
        emsCase,
        appointments,
        permissions,

        openAuthModal,
        closeAuthModal,
        login,
        loginWithGoogle,
        register,
        logout,
        recheckBackend,

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

        updateDiagnosis,
        addClinicalOrder,
        addCarePlanItem,
        toggleCareTask,
        addCareTask,
        addCaregiverObservation,
        addCaregiverEscalation,
        respondToEscalation,
        logEmsVitals,
        logEmsIntervention,
        completeEmsHandover,
        logPatientCheckin
      }}
    >
      {children}
    </CareChainContext.Provider>
  );
};

export const useCareChain = (): CareChainContextType => {
  const context = useContext(CareChainContext);
  if (!context) {
    throw new Error('useCareChain must be used within a CareChainProvider');
  }
  return context;
};
