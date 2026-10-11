import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCareChain } from '../context/CareChainContext';
import type { UserRole, AppTab } from '../types';
import { BrandLink } from './BrandLink';
import {
  Play,
  RotateCcw,
  Plus,
  Menu,
  X,
  ChevronDown,
  Check,
  LogIn,
  LogOut,
  User as UserIcon,
  Lock,
  Stethoscope,
  Users,
  Ambulance,
  ShieldCheck
} from 'lucide-react';

const ROLE_NAV_ITEMS: Record<UserRole, { id: AppTab; label: string }[]> = {
  doctor: [
    { id: 'doctor-dashboard', label: 'Doctor Dashboard' },
    { id: 'timeline', label: 'Clinical Timeline' },
    { id: 'doctor', label: 'Assessment' },
    { id: 'handover', label: '60s Handover' },
    { id: 'vitals', label: 'Vitals & Trends' },
    { id: 'reports', label: 'Reports' },
    { id: 'emergency', label: 'Emergency Mode' },
    { id: 'sharing', label: 'Audit & Sharing' },
  ],
  family: [
    { id: 'caregiver-dashboard', label: 'Caregiver Dashboard' },
    { id: 'caregiver-tasks', label: 'Care Tasks' },
    { id: 'caregiver-observations', label: 'Observations Log' },
    { id: 'caregiver-escalate', label: 'Escalate Concern' },
    { id: 'caregiver-careplan', label: 'Doctor Instructions' },
    { id: 'timeline', label: 'Patient Timeline' },
  ],
  patient: [
    { id: 'patient-dashboard', label: 'My Health Portal' },
    { id: 'timeline', label: 'My Timeline' },
    { id: 'patient-careplan', label: 'My Care Plan' },
    { id: 'medications', label: 'My Medications' },
    { id: 'patient-appointments', label: 'Appointments' },
    { id: 'patient-careteam', label: 'My Care Team' },
  ],
  ems: [
    { id: 'ems-dashboard', label: 'EMS Dashboard' },
    { id: 'ems-assessment', label: 'Active Triage' },
    { id: 'ems-vitals-interventions', label: 'Vitals & Interventions' },
    { id: 'ems-handover', label: 'Hospital Handover' },
    { id: 'emergency', label: 'ER Mode' },
    { id: 'timeline', label: 'Pre-Hospital Timeline' },
  ],
  admin: [
    { id: 'doctor-dashboard', label: 'Doctor Dashboard' },
    { id: 'timeline', label: 'Clinical Timeline' },
    { id: 'handover', label: '60s Handover' },
    { id: 'sharing', label: 'Audit & Sharing' },
  ]
};

const DROPDOWN_MIN_W = 160;
const DROPDOWN_MAX_W = 240;
const DROPDOWN_GAP = 6;
const VIEWPORT_PAD = 8;

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

function computePos(triggerEl: HTMLElement, panelHeight: number, minW = DROPDOWN_MIN_W, maxW = DROPDOWN_MAX_W): DropdownPos {
  const r = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const idealW = Math.max(minW, Math.min(maxW, r.width));
  const width = Math.min(idealW, vw - VIEWPORT_PAD * 2);

  let left = r.right - width;
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;
  if (left + width > vw - VIEWPORT_PAD) left = vw - VIEWPORT_PAD - width;

  const spaceBelow = vh - r.bottom - VIEWPORT_PAD;
  const spaceAbove = r.top - VIEWPORT_PAD;
  const openUpward = spaceBelow < panelHeight && spaceAbove > spaceBelow;

  const top = openUpward
    ? r.top - DROPDOWN_GAP - panelHeight
    : r.bottom + DROPDOWN_GAP;

  return { top, left, width, openUpward };
}

interface PatientSelectorProps {
  patients: { id: string; fullName: string }[];
  activePatientId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  patients,
  activePatientId,
  onSelect,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const [pos, setPos] = useState<DropdownPos | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const activePatient = patients.find(p => p.id === activePatientId);

  const updatePos = useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const panelH = panelRef.current.offsetHeight || 120;
    setPos(computePos(triggerRef.current, panelH, 160, 220));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('scroll', updatePos, { passive: true });
    window.addEventListener('resize', updatePos, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  const handleOpen = () => {
    setFocusIndex(0);
    setOpen(v => !v);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); setFocusIndex(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIndex(i => Math.min(i + 1, patients.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && focusIndex >= 0) {
      onSelect(patients[focusIndex].id);
      setOpen(false);
      setFocusIndex(-1);
    }
  };

  const panel = open ? (
    <div
      ref={panelRef}
      role="listbox"
      aria-label="Select patient"
      style={{
        position: 'fixed',
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        width: pos ? pos.width : DROPDOWN_MIN_W,
        zIndex: 2147483647,
        background: 'rgba(235, 242, 250, 0.94)',
        backdropFilter: 'blur(28px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.7)',
        border: '1px solid rgba(255,255,255,0.88)',
        borderRadius: '14px',
        boxShadow:
          '0 8px 32px -4px rgba(16,96,216,0.13), ' +
          '0 3px 12px rgba(0,0,0,0.07), ' +
          'inset 0 1px 0 rgba(255,255,255,0.95), ' +
          'inset 0 -1px 0 rgba(0,0,0,0.03)',
        padding: '5px',
        animation: 'patient-dropdown-in 160ms cubic-bezier(0.22,1,0.36,1) both',
        maxHeight: `calc(100vh - ${VIEWPORT_PAD * 2}px)`,
        overflowY: 'auto',
      }}
    >
      <div className="px-2 py-1 mb-1 border-b border-black/[0.05] text-[10px] font-bold text-ink-muted uppercase tracking-wider">
        Active Patient Record
      </div>
      {patients.map((p, idx) => {
        const isSelected = p.id === activePatientId;
        const isFocused = idx === focusIndex;
        return (
          <div
            key={p.id}
            role="option"
            aria-selected={isSelected}
            onClick={() => { onSelect(p.id); setOpen(false); }}
            onMouseEnter={() => setFocusIndex(idx)}
            onMouseLeave={() => setFocusIndex(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
              transition: 'background 140ms ease, color 140ms ease',
              background: isSelected
                ? 'rgba(30,207,224,0.14)'
                : isFocused
                ? 'rgba(255,255,255,0.75)'
                : 'transparent',
              boxShadow: isSelected
                ? 'inset 0 1px 0 rgba(255,255,255,0.70), 0 1px 4px rgba(16,96,216,0.06)'
                : 'none',
              border: isSelected
                ? '1px solid rgba(30,207,224,0.22)'
                : '1px solid transparent',
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.fullName}
            </span>
            {isSelected && (
              <Check style={{ width: '12px', height: '12px', flexShrink: 0, color: 'var(--accent-cyan)' }} />
            )}
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="text-xs text-ink-primary rounded-full px-3 py-1.5 focus:outline-none cursor-pointer flex items-center gap-1.5 transition-all pressable"
        style={{
          background: open ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.60)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: open
            ? '0 2px 12px rgba(16,96,216,0.10), inset 0 1px 0 rgba(255,255,255,0.95)'
            : '0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.90)',
          maxWidth: compact ? undefined : '160px',
          minWidth: compact ? undefined : '110px',
          whiteSpace: 'nowrap',
          overflow: compact ? undefined : 'hidden',
          textOverflow: compact ? undefined : 'ellipsis',
        }}
        title={`Select patient (current: ${activePatient?.fullName || 'None'})`}
        disabled={patients.length === 0}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left',
          fontWeight: 500,
        }}>
          {activePatient?.fullName || (patients.length === 0 ? 'No Patients' : 'Select Patient')}
        </span>
        <ChevronDown
          style={{
            width: '10px',
            height: '10px',
            flexShrink: 0,
            color: 'var(--ink-secondary)',
            transition: 'transform 200ms cubic-bezier(0.22,1,0.36,1)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
};

const DEMO_PERSONAS = [
  {
    role: 'doctor' as UserRole,
    label: 'Doctor',
    name: 'Dr. Aarav Sharma, MD',
    title: 'Senior Attending Physician',
    email: 'doctor@carechain.health',
    password: 'doctor123',
    icon: Stethoscope,
    accentColor: '#0EA5E9',
    badgeColor: 'rgba(14,165,233,0.15)',
    description: 'Clinical Cockpit & Assessment'
  },
  {
    role: 'family' as UserRole,
    label: 'Caregiver',
    name: 'Pooja Sharma',
    title: 'Primary Family Caregiver',
    email: 'caregiver@carechain.health',
    password: 'caregiver123',
    icon: Users,
    accentColor: '#D97706',
    badgeColor: 'rgba(217,119,6,0.15)',
    description: 'Care Tasks & Observations Log'
  },
  {
    role: 'patient' as UserRole,
    label: 'Patient',
    name: 'Rahul Sharma',
    title: 'Patient (Self Access)',
    email: 'patient@carechain.health',
    password: 'patient123',
    icon: UserIcon,
    accentColor: '#059669',
    badgeColor: 'rgba(5,150,105,0.15)',
    description: 'Personal Health Portal & Care Plan'
  },
  {
    role: 'ems' as UserRole,
    label: 'EMS Paramedic',
    name: 'Capt. Dave Miller',
    title: 'Critical Care Paramedic',
    email: 'paramedic@carechain.health',
    password: 'ems123',
    icon: Ambulance,
    accentColor: '#E11D48',
    badgeColor: 'rgba(225,29,72,0.15)',
    description: 'Active Triage & Rapid Handover'
  }
];

const DemoUserSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentRole, setCurrentRole, user, login } = useCareChain();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isRealAuthenticatedUser = user && user.authProvider === 'google' && !user.email.toLowerCase().includes('@carechain.health');

  const updatePos = useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const panelH = panelRef.current.offsetHeight || 240;
    setPos(computePos(triggerRef.current, panelH, 250, 280));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('scroll', updatePos, { passive: true });
    window.addEventListener('resize', updatePos, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  if (isRealAuthenticatedUser) {
    return null;
  }

  const currentPersona = DEMO_PERSONAS.find(p => p.role === currentRole) || DEMO_PERSONAS[0];
  const CurrentIcon = currentPersona.icon;

  const handleSelect = (persona: typeof DEMO_PERSONAS[0]) => {
    setCurrentRole(persona.role);
    if (!user || user.email.toLowerCase().includes('@carechain.health') || user.authProvider !== 'google') {
      login(persona.email, persona.password);
    }
    setOpen(false);
  };

  const panel = open ? (
    <div
      ref={panelRef}
      role="listbox"
      aria-label="Switch Demo User"
      style={{
        position: 'fixed',
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        width: pos ? pos.width : 260,
        zIndex: 2147483647,
        background: 'rgba(235, 242, 250, 0.95)',
        backdropFilter: 'blur(28px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.7)',
        border: '1px solid rgba(255,255,255,0.90)',
        borderRadius: '16px',
        boxShadow: '0 12px 36px -4px rgba(16,96,216,0.18), 0 3px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
        padding: '8px',
        animation: 'patient-dropdown-in 160ms cubic-bezier(0.22,1,0.36,1) both',
        maxHeight: `calc(100vh - ${VIEWPORT_PAD * 2}px)`,
        overflowY: 'auto'
      }}
    >
      <div className="px-2.5 py-1.5 mb-1.5 border-b border-black/[0.06]">
        <div className="text-[11px] font-bold text-ink-primary uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Switch Demo User</span>
        </div>
        <div className="text-[10px] text-ink-muted mt-0.5">
          Simulate role-specific dashboards & workflows
        </div>
      </div>

      <div className="space-y-1">
        {DEMO_PERSONAS.map(p => {
          const isSelected = p.role === currentRole;
          const PersonaIcon = p.icon;
          return (
            <button
              key={p.role}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer group"
              style={{
                background: isSelected ? 'rgba(255,255,255,0.92)' : 'transparent',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)' : 'none',
                border: isSelected ? '1px solid rgba(255,255,255,0.95)' : '1px solid transparent'
              }}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  style={{ background: p.badgeColor, color: p.accentColor }}
                >
                  <PersonaIcon className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-ink-primary truncate">{p.label}</span>
                    {isSelected && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-accent-cyan/15 text-accent-cyan">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-secondary truncate">{p.name}</div>
                  <div className="text-[9px] text-ink-muted truncate hidden sm:block">{p.description}</div>
                </div>
              </div>
              {isSelected && (
                <Check className="w-3.5 h-3.5 shrink-0 ml-2" style={{ color: p.accentColor }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all pressable shrink-0"
        style={{
          background: open ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.60)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          color: 'var(--ink-primary)'
        }}
        title="Switch Demo User Persona"
      >
        <CurrentIcon className="w-3.5 h-3.5 shrink-0" style={{ color: currentPersona.accentColor }} />
        <span className="text-ink-secondary text-[11px] hidden sm:inline">Switch Demo:</span>
        <span className="font-semibold text-ink-primary truncate max-w-[90px] sm:max-w-none">
          {currentPersona.label}
        </span>
        <ChevronDown
          className="w-3 h-3 text-ink-muted shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
};

const UserAccountDropdown: React.FC = () => {
  const { user, openAuthModal, logout, isBackendOnline, profileState, isDemoMode } = useCareChain();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback(() => {
    if (!triggerRef.current || !panelRef.current) return;
    const panelH = panelRef.current.offsetHeight || 160;
    setPos(computePos(triggerRef.current, panelH, 200, 240));
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(updatePos);
    window.addEventListener('scroll', updatePos, { passive: true });
    window.addEventListener('resize', updatePos, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updatePos);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  if (!user) {
    if (!isDemoMode && (profileState === 'authLoading' || profileState === 'profileLoading')) {
      return (
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium text-ink-muted shrink-0"
          style={{
            background: 'rgba(255,255,255,0.60)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.85)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="hidden sm:inline">Verifying...</span>
        </div>
      );
    }

    return (
      <button
        onClick={openAuthModal}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all pressable shrink-0 cursor-pointer"
        style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          color: 'var(--ink-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
        title="Sign In / Register"
      >
        <LogIn className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="hidden sm:inline">Sign In</span>
        {isBackendOnline && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live API Online" />
        )}
      </button>
    );
  }

  const panel = open ? (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos ? pos.top : -9999,
        left: pos ? pos.left : -9999,
        width: 220,
        zIndex: 2147483647,
        background: 'rgba(235, 242, 250, 0.94)',
        backdropFilter: 'blur(28px) saturate(1.7)',
        WebkitBackdropFilter: 'blur(28px) saturate(1.7)',
        border: '1px solid rgba(255,255,255,0.88)',
        borderRadius: '16px',
        boxShadow: '0 12px 36px -4px rgba(16,96,216,0.18), 0 3px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
        padding: '10px',
        animation: 'patient-dropdown-in 160ms cubic-bezier(0.22,1,0.36,1) both',
      }}
    >
      <div className="px-2 py-1.5 mb-2 border-b border-black/[0.06]">
        <div className="text-xs font-bold text-ink-primary truncate">{user.fullName}</div>
        <div className="text-[10px] text-ink-muted truncate">{user.email}</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-accent-cyan/15 text-accent-cyan uppercase">
            {user.role}
          </span>
          {isBackendOnline && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => { setOpen(false); openAuthModal(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-ink-secondary hover:text-ink-primary hover:bg-white/70 transition-all pressable cursor-pointer text-left"
      >
        <UserIcon className="w-3.5 h-3.5 text-ink-muted" />
        <span>Manage Account</span>
      </button>

      <button
        onClick={async () => { setOpen(false); await logout(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50/80 transition-all pressable cursor-pointer text-left mt-1"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-500" />
        <span>Sign Out</span>
      </button>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all pressable shrink-0 cursor-pointer"
        style={{
          background: open ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.85)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <div className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-bold text-[10px]">
          {user.fullName.charAt(0)}
        </div>
        <span className="text-ink-primary font-medium max-w-[90px] truncate hidden sm:inline">
          {user.fullName.split(' ')[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-ink-muted" />
      </button>

      {panel && createPortal(panel, document.body)}
    </>
  );
};

export const Navbar: React.FC = () => {
  const {
    activeTab, setActiveTab,
    currentRole, setCurrentRole,
    activePatient, patients, setActivePatientId,
    startDemoStory, resetDemoData, demoScene,
    isDemoMode, enterDemoMode, exitDemoMode,
    setIsAddEventModalOpen,
  } = useCareChain();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close "More" dropdown when role or active tab changes
  useEffect(() => {
    setMoreOpen(false);
  }, [currentRole, activeTab]);

  // Handle outside click and Escape key to close "More" dropdown
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const navItems = ROLE_NAV_ITEMS[currentRole] || ROLE_NAV_ITEMS.doctor;

  // Adaptive threshold: partition nav items into visible tabs and a clean "More" dropdown
  const getMaxVisibleTabs = (role: UserRole, width: number): number => {
    if (width >= 1380) return 99; // Wide desktop (>=1380px): show all tabs
    if (width >= 1200) {
      // 1200px - 1379px: Doctor has 8 items, keep 5 visible + More. Others (6 items) fit directly.
      return role === 'doctor' ? 5 : 99;
    }
    // 1024px - 1199px (compact desktop):
    return role === 'doctor' ? 5 : 4;
  };

  const maxVisible = getMaxVisibleTabs(currentRole, windowWidth);
  const visibleItems = navItems.slice(0, maxVisible);
  const moreItems = navItems.length > maxVisible ? navItems.slice(maxVisible) : [];
  const activeMoreItem = moreItems.find(item => item.id === activeTab);
  const isMoreActive = Boolean(activeMoreItem);

  const renderPatientContext = (compact = false) => {
    if (!activePatient) {
      return (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-ink-muted select-none shrink-0"
          style={{
            background: 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
          title="No patient currently selected or assigned."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>No Assigned Patient</span>
        </div>
      );
    }

    if (currentRole === 'patient') {
      return (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-ink-primary select-none shrink-0"
          style={{
            background: 'rgba(255,255,255,0.70)',
            border: '1px solid rgba(255,255,255,0.88)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          title="Patient role access is secured to your personal verified record."
        >
          <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
          <span className="truncate max-w-[130px]">{activePatient.fullName} (You)</span>
        </div>
      );
    }

    if (currentRole === 'family') {
      return (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-ink-primary select-none shrink-0"
          style={{
            background: 'rgba(255,255,255,0.70)',
            border: '1px solid rgba(255,255,255,0.88)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
          title="Caregiver access configured for assigned patient."
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          <span className="truncate max-w-[130px]">{activePatient.fullName} (Assigned)</span>
        </div>
      );
    }

    if (currentRole === 'ems') {
      return (
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-700 select-none shrink-0"
          style={{
            background: 'rgba(254,242,242,0.85)',
            border: '1px solid rgba(248,113,113,0.3)',
            boxShadow: '0 2px 8px rgba(239,68,68,0.1)'
          }}
          title="Emergency triage active case."
        >
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
          <span className="truncate max-w-[150px]">{activePatient.fullName} · Case #EMS-7821</span>
        </div>
      );
    }

    return (
      <PatientSelector
        patients={patients}
        activePatientId={activePatient.id}
        onSelect={setActivePatientId}
        compact={compact}
      />
    );
  };

  const renderActionButton = () => (
    <button
      onClick={() => {
        if (currentRole === 'doctor') {
          setIsAddEventModalOpen(true);
        } else if (currentRole === 'family') {
          setActiveTab('caregiver-dashboard');
        } else if (currentRole === 'patient') {
          setIsAddEventModalOpen(true);
        } else if (currentRole === 'ems') {
          setActiveTab('ems-dashboard');
        }
      }}
      className="btn-cyan flex items-center gap-1.5 !px-3 !py-1.5 !text-xs pressable shrink-0 cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5 shrink-0" />
      <span>
        {currentRole === 'doctor'
          ? 'Add Event'
          : currentRole === 'family'
          ? 'Log Observation'
          : currentRole === 'patient'
          ? 'Check-In'
          : 'Intervene'}
      </span>
    </button>
  );

  const renderDemoStoryButton = (className = '') => (
    <button
      onClick={demoScene > 0 ? resetDemoData : startDemoStory}
      className={`items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all pressable shrink-0 cursor-pointer ${className}`}
      style={demoScene > 0 ? {
        background:
          'linear-gradient(162deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.32) 20%, transparent 50%), rgba(255,255,255,0.46)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        border: '1px solid rgba(255,255,255,0.82)',
        color: 'var(--ink-secondary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.04)',
      } : {
        background:
          'linear-gradient(160deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 25%, transparent 55%), rgba(7,8,10,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.14)',
        color: '#F0F4F8',
        boxShadow: '0 3px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18), inset 0 1.5px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.18)',
      }}
    >
      {demoScene > 0
        ? <><RotateCcw className="w-3 h-3"/><span>Reset</span></>
        : <><Play className="w-3 h-3 fill-current"/><span>Demo</span></>
      }
    </button>
  );

  return (
    <header
      className="nav-wrapper max-w-full overflow-x-clip"
      style={{
        background: scrolled
          ? 'linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(234,240,246,0.00) 100%), rgba(228, 236, 244, 0.90)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(234,240,246,0.00) 100%), rgba(234, 240, 246, 0.80)',
        boxShadow: scrolled
          ? '0 2px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(255,255,255,0.28) inset, 0 8px 32px rgba(16,96,216,0.10), 0 1px 0 rgba(0,0,0,0.05)'
          : '0 1.5px 0 rgba(255,255,255,0.90) inset, 0 -1px 0 rgba(255,255,255,0.25) inset, 0 4px 20px rgba(16,96,216,0.06)',
        transition: 'background 280ms cubic-bezier(0.22,1,0.36,1), box-shadow 280ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* ROW 1: PRIMARY NAVIGATION */}
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-13 gap-2 sm:gap-3">
          {/* Logo - links to the public homepage */}
          <BrandLink />

          {/* Role-Specific Primary Navigation Tabs (Centered, never squished or clipped) */}
          <div className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-2">
            <nav className="flex items-center gap-1 nav-capsule shrink-0 select-none">
              {visibleItems.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all pressable cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === item.id ? 'nav-pill-active text-ice' : 'nav-pill-inactive'
                  } ${item.id === 'emergency' && activeTab !== item.id ? 'text-rose-400 font-semibold' : ''}`}
                  style={
                    activeTab === item.id
                      ? {}
                      : item.id === 'emergency'
                      ? { color: '#F87171' }
                      : {}
                  }
                >
                  {item.label}
                </button>
              ))}

              {moreItems.length > 0 && (
                <div className="relative shrink-0" ref={moreDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setMoreOpen(v => !v)}
                    aria-expanded={moreOpen}
                    aria-haspopup="true"
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all pressable cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                      isMoreActive ? 'nav-pill-active text-ice' : 'nav-pill-inactive'
                    }`}
                  >
                    <span>{activeMoreItem ? activeMoreItem.label : 'More'}</span>
                    <ChevronDown
                      className="w-3 h-3 transition-transform duration-200"
                      style={{ transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {moreOpen && (
                    <div
                      className="absolute right-0 top-full mt-2.5 py-1.5 px-1.5 rounded-2xl z-50 min-w-[190px] shadow-2xl border"
                      style={{
                        background: 'rgba(10, 14, 22, 0.96)',
                        backdropFilter: 'blur(28px) saturate(1.8)',
                        WebkitBackdropFilter: 'blur(28px) saturate(1.8)',
                        borderColor: 'rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1">
                        Additional Views
                      </div>
                      {moreItems.map(item => {
                        const isActive = activeTab === item.id;
                        const isEmergency = item.id === 'emergency';
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setMoreOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-white/15 text-white font-semibold'
                                : isEmergency
                                ? 'text-rose-400 hover:bg-white/10 hover:text-rose-300'
                                : 'text-slate-300 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-accent-cyan" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          {/* Right Header Area (Account, Demo Story, Mobile menu toggle) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Account / Sign In */}
            <UserAccountDropdown />

            {/* Demo Story Trigger on wider desktop */}
            {renderDemoStoryButton('hidden xl:flex')}

            {/* Mobile / Tablet Menu Toggle */}
            <button
              className="lg:hidden p-1.5 text-ink-secondary pressable rounded-xl transition-all cursor-pointer"
              style={{
                background: mobileOpen ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.80)',
              }}
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-4 h-4"/> : <Menu className="w-4 h-4"/>}
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: CONTEXTUAL CONTROLS BAR (FOR DESKTOP VIEWPORTS: lg and up) */}
      <div
        className="hidden lg:flex items-center justify-between px-3 sm:px-4 lg:px-6 py-1.5 border-t"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.45)',
          background: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Left: Patient Context & Selector + Demo Mode Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider pl-1">
              Active Patient:
            </span>
            {renderPatientContext()}
          </div>

          {isDemoMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>DEMO MODE</span>
              <button
                onClick={exitDemoMode}
                className="ml-1 text-[10px] font-medium underline text-amber-900 hover:text-amber-950 cursor-pointer"
                title="Exit Demo Mode and return to real application"
              >
                Exit Demo
              </button>
            </div>
          )}
        </div>

        {/* Right: Demo User Switcher (only in Demo Mode!), Demo Story (on lg < xl), & Role Action Button */}
        <div className="flex items-center gap-2">
          {renderDemoStoryButton('flex xl:hidden')}
          {isDemoMode && <DemoUserSwitcher />}
          {renderActionButton()}
        </div>
      </div>

      {/* MOBILE / TABLET EXPANDED DRAWER (< 1024px) */}
      {mobileOpen && (
        <nav
          className="lg:hidden px-3 sm:px-4 pb-4 border-t pt-3 animate-drift-up"
          style={{ borderColor: 'rgba(255,255,255,0.45)' }}
        >
          {/* Primary role navigation pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {navItems.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all pressable cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-slate-900 text-white shadow-md border border-white/20'
                    : 'bg-white/60 text-ink-primary hover:bg-white/90 border border-white/80'
                } ${item.id === 'emergency' && activeTab !== item.id ? 'text-rose-600 font-bold' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Contextual controls, demo switcher & demo story */}
          <div
            className="flex flex-wrap items-center gap-2 pt-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.40)' }}
          >
            {renderPatientContext(true)}
            {isDemoMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>DEMO</span>
                <button onClick={exitDemoMode} className="ml-1 text-[10px] underline">Exit</button>
              </div>
            )}
            {isDemoMode && <DemoUserSwitcher compact />}
            {renderDemoStoryButton('flex')}
            {renderActionButton()}
          </div>
        </nav>
      )}
    </header>
  );
};
