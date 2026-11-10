import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserSubscriptionProfile, Invoice } from '../types';

const STORAGE_KEY_SUPABASE = 'autopro_supabase_config';
const STORAGE_KEY_DEMO_USER = 'autopro_demo_auth_user';
const STORAGE_KEY_DEMO_PROFILES = 'autopro_demo_auth_profiles';
const STORAGE_KEY_SESSION_ID = 'autopro_device_session_token';

export function getDeviceSessionId(): string {
  try {
    let sess = localStorage.getItem(STORAGE_KEY_SESSION_ID);
    if (!sess) {
      sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEY_SESSION_ID, sess);
    }
    return sess;
  } catch {
    return `sess_${Date.now()}`;
  }
}

export function createNewDeviceSessionId(): string {
  const sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  try {
    localStorage.setItem(STORAGE_KEY_SESSION_ID, sess);
  } catch {
    // ignore
  }
  return sess;
}

export function clearDeviceSessionId(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION_ID);
  } catch {
    // ignore
  }
}

export async function updateUserSessionToken(userId: string, sessionId: string): Promise<void> {
  const client = getSupabase();
  if (client && userId) {
    try {
      await client.from('users').update({ current_session_id: sessionId }).eq('id', userId);
    } catch (err) {
      console.warn('Could not update current_session_id in Supabase:', err);
    }
  }
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  if (envUrl && envKey && !envUrl.includes('your-project-id')) {
    return { url: envUrl.trim(), anonKey: envKey.trim() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch {
    // ignore
  }

  return { url: '', anonKey: '' };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY_SUPABASE,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
  } catch (err) {
    console.error('Failed to save Supabase config', err);
  }
}

export function clearStoredSupabaseConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY_SUPABASE);
  } catch {
    // ignore
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfigString = '';

export function getSupabase(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    supabaseInstance = null;
    currentConfigString = '';
    return null;
  }

  const configKey = `${config.url}_${config.anonKey}`;
  if (supabaseInstance && currentConfigString === configKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigString = configKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  const config = getStoredSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.includes('supabase.co'));
}

/* =========================================================
   DEMO / SIMULATED DATABASE HELPERS
   (Used when Supabase credentials are not yet entered)
   ========================================================= */

function getDemoProfiles(): Record<string, UserSubscriptionProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEMO_PROFILES);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveDemoProfiles(profiles: Record<string, UserSubscriptionProfile>) {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO_PROFILES, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

/* =========================================================
   AUTHENTICATION & PROFILE METHODS
   ========================================================= */

export async function signUpUser(
  email: string,
  pass: string,
  metadata: { workshopName?: string; phone?: string }
): Promise<{
  user: { id: string; email: string } | null;
  profile: UserSubscriptionProfile | null;
  error?: string;
  requiresEmailConfirmation?: boolean;
}> {
  const client = getSupabase();

  if (client) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const workshopName = (metadata.workshopName || '').trim();
      const phone = (metadata.phone || '').trim();

      console.log('[Supabase SignUp] Initiating signup for:', cleanEmail);

      // 1. Sign up with user metadata so auth.users & triggers receive the info
      let signUpResult = await client.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            workshop_name: workshopName,
            phone: phone,
          },
        },
      });

      // If signup failed with "Database error saving new user", it is usually because an old trigger on auth.users failed.
      // Automatically retry minimal signup without metadata:
      if (signUpResult.error && signUpResult.error.message.toLowerCase().includes('database error saving new user')) {
        console.warn('[Supabase SignUp] Database trigger error with metadata. Retrying minimal auth signup...');
        const minimalSignUp = await client.auth.signUp({
          email: cleanEmail,
          password: pass,
        });
        if (!minimalSignUp.error && minimalSignUp.data?.user) {
          console.log('[Supabase SignUp] Minimal signup without metadata succeeded!');
          signUpResult = minimalSignUp;
        } else if (minimalSignUp.error) {
          console.warn('[Supabase SignUp] Minimal signup also failed:', minimalSignUp.error.message);
          signUpResult = minimalSignUp;
        }
      }

      const { data, error } = signUpResult;

      if (error) {
        console.error('[Supabase SignUp] Auth error:', error);
        let errorMsg = error.message;
        const lower = errorMsg.toLowerCase();
        if (lower.includes('already registered') || lower.includes('user already registered')) {
          errorMsg = 'Is email se already account registered hai. Kripya "Log In" par click karke login karein ya Forgot Password use karein.';
        } else if (lower.includes('password should be at least')) {
          errorMsg = 'Password kam se kam 6 akshar (characters) ka hona chahiye.';
        } else if (lower.includes('database error saving new user')) {
          errorMsg = 'Supabase Database Trigger Error: Aapke Supabase project me auth.users par laga hua trigger fail ho raha hai. Supabase Dashboard -> SQL Editor me ye run karein: DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;';
        }
        return { user: null, profile: null, error: errorMsg };
      }

      if (!data?.user) {
        return { user: null, profile: null, error: 'Sign up failed. Please try again.' };
      }

      // Check if user already existed (Supabase returns empty identities array when email confirmation is enabled and user already exists)
      if (data.user.identities && data.user.identities.length === 0) {
        return {
          user: null,
          profile: null,
          error: 'Is email se already account bana hua hai. Kripya "Log In" tab me jaakar login karein.',
        };
      }

      console.log('[Supabase SignUp] Auth user created successfully, id:', data.user.id);
      const newSessId = createNewDeviceSessionId();

      // 2. Direct save / upsert into public.users table with workshopName and phone
      // Ensures data is saved in public.users even if trigger had issues or is absent
      try {
        const userRow = {
          id: data.user.id,
          email: cleanEmail,
          workshop_name: workshopName,
          phone: phone,
          is_active: false,
          bills_created_count: 0,
          max_free_bills: 2,
          subscription_plan: 'free_trial',
          current_session_id: newSessId,
          created_at: new Date().toISOString(),
        };

        const { error: upsertErr } = await client.from('users').upsert([userRow], { onConflict: 'id' });
        if (upsertErr) {
          console.warn('[Supabase SignUp] public.users upsert notice:', upsertErr.message);
          // If upsert had a constraint or conflict, attempt update
          await client.from('users').update({
            workshop_name: workshopName,
            phone: phone,
            current_session_id: newSessId,
          }).eq('id', data.user.id);
        }
      } catch (dbErr) {
        console.warn('[Supabase SignUp] Exception writing to public.users:', dbErr);
      }

      // 3. If Supabase did not return an active session (e.g. Email Confirmation is enabled),
      // attempt immediate signInWithPassword
      let activeUser = data.user;
      if (!data.session) {
        console.log('[Supabase SignUp] No session returned by signUp, attempting auto signInWithPassword...');
        const { data: signInData, error: signInErr } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (signInData?.user) {
          activeUser = signInData.user;
        } else if (signInErr) {
          console.warn('[Supabase SignUp] Auto sign-in notice:', signInErr.message);
          if (signInErr.message.toLowerCase().includes('email not confirmed')) {
            return {
              user: null,
              profile: null,
              requiresEmailConfirmation: true,
              error: 'Account create ho gaya hai! Supabase me "Confirm email" on hai. Kripya apna email inbox check karke verify karein, ya Supabase Auth Settings me "Confirm email" off karein.',
            };
          }
        }
      }

      // 4. Fetch the profile from Supabase with initial metadata fallback
      const profile = await fetchUserProfile(activeUser.id, activeUser.email || cleanEmail, {
        workshopName,
        phone,
      });

      return {
        user: { id: activeUser.id, email: activeUser.email || cleanEmail },
        profile: profile,
      };
    } catch (e: any) {
      console.error('[Supabase SignUp] Critical exception:', e);
      return { user: null, profile: null, error: e?.message || 'Failed to sign up' };
    }
  }

  // Demo Fallback Mode
  const demoProfiles = getDemoProfiles();
  const normalizedEmail = email.trim().toLowerCase();
  const demoId = `usr_demo_${Date.now()}`;
  const newSessId = createNewDeviceSessionId();

  const demoProfile: UserSubscriptionProfile = {
    id: demoId,
    email: normalizedEmail,
    workshop_name: metadata.workshopName || 'My Auto Workshop',
    phone: metadata.phone || '',
    is_active: false,
    bills_created_count: 0,
    max_free_bills: 2,
    subscription_plan: 'free_trial',
    current_session_id: newSessId,
    created_at: new Date().toISOString(),
  };

  demoProfiles[demoId] = demoProfile;
  saveDemoProfiles(demoProfiles);
  localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify({ id: demoId, email: normalizedEmail }));

  return {
    user: { id: demoId, email: normalizedEmail },
    profile: demoProfile,
  };
}

export async function signInUser(
  email: string,
  pass: string
): Promise<{ user: { id: string; email: string } | null; profile: UserSubscriptionProfile | null; error?: string }> {
  const newSessId = createNewDeviceSessionId();
  const cleanEmail = email.trim().toLowerCase();

  // Instant demo login bypass
  if (cleanEmail === 'demo.workshop@gmail.com') {
    const demoProfiles = getDemoProfiles();
    const demoId = 'usr_demo_workshop_owner';
    const demoProfile: UserSubscriptionProfile = demoProfiles[demoId] || {
      id: demoId,
      email: cleanEmail,
      workshop_name: 'Apex Multi-Brand Car Service',
      phone: '+91 98765 43210',
      is_active: false,
      bills_created_count: 0,
      max_free_bills: 2,
      subscription_plan: 'free_trial',
      current_session_id: newSessId,
      created_at: new Date().toISOString(),
    };
    demoProfiles[demoId] = demoProfile;
    saveDemoProfiles(demoProfiles);
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify({ id: demoId, email: cleanEmail }));
    return {
      user: { id: demoId, email: cleanEmail },
      profile: demoProfile,
    };
  }

  const client = getSupabase();

  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        let msg = error.message;
        const lower = msg.toLowerCase();
        if (lower.includes('invalid login credentials')) {
          msg = 'Galat email ya password. Kripya check karein ya "Sign Up" par jaakar naya account banayein.';
        } else if (lower.includes('email not confirmed')) {
          msg = 'Aapka email verify nahi hua hai. Kripya apna email inbox check karein ya Supabase Dashboard me "Confirm email" band karein.';
        }
        return { user: null, profile: null, error: msg };
      }

      if (!data.user) {
        return { user: null, profile: null, error: 'Sign in failed. Please try again.' };
      }

      await updateUserSessionToken(data.user.id, newSessId);
      const profile = await fetchUserProfile(data.user.id, data.user.email || cleanEmail);
      profile.current_session_id = newSessId;

      return {
        user: { id: data.user.id, email: data.user.email || cleanEmail },
        profile,
      };
    } catch (e: any) {
      return { user: null, profile: null, error: e?.message || 'Login failed' };
    }
  }

  // Demo Fallback Mode
  const normalizedEmail = email.trim().toLowerCase();
  const demoProfiles = getDemoProfiles();

  let existing = Object.values(demoProfiles).find(p => p.email.toLowerCase() === normalizedEmail);
  if (!existing) {
    return {
      user: null,
      profile: null,
      error: 'Account nahi mila. Kripya pehle "Sign Up" karein.',
    };
  }

  existing.current_session_id = newSessId;
  demoProfiles[existing.id] = existing;
  saveDemoProfiles(demoProfiles);
  localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify({ id: existing.id, email: existing.email }));

  return {
    user: { id: existing.id, email: existing.email },
    profile: existing,
  };
}

export async function signOutUser(): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
  clearDeviceSessionId();
  localStorage.removeItem(STORAGE_KEY_DEMO_USER);
}

export async function deleteUserAccount(
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();

  if (client) {
    try {
      console.log('[Supabase Delete] Starting account deletion for:', { userId, userEmail });

      // 1. First invoke RPC delete_user_account (which deletes auth user and cascades)
      try {
        const { error: rpcError } = await client.rpc('delete_user_account');
        if (rpcError) {
          console.warn('[Supabase Delete] delete_user_account RPC notice:', rpcError.message);
        } else {
          console.log('[Supabase Delete] delete_user_account RPC succeeded!');
        }
      } catch (rpcErr) {
        console.warn('[Supabase Delete] RPC delete_user_account exception:', rpcErr);
      }

      // 2. Delete user's invoices/bills from Supabase table if not cascaded
      try {
        await client.from('invoices').delete().eq('user_id', userId);
        if (userEmail) {
          await client.from('invoices').delete().ilike('user_email', userEmail.trim().toLowerCase());
        }
      } catch (err) {
        console.warn('Invoices table delete notice:', err);
      }

      // 3. Delete user record from public.users table directly
      try {
        const { error: dbError } = await client
          .from('users')
          .delete()
          .eq('id', userId);

        if (dbError && userEmail) {
          console.warn('Error deleting by id, trying email match:', dbError.message);
          await client
            .from('users')
            .delete()
            .ilike('email', userEmail.trim().toLowerCase());
        }
      } catch (uErr) {
        console.warn('Users table delete notice:', uErr);
      }

      // 4. Sign out the user & clear session
      try {
        await client.auth.signOut();
      } catch (soErr) {
        console.warn('Sign out notice during account deletion:', soErr);
      }
    } catch (e: any) {
      console.error('[Supabase Delete] Unexpected error:', e);
      return { success: false, error: e?.message || 'Failed to delete user account' };
    }
  }

  // Clear all bills, invoices, labor, parts, profile, and demo data from localStorage
  try {
    localStorage.removeItem('autopro_invoices_v1');
    localStorage.removeItem('autopro_labor_services_v1');
    localStorage.removeItem('autopro_spare_parts_v1');
    localStorage.removeItem('autopro_profile_v1');
  } catch {
    // ignore
  }

  // Demo Fallback Mode
  const demoProfiles = getDemoProfiles();
  if (demoProfiles[userId]) {
    delete demoProfiles[userId];
    saveDemoProfiles(demoProfiles);
  }
  clearDeviceSessionId();
  localStorage.removeItem(STORAGE_KEY_DEMO_USER);

  return { success: true };
}

export async function resetUserPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  const normalizedEmail = email.trim().toLowerCase();

  if (client) {
    try {
      const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send password reset email' };
    }
  }

  // Demo Fallback Mode
  const demoProfiles = getDemoProfiles();
  const existing = Object.values(demoProfiles).find(p => p.email.toLowerCase() === normalizedEmail);
  if (!existing) {
    return { success: false, error: 'Account not found. Please check your email address.' };
  }

  return { success: true };
}

export function parseBooleanActive(val: any): boolean {
  if (val === true) return true;
  if (val === false) return false;
  if (val === 1 || val === '1') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'true' || s === 't' || s === 'yes' || s === 'active';
  }
  return false;
}

export async function fetchUserProfile(
  userId: string,
  userEmail: string,
  initialData?: { workshopName?: string; phone?: string }
): Promise<UserSubscriptionProfile> {
  const client = getSupabase();
  const normalizedEmail = (userEmail || '').trim().toLowerCase();

  if (client) {
    let userData: any = null;

    // 1. Check if record exists in public.users table (search by ID first, then Email)
    try {
      if (userId) {
        const { data, error } = await client.from('users').select('*').eq('id', userId).maybeSingle();
        if (!error && data) {
          userData = data;
        }
      }
      if (!userData && normalizedEmail) {
        const { data, error } = await client.from('users').select('*').ilike('email', normalizedEmail).limit(1).maybeSingle();
        if (!error && data) {
          userData = data;
        }
      }
    } catch (err) {
      console.warn('[Supabase Check] Error querying public.users:', err);
    }

    // 2. If record exists in public.users table:
    if (userData) {
      const isActive = parseBooleanActive(userData.is_active);
      const workshopName = userData.workshop_name || initialData?.workshopName || '';
      const phone = userData.phone || initialData?.phone || '';

      // If existing database record had blank workshop_name or phone and we have initialData, update it now
      if ((!userData.workshop_name && initialData?.workshopName) || (!userData.phone && initialData?.phone)) {
        try {
          await client.from('users').update({
            workshop_name: workshopName,
            phone: phone,
          }).eq('id', userData.id || userId);
        } catch {
          // ignore
        }
      }

      return {
        id: userId || userData.id,
        email: normalizedEmail || userData.email,
        workshop_name: workshopName,
        phone: phone,
        address: userData.address || '',
        city: userData.city || '',
        gstin: userData.gstin || '',
        upi_id: userData.upi_id || '',
        logo_url: userData.logo_url || '',
        is_active: isActive, // STRICT: directly reflects database value, no override!
        bills_created_count: Number(userData.bills_created_count) || 0,
        max_free_bills: userData.max_free_bills !== undefined ? Number(userData.max_free_bills) : 2,
        subscription_plan: userData.subscription_plan !== undefined && userData.subscription_plan !== null
          ? String(userData.subscription_plan).trim()
          : '', // STRICT: exact value from database column, no hardcoded override!
        subscription_end_date: userData.subscription_end_date,
        current_session_id: userData.current_session_id,
        created_at: userData.created_at || new Date().toISOString(),
      };
    }

    // 3. User record doesn't exist in public.users yet:
    // Insert into public.users with is_active = false
    const newRecord: UserSubscriptionProfile = {
      id: userId,
      email: normalizedEmail,
      workshop_name: initialData?.workshopName || '',
      phone: initialData?.phone || '',
      address: '',
      city: '',
      gstin: '',
      upi_id: '',
      logo_url: '',
      is_active: false, // Strictly false by default
      bills_created_count: 0,
      max_free_bills: 2,
      subscription_plan: 'free_trial',
      current_session_id: getDeviceSessionId(),
      created_at: new Date().toISOString(),
    };

    try {
      const { error: insertErr } = await client.from('users').upsert([newRecord], { onConflict: 'id' });
      if (insertErr) {
        console.warn('Auto insert into public.users notice:', insertErr.message);
      }
    } catch (err) {
      console.warn('Auto insert into public.users failed:', err);
    }

    return newRecord;
  }

  // Demo Fallback profiles
  const demoProfiles = getDemoProfiles();
  if (demoProfiles[userId]) {
    const existing = demoProfiles[userId];
    if (initialData?.workshopName && !existing.workshop_name) {
      existing.workshop_name = initialData.workshopName;
    }
    if (initialData?.phone && !existing.phone) {
      existing.phone = initialData.phone;
    }
    return {
      ...existing,
      is_active: parseBooleanActive(existing.is_active),
    };
  }

  // Create demo record
  const fallback: UserSubscriptionProfile = {
    id: userId,
    email: normalizedEmail,
    workshop_name: initialData?.workshopName || 'My Auto Workshop',
    phone: initialData?.phone || '',
    is_active: false,
    bills_created_count: 0,
    max_free_bills: 2,
    subscription_plan: 'free_trial',
    created_at: new Date().toISOString(),
  };

  demoProfiles[userId] = fallback;
  saveDemoProfiles(demoProfiles);
  return fallback;
}

export async function saveWorkshopProfileToSupabase(
  userId: string,
  profile: { name: string; phone: string; address?: string; city?: string; gstin?: string; upiId?: string; logoUrl?: string }
): Promise<void> {
  const client = getSupabase();
  if (!client || !userId) return;

  try {
    const updatePayload: any = {
      workshop_name: profile.name || '',
      phone: profile.phone || '',
    };
    if (profile.address !== undefined) updatePayload.address = profile.address;
    if (profile.city !== undefined) updatePayload.city = profile.city;
    if (profile.gstin !== undefined) updatePayload.gstin = profile.gstin;
    if (profile.upiId !== undefined) updatePayload.upi_id = profile.upiId;
    if (profile.logoUrl !== undefined) updatePayload.logo_url = profile.logoUrl;

    const { error } = await client.from('users').update(updatePayload).eq('id', userId);
    if (error) {
      console.warn('[Supabase Profile] Save notice:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase Profile] Exception saving workshop profile:', err);
  }
}

export async function incrementUserBillCount(
  userId: string,
  userEmail: string
): Promise<UserSubscriptionProfile> {
  const client = getSupabase();

  if (client) {
    try {
      const current = await fetchUserProfile(userId, userEmail);
      const newCount = (current.bills_created_count || 0) + 1;

      // Update public.users table ONLY
      const { data, error } = await client
        .from('users')
        .update({ bills_created_count: newCount })
        .eq('id', userId)
        .select()
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          is_active: parseBooleanActive(data.is_active),
          bills_created_count: Number(data.bills_created_count),
        } as UserSubscriptionProfile;
      }

      return { ...current, bills_created_count: newCount };
    } catch (err) {
      console.warn('Could not update count in Supabase:', err);
    }
  }

  // Demo Fallback
  const demoProfiles = getDemoProfiles();
  const current = demoProfiles[userId] || {
    id: userId,
    email: userEmail,
    is_active: false,
    bills_created_count: 0,
    max_free_bills: 2,
    subscription_plan: '',
  };

  const updated: UserSubscriptionProfile = {
    ...current,
    bills_created_count: (current.bills_created_count || 0) + 1,
  };

  demoProfiles[userId] = updated;
  saveDemoProfiles(demoProfiles);
  return updated;
}

/**
 * Toggle or update is_active in demo/test mode and Supabase public.users
 */
export async function toggleDemoSubscription(userId: string, isActive: boolean, userEmail?: string) {
  const client = getSupabase();
  if (client) {
    try {
      if (userId) {
        await client.from('users').update({ is_active: isActive }).eq('id', userId);
      }
      if (userEmail) {
        const emailLower = userEmail.trim().toLowerCase();
        await client.from('users').update({ is_active: isActive }).ilike('email', emailLower);
      }
    } catch (err) {
      console.warn('Could not update active status in Supabase:', err);
    }
  }

  const demoProfiles = getDemoProfiles();
  if (demoProfiles[userId]) {
    demoProfiles[userId].is_active = isActive;
    saveDemoProfiles(demoProfiles);
  }
}

export interface AppSettings {
  monthly_price: number;
  yearly_price: number;
  lifitime_plan?: number | string;
  currency?: string;
  support_phone?: string;
}

export async function fetchAppSettings(): Promise<AppSettings> {
  const defaultSettings: AppSettings = {
    monthly_price: 499,
    yearly_price: 3999,
    lifitime_plan: 7999,
    currency: '₹',
    support_phone: '+91 98765 43210',
  };

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('app_settings')
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        const rawLifetime =
          data.lifitime_plan !== undefined && data.lifitime_plan !== null
            ? data.lifitime_plan
            : (data.lifetime_plan !== undefined && data.lifetime_plan !== null ? data.lifetime_plan : defaultSettings.lifitime_plan);

        return {
          monthly_price: data.monthly_price !== undefined ? Number(data.monthly_price) : defaultSettings.monthly_price,
          yearly_price: data.yearly_price !== undefined ? Number(data.yearly_price) : defaultSettings.yearly_price,
          lifitime_plan: rawLifetime,
          currency: data.currency || defaultSettings.currency,
          support_phone: data.support_phone || defaultSettings.support_phone,
        };
      }
    } catch (err) {
      console.warn('Could not fetch app_settings from Supabase, using defaults:', err);
    }
  }

  return defaultSettings;
}

/* =========================================================
   SUPABASE INVOICES & BILLS CLOUD SYNC METHODS
   ========================================================= */

export async function fetchUserInvoicesFromSupabase(
  userId: string,
  userEmail?: string
): Promise<Invoice[]> {
  const client = getSupabase();
  if (!client) return [];

  try {
    let query = client.from('invoices').select('*');
    if (userId && userEmail) {
      query = query.or(`user_id.eq.${userId},user_email.ilike.${userEmail.trim().toLowerCase()}`);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else if (userEmail) {
      query = query.ilike('user_email', userEmail.trim().toLowerCase());
    } else {
      return [];
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.warn('Notice querying public.invoices from Supabase:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      jobCardNumber: row.job_card_number || '',
      date: row.date || '',
      customerName: row.customer_name || '',
      customerPhone: row.customer_phone || '',
      customerAddress: row.customer_address || '',
      vehicleNumber: row.vehicle_number || '',
      carModel: row.car_model || '',
      kilometers: Number(row.kilometers) || 0,
      fuelLevel: row.fuel_level || '',
      mechanicName: row.mechanic_name || '',
      customerComplaints: row.customer_complaints || '',
      items: Array.isArray(row.items) ? row.items : [],
      laborSubtotal: Number(row.labor_subtotal) || 0,
      partsSubtotal: Number(row.parts_subtotal) || 0,
      discountTotal: Number(row.discount_total) || 0,
      gstApplied: Boolean(row.gst_applied),
      gstRate: Number(row.gst_rate) || 18,
      gstAmount: Number(row.gst_amount) || 0,
      grandTotal: Number(row.grand_total) || 0,
      paymentStatus: row.payment_status || 'Paid',
      paymentMethod: row.payment_method || 'Cash',
      amountPaid: Number(row.amount_paid) || 0,
      balanceDue: Number(row.balance_due) || 0,
      notes: row.notes || '',
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Could not fetch invoices from Supabase:', err);
    return [];
  }
}

export async function saveUserInvoiceToSupabase(
  userId: string,
  userEmail: string,
  invoice: Invoice
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    const row = {
      id: invoice.id,
      user_id: userId,
      user_email: (userEmail || '').trim().toLowerCase(),
      invoice_number: invoice.invoiceNumber,
      job_card_number: invoice.jobCardNumber,
      date: invoice.date,
      customer_name: invoice.customerName,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress || '',
      vehicle_number: invoice.vehicleNumber,
      car_model: invoice.carModel,
      kilometers: invoice.kilometers,
      fuel_level: invoice.fuelLevel || '',
      mechanic_name: invoice.mechanicName || '',
      customer_complaints: invoice.customerComplaints || '',
      items: invoice.items || [],
      labor_subtotal: invoice.laborSubtotal,
      parts_subtotal: invoice.partsSubtotal,
      discount_total: invoice.discountTotal || 0,
      gst_applied: invoice.gstApplied,
      gst_rate: invoice.gstRate,
      gst_amount: invoice.gstAmount,
      grand_total: invoice.grandTotal,
      payment_status: invoice.paymentStatus,
      payment_method: invoice.paymentMethod || 'Cash',
      amount_paid: invoice.amountPaid,
      balance_due: invoice.balanceDue,
      notes: invoice.notes || '',
      created_at: invoice.createdAt || new Date().toISOString(),
    };

    const { error } = await client.from('invoices').upsert([row], { onConflict: 'id' });
    if (error) {
      console.warn('[Supabase Invoice] Upsert notice:', error.message);
    }
  } catch (err) {
    console.warn('Could not save invoice to Supabase:', err);
  }
}

export async function updateUserInvoiceInSupabase(
  invoiceId: string,
  updated: Partial<Invoice>
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    const dbUpdates: any = {};
    if (updated.paymentStatus !== undefined) dbUpdates.payment_status = updated.paymentStatus;
    if (updated.amountPaid !== undefined) dbUpdates.amount_paid = updated.amountPaid;
    if (updated.balanceDue !== undefined) dbUpdates.balance_due = updated.balanceDue;
    if (updated.paymentMethod !== undefined) dbUpdates.payment_method = updated.paymentMethod;
    if (updated.notes !== undefined) dbUpdates.notes = updated.notes;
    if (updated.customerName !== undefined) dbUpdates.customer_name = updated.customerName;
    if (updated.customerPhone !== undefined) dbUpdates.customer_phone = updated.customerPhone;

    await client.from('invoices').update(dbUpdates).eq('id', invoiceId);
  } catch (err) {
    console.warn('Could not update invoice in Supabase:', err);
  }
}

export async function deleteUserInvoiceFromSupabase(invoiceId: string): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from('invoices').delete().eq('id', invoiceId);
  } catch (err) {
    console.warn('Could not delete invoice from Supabase:', err);
  }
}

