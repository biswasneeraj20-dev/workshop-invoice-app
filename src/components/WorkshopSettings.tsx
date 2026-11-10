import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { useAuth } from '../context/AuthContext';
import defaultWorkshopLogo from '../assets/images/workshop_logo_1794027071111.jpg';
import {
  Settings,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Building,
  Phone,
  FileText,
  CreditCard,
  Camera,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  Wrench,
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  Code,
  Lock,
  User,
  Mail,
  LogOut,
  Copy,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';

import { PaperSize, TableBorderStyle } from '../types';

interface WorkshopSettingsProps {
  onSavedGoToBilling?: () => void;
}

export const WorkshopSettings: React.FC<WorkshopSettingsProps> = ({ onSavedGoToBilling }) => {
  const { profile, updateProfile, resetAllData, laborServices, spareParts, invoices } = useWorkshop();
  const {
    user,
    profile: authProfile,
    isSubscriptionActive,
    isTrialActive,
    billsCreatedCount,
    maxFreeBills,
    logout,
    deleteAccount,
  } = useAuth();

  const [copiedUserId, setCopiedUserId] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      // 1. Erase all local bills, inventory, labor services, profile from memory & localStorage
      resetAllData();
      
      // 2. Erase remote public.users record, public.invoices from Supabase, call delete_user_account RPC and sign out
      const res = await deleteAccount();
      if (!res.success) {
        setDeleteError(res.error || 'Account deletion failed. Please check your connection.');
        setIsDeletingAccount(false);
      } else {
        setShowDeleteModal(false);
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Error occurred during account deletion.');
      setIsDeletingAccount(false);
    }
  };

  const isFirstTime = !profile.name || profile.name.trim() === '';

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline);
  const [ownerName, setOwnerName] = useState(profile.ownerName);
  const [phone, setPhone] = useState(profile.phone);
  const [alternatePhone, setAlternatePhone] = useState(profile.alternatePhone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city);
  const [gstin, setGstin] = useState(profile.gstin);
  const [defaultGstRate, setDefaultGstRate] = useState(profile.defaultGstRate);
  const [upiId, setUpiId] = useState(profile.upiId);
  const [terms, setTerms] = useState(profile.termsAndConditions.join('\n'));
  const [logoUrl, setLogoUrl] = useState<string>(profile.logoUrl || '');
  const [defaultMechanicName, setDefaultMechanicName] = useState(profile.defaultMechanicName || '');
  const [defaultGstApplied, setDefaultGstApplied] = useState<boolean>(() =>
    profile.defaultGstApplied !== undefined ? profile.defaultGstApplied : true
  );
  const [defaultPaperSize, setDefaultPaperSize] = useState<PaperSize>(
    profile.defaultPaperSize || 'A4'
  );
  const [tableBorderStyle, setTableBorderStyle] = useState<TableBorderStyle>(
    profile.tableBorderStyle || 'thin'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if profile is populated from Supabase after initial render
  React.useEffect(() => {
    if (!name && profile.name) setName(profile.name);
    if (!phone && profile.phone) setPhone(profile.phone);
    if (!email && profile.email) setEmail(profile.email);
    if (!address && profile.address) setAddress(profile.address);
    if (!city && profile.city) setCity(profile.city);
    if (!gstin && profile.gstin) setGstin(profile.gstin);
    if (!upiId && profile.upiId) setUpiId(profile.upiId);
    if (!logoUrl && profile.logoUrl) setLogoUrl(profile.logoUrl);
  }, [profile]);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('Please choose an image under 3MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      tagline: tagline.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      alternatePhone: alternatePhone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      gstin: gstin.toUpperCase().trim(),
      defaultGstRate: Number(defaultGstRate) || 18,
      upiId: upiId.trim(),
      logoUrl: logoUrl.trim(),
      defaultMechanicName: defaultMechanicName.trim(),
      defaultGstApplied,
      defaultPaperSize,
      tableBorderStyle,
      termsAndConditions: terms
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    const data = {
      profile,
      laborServices,
      spareParts,
      invoices,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autopro_workshop_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.profile) localStorage.setItem('autopro_profile_v1', JSON.stringify(json.profile));
        if (json.laborServices) localStorage.setItem('autopro_labor_services_v1', JSON.stringify(json.laborServices));
        if (json.spareParts) localStorage.setItem('autopro_spare_parts_v1', JSON.stringify(json.spareParts));
        if (json.invoices) localStorage.setItem('autopro_invoices_v1', JSON.stringify(json.invoices));
        window.location.reload();
      } catch (err) {
        alert('Invalid JSON backup file!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* First-Time Setup Welcome Alert (if profile name is blank) */}
      {isFirstTime && !savedSuccess && (
        <div className="bg-amber-500 text-slate-950 rounded-2xl p-5 shadow-lg border-2 border-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-slate-950 text-amber-400 rounded-xl shrink-0 shadow">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-950 text-amber-400 font-extrabold text-[10px] uppercase rounded-full tracking-wider mb-1">
                First Time Setup Required
              </div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Welcome to Auto Workshop Invoice Maker!
              </h3>
              <p className="text-xs font-semibold text-slate-900 mt-1 max-w-2xl leading-relaxed">
                Please enter your Workshop / Garage Name, Logo, Address, and Contact details below to activate your software profile. All details will print on your customer Tax Invoices & Job Cards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="bg-emerald-500 text-white rounded-2xl p-5 shadow-xl border border-emerald-400 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center shrink-0 shadow">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base">Workshop Business Profile Saved Successfully!</h4>
              <p className="text-xs text-emerald-100 mt-0.5">Your garage name, address, logo, and phone are active across the app.</p>
            </div>
          </div>
          {onSavedGoToBilling && (
            <button
              type="button"
              onClick={onSavedGoToBilling}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-bold text-xs rounded-xl shadow-md transition active:scale-95 whitespace-nowrap"
            >
              <span>+ Create First Bill Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Top Banner with Permanent Software Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-amber-400 rounded-md">
              Software
            </span>
            <span className="text-sm font-black text-slate-900 tracking-tight">
              Auto Workshop Invoice Maker
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <span>Workshop Business Profile & Billing Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize your garage/workshop name, address, logo, and contact details. These appear on all printed invoices and job cards.
          </p>
        </div>
      </div>

      {/* Logged-In User Account & Security Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm border border-slate-800 shrink-0">
              {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900">
                  Logged In Account
                </h3>
                {isSubscriptionActive ? (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {authProfile?.subscription_plan?.trim() || 'Active Plan'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3 text-rose-600" />
                    {authProfile?.subscription_plan?.trim() ? `${authProfile.subscription_plan} (Inactive)` : 'Inactive / Locked'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Current active session details, registered User ID, and account logout option.
              </p>
            </div>
          </div>

          {/* Account Actions: Log Out & Delete Account */}
          {user ? (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                disabled={isLoggingOut || isDeletingAccount}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition active:scale-95 border border-slate-300 cursor-pointer"
                title="Account se Log Out karein"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                disabled={isLoggingOut || isDeletingAccount}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-sm cursor-pointer"
                title="Account aur database record (public.users) permanently delete karein"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>{isDeletingAccount ? 'Deleting...' : 'Delete Account'}</span>
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No account logged in</span>
          )}
        </div>

        {/* User Details Grid */}
        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
            {/* User Email Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                  Logged In Email
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* User ID Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    User ID (Auth UID)
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUserId}
                    className="flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition shrink-0 active:scale-95 cursor-pointer"
                    title="Copy User ID to Clipboard"
                  >
                    {copiedUserId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 text-[10px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px]">Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center">
                  <span className="text-[11px] font-mono text-slate-800 font-semibold truncate select-all" title={user.id}>
                    {user.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Plan Box (Dynamically fetched from public.users) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                  Assigned Subscription Plan
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={authProfile?.subscription_plan || 'N/A'}>
                    {authProfile?.subscription_plan?.trim() || (isSubscriptionActive ? 'Active Plan' : 'No Active Plan')}
                  </p>
                  {isSubscriptionActive ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold uppercase shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-extrabold uppercase shrink-0">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
            Aap abhi offline ya guest mode me hain.
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        
        {/* Basic Workshop Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <Building className="w-4 h-4 text-amber-500" />
            <span>Workshop Logo & Identity</span>
          </h3>

          {/* Company / Workshop Logo Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              
              {/* Logo Preview Box */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-slate-300 shadow-xs overflow-hidden flex items-center justify-center shrink-0 relative group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={name || 'Workshop Logo'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoUrl('')}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                    <span className="text-[10px] mt-1 font-semibold text-slate-400 leading-tight">No Logo</span>
                  </div>
                )}
              </div>

              {/* Logo Controls */}
              <div className="space-y-2 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">
                    Company / Workshop Logo
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload garage logo (PNG, JPG, WebP). This logo prints on all customer Tax Invoices & Job Cards.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Upload from device */}
                  <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs transition">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Remove Logo */}
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                {/* Optional Web URL Input */}
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    Or image URL:
                  </span>
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    value={logoUrl.startsWith('data:') ? '' : logoUrl}
                    onChange={(e) => {
                      setLogoUrl(e.target.value.trim());
                    }}
                    className="flex-1 max-w-sm px-2.5 py-1 text-xs border border-slate-300 rounded-md font-mono bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-700"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workshop / Garage Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Specialty
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Owner / Manager Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Mechanic / Technician Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Mistry / Leave blank"
                value={defaultMechanicName}
                onChange={e => setDefaultMechanicName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone / WhatsApp *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alternate Phone
              </label>
              <input
                type="text"
                value={alternatePhone}
                onChange={e => setAlternatePhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workshop Address *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City, State & Pincode *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* GST & Payment Information */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>GST & UPI Payment Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                placeholder="07AAAAA0000A1Z5"
                value={gstin}
                onChange={e => setGstin(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default GST Rate (%)
              </label>
              <select
                value={defaultGstRate}
                onChange={e => setDefaultGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="18">18% (Standard Auto Repair)</option>
                <option value="28">28% (High Tax Parts)</option>
                <option value="12">12%</option>
                <option value="5">5%</option>
                <option value="0">0% (Non-GST / Exemption)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                UPI ID for Customer Payment
              </label>
              <input
                type="text"
                placeholder="garage@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>


            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default GST Tax Status
              </label>
              <select
                value={defaultGstApplied ? 'true' : 'false'}
                onChange={e => setDefaultGstApplied(e.target.value === 'true')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              >
                <option value="true">Ticked (Apply GST by Default)</option>
                <option value="false">Unticked (Non-GST / Exclude Tax by Default)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Paper Size Setting (A4 vs A5 Portrait) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Default Bill Paper Size Format (A4 / A5 Vertical)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* A4 Card */}
            <label
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                defaultPaperSize === 'A4'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value="A4"
                checked={defaultPaperSize === 'A4'}
                onChange={() => setDefaultPaperSize('A4')}
                className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-950">A4 Paper Size</span>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded uppercase">
                    210 × 297 mm (Vertical)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Standard portrait bill paper size. Grand Total page holds max <strong>10 items</strong>, and previous pages hold max <strong>15 items</strong> with zero empty gap grid.
                </p>
              </div>
            </label>

            {/* A5 Card */}
            <label
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                defaultPaperSize === 'A5'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value="A5"
                checked={defaultPaperSize === 'A5'}
                onChange={() => setDefaultPaperSize('A5')}
                className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-950">A5 Paper Size</span>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded uppercase">
                    148 × 210 mm (Vertical)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Compact portrait bill paper size. Grand Total page holds max <strong>6 items</strong>, and previous pages hold max <strong>10 items</strong> with zero empty gap grid.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Invoice Table Border Setting (Hide / Thin / Medium / Thick) */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Bill Table Border & Line Thickness Options (Hide / Mota / Patla)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1. None / Hide */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                tableBorderStyle === 'none'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableBorderStyle"
                    value="none"
                    checked={tableBorderStyle === 'none'}
                    onChange={() => setTableBorderStyle('none')}
                    className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-xs text-slate-950">Hide Border</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-slate-200 text-slate-700 rounded uppercase">
                  Hidden
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Table rows and column separators will have no border lines.
              </p>
              <div className="mt-3 p-1.5 bg-slate-100 rounded border-0 text-[10px] text-center font-mono text-slate-400">
                Border Off
              </div>
            </label>

            {/* 2. Thin (1px) */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                tableBorderStyle === 'thin'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableBorderStyle"
                    value="thin"
                    checked={tableBorderStyle === 'thin'}
                    onChange={() => setTableBorderStyle('thin')}
                    className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-xs text-slate-950">Thin Border</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-blue-100 text-blue-900 rounded uppercase">
                  1px Patla
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Standard clean 1px border lines for all items and table header.
              </p>
              <div className="mt-3 p-1.5 bg-slate-50 rounded border border-slate-300 text-[10px] text-center font-mono text-slate-700">
                1px Standard
              </div>
            </label>

            {/* 3. Medium (2px) */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                tableBorderStyle === 'medium'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableBorderStyle"
                    value="medium"
                    checked={tableBorderStyle === 'medium'}
                    onChange={() => setTableBorderStyle('medium')}
                    className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-xs text-slate-950">Medium Border</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-100 text-emerald-900 rounded uppercase">
                  2px Medium
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Slightly thicker 2px border lines for clearer grid lines.
              </p>
              <div className="mt-3 p-1.5 bg-slate-50 rounded border-2 border-slate-400 text-[10px] text-center font-mono font-bold text-slate-800">
                2px Medium
              </div>
            </label>

            {/* 4. Thick (3px) */}
            <label
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                tableBorderStyle === 'thick'
                  ? 'bg-amber-50/80 border-amber-500 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tableBorderStyle"
                    value="thick"
                    checked={tableBorderStyle === 'thick'}
                    onChange={() => setTableBorderStyle('thick')}
                    className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-xs text-slate-950">Thick Border</span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-400 text-slate-950 rounded uppercase">
                  3px Mota
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Bold 3px dark table borders for high contrast and prominent look.
              </p>
              <div className="mt-3 p-1.5 bg-slate-50 rounded border-[3px] border-slate-900 text-[10px] text-center font-mono font-black text-slate-950">
                3px Dark Mota
              </div>
            </label>
          </div>
        </div>

        {/* Invoice Terms & Conditions */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Printed Invoice Terms & Conditions (One per line)</span>
          </h3>

          <div>
            <textarea
              rows={4}
              value={terms}
              onChange={e => setTerms(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              These points will print at the bottom of every customer invoice and job card.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-sm shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Workshop Settings</span>
          </button>
        </div>
      </form>


      {/* Danger Zone: Permanent Account Deletion */}
      {user && (
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-400 uppercase tracking-wide">
                  Danger Zone: Permanent Account & Bill Deletion
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Permanently remove your user profile from <code className="text-rose-300 font-mono text-[11px]">public.users</code> database along with <strong>ALL your created customer bills, invoices & garage data</strong>. Once deleted, your session will end immediately and this action cannot be undone.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              disabled={isDeletingAccount || isLoggingOut}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeletingAccount ? 'Deleting Account...' : 'Delete My Account Permanently'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Permanent App Creator & Developer Information */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-4 sm:p-5 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
            <Code className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                Neeraj Biswas
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase tracking-wider">
                App Creator & Developer
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Designed & Developed by <strong className="text-slate-200 font-bold">Neeraj Biswas</strong> for Auto Workshop Invoice Maker.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>System Locked Developer Credit</span>
        </div>
      </div>

      {/* IN-APP CONFIRMATION POPUP FOR ACCOUNT DELETION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 text-slate-100 shadow-2xl space-y-4 my-auto relative animate-in zoom-in-95 duration-150">
            {/* Close Modal Button */}
            <button
              type="button"
              onClick={() => {
                if (!isDeletingAccount) setShowDeleteModal(false);
              }}
              disabled={isDeletingAccount}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Permanent Account Deletion
                </h3>
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                  Irreversible Action
                </span>
              </div>
            </div>

            {/* Detailed Warning Notice */}
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 text-xs text-rose-200 space-y-2">
              <p className="font-semibold leading-relaxed">
                Kya aap sach me apna account <strong className="text-white underline">{user?.email}</strong> aur saara data permanently delete karna chahte hain?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-300">
                <li>Supabase Database function <code className="text-amber-300 font-mono">delete_user_account()</code> call hokar aapka Auth credentials delete hoga.</li>
                <li><code className="text-amber-300 font-mono">public.users</code> se aapka user record delete hoga.</li>
                <li>Aapke banaye gaye <strong>sabhi customer bills aur invoices</strong> cloud aur local memory se permanently erase ho jayenge.</li>
              </ul>
            </div>

            {/* Error Message if any */}
            {deleteError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold text-xs rounded-xl transition border border-slate-700 cursor-pointer text-center"
              >
                Cancel (Keep Account)
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Everything</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CONFIRMATION POPUP FOR LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-slate-100 shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Log Out Confirmation</h3>
                <p className="text-xs text-slate-400">Kya aap sach me Log Out karna chahte hain?</p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoggingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>{isLoggingOut ? 'Logging out...' : 'Yes, Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
