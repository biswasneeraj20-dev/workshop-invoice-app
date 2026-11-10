import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Wrench,
  Lock,
  Mail,
  KeyRound,
  Building2,
  Phone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AuthScreenProps {
  onOpenSupabaseConfig?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenSupabaseConfig }) => {
  const { login, signup, resetPassword, isLoading, isConfigured } = useAuth();
  const { updateProfile } = useWorkshop();

  const [tab, setTab] = useState<'login' | 'signup' | 'forgot_password'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthScreen] Form submission started, tab:', tab);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === 'forgot_password') {
        if (!email) {
          setErrorMsg('Please enter your registered email address.');
          return;
        }
        const res = await resetPassword(email);
        if (!res.success) {
          throw new Error(res.error || 'Failed to send password reset email.');
        } else {
          setSuccessMsg('Password reset link has been sent to your email! Please check your inbox.');
        }
        return;
      }

      if (!email || !password) {
        setErrorMsg('Please enter both email and password.');
        return;
      }

      if (tab === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          return;
        }
        if (!workshopName || !phoneNumber) {
          setErrorMsg('Workshop name and phone number are required.');
          return;
        }

        console.log('[AuthScreen] Initiating sign up...');
        const res = await signup(email, password, {
          workshopName: workshopName.trim(),
          phone: phoneNumber.trim(),
        });

        if (!res.success) {
          if (res.requiresEmailConfirmation) {
            setSuccessMsg(res.error || 'Account ban gaya hai! Kripya apna email verify karein.');
            setTab('login');
            return;
          }
          console.error('[AuthScreen] Signup failed:', res.error);
          throw new Error(res.error || 'Signup failed. Please try again.');
        } else {
          updateProfile({
            name: workshopName.trim(),
            phone: phoneNumber.trim(),
            email: email.trim(),
          });
          setSuccessMsg('Workshop account created successfully!');
          console.log('[AuthScreen] Signup successful!');
        }
      } else {
        console.log('[AuthScreen] Initiating login...');
        const res = await login(email, password);
        if (!res.success) {
          console.error('[AuthScreen] Login failed:', res.error);
          throw new Error(res.error || 'Invalid email or password.');
        }
        console.log('[AuthScreen] Login successful!');
      }
    } catch (err: any) {
      console.error('[AuthScreen] handleSubmit catch block:', err);
      setErrorMsg(err.message || 'An unexpected error occurred during authentication.');
    }
  };

  const handleQuickDemoLogin = async () => {
    setErrorMsg(null);
    setEmail('demo.workshop@gmail.com');
    setPassword('demo1234');
    await login('demo.workshop@gmail.com', 'demo1234');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
            <Wrench className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block">
              Auto Workshop Invoice Maker
            </span>
            <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">
              Subscription Cloud Software
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupabaseConfig && (
            <button
              type="button"
              onClick={onOpenSupabaseConfig}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                isConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isConfigured ? 'Supabase Connected' : 'Setup Supabase'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Auth Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{tab === 'forgot_password' ? 'Password Recovery' : '2 Free Bills on New Signup'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {tab === 'login'
                ? 'Workshop Owner Login'
                : tab === 'signup'
                ? 'Create Free Workshop Account'
                : 'Reset Your Password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {tab === 'login'
                ? 'Sign in to access your garage billing, customer invoices & inventory.'
                : tab === 'signup'
                ? 'Register your auto garage to start free trial and make customer bills.'
                : 'Enter your registered email address to receive a password reset link via Supabase.'}
            </p>
          </div>

          {/* Tab Switcher */}
          {tab !== 'forgot_password' && (
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  tab === 'login'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  tab === 'signup'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up (New)
              </button>
            </div>
          )}

          {/* Alert feedback */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-2xl text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>

              {errorMsg.includes('DROP TRIGGER') && (
                <div className="pt-2 border-t border-rose-500/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-amber-300">
                    <span className="truncate">DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
                        setSuccessMsg('SQL command copied to clipboard!');
                        setTimeout(() => setSuccessMsg(null), 3500);
                      }}
                      className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded text-[10px] font-bold shrink-0 cursor-pointer hover:bg-amber-400"
                    >
                      Copy SQL
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 underline font-semibold flex items-center gap-1"
                    >
                      <span>Open Supabase SQL Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="text-[11px] text-amber-300 underline font-semibold cursor-pointer"
                    >
                      Use Demo Mode Now &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Workshop / Garage Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Multi-Brand Car Service"
                      value={workshopName}
                      onChange={e => setWorkshopName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="garage.owner@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            {tab !== 'forgot_password' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot_password');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {tab === 'login'
                      ? 'Login to Existing Account'
                      : tab === 'signup'
                      ? 'Create New Account'
                      : 'Send Reset Password Link'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {tab === 'forgot_password' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-xs text-slate-400 hover:text-white font-semibold transition cursor-pointer inline-flex items-center gap-1"
              >
                <span>← Back to Login</span>
              </button>
            </div>
          )}

          {/* Quick Demo Access Button */}
          {tab !== 'forgot_password' && (
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>One-Click Demo Login (Test Free Trial)</span>
              </button>
            </div>
          )}

          {/* Subscription Contact Note */}
          <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
            <p className="text-[11px] text-slate-400">
              Need full unlimited subscription or assistance?
            </p>
            <a
              href="https://wa.me/919876543210?text=Hello%20Neeraj%20ji%2C%20I%20want%20subscription%20for%20Auto%20Workshop%20Invoice%20Maker"
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Contact Admin (Neeraj Biswas) on WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-3 text-center text-xs text-slate-500">
        <span>Auto Workshop Invoice Maker · Designed & Developed by Neeraj Biswas · Netlify + Supabase Ready</span>
      </footer>

    </div>
  );
};
