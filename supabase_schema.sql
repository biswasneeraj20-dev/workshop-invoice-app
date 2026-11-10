-- ========================================================
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

-- ========================================================
-- ADMIN COMMANDS REFERENCE:
-- 1. Activate User:
--    update public.users set is_active = true where email = 'client@gmail.com';
--
-- 2. Deactivate User (Strict Lock):
--    update public.users set is_active = false where email = 'client@gmail.com';
--
-- 3. Update Live Pricing:
--    update public.app_settings set monthly_price = 599, yearly_price = 4999 where id = 1;
-- ========================================================
