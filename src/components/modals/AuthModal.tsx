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
    loginWithGoogle,
    register,
    user,
    logout,
    demoAccounts,
    enterDemoMode
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLaunchDemoPersona = (personaRole: UserRole) => {
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
    enterDemoMode(personaRole);
    closeAuthModal();
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);
    try {
      // Preserve intent for role resolution post-OAuth redirect
      sessionStorage.setItem('carechain_oauth_intent', JSON.stringify({
        mode,
        role: mode === 'register' ? role : undefined,
        fullName: mode === 'register' ? fullName : undefined
      }));

      const res = await loginWithGoogle();
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to initialize Google Sign-In');
        setIsGoogleLoading(false);
      }
      // If successful, Supabase navigates to Google Accounts OAuth URL
    } catch (e: any) {
      setErrorMsg(e?.message || 'Google Sign-In failed');
      setIsGoogleLoading(false);
    }
  };

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
        className="modal-panel glass-light w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/80 p-0 animate-scale-in max-h-[92vh] flex flex-col"
        style={{
          background: 'rgba(248, 251, 255, 0.94)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          boxShadow: '0 25px 60px -15px rgba(16, 96, 216, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.9) inset'
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-black/[0.06] flex items-center justify-between shrink-0">
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
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-white/80 border border-black/[0.06] flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-cyan/20 text-accent-cyan flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.charAt(0)
                )}
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

            {user.pendingVerification && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Clinical credentials pending administrative verification. Standard patient access active.</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Session active & synchronized with CareChain {user.authProvider === 'google' ? 'Google OAuth & Supabase' : 'API backend'}.</span>
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
          <div className="p-6 space-y-5 overflow-y-auto">
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
                  onClick={() => handleLaunchDemoPersona('doctor')}
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
                  onClick={() => handleLaunchDemoPersona('family')}
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
                  onClick={() => handleLaunchDemoPersona('patient')}
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
                  onClick={() => handleLaunchDemoPersona('ems')}
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
                disabled={isLoading || isGoogleLoading}
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

              {/* Divider: OR CONTINUE WITH */}
              <div className="relative flex items-center justify-center my-3.5">
                <div className="w-full border-t border-black/[0.08]" />
                <span className="px-3 text-[10px] font-semibold tracking-wider text-ink-muted uppercase select-none shrink-0 bg-transparent">
                  OR CONTINUE WITH
                </span>
                <div className="w-full border-t border-black/[0.08]" />
              </div>

              {/* Continue with Google Secondary Button */}
              <button
                type="button"
                id="google-signin-btn"
                disabled={isLoading || isGoogleLoading}
                onClick={handleGoogleSignIn}
                aria-label="Continue with Google"
                className="w-full py-2.5 px-4 rounded-xl border border-black/[0.1] bg-white hover:bg-slate-50/90 active:bg-slate-100 text-ink-primary text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs hover:shadow-sm hover:border-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 focus-visible:ring-offset-1 pressable disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGoogleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-300 border-t-accent-cyan rounded-full animate-spin" />
                    <span className="text-xs text-ink-secondary">Connecting to Google...</span>
                  </span>
                ) : (
                  <>
                    <svg
                      className="w-[18px] h-[18px] shrink-0"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px' }}
                    >
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.39 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.13z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span>Continue with Google</span>
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
