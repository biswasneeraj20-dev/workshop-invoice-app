import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserSubscriptionProfile } from '../types';
import {
  getSupabase,
  isSupabaseConnected,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  signUpUser,
  signInUser,
  signOutUser,
  fetchUserProfile,
  incrementUserBillCount,
  toggleDemoSubscription,
  parseBooleanActive,
  getDeviceSessionId,
  resetUserPassword,
  deleteUserAccount,
} from '../lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserSubscriptionProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  billsCreatedCount: number;
  maxFreeBills: number;
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  canCreateBill: boolean;
  isAppLocked: boolean;
  lockReason: 'trial_expired' | 'admin_deactivated' | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    pass: string,
    meta: { workshopName?: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  recordBillCreated: () => Promise<void>;
  saveSupabaseConfig: (url: string, key: string) => void;
  resetSupabaseConfig: () => void;
  toggleDevActiveStatus: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserSubscriptionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isSupabaseConnected());

  // Check initial session
  const initAuth = useCallback(async () => {
    setIsLoading(true);
    const client = getSupabase();

    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data.session?.user) {
          const u = {
            id: data.session.user.id,
            email: data.session.user.email || '',
          };
          setUser(u);
          const prof = await fetchUserProfile(u.id, u.email);
          setProfile(prof);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      }
    }

    // Check demo user
    try {
      const demoUser = localStorage.getItem('autopro_demo_auth_user');
      if (demoUser) {
        const parsed = JSON.parse(demoUser);
        if (parsed.id && parsed.email) {
          setUser(parsed);
          const prof = await fetchUserProfile(parsed.id, parsed.email);
          setProfile(prof);
        }
      }
    } catch {
      // ignore
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Listen to Supabase auth state changes if connected
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email || '' };
        setUser(u);
        const prof = await fetchUserProfile(u.id, u.email);
        setProfile(prof);
      } else if (event === 'SIGNED_OUT') {
        // User explicitly logged out
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await signInUser(email, pass);
    setIsLoading(false);

    if (res.error) {
      return { success: false, error: res.error };
    }

    setUser(res.user);
    setProfile(res.profile);
    return { success: true };
  };

  const signup = async (
    email: string,
    pass: string,
    meta: { workshopName?: string; phone?: string }
  ) => {
    setIsLoading(true);
    const res = await signUpUser(email, pass, meta);
    setIsLoading(false);

    if (res.error) {
      return {
        success: false,
        error: res.error,
        requiresEmailConfirmation: res.requiresEmailConfirmation,
      };
    }

    if (res.user) {
      setUser(res.user);
      setProfile(res.profile);
    }
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    const res = await resetUserPassword(email);
    setIsLoading(false);
    return res;
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    await signOutUser();
    setUser(null);
    setProfile(null);
    setIsLoading(false);
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No user logged in' };
    setIsLoading(true);
    const res = await deleteUserAccount(user.id, user.email);
    setUser(null);
    setProfile(null);
    setIsLoading(false);
    return res;
  }, [user]);

  const refreshSubscription = async () => {
    if (!user) return;
    setIsLoading(true);
    const freshProfile = await fetchUserProfile(user.id, user.email);
    setProfile(freshProfile);
    setIsLoading(false);
  };

  const recordBillCreated = async () => {
    if (!user) return;
    const updated = await incrementUserBillCount(user.id, user.email);
    setProfile(updated);
  };

  const saveSupabaseConfig = (url: string, key: string) => {
    saveStoredSupabaseConfig(url, key);
    setIsConfigured(isSupabaseConnected());
    initAuth();
  };

  const resetSupabaseConfig = () => {
    clearStoredSupabaseConfig();
    setIsConfigured(false);
    initAuth();
  };

  const toggleDevActiveStatus = async (active: boolean) => {
    if (!user) return;
    await toggleDemoSubscription(user.id, active, user.email);
    setProfile(prev => (prev ? { ...prev, is_active: active } : null));
    refreshSubscription();
  };

  // Calculations for subscription:
  // If is_active = true, user has full paid subscription.
  // If is_active = false, user gets 2 free bills trial. App locks only when billsCreatedCount >= maxFreeBills.
  const billsCreatedCount = profile?.bills_created_count || 0;
  const maxFreeBills = profile?.max_free_bills !== undefined ? profile.max_free_bills : 2;
  const isSubscriptionActive = parseBooleanActive(profile?.is_active);
  const isTrialActive = !isSubscriptionActive && billsCreatedCount < maxFreeBills;
  const canCreateBill = isSubscriptionActive || isTrialActive;

  // App lock condition:
  // Locked only when not active AND free trial bills (2 bills) have been exhausted.
  const isAppLocked = Boolean(user && profile && !canCreateBill);
  const lockReason: 'trial_expired' | 'admin_deactivated' | null = isAppLocked
    ? (billsCreatedCount >= maxFreeBills ? 'trial_expired' : 'admin_deactivated')
    : null;

  // Single-device session enforcement & Real-time active status polling:
  // Polls Supabase public.users in background every 3.5 seconds.
  // If another device logs in, current_session_id changes in database and this device automatically logs out!
  useEffect(() => {
    if (!user) return;

    const intervalId = setInterval(async () => {
      try {
        const fresh = await fetchUserProfile(user.id, user.email);
        
        // Single Device Login Check:
        const currentDeviceToken = getDeviceSessionId();
        if (fresh.current_session_id && fresh.current_session_id !== currentDeviceToken) {
          alert('Security Alert: Aapka account kisi doosre device me login kar liya gaya hai! Aap is device se automatic Log Out ho gaye hain.');
          await logout();
          return;
        }

        const freshIsActive = parseBooleanActive(fresh.is_active);
        const currentIsActive = parseBooleanActive(profile?.is_active);
        if (freshIsActive !== currentIsActive || fresh.subscription_plan !== profile?.subscription_plan) {
          setProfile(fresh);
        }
      } catch (e) {
        console.warn('Session sync check failed:', e);
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, [user, profile?.is_active, profile?.subscription_plan, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        billsCreatedCount,
        maxFreeBills,
        isTrialActive,
        isSubscriptionActive,
        canCreateBill,
        isAppLocked,
        lockReason,
        login,
        signup,
        logout,
        resetPassword,
        deleteAccount,
        refreshSubscription,
        recordBillCreated,
        saveSupabaseConfig,
        resetSupabaseConfig,
        toggleDevActiveStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
