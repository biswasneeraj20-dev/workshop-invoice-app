/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WorkshopProvider, useWorkshop } from './context/WorkshopContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { InvoiceCreator } from './components/InvoiceCreator';
import { InvoiceHistory } from './components/InvoiceHistory';
import { LaborCatalogue } from './components/LaborCatalogue';
import { PartsInventory } from './components/PartsInventory';
import { WorkshopSettings } from './components/WorkshopSettings';
import { InvoiceViewModal } from './components/InvoiceViewModal';
import { SplashScreen } from './components/SplashScreen';
import { AuthScreen } from './components/AuthScreen';
import { SubscriptionLockScreen } from './components/SubscriptionLockScreen';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { Invoice, LaborService } from './types';

function WorkshopApp() {
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useWorkshop();
  const { user, isAppLocked, isLoading: authLoading } = useAuth();
  
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);

  const isFirstTime = !profile.name || profile.name.trim() === '';

  const [activeTab, setActiveTab] = useState<'billing' | 'invoices' | 'labor' | 'inventory' | 'settings'>(() =>
    isFirstTime ? 'settings' : 'billing'
  );
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Handle invoice created: automatically switch to modal preview
  const handleInvoiceCreated = (invoice: Invoice) => {
    setViewingInvoice(invoice);
  };

  const handleSelectLaborForBill = (_service: LaborService) => {
    setActiveTab('billing');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-mono text-xs">
        Loading Auto Workshop Software...
      </div>
    );
  }

  // 1. If user is not logged in, show AuthScreen (Login & Free Trial Signup)
  if (!user) {
    return (
      <>
        {isLoading && <SplashScreen onLoaded={() => setIsLoading(false)} />}
        <AuthScreen onOpenSupabaseConfig={() => setShowSupabaseConfig(true)} />
        {showSupabaseConfig && <SupabaseConfigModal onClose={() => setShowSupabaseConfig(false)} />}
      </>
    );
  }

  // 2. If app is locked because is_active is false and free trial (2 bills) is exhausted
  if (isAppLocked) {
    return (
      <>
        <SubscriptionLockScreen onOpenSupabaseConfig={() => setShowSupabaseConfig(true)} />
        {showSupabaseConfig && <SupabaseConfigModal onClose={() => setShowSupabaseConfig(false)} />}
      </>
    );
  }

  return (
    <>
      {isLoading && <SplashScreen onLoaded={() => setIsLoading(false)} />}
      <div className="print:hidden min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewBillClick={() => setActiveTab('billing')}
        onOpenSupabaseConfig={() => setShowSupabaseConfig(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* First Time Setup Alert Banner if user navigates off settings before completing setup */}
        {isFirstTime && activeTab !== 'settings' && (
          <div className="mb-6 bg-amber-500 text-slate-950 px-4 py-3.5 rounded-xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-2 border-amber-400 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                Action Required
              </span>
              <span className="text-xs sm:text-sm font-bold">
                Please add your Workshop Name, Logo, Address & Contact Details in Settings before creating bills.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-400 px-4 py-1.5 rounded-lg font-bold text-xs shadow transition shrink-0 cursor-pointer"
            >
              Go to Settings Now →
            </button>
          </div>
        )}

        {/* KPI Strip */}
        <StatsBar
          onLowStockClick={() => setActiveTab('inventory')}
          onPendingDuesClick={() => setActiveTab('invoices')}
        />

        {/* Tab Views */}
        {activeTab === 'billing' && (
          <InvoiceCreator
            onInvoiceCreated={handleInvoiceCreated}
            onCancel={() => setActiveTab('invoices')}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceHistory
            onViewInvoice={inv => setViewingInvoice(inv)}
            onNewBillClick={() => setActiveTab('billing')}
          />
        )}

        {activeTab === 'labor' && (
          <LaborCatalogue
            onSelectForBill={handleSelectLaborForBill}
          />
        )}

        {activeTab === 'inventory' && (
          <PartsInventory />
        )}

        {activeTab === 'settings' && (
          <WorkshopSettings
            onSavedGoToBilling={() => setActiveTab('billing')}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print mt-auto py-5 bg-slate-900 text-slate-400 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-extrabold text-amber-400">Auto Workshop Invoice Maker</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white">{profile.name || 'Garage Software'}</span>
            <span>·</span>
            <span>{profile.city || 'Netlify Ready'}</span>
            <span>·</span>
            <span className="font-mono text-amber-400">{profile.phone || '+91 98765 43210'}</span>
          </div>
          <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-1.5 justify-center sm:justify-end">
            <span>Automotive Car Workshop Billing & Inventory Software</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400 font-bold">Created by Neeraj Biswas</span>
          </div>
        </div>
      </footer>

    </div>

    {/* Printable Invoice & View Modal rendered at top level outside print:hidden */}
    {viewingInvoice && (
      <InvoiceViewModal
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />
    )}

    {/* Supabase Config Modal */}
    {showSupabaseConfig && <SupabaseConfigModal onClose={() => setShowSupabaseConfig(false)} />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkshopProvider>
        <WorkshopApp />
      </WorkshopProvider>
    </AuthProvider>
  );
}
