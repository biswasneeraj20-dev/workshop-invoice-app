import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { IndianRupee, AlertTriangle, FileCheck, Layers } from 'lucide-react';

interface StatsBarProps {
  onLowStockClick?: () => void;
  onPendingDuesClick?: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ onLowStockClick, onPendingDuesClick }) => {
  const { stats } = useWorkshop();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {/* Today's Revenue */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Today's Revenue
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            ₹{stats.todayRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">
            Collected today
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <IndianRupee className="w-5 h-5" />
        </div>
      </div>

      {/* Pending Customer Dues */}
      <div 
        onClick={onPendingDuesClick}
        className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between cursor-pointer transition hover:border-amber-400 ${
          stats.pendingDues > 0 ? 'border-amber-200' : 'border-slate-200'
        }`}
      >
        <div>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
            Pending Customer Dues
          </span>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono tabular-nums mt-0.5">
            ₹{stats.pendingDues.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400">
            Click to view pending bills
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Total Invoices */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Invoices
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums mt-0.5">
            {stats.totalInvoicesCount}
          </div>
          <span className="text-[11px] text-slate-400">
            All-time serviced cars
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <FileCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div 
        onClick={onLowStockClick}
        className={`bg-white border rounded-xl p-4 shadow-xs flex items-center justify-between cursor-pointer transition hover:border-rose-400 ${
          stats.lowStockCount > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
        }`}
      >
        <div>
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
            Low Stock Alerts
          </span>
          <div className="text-xl sm:text-2xl font-bold text-rose-600 font-mono tabular-nums mt-0.5">
            {stats.lowStockCount} <span className="text-xs font-normal text-slate-500">items</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Click to view reorders
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
