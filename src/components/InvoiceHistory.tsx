import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Invoice, PaymentStatus } from '../types';
import { calculateInvoicePageCount } from './InvoiceViewModal';
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Share2,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Car,
  RotateCcw,
} from 'lucide-react';

interface InvoiceHistoryProps {
  onViewInvoice: (invoice: Invoice) => void;
  onNewBillClick: () => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ onViewInvoice, onNewBillClick }) => {
  const { invoices, deleteInvoice, profile, loadExampleInvoices } = useWorkshop();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');

  const filteredInvoices = invoices.filter(inv => {
    const matchStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.jobCardNumber.toLowerCase().includes(q) ||
      inv.vehicleNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q) ||
      inv.carModel.toLowerCase().includes(q);

    return matchStatus && matchSearch;
  });

  const handleWhatsAppQuick = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `*${profile.name} - Service Invoice Summary*\n` +
      `Car: ${inv.carModel} (${inv.vehicleNumber})\n` +
      `Bill No: ${inv.invoiceNumber} | Date: ${inv.date}\n` +
      `Amount: ₹${inv.grandTotal.toLocaleString('en-IN')}\n` +
      (inv.balanceDue > 0 ? `Pending Due: ₹${inv.balanceDue.toLocaleString('en-IN')}\n` : `Status: FULLY PAID\n`) +
      `UPI ID for payment: ${profile.upiId}\n` +
      `Workshop Phone: ${profile.phone}`;

    let cleanPhone = inv.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Invoices & Job Cards Records</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search through generated bills, track pending customer dues, and reprint invoices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadExampleInvoices}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-semibold rounded-lg text-xs border border-slate-300 transition cursor-pointer"
            title="Reload Small, Medium, and Long Example Invoices"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Load 3 Example Bills</span>
          </button>

          <button
            type="button"
            onClick={onNewBillClick}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition cursor-pointer"
          >
            <span>+ Create New Bill</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by vehicle number, customer name, mobile, invoice #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {(['All', 'Paid', 'Pending', 'Partial'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'All'
                  ? `All (${invoices.length})`
                  : st === 'Paid'
                  ? `Paid (${invoices.filter(i => i.paymentStatus === 'Paid').length})`
                  : st === 'Pending'
                  ? `Pending Dues (${invoices.filter(i => i.paymentStatus === 'Pending').length})`
                  : `Partial (${invoices.filter(i => i.paymentStatus === 'Partial').length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 w-36">Invoice & Date</th>
                <th className="py-3 px-3 min-w-[180px]">Vehicle & Model</th>
                <th className="py-3 px-3 min-w-[180px]">Customer</th>
                <th className="py-3 px-3 w-28 text-right">Amount (₹)</th>
                <th className="py-3 px-3 w-28 text-right">Balance Due</th>
                <th className="py-3 px-3 w-28 text-center">Status</th>
                <th className="py-3 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                    No invoices or job cards found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr
                    key={inv.id}
                    onClick={() => onViewInvoice(inv)}
                    className="hover:bg-amber-50/40 cursor-pointer transition group"
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs group-hover:text-amber-800">
                          {inv.invoiceNumber}
                        </span>
                        {(() => {
                          const pageCount = calculateInvoicePageCount(inv.items.length, profile.defaultPaperSize || 'A4');
                          return (
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${
                                pageCount === 1
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : pageCount === 2
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {pageCount} {pageCount === 1 ? 'Page' : 'Pages'} ({profile.defaultPaperSize || 'A4'})
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {inv.date}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                          {inv.vehicleNumber}
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium text-xs mt-1">
                        {inv.carModel}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {inv.kilometers.toLocaleString('en-IN')} KM
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {inv.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {inv.customerPhone}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                        ₹{inv.grandTotal.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Labor: ₹{inv.laborSubtotal} | Parts: ₹{inv.partsSubtotal}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div
                        className={`font-mono font-bold text-xs tabular-nums ${
                          inv.balanceDue > 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      >
                        {inv.balanceDue > 0 ? `₹${inv.balanceDue.toLocaleString('en-IN')}` : '₹0 (Clear)'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block font-mono font-bold text-[11px] px-2.5 py-0.5 rounded border uppercase ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.paymentStatus === 'Partial'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewInvoice(inv);
                          }}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View / Print Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* WhatsApp Quick */}
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppQuick(inv, e)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Send on WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
