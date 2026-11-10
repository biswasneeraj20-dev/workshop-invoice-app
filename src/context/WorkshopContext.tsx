import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  LaborService,
  SparePart,
  Invoice,
  WorkshopProfile,
  PaymentStatus,
  PaymentMethod,
} from '../types';
import {
  DEFAULT_LABOR_SERVICES,
  DEFAULT_SPARE_PARTS,
  DEFAULT_INVOICES,
  DEFAULT_WORKSHOP_PROFILE,
} from '../data/defaultData';
import { useAuth } from './AuthContext';
import {
  fetchUserInvoicesFromSupabase,
  saveUserInvoiceToSupabase,
  updateUserInvoiceInSupabase,
  deleteUserInvoiceFromSupabase,
  saveWorkshopProfileToSupabase,
} from '../lib/supabase';

interface WorkshopContextType {
  laborServices: LaborService[];
  spareParts: SparePart[];
  invoices: Invoice[];
  profile: WorkshopProfile;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  // Invoice actions
  addInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'jobCardNumber' | 'createdAt'> & { customInvoiceNumber?: string; customJobCardNumber?: string }) => Invoice;
  updateInvoice: (id: string, updated: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updatePayment: (id: string, status: PaymentStatus, amountPaid: number, method?: string) => void;
  loadExampleInvoices: () => void;
  // Labor Service actions
  addLaborService: (service: Omit<LaborService, 'id'>) => LaborService;
  updateLaborService: (id: string, updated: Partial<LaborService>) => void;
  deleteLaborService: (id: string) => void;
  // Spare Parts actions
  addSparePart: (part: Omit<SparePart, 'id'>) => SparePart;
  updateSparePart: (id: string, updated: Partial<SparePart>) => void;
  deleteSparePart: (id: string) => void;
  adjustPartStock: (id: string, delta: number) => void;
  // Profile
  updateProfile: (updated: Partial<WorkshopProfile>) => void;
  resetAllData: () => void;
  // Computed stats
  stats: {
    totalRevenue: number;
    todayRevenue: number;
    pendingDues: number;
    pendingUdhaar: number;
    lowStockCount: number;
    totalPartsCount: number;
    inventoryCostValue: number;
    inventoryRetailValue: number;
    totalInvoicesCount: number;
  };
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

const STORAGE_KEYS = {
  LABOR: 'autopro_labor_services_v1',
  PARTS: 'autopro_spare_parts_v1',
  INVOICES: 'autopro_invoices_v1',
  PROFILE: 'autopro_profile_v1',
  LANG: 'autopro_language_v1',
};

export const WorkshopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile: authProfile } = useAuth();

  const [laborServices, setLaborServices] = useState<LaborService[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LABOR);
      return saved ? JSON.parse(saved) : DEFAULT_LABOR_SERVICES;
    } catch {
      return DEFAULT_LABOR_SERVICES;
    }
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARTS);
      return saved ? JSON.parse(saved) : DEFAULT_SPARE_PARTS;
    } catch {
      return DEFAULT_SPARE_PARTS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
    }
  });

  // Cloud Sync: Fetch user's invoices from Supabase on login / account session change
  // If Supabase table is empty for user, auto-upload all existing local bills to Supabase!
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    fetchUserInvoicesFromSupabase(user.id, user.email).then(async (cloudInvoices) => {
      if (!isMounted) return;

      if (cloudInvoices && cloudInvoices.length > 0) {
        setInvoices(cloudInvoices);
      } else {
        // Cloud has 0 invoices. Check if local storage or state has bills to migrate
        let localBills = invoices;
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localBills = parsed;
            }
          }
        } catch {
          // ignore
        }

        if (localBills && localBills.length > 0) {
          console.log(`Auto-uploading ${localBills.length} existing local bills to Supabase public.invoices table...`);
          for (const inv of localBills) {
            await saveUserInvoiceToSupabase(user.id, user.email, inv);
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email]);

  const syncAllInvoicesToCloud = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!user?.id) return { success: false, count: 0, error: 'User not logged in' };

    try {
      let count = 0;
      for (const inv of invoices) {
        await saveUserInvoiceToSupabase(user.id, user.email, inv);
        count++;
      }
      return { success: true, count };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'Sync failed' };
    }
  };

  const loadExampleInvoices = () => {
    setInvoices(DEFAULT_INVOICES);
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
    } catch {
      // ignore
    }
  };

  const [profile, setProfile] = useState<WorkshopProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_WORKSHOP_PROFILE;
    } catch {
      return DEFAULT_WORKSHOP_PROFILE;
    }
  });

  // Automatically sync workshop profile details from Supabase public.users when available
  useEffect(() => {
    if (!authProfile) return;
    setProfile(prev => {
      const shouldSync = (!prev.name && authProfile.workshop_name) || (!prev.phone && authProfile.phone);
      if (shouldSync) {
        return {
          ...prev,
          name: prev.name || authProfile.workshop_name || '',
          phone: prev.phone || authProfile.phone || '',
          address: prev.address || authProfile.address || '',
          city: prev.city || authProfile.city || '',
          gstin: prev.gstin || authProfile.gstin || '',
          upiId: prev.upiId || authProfile.upi_id || '',
          logoUrl: prev.logoUrl || authProfile.logo_url || '',
          email: prev.email || authProfile.email || '',
        };
      }
      return prev;
    });
  }, [authProfile]);

  const [language, setLanguageState] = useState<'en' | 'hi'>('en');

  const setLanguage = (_lang: 'en' | 'hi') => {
    setLanguageState('en');
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, 'en');
    } catch {
      // ignore
    }
  };

  // Sync to localStorage as local cache fallback
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(laborServices));
    } catch (e) {
      console.warn('Storage failed for labor', e);
    }
  }, [laborServices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(spareParts));
    } catch (e) {
      console.warn('Storage failed for parts', e);
    }
  }, [spareParts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Storage failed for invoices', e);
    }
  }, [invoices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Storage failed for profile', e);
    }
  }, [profile]);

  // Invoice actions (Synced with Supabase)
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'jobCardNumber' | 'createdAt'> & { customInvoiceNumber?: string; customJobCardNumber?: string }) => {
    const nextSeq = invoices.length + 1042;
    const invNumber = invoiceData.customInvoiceNumber || `APW-${new Date().getFullYear()}-${nextSeq}`;
    const jcNumber = invoiceData.customJobCardNumber || `JC-${nextSeq}`;
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber: invNumber,
      jobCardNumber: jcNumber,
      createdAt: new Date().toISOString(),
    };

    // Deduct stock for all spare parts in the invoice
    setSpareParts(prevParts => {
      const updatedParts = [...prevParts];
      for (const item of newInvoice.items) {
        if (item.type === 'part' && item.itemId) {
          const index = updatedParts.findIndex(p => p.id === item.itemId);
          if (index !== -1) {
            const current = updatedParts[index];
            const newStock = Math.max(0, current.currentStock - item.quantity);
            updatedParts[index] = { ...current, currentStock: newStock };
          }
        }
      }
      return updatedParts;
    });

    setInvoices(prev => [newInvoice, ...prev]);

    // Save directly to Supabase cloud database
    if (user?.id) {
      saveUserInvoiceToSupabase(user.id, user.email, newInvoice);
    }

    return newInvoice;
  };

  const updateInvoice = (id: string, updated: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updated } : inv)));
    if (user?.id) {
      updateUserInvoiceInSupabase(id, updated);
    }
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    if (user?.id) {
      deleteUserInvoiceFromSupabase(id);
    }
  };

  const updatePayment = (id: string, status: PaymentStatus, amountPaid: number, method?: string) => {
    const updatedFields: Partial<Invoice> = {
      paymentStatus: status,
      amountPaid,
      balanceDue: 0,
      paymentMethod: method || 'Paid',
    };

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== id) return inv;
        const balanceDue = Math.max(0, inv.grandTotal - amountPaid);
        updatedFields.balanceDue = balanceDue;
        return {
          ...inv,
          paymentStatus: status,
          amountPaid,
          balanceDue,
          paymentMethod: method || inv.paymentMethod || 'Paid',
        };
      })
    );

    if (user?.id) {
      updateUserInvoiceInSupabase(id, updatedFields);
    }
  };

  // Labor actions
  const addLaborService = (serviceData: Omit<LaborService, 'id'>) => {
    const newService: LaborService = {
      ...serviceData,
      id: `lab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setLaborServices(prev => [...prev, newService]);
    return newService;
  };

  const updateLaborService = (id: string, updated: Partial<LaborService>) => {
    setLaborServices(prev => prev.map(s => (s.id === id ? { ...s, ...updated } : s)));
  };

  const deleteLaborService = (id: string) => {
    setLaborServices(prev => prev.filter(s => s.id !== id));
  };

  // Spare Parts actions
  const addSparePart = (partData: Omit<SparePart, 'id'>) => {
    const newPart: SparePart = {
      ...partData,
      id: `prt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      lastRestockedAt: new Date().toISOString().split('T')[0],
    };
    setSpareParts(prev => [...prev, newPart]);
    return newPart;
  };

  const updateSparePart = (id: string, updated: Partial<SparePart>) => {
    setSpareParts(prev => prev.map(p => (p.id === id ? { ...p, ...updated } : p)));
  };

  const deleteSparePart = (id: string) => {
    setSpareParts(prev => prev.filter(p => p.id !== id));
  };

  const adjustPartStock = (id: string, delta: number) => {
    setSpareParts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const newStock = Math.max(0, p.currentStock + delta);
        return {
          ...p,
          currentStock: newStock,
          lastRestockedAt: delta > 0 ? new Date().toISOString().split('T')[0] : p.lastRestockedAt,
        };
      })
    );
  };

  // Profile actions
  const updateProfile = (updated: Partial<WorkshopProfile>) => {
    setProfile(prev => {
      const merged = { ...prev, ...updated };
      if (user?.id) {
        saveWorkshopProfileToSupabase(user.id, merged);
      }
      return merged;
    });
  };

  const resetAllData = () => {
    setLaborServices(DEFAULT_LABOR_SERVICES);
    setSpareParts(DEFAULT_SPARE_PARTS);
    setInvoices(DEFAULT_INVOICES);
    setProfile(DEFAULT_WORKSHOP_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LABOR);
    localStorage.removeItem(STORAGE_KEYS.PARTS);
    localStorage.removeItem(STORAGE_KEYS.INVOICES);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let totalRev = 0;
    let todayRev = 0;
    let pendingDues = 0;

    for (const inv of invoices) {
      totalRev += inv.amountPaid || 0;
      if (inv.date === todayStr) {
        todayRev += inv.amountPaid || 0;
      }
      if (inv.paymentStatus === 'Pending' || inv.paymentStatus === 'Partial') {
        pendingDues += inv.balanceDue || 0;
      }
    }

    const lowStockCount = spareParts.filter(p => p.currentStock <= p.minStockLevel).length;
    const totalPartsCount = spareParts.reduce((sum, p) => sum + p.currentStock, 0);
    const inventoryCostValue = spareParts.reduce((sum, p) => sum + p.purchasePrice * p.currentStock, 0);
    const inventoryRetailValue = spareParts.reduce((sum, p) => sum + p.sellingPrice * p.currentStock, 0);

    return {
      totalRevenue: totalRev,
      todayRevenue: todayRev,
      pendingDues,
      pendingUdhaar: pendingDues,
      lowStockCount,
      totalPartsCount,
      inventoryCostValue,
      inventoryRetailValue,
      totalInvoicesCount: invoices.length,
    };
  }, [invoices, spareParts]);

  return (
    <WorkshopContext.Provider
      value={{
        laborServices,
        spareParts,
        invoices,
        profile,
        language,
        setLanguage,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updatePayment,
        loadExampleInvoices,
        addLaborService,
        updateLaborService,
        deleteLaborService,
        addSparePart,
        updateSparePart,
        deleteSparePart,
        adjustPartStock,
        updateProfile,
        resetAllData,
        stats,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = () => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
