import React, { useState } from 'react';
import { useCareChain } from '../../context/CareChainContext';
import { UserRole } from '../../types';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Stethoscope,
  Users,
  ShieldCheck,
  Ambulance,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

const inputCls = "w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/[0.08] text-sm text-ink-primary bg-white focus:outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/10 transition-all placeholder:text-ink-muted";
const labelCls = "label-tag text-ink-muted block mb-1.5";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    user,
    logout,
    demoAccounts
  } = useCareChain();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('doctor');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleQuickLogin = async (accEmail: string, accPass = 'doctor123') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const res = await login(accEmail, accPass);
      if (res.success) {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        closeAuthModal();
      } else {
        setErrorMsg(res.error || 'Failed to authenticate');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
          closeAuthModal();
        } else {
          setErrorMsg(res.error || 'Invalid credentials');
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full name');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters');
          setIsLoading(false);
          return;
        }

        const res = await register({
          email,
          password,
          fullName,
          role,
          phone,
          title: title || (role === 'doctor' ? 'Attending Physician' : role === 'family' ? 'Family Member' : 'Patient')
        });

        if (res.success) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          setSuccessMsg('Account registered and session created!');
          setTimeout(() => {
            closeAuthModal();
          }, 800);
        } else {
          setErrorMsg(res.error || 'Registration failed');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="modal-panel glass-light w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/80 p-0 animate-scale-in"
        style={{
          background: 'rgba(248, 251, 255, 0.94)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          boxShadow: '0 25px 60px -15px rgba(16, 96, 216, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.9) inset'
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-black/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <ShieldCheck className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink-primary font-carmen leading-tight">
                {user ? 'Account Management' : mode === 'login' ? 'Sign in to CareChain' : 'Create CareChain Account'}
              </h2>
              <p className="text-xs text-ink-muted">
                {user ? `Signed in as ${user.email}` : 'Access verified clinical timeline and handover intelligence'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-black/5 transition-all pressable"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is already logged in, show current profile card */}
        {user ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-bold text-lg">
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink-primary text-sm">{user.fullName}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-cyan/15 text-accent-cyan uppercase">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">{user.email}</p>
                {user.title && <p className="text-[11px] text-ink-muted mt-0.5">{user.title}</p>}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Session active & synchronized with CareChain API backend.</span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={closeAuthModal}
                className="px-4 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary transition-colors pressable"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  closeAuthModal();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors pressable"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Quick 1-Click Demo Accounts */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
                  Quick Demo Access (1-Click)
                </span>
                <span className="text-[10px] text-ink-muted">Pre-seeded with clinical roles</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('doctor@carechain.health', 'doctor123')}
                  className="p-2.5 rounded-xl border border-black/[0.07] bg-white/90 hover:bg-white hover:border-accent-cyan/40 hover:shadow-sm text-left transition-all pressable group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Stethoscope className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-ink-primary truncate">Doctor</div>
                      <div className="text-[10px] text-ink-muted truncate">Dr. Aarav Sharma</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('caregiver@carechain.health', 'caregiver123')}
                  className="p-2.5 rounded-xl border border-black/[0.07] bg-white/90 hover:bg-white hover:border-amber-400/50 hover:shadow-sm text-left transition-all pressable group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-ink-primary truncate">Caregiver</div>
                      <div className="text-[10px] text-ink-muted truncate">Pooja Sharma</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('patient@carechain.health', 'patient123')}
                  className="p-2.5 rounded-xl border border-black/[0.07] bg-white/90 hover:bg-white hover:border-emerald-400/50 hover:shadow-sm text-left transition-all pressable group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-ink-primary truncate">Patient</div>
                      <div className="text-[10px] text-ink-muted truncate">Rahul Sharma</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin('paramedic@carechain.health', 'ems123')}
                  className="p-2.5 rounded-xl border border-black/[0.07] bg-white/90 hover:bg-white hover:border-rose-400/50 hover:shadow-sm text-left transition-all pressable group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Ambulance className="w-3.5 h-3.5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold text-ink-primary truncate">EMS Paramedic</div>
                      <div className="text-[10px] text-ink-muted truncate">Capt. Dave Miller</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-xl p-1 bg-black/[0.05]">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all pressable ${
                  mode === 'login' ? 'bg-white text-ink-primary shadow-xs' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all pressable ${
                  mode === 'register' ? 'bg-white text-ink-primary shadow-xs' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Feedback */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs flex items-center gap-2 animate-drift-up">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2 animate-drift-up">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Jane Doe"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Role & Access Scope</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('doctor')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all pressable ${
                          role === 'doctor'
                            ? 'bg-accent-cyan/15 border-accent-cyan/40 text-ink-primary'
                            : 'bg-white/80 border-black/[0.08] text-ink-muted'
                        }`}
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-accent-cyan" />
                        <span>Doctor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('family')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all pressable ${
                          role === 'family'
                            ? 'bg-amber-500/15 border-amber-500/40 text-ink-primary'
                            : 'bg-white/80 border-black/[0.08] text-ink-muted'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Caregiver</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('patient')}
                        className={`p-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all pressable ${
                          role === 'patient'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-ink-primary'
                            : 'bg-white/80 border-black/[0.08] text-ink-muted'
                        }`}
                      >
                        <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Patient</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Title / Specialization</label>
                      <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Cardiology"
                        className="w-full px-3 py-2 rounded-xl border border-black/[0.08] text-xs bg-white text-ink-primary"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Phone Number</label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-black/[0.08] text-xs bg-white text-ink-primary"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={labelCls}>Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@hospital.org"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 btn-cyan flex items-center justify-center gap-2 !py-2.5 !text-sm font-semibold rounded-xl pressable disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In with CareChain' : 'Register Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
