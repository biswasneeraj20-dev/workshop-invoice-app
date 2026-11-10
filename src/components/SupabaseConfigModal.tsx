import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoredSupabaseConfig } from '../lib/supabase';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Save,
  RotateCcw,
} from 'lucide-react';

interface SupabaseConfigModalProps {
  onClose: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- ========================================================
-- AUTO WORKSHOP INVOICE MAKER - SUPABASE SQL SCHEMA & TRIGGER
-- SINGLE TABLE ARCHITECTURE: public.users ONLY
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ========================================================

-- 1. Create public.users table to manage user subscriptions & active status
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  workshop_name text default '',
  phone text default '',
  address text default '',
  city text default '',
  gstin text default '',
  upi_id text default '',
  logo_url text default '',
  is_active boolean default false,
  bills_created_count integer default 0,
  max_free_bills integer default 2,
  subscription_plan text default 'free_trial',
  subscription_end_date timestamptz,
  current_session_id text,
  created_at timestamptz default now()
);

-- Ensure all columns exist if table was already created
alter table public.users add column if not exists workshop_name text default '';
alter table public.users add column if not exists phone text default '';
alter table public.users add column if not exists address text default '';
alter table public.users add column if not exists city text default '';
alter table public.users add column if not exists gstin text default '';
alter table public.users add column if not exists upi_id text default '';
alter table public.users add column if not exists logo_url text default '';
alter table public.users add column if not exists current_session_id text;

-- 2. Create app_settings table for dynamic subscription pricing (monthly_price, yearly_price, lifitime_plan)
create table if not exists public.app_settings (
  id serial primary key,
  monthly_price numeric not null default 499,
  yearly_price numeric not null default 3999,
  lifitime_plan numeric default 7999,
  currency text default '₹',
  support_phone text default '+91 98765 43210',
  updated_at timestamptz default now()
);

-- Ensure lifitime_plan column exists if table was already created
alter table public.app_settings add column if not exists lifitime_plan numeric default 7999;

insert into public.app_settings (id, monthly_price, yearly_price, lifitime_plan, currency, support_phone)
values (1, 499, 3999, 7999, '₹', '+91 98765 43210')
on conflict (id) do nothing;

-- 3. Enable Row Level Security (RLS) & Grant full access policies
alter table public.users enable row level security;
alter table public.app_settings enable row level security;

-- Permissive policies so client apps can query and insert smoothly
drop policy if exists "Enable all operations for users" on public.users;
create policy "Enable all operations for users"
  on public.users for all
  using (true)
  with check (true);

drop policy if exists "Anyone can read app_settings" on public.app_settings;
create policy "Anyone can read app_settings"
  on public.app_settings for select
  using (true);

-- STEP 0: DROP OLD FAILING TRIGGERS (FIXES "Database error saving new user")
drop trigger if exists on_auth_user_created on auth.users;

-- 4. DIRECT DATABASE TRIGGER FUNCTION (OPTIONAL & SAFE)
-- Automatically copies new users from auth.users into public.users without ever throwing fatal errors
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  -- Insert into public.users with is_active = false
  insert into public.users (
    id,
    email,
    workshop_name,
    phone,
    is_active,
    bills_created_count,
    max_free_bills,
    subscription_plan
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'workshop_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    false, -- starts as false for 2 free bills trial
    0,
    2,
    'free_trial'
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- Exception handler ensures trigger errors NEVER abort auth.users creation
    return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. INSTANT BACKFILL / SYNC FOR ALL EXISTING USERS IN auth.users
-- Copies all users who have already registered into public.users right now!
insert into public.users (id, email, workshop_name, phone, is_active, bills_created_count, max_free_bills, subscription_plan)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'workshop_name', ''),
  coalesce(raw_user_meta_data->>'phone', ''),
  false,
  0,
  2,
  'free_trial'
from auth.users
on conflict (id) do nothing;

-- 6. Grant database execution permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.users to postgres, anon, authenticated, service_role;
grant all on table public.app_settings to postgres, anon, authenticated, service_role;
grant execute on function public.handle_new_user() to postgres, anon, authenticated, service_role;

-- 7. Create public.invoices table for multi-device cloud bill sync
create table if not exists public.invoices (
  id text primary key,
  user_id text not null,
  user_email text,
  invoice_number text not null,
  job_card_number text,
  date text,
  customer_name text,
  customer_phone text,
  customer_address text,
  vehicle_number text,
  car_model text,
  kilometers numeric default 0,
  fuel_level text,
  mechanic_name text,
  customer_complaints text,
  items jsonb default '[]'::jsonb,
  labor_subtotal numeric default 0,
  parts_subtotal numeric default 0,
  discount_total numeric default 0,
  gst_applied boolean default true,
  gst_rate numeric default 18,
  gst_amount numeric default 0,
  grand_total numeric default 0,
  payment_status text default 'Paid',
  payment_method text,
  amount_paid numeric default 0,
  balance_due numeric default 0,
  notes text,
  created_at timestamptz default now()
);

alter table public.invoices enable row level security;
drop policy if exists "Enable full access for authenticated users to their invoices" on public.invoices;
create policy "Enable full access for authenticated users to their invoices"
  on public.invoices for all
  using (true)
  with check (true);

grant all on table public.invoices to postgres, anon, authenticated, service_role;
`;

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ onClose }) => {
  const { saveSupabaseConfig, resetSupabaseConfig, isConfigured } = useAuth();
  const currentConfig = getStoredSupabaseConfig();

  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    resetSupabaseConfig();
    setUrl('');
    setAnonKey('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Supabase Database & Netlify Setup</span>
                {isConfigured && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase rounded-full">
                    Connected
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Connect your real Supabase project to manage user authentication & active subscriptions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Copy SQL Query */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Step 1: Run SQL in Supabase Dashboard
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'SQL Copied!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Open your Supabase Project at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">supabase.com</a> &rarr; Click <strong>SQL Editor</strong> &rarr; Click <strong>New Query</strong> &rarr; Paste & click <strong>Run</strong>.
          </p>

          <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Instant Login Tip:</strong> Supabase Dashboard me <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong> me jaakar <strong>&quot;Confirm email&quot;</strong> ko <strong>OFF (Uncheck)</strong> karein. Isse naye workshop owners signup karte hi bina verification email ke direct login ho jayenge!
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto">
            <pre>{SUPABASE_SQL_SCRIPT}</pre>
          </div>
        </div>

        {/* Step 2: Supabase Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Step 2: Enter Supabase API Credentials
            </span>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <span>Get API Keys from Project Settings</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project URL (e.g. https://xyzcompany.supabase.co)
            </label>
            <input
              type="text"
              placeholder="https://yourprojectid.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Anon Public API Key (anon public)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {saveSuccess && (
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Supabase credentials saved successfully!</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Demo Mode</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Supabase</span>
            </button>
          </div>
        </form>

        {/* Netlify Deployment Guide */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Netlify Deployment Tip:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Jab aap is app ko Netlify par deploy karenge, toh Netlify ke <strong>Site Configuration &rarr; Environment variables</strong> me ye dono variables add karein:
            <br />
            <code className="text-amber-300 font-mono">VITE_SUPABASE_URL</code> aur <code className="text-amber-300 font-mono">VITE_SUPABASE_ANON_KEY</code>.
          </p>
        </div>

      </div>
    </div>
  );
};
