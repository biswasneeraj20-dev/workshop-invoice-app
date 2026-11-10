import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAppSettings, AppSettings } from '../lib/supabase';
import {
  Lock,
  Phone,
  MessageSquare,
  RefreshCw,
  LogOut,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  User,
  Wrench,
  ExternalLink,
  Tag,
  CreditCard,
  Database,
} from 'lucide-react';

interface SubscriptionLockScreenProps {
  onOpenSupabaseConfig?: () => void;
}

export const SubscriptionLockScreen: React.FC<SubscriptionLockScreenProps> = ({ onOpenSupabaseConfig }) => {
  const {
    user,
    profile,
    billsCreatedCount,
    maxFreeBills,
    refreshSubscription,
    logout,
    isConfigured,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    monthly_price: 499,
    yearly_price: 3999,
    lifitime_plan: 7999,
    currency: '₹',
    support_phone: '+91 98765 43210',
  });

  const formatPlanPrice = (val: any) => {
    if (val === undefined || val === null || val === '') return 'Contact';
    if (typeof val === 'number') {
      return `${appSettings.currency || '₹'}${val.toLocaleString('en-IN')}`;
    }
    const str = String(val).trim();
    if (!isNaN(Number(str))) {
      return `${appSettings.currency || '₹'}${Number(str).toLocaleString('en-IN')}`;
    }
    return str;
  };

  useEffect(() => {
    let isMounted = true;
    fetchAppSettings().then(settings => {
      if (isMounted) {
        setAppSettings(settings);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    await refreshSubscription();
    const latestSettings = await fetchAppSettings();
    setAppSettings(latestSettings);
    setIsRefreshing(false);
    setRefreshMessage('Status & pricing checked with Supabase database.');
    setTimeout(() => setRefreshMessage(null), 3000);
  };

  const adminPhone = appSettings.support_phone || '+91 98765 43210';
  const lifetimeText = appSettings.lifitime_plan ? ` or ${formatPlanPrice(appSettings.lifitime_plan)} lifetime` : '';
  const whatsappUrl = `https://wa.me/${adminPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello Neeraj ji, I want to activate subscription for my Auto Workshop account.\nEmail: ${user?.email || 'N/A'}\nWorkshop: ${profile?.workshop_name || 'My Workshop'}\n(Pricing: ${appSettings.currency}${appSettings.monthly_price}/month, ${appSettings.currency}${appSettings.yearly_price}/year${lifetimeText})`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans p-4 sm:p-6">
      
      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
            <Wrench className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm text-white">Auto Workshop Invoice Maker</span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSupabaseConfig && (
            <button
              onClick={onOpenSupabaseConfig}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition"
            >
              <Database className="w-3 h-3 text-amber-400" />
              <span>Supabase</span>
            </button>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-lg w-full bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center">
          
          {/* Background Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Lock className="w-10 h-10 stroke-[2.2] animate-bounce" />
          </div>

          {/* Exact Required Message */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>App Locked · Inactive Subscription</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Please contact admin for subscription
          </h1>



          {/* Dynamic Pricing Plans Box (Fetched live from Supabase app_settings) */}
          <div className="my-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5" />
                <span>Live Subscription Pricing</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Supabase Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
              {/* Box 1: Monthly Plan */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Plan</span>
                  <span className="text-base sm:text-lg font-mono font-black text-white mt-1 block truncate">
                    {appSettings.currency || '₹'}{typeof appSettings.monthly_price === 'number' ? appSettings.monthly_price.toLocaleString('en-IN') : appSettings.monthly_price}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Per Month</span>
              </div>

              {/* Box 2: Yearly Plan */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Yearly Plan</span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-300 mt-1 block truncate">
                    {appSettings.currency || '₹'}{typeof appSettings.yearly_price === 'number' ? appSettings.yearly_price.toLocaleString('en-IN') : appSettings.yearly_price}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Per Year</span>
              </div>

              {/* Box 3: Lifetime Plan (Dynamic from Supabase app_settings.lifitime_plan) */}
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-3 flex flex-col justify-between relative shadow-sm">
                <span className="absolute -top-2.5 right-2 bg-amber-500 text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                  Best Deal
                </span>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Lifetime Plan</span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-200 mt-1 block truncate" title={String(appSettings.lifitime_plan ?? '')}>
                    {formatPlanPrice(appSettings.lifitime_plan)}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium mt-1">One-Time / Permanent</span>
              </div>
            </div>
          </div>

          {/* Account Details Box */}
          <div className="mb-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Logged In User:</span>
              </span>
              <strong className="font-mono text-white text-xs">{user?.email}</strong>
            </div>

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Database Table:</span>
              <span className="font-mono font-bold text-amber-400">
                public.users
              </span>
            </div>

            {profile?.subscription_plan ? (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Plan (subscription_plan):</span>
                <span className="font-mono font-bold text-amber-400">
                  {profile.subscription_plan}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="text-slate-400 font-medium">Database Connection:</span>
              {isConfigured ? (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px] rounded">
                  <Database className="w-3 h-3" />
                  <span>Supabase Cloud Connected</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold text-[10px] rounded">
                  <span>Demo Mode (Local Storage)</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Database is_active Status:</span>
              <span className={`px-2 py-0.5 font-mono font-extrabold text-[10px] uppercase rounded border ${
                Boolean(profile?.is_active)
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                is_active = {String(profile?.is_active ?? 'false')}
              </span>
            </div>
          </div>

          {!isConfigured && onOpenSupabaseConfig && (
            <div className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-left text-xs text-amber-200">
              <div className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
                <Database className="w-4 h-4" />
                <span>Notice: Supabase Not Connected in this Browser!</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Agar aapne Supabase dashboard me condition true ki hai, toh pehle is browser me apna Supabase URL aur Anon Key connect karein (upar <strong>Supabase</strong> button se), ya fir seedhe niche diye gaye <strong>"Set is_active = true (Unlock App)"</strong> button par click karein.
              </p>
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer shadow"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Open Supabase Connection Setup</span>
              </button>
            </div>
          )}

          {/* Refresh Notification */}
          {refreshMessage && (
            <div className="mb-4 p-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-xl text-xs flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{refreshMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5">
            {/* WhatsApp Admin */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg transition active:scale-95"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>WhatsApp Admin to Pay & Activate</span>
            </a>

            {/* Call Admin */}
            <a
              href={`tel:${adminPhone}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Call Admin: {adminPhone}</span>
            </a>

            {/* Check / Refresh Status */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-950 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs border border-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Check / Refresh Activation Status & Pricing</span>
            </button>
          </div>



        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-2 border-t border-slate-800 max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Software Created by Neeraj Biswas · For Automotive Car Garages</span>
        <span>Netlify & Supabase Live Pricing Enabled</span>
      </footer>

    </div>
  );
};
