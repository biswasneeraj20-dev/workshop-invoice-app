import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  FileText,
  Package,
  Clock,
  Settings,
  PlusCircle,
  Phone,
  User,
  LogOut,
  ShieldCheck,
  Sparkles,
  Database,
  Lock,
} from 'lucide-react';
import workshopLogo from '../assets/images/workshop_logo_1794027071111.jpg';

interface NavbarProps {
  activeTab: 'billing' | 'invoices' | 'labor' | 'inventory' | 'settings';
  setActiveTab: (tab: 'billing' | 'invoices' | 'labor' | 'inventory' | 'settings') => void;
  onNewBillClick: () => void;
  onOpenSupabaseConfig?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewBillClick,
  onOpenSupabaseConfig,
}) => {
  const { profile } = useWorkshop();
  const {
    user,
    profile: authProfile,
    billsCreatedCount,
    maxFreeBills,
    isSubscriptionActive,
    isTrialActive,
    logout,
    isConfigured,
  } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Permanent Software Name & Workshop Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Wrench className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap">
                  Auto Workshop Invoice Maker
                </span>
                <span className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  Software
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                <span className="text-slate-400 text-[11px]">Workshop:</span>
                <span className={`truncate max-w-[160px] sm:max-w-[260px] ${profile.name ? 'text-amber-400 font-semibold' : 'text-amber-300 font-bold underline italic animate-pulse'}`}>
                  {profile.name || 'Setup Required (Settings)'}
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Create Bill</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'invoices'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Invoices & Jobs</span>
            </button>

            <button
              onClick={() => setActiveTab('labor')}
              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'labor'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Labor Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Parts Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3 py-2 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Subscription Status */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Subscription Status Badge */}
            <div className="hidden sm:flex items-center">
              {isSubscriptionActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{authProfile?.subscription_plan?.trim() || 'Active'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold font-mono">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>{authProfile?.subscription_plan?.trim() ? `${authProfile.subscription_plan} (Inactive)` : 'Inactive'}</span>
                </span>
              )}
            </div>

            {/* Supabase Indicator Button */}
            {onOpenSupabaseConfig && (
              <button
                type="button"
                onClick={onOpenSupabaseConfig}
                className={`p-1.5 rounded-lg border transition hidden xl:flex items-center gap-1 text-[11px] font-bold ${
                  isConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Supabase Database Status & Setup"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Supabase</span>
              </button>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={onNewBillClick}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow transition duration-150 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Bill</span>
            </button>

            {/* User Logged In & Logout */}
            {user && (
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 border border-slate-800 transition"
                title={`Logged in as ${user.email} (Click to Logout)`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 overflow-x-auto gap-1 text-xs">
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'billing' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Create Bill
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('labor')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'labor' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Labor
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'inventory' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Parts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1.5 rounded font-medium whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300'
            }`}
          >
            Settings
          </button>
        </div>

      </div>
    </header>
  );
};
