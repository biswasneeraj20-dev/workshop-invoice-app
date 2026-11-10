import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Invoice, PaymentStatus, InvoiceItem, PaperSize, TableBorderStyle } from '../types';
import {
  Printer,
  Share2,
  X,
  CreditCard,
  Wrench,
  MapPin,
  Phone,
  FileText,
} from 'lucide-react';

interface InvoiceViewModalProps {
  invoice: Invoice;
  onClose: () => void;
}

interface IndexedItem {
  item: InvoiceItem;
  globalIndex: number;
}

interface InvoicePageSlice {
  pageNumber: number;
  totalPages: number;
  items: IndexedItem[];
  maxSlots: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}

/**
 * Calibrated pagination based on paper size:
 * - Single / Last page (with Grand Total & Signatures block): A4 max 12 items, A5 max 6 items.
 * - Non-last pages (without Grand Total block): A4 max 15 items, A5 max 10 items.
 */
export function calculateInvoicePageCount(itemCount: number, paperSize: PaperSize): number {
  if (itemCount === 0) return 1;
  const lastPageMax = paperSize === 'A5' ? 6 : 12;
  const nonLastPageMax = paperSize === 'A5' ? 10 : 15;

  if (itemCount <= lastPageMax) return 1;

  let remaining = itemCount;
  let count = 0;
  while (remaining > 0) {
    if (remaining <= lastPageMax) {
      count++;
      break;
    }
    let chunkSize = nonLastPageMax;
    if (remaining <= nonLastPageMax) {
      chunkSize = remaining - 1;
    }
    count++;
    remaining -= chunkSize;
  }
  return count;
}

export function buildInvoicePages(items: InvoiceItem[], paperSize: PaperSize): InvoicePageSlice[] {
  const indexedItems: IndexedItem[] = items.map((item, idx) => ({ item, globalIndex: idx }));

  const lastPageMax = paperSize === 'A5' ? 6 : 12;
  const nonLastPageMax = paperSize === 'A5' ? 10 : 15;

  if (indexedItems.length === 0) {
    return [{ pageNumber: 1, totalPages: 1, items: [], maxSlots: lastPageMax, isFirstPage: true, isLastPage: true }];
  }

  // Single page fit: all items fit on 1 page with totals box
  if (indexedItems.length <= lastPageMax) {
    return [{ pageNumber: 1, totalPages: 1, items: indexedItems, maxSlots: lastPageMax, isFirstPage: true, isLastPage: true }];
  }

  const pagesItems: IndexedItem[][] = [];
  let currentStart = 0;

  while (currentStart < indexedItems.length) {
    const remaining = indexedItems.length - currentStart;
    if (remaining <= lastPageMax) {
      pagesItems.push(indexedItems.slice(currentStart));
      break;
    }
    let chunkSize = nonLastPageMax;
    if (remaining <= nonLastPageMax) {
      chunkSize = remaining - 1;
    }
    pagesItems.push(indexedItems.slice(currentStart, currentStart + chunkSize));
    currentStart += chunkSize;
  }

  const totalPages = pagesItems.length;
  return pagesItems.map((pageItems, idx) => {
    const isLastPage = idx === totalPages - 1;
    const maxSlots = isLastPage ? lastPageMax : nonLastPageMax;
    return {
      pageNumber: idx + 1,
      totalPages,
      items: pageItems,
      maxSlots,
      isFirstPage: idx === 0,
      isLastPage,
    };
  });
}

export const InvoiceViewModal: React.FC<InvoiceViewModalProps> = ({ invoice, onClose }) => {
  const { profile, updatePayment } = useWorkshop();
  const [paperSize, setPaperSize] = useState<PaperSize>(profile.defaultPaperSize || 'A4');
  const [tableBorderStyle, setTableBorderStyle] = useState<TableBorderStyle>(
    profile.tableBorderStyle || 'thin'
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newStatus, setNewStatus] = useState<PaymentStatus>(invoice.paymentStatus);
  const [newAmountPaid, setNewAmountPaid] = useState<number>(invoice.amountPaid);

  const getTableBorderClass = () => {
    switch (tableBorderStyle) {
      case 'none':
        return 'border-0 rounded overflow-hidden';
      case 'medium':
        return 'border-2 border-slate-400 rounded overflow-hidden';
      case 'thick':
        return 'border-[3px] border-slate-900 rounded overflow-hidden';
      case 'thin':
      default:
        return 'border border-slate-300 rounded overflow-hidden';
    }
  };

  const getTheadBorderClass = () => {
    switch (tableBorderStyle) {
      case 'none':
        return 'bg-slate-100 text-slate-900 font-extrabold border-b-0 shrink-0';
      case 'medium':
        return 'bg-slate-100 text-slate-900 font-extrabold border-b-2 border-slate-400 shrink-0';
      case 'thick':
        return 'bg-slate-100 text-slate-900 font-extrabold border-b-[3px] border-slate-900 shrink-0';
      case 'thin':
      default:
        return 'bg-slate-100 text-slate-900 font-extrabold border-b border-slate-300 shrink-0';
    }
  };

  const getHeaderColBorderClass = () => {
    switch (tableBorderStyle) {
      case 'none':
        return 'border-r-0';
      case 'medium':
        return 'border-r-2 border-slate-400';
      case 'thick':
        return 'border-r-[2.5px] border-slate-800';
      case 'thin':
      default:
        return 'border-r border-slate-300';
    }
  };

  const getTbodyDivideClass = () => {
    switch (tableBorderStyle) {
      case 'none':
        return 'flex-1 flex flex-col divide-y-0 min-h-0';
      case 'medium':
        return 'flex-1 flex flex-col divide-y-2 divide-slate-300 min-h-0';
      case 'thick':
        return 'flex-1 flex flex-col divide-y-2 divide-slate-400 min-h-0';
      case 'thin':
      default:
        return 'flex-1 flex flex-col divide-y divide-slate-200 min-h-0';
    }
  };

  const getCellRightBorderClass = () => {
    switch (tableBorderStyle) {
      case 'none':
        return 'border-r-0';
      case 'medium':
        return 'border-r-2 border-slate-300';
      case 'thick':
        return 'border-r-[2px] border-slate-400';
      case 'thin':
      default:
        return 'border-r border-slate-200';
    }
  };

  // Workshop details with professional fallback if user profile is not configured yet
  const workshopName = profile.name?.trim() || 'Apex Auto Care & Service Centre';
  const workshopTagline = profile.tagline?.trim() || 'Multi-Brand Car Repair, Computer Scanning & Spare Parts';
  const workshopAddress = profile.address?.trim() || 'Plot No. 42, Automobile Market, Sector 14';
  const workshopCity = profile.city?.trim() || 'Gurugram, Haryana - 122001';
  const workshopPhone = profile.phone?.trim() || '+91 98765 43210';
  const workshopGstin = profile.gstin?.trim() || '07AAAAA0000A1Z5';
  const workshopLogoUrl = profile.logoUrl?.trim() || '';

  const pages = buildInvoicePages(invoice.items, paperSize);

  const handlePrint = () => {
    if (paperSize === 'A5') {
      document.body.classList.add('paper-a5-mode');
      document.body.classList.remove('paper-a4-mode');
    } else {
      document.body.classList.add('paper-a4-mode');
      document.body.classList.remove('paper-a5-mode');
    }
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text =
      `*${workshopName} - Tax Invoice & Job Card*\n` +
      `--------------------------------\n` +
      `*Invoice No:* ${invoice.invoiceNumber}\n` +
      `*Job Card:* ${invoice.jobCardNumber}\n` +
      `*Date:* ${invoice.date}\n` +
      `*Car:* ${invoice.carModel} (${invoice.vehicleNumber})\n` +
      `*Customer:* ${invoice.customerName}\n` +
      `*KM Reading:* ${invoice.kilometers.toLocaleString('en-IN')} KM\n` +
      `--------------------------------\n` +
      `*Labor Total:* ₹${invoice.laborSubtotal.toLocaleString('en-IN')}\n` +
      `*Spare Parts Total:* ₹${invoice.partsSubtotal.toLocaleString('en-IN')}\n` +
      (invoice.gstApplied ? `*GST (${invoice.gstRate}%):* ₹${invoice.gstAmount.toLocaleString('en-IN')}\n` : '') +
      `*Grand Total:* ₹${invoice.grandTotal.toLocaleString('en-IN')}\n` +
      `*Paid:* ₹${invoice.amountPaid.toLocaleString('en-IN')}\n` +
      (invoice.balanceDue > 0 ? `*Balance Due:* ₹${invoice.balanceDue.toLocaleString('en-IN')}\n` : `*Status:* PAID FULLY\n`) +
      `--------------------------------\n` +
      `*Contact:* ${workshopPhone}\n` +
      `Thank you for trusting ${workshopName}!`;

    let cleanPhone = invoice.customerPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const whatsappUrl =
      cleanPhone.length >= 10
        ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, '_blank');
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayment(invoice.id, newStatus, Number(newAmountPaid));
    setShowPaymentModal(false);
  };

  return (
    <div className="invoice-modal-overlay fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Outer Modal Container */}
      <div className="invoice-modal-card bg-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col border border-slate-300">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
              {invoice.invoiceNumber}
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">|</span>
            <span className="text-xs text-slate-300 hidden sm:inline font-mono">
              {invoice.vehicleNumber} ({invoice.carModel})
            </span>
            <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded font-mono shadow-xs">
              {pages.length === 1 ? '1 Page' : `${pages.length} Pages`} ({paperSize})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Paper Size Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                  paperSize === 'A4'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to Standard A4 Vertical Format (210×297 mm)"
              >
                A4
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('A5')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition ${
                  paperSize === 'A5'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Switch to Compact A5 Vertical Format (148×210 mm)"
              >
                A5
              </button>
            </div>

            {/* Table Border Style Quick Switcher */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-1 hidden lg:inline">
                Border:
              </span>
              <button
                type="button"
                onClick={() => setTableBorderStyle('none')}
                className={`px-2 py-1 text-xs font-bold rounded transition ${
                  tableBorderStyle === 'none'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Hide Table Borders"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={() => setTableBorderStyle('thin')}
                className={`px-2 py-1 text-xs font-bold rounded transition ${
                  tableBorderStyle === 'thin'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Thin 1px Border"
              >
                Thin
              </button>
              <button
                type="button"
                onClick={() => setTableBorderStyle('medium')}
                className={`px-2 py-1 text-xs font-bold rounded transition ${
                  tableBorderStyle === 'medium'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Medium 2px Border"
              >
                Med
              </button>
              <button
                type="button"
                onClick={() => setTableBorderStyle('thick')}
                className={`px-2 py-1 text-xs font-bold rounded transition ${
                  tableBorderStyle === 'thick'
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Thick 3px Border"
              >
                Thick
              </button>
            </div>

            {/* Update Payment Button */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>Payment Status</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black rounded-lg transition shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Print {paperSize}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body (Contains stack of A4/A5 page sheets) */}
        <div className="invoice-modal-scroll p-3 sm:p-5 overflow-y-auto max-h-[86vh] bg-slate-300">
          <div className="printable-invoice-container max-w-4xl mx-auto space-y-6">
            
            {pages.map((pageSlice) => (
              <div
                key={pageSlice.pageNumber}
                className={
                  paperSize === 'A5'
                    ? "a5-page-sheet bg-white border border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-md text-slate-900 flex flex-col justify-between mx-auto relative min-h-[210mm] w-full max-w-[148mm] aspect-[148/210] print:aspect-auto text-xs"
                    : "a4-page-sheet bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-md text-slate-900 flex flex-col justify-between mx-auto relative min-h-[297mm] w-full max-w-[210mm] aspect-[210/297] print:aspect-auto"
                }
              >
                {/* 1. FIXED TOP ZONE (Workshop Details + Customer & Vehicle Details Bar - Rendered on EVERY Page) */}
                <div className="shrink-0">
                  {/* Workshop Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b-2 border-slate-900 gap-2">
                    <div className="flex items-center gap-2">
                      {workshopLogoUrl ? (
                        <div className={paperSize === 'A5' ? "w-9 h-9 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center" : "w-12 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center"}>
                          <img
                            src={workshopLogoUrl}
                            alt={workshopName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className={paperSize === 'A5' ? "w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs print:hidden" : "w-11 h-11 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs print:hidden"}>
                          <Wrench className={paperSize === 'A5' ? "w-4 h-4 stroke-[2.5]" : "w-5 h-5 stroke-[2.5]"} />
                        </div>
                      )}
                      <div>
                        <h1 className={paperSize === 'A5' ? "text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight uppercase" : "text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none uppercase"}>
                          {workshopName}
                        </h1>
                        <p className={paperSize === 'A5' ? "text-[9px] text-slate-700 font-semibold" : "text-[11px] text-slate-700 font-semibold mt-0.5"}>
                          {workshopTagline}
                        </p>
                        <p className={paperSize === 'A5' ? "text-[9px] text-slate-600 flex flex-wrap items-center gap-1 font-medium mt-0.5" : "text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium"}>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5 text-amber-600 inline shrink-0" />
                            {workshopAddress}, {workshopCity}
                          </span>
                          <span>·</span>
                          <span>
                            <Phone className="w-2.5 h-2.5 text-amber-600 inline shrink-0 mr-0.5" />
                            {workshopPhone} {profile.alternatePhone ? `/ ${profile.alternatePhone}` : ''}
                          </span>
                          <span>·</span>
                          <span className="font-mono font-bold text-slate-800">
                            GSTIN: {workshopGstin}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Document Title & Reference Numbers */}
                    <div className="text-left sm:text-right shrink-0">
                      <span className={paperSize === 'A5' ? "inline-block px-1.5 py-0.5 bg-slate-900 text-amber-400 font-black text-[9px] uppercase tracking-wider rounded" : "inline-block px-2 py-0.5 bg-slate-900 text-amber-400 font-black text-xs uppercase tracking-wider rounded"}>
                        TAX INVOICE & JOB CARD
                      </span>
                      <div className={paperSize === 'A5' ? "mt-0.5 text-[9px] space-y-0" : "mt-0.5 text-xs space-y-0.5"}>
                        <div>
                          <span className="text-slate-600 font-medium">Invoice No: </span>
                          <strong className="font-mono text-slate-950 font-black">{invoice.invoiceNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Job Card: </span>
                          <strong className="font-mono text-slate-900 font-bold">{invoice.jobCardNumber}</strong>
                        </div>
                        <div>
                          <span className="text-slate-600 font-medium">Date: </span>
                          <strong className="font-mono text-slate-900 font-bold">{invoice.date}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer & Vehicle Details Bar - Rendered on EVERY page */}
                  <div className={paperSize === 'A5' ? "grid grid-cols-1 sm:grid-cols-2 gap-1 py-1 px-2 bg-slate-50 border border-slate-300 rounded mt-1 text-[9px]" : "grid grid-cols-1 sm:grid-cols-2 gap-1.5 py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg mt-1.5 text-xs"}>
                    {/* Customer Info */}
                    <div className="flex flex-wrap items-center gap-1 text-slate-800">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        Customer:
                      </span>
                      <strong className="font-bold text-slate-950">{invoice.customerName}</strong>
                      <span>·</span>
                      <span className="font-mono font-semibold text-slate-800">{invoice.customerPhone}</span>
                      {invoice.customerAddress && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600 truncate max-w-[120px]">{invoice.customerAddress}</span>
                        </>
                      )}
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex flex-wrap items-center sm:justify-end gap-1 text-slate-800">
                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        Vehicle:
                      </span>
                      <span className="font-mono font-black text-[9px] sm:text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded border border-amber-500">
                        {invoice.vehicleNumber}
                      </span>
                      <strong className="font-bold text-slate-950">{invoice.carModel}</strong>
                      <span>·</span>
                      <span className="font-mono text-[9px] sm:text-[10px] text-slate-600">
                        Odo: {invoice.kilometers.toLocaleString('en-IN')} KM · Fuel: {invoice.fuelLevel || 'N/A'} · Tech: {invoice.mechanicName || 'Staff'}
                      </span>
                    </div>
                  </div>

                  {/* Work Scope if present */}
                  {invoice.customerComplaints && (
                    <div className={paperSize === 'A5' ? "py-0.5 px-1.5 bg-amber-50/80 border border-amber-200 rounded mt-0.5 text-[9px] text-slate-800 flex items-center gap-1" : "py-1 px-2.5 bg-amber-50/80 border border-amber-200 rounded mt-1 text-xs text-slate-800 flex items-center gap-1.5"}>
                      <span className="font-black text-amber-950 shrink-0">Work Scope:</span>
                      <span className="font-medium truncate">{invoice.customerComplaints}</span>
                    </div>
                  )}
                </div>

                {/* 2. EXPANDED MIDDLE CONTENT AREA (Items Table - Full Vertical Height Fill) */}
                <div className="flex-1 flex flex-col min-h-0 my-1">
                  <table className={paperSize === 'A5' ? `w-full h-full flex flex-col text-left text-[10px] sm:text-[11px] ${getTableBorderClass()} table-fixed` : `w-full h-full flex flex-col text-left text-xs sm:text-[13px] ${getTableBorderClass()}`}>
                    <thead className={getTheadBorderClass()}>
                      <tr className="flex items-center w-full py-1">
                        <th className={paperSize === 'A5' ? `w-6 text-center ${getHeaderColBorderClass()} shrink-0` : `w-10 text-center ${getHeaderColBorderClass()} shrink-0`}>#</th>
                        <th className={`flex-1 px-1.5 ${getHeaderColBorderClass()} min-w-0`}>Work Description / Particulars</th>
                        <th className={paperSize === 'A5' ? `w-11 text-center ${getHeaderColBorderClass()} shrink-0` : `w-16 text-center ${getHeaderColBorderClass()} shrink-0`}>Type</th>
                        <th className={paperSize === 'A5' ? `w-20 ${getHeaderColBorderClass()} shrink-0` : `w-28 ${getHeaderColBorderClass()} shrink-0`}>Part No.</th>
                        <th className={paperSize === 'A5' ? `w-14 text-right ${getHeaderColBorderClass()} shrink-0` : `w-24 text-right ${getHeaderColBorderClass()} shrink-0`}>Rate (₹)</th>
                        <th className={paperSize === 'A5' ? `w-8 text-center ${getHeaderColBorderClass()} shrink-0` : `w-14 text-center ${getHeaderColBorderClass()} shrink-0`}>Qty</th>
                        <th className={paperSize === 'A5' ? "w-16 text-right px-1 shrink-0" : "w-28 text-right px-2 shrink-0"}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className={getTbodyDivideClass()}>
                      {Array.from({ length: pageSlice.maxSlots }).map((_, slotIndex) => {
                        const indexedItem = pageSlice.items[slotIndex];
                        if (indexedItem) {
                          const { item, globalIndex } = indexedItem;
                          return (
                            <tr key={item.id} className="flex-1 flex items-center w-full text-slate-900 hover:bg-slate-50/50 min-h-0">
                              <td className={paperSize === 'A5' ? `w-6 text-center text-slate-600 font-mono text-[9.5px] ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full` : `w-10 text-center text-slate-600 font-mono text-xs ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full`}>
                                {globalIndex + 1}
                              </td>
                              <td className={`flex-1 px-1.5 font-bold text-slate-950 ${getCellRightBorderClass()} break-words leading-tight text-[9.5px] sm:text-xs min-w-0 flex items-center h-full`}>
                                <span className="line-clamp-1">{item.name}</span>
                              </td>
                              <td className={paperSize === 'A5' ? `w-11 text-center ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full` : `w-16 text-center ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full`}>
                                <span
                                  className={`inline-block text-[8px] uppercase font-black px-1 py-0 rounded ${
                                    item.type === 'labor'
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : 'bg-blue-100 text-blue-950 border border-blue-300'
                                  }`}
                                >
                                  {item.type === 'labor' ? 'Labor' : 'Spare'}
                                </span>
                              </td>
                              <td className={paperSize === 'A5' ? `w-20 font-mono text-[8.5px] text-slate-700 font-semibold ${getCellRightBorderClass()} break-all shrink-0 flex items-center px-1 h-full` : `w-28 font-mono text-xs text-slate-700 font-semibold ${getCellRightBorderClass()} shrink-0 flex items-center px-2 h-full`}>
                                {item.partNumber || '-'}
                              </td>
                              <td className={paperSize === 'A5' ? `w-14 text-right font-mono font-semibold tabular-nums text-[9.5px] ${getCellRightBorderClass()} shrink-0 flex items-center justify-end px-1 h-full` : `w-24 text-right font-mono font-semibold tabular-nums text-xs ${getCellRightBorderClass()} shrink-0 flex items-center justify-end px-2 h-full`}>
                                ₹{item.unitPrice.toLocaleString('en-IN')}
                              </td>
                              <td className={paperSize === 'A5' ? `w-8 text-center font-mono font-bold text-[9.5px] ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full` : `w-14 text-center font-mono font-bold text-xs ${getCellRightBorderClass()} shrink-0 flex items-center justify-center h-full`}>
                                {item.quantity}
                              </td>
                              <td className={paperSize === 'A5' ? "w-16 text-right font-mono font-black text-slate-950 tabular-nums text-[9.5px] shrink-0 flex items-center justify-end px-1 h-full" : "w-28 text-right font-mono font-black text-slate-950 tabular-nums text-xs shrink-0 flex items-center justify-end px-2 h-full"}>
                                ₹{item.total.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        } else {
                          return (
                            <tr key={`empty-grid-${slotIndex}`} className="flex-1 flex items-center w-full min-h-0">
                              <td className={paperSize === 'A5' ? `w-6 ${getCellRightBorderClass()} shrink-0 h-full` : `w-10 ${getCellRightBorderClass()} shrink-0 h-full`}></td>
                              <td className={`flex-1 ${getCellRightBorderClass()} min-w-0 h-full`}></td>
                              <td className={paperSize === 'A5' ? `w-11 ${getCellRightBorderClass()} shrink-0 h-full` : `w-16 ${getCellRightBorderClass()} shrink-0 h-full`}></td>
                              <td className={paperSize === 'A5' ? `w-20 ${getCellRightBorderClass()} shrink-0 h-full` : `w-28 ${getCellRightBorderClass()} shrink-0 h-full`}></td>
                              <td className={paperSize === 'A5' ? `w-14 ${getCellRightBorderClass()} shrink-0 h-full` : `w-24 ${getCellRightBorderClass()} shrink-0 h-full`}></td>
                              <td className={paperSize === 'A5' ? `w-8 ${getCellRightBorderClass()} shrink-0 h-full` : `w-14 ${getCellRightBorderClass()} shrink-0 h-full`}></td>
                              <td className={paperSize === 'A5' ? "w-16 h-full" : "w-28 h-full"}></td>
                            </tr>
                          );
                        }
                      })}
                    </tbody>
                  </table>

                </div>

                {/* 3. FIXED BOTTOM ZONE (Compact Calculation + Compact Terms + Flat/Simple Signatures) */}
                <div className="shrink-0 mt-auto pt-1.5 border-t-2 border-slate-900">
                  {pageSlice.isLastPage ? (
                    <>
                      {/* Compact Calculations & Settlement Box */}
                      <div className={paperSize === 'A5' ? "grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] mb-1.5" : "grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-2"}>
                        {/* Left: Settlement Status & Remarks */}
                        <div className="flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider block mb-0.5">
                              SETTLEMENT STATUS
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-block px-2 py-0.5 font-mono font-black text-[10px] uppercase tracking-wider rounded border ${
                                  invoice.paymentStatus === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                                    : invoice.paymentStatus === 'Partial'
                                    ? 'bg-amber-100 text-amber-900 border-amber-400'
                                    : 'bg-rose-100 text-rose-900 border-rose-400'
                                }`}
                              >
                                {invoice.paymentStatus === 'Paid'
                                  ? 'PAID FULLY'
                                  : invoice.paymentStatus === 'Partial'
                                  ? 'PARTIALLY PAID'
                                  : 'PAYMENT DUE'}
                              </span>
                            </div>
                          </div>

                          {invoice.notes && (
                            <div className="bg-slate-50 border border-slate-200 rounded p-1 text-[10px] text-slate-800 mt-1">
                              <strong className="text-slate-950">Remarks: </strong>
                              {invoice.notes}
                            </div>
                          )}

                          <div className="text-[9px] text-slate-500 mt-0.5 font-medium">
                            Computer Generated Tax Invoice. No signature required on digital copy.
                          </div>
                        </div>

                        {/* Right: Calculations Summary (Tight, compact) */}
                        <div className={paperSize === 'A5' ? "space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-300 text-[10px]" : "space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-300 text-xs"}>
                          <div className="flex justify-between text-slate-800 font-medium">
                            <span>Labor Charges:</span>
                            <span className="font-mono font-bold tabular-nums text-slate-950">
                              ₹{invoice.laborSubtotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-800 font-medium">
                            <span>Spare Parts:</span>
                            <span className="font-mono font-bold tabular-nums text-slate-950">
                              ₹{invoice.partsSubtotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {invoice.gstApplied && (
                            <div className="flex justify-between text-slate-800 font-medium">
                              <span>GST Tax ({invoice.gstRate}%):</span>
                              <span className="font-mono font-bold tabular-nums text-slate-950">
                                ₹{invoice.gstAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                          <div className="pt-0.5 border-t-2 border-slate-900 flex justify-between items-baseline font-black text-slate-950">
                            <span className="uppercase tracking-wide text-[10px]">Grand Total:</span>
                            <span className={paperSize === 'A5' ? "text-sm font-mono tabular-nums text-slate-950 font-black" : "text-base sm:text-lg font-mono tabular-nums text-slate-950 font-black"}>
                              ₹{invoice.grandTotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-800 text-[10px] pt-0.5 font-bold">
                            <span>Amount Paid:</span>
                            <span className="font-mono font-bold text-emerald-700 tabular-nums">
                              ₹{invoice.amountPaid.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {invoice.balanceDue > 0 && (
                            <div className="flex justify-between text-rose-700 font-black text-[10px] pt-0.5">
                              <span>Balance Due:</span>
                              <span className="font-mono tabular-nums">
                                ₹{invoice.balanceDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Terms */}
                      <div className={paperSize === 'A5' ? "text-[9px] text-slate-600 border-t border-slate-200 pt-0.5 mb-1" : "text-[10px] text-slate-600 border-t border-slate-200 pt-1 mb-2"}>
                        <strong className="text-slate-800 uppercase">Terms: </strong>
                        <span>
                          1. Vehicle delivery against full bill settlement. · 2. 30 days warranty on labor. · 3. Owner's risk.
                        </span>
                      </div>

                      {/* FLAT, SIMPLE, COMPACT SIGNATURE AREA */}
                      <div className={paperSize === 'A5' ? "flex items-end justify-between pt-2 pb-0.5 border-t border-slate-300" : "flex items-end justify-between pt-4 pb-1 border-t border-slate-300"}>
                        {/* Customer Signature */}
                        <div className="text-center w-36 sm:w-48">
                          <div className="border-b border-slate-700 mb-0.5"></div>
                          <div className="text-[10px] sm:text-xs font-bold text-slate-900">Customer Signature</div>
                          <div className="text-[8px] sm:text-[9px] text-slate-500">Vehicle Acceptance & Approval</div>
                        </div>

                        {/* Workshop Authorised Signature */}
                        <div className="text-center w-40 sm:w-56">
                          <div className="border-b border-slate-700 mb-0.5"></div>
                          <div className="text-[10px] sm:text-xs font-bold text-slate-900">For {workshopName}</div>
                          <div className="text-[8px] sm:text-[9px] text-slate-500">Authorised Signatory</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Intermediate Page Bottom Continuation Bar */
                    <div className="flex items-center justify-between text-[11px] text-slate-700 font-mono pt-1 font-bold">
                      <span>Continued on Page {pageSlice.pageNumber + 1}...</span>
                      <span className="text-slate-950 font-black">For {workshopName}</span>
                    </div>
                  )}

                  {/* Bottom Software Badge & Page Number */}
                  <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 font-mono">
                    <span className="font-bold text-slate-700">Auto Workshop Invoice Maker</span>
                    <span>Computer Generated Tax Invoice</span>
                    <span className="font-extrabold text-slate-950 bg-slate-100 px-1.5 py-0.1 rounded border border-slate-300">
                      Page {pageSlice.pageNumber} of {pageSlice.totalPages}
                    </span>
                  </div>
                </div>

              </div>
            ))}

          </div>
        </div>

      </div>

      {/* QUICK PAYMENT UPDATE MODAL (Without Payment Method) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePayment}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">Update Bill Settlement</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => {
                  const s = e.target.value as PaymentStatus;
                  setNewStatus(s);
                  if (s === 'Paid') setNewAmountPaid(invoice.grandTotal);
                  if (s === 'Pending') setNewAmountPaid(0);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="Paid">Paid Fully</option>
                <option value="Partial">Partial Payment</option>
                <option value="Pending">Payment Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                max={invoice.grandTotal}
                value={newAmountPaid}
                onChange={(e) => setNewAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Grand Total: ₹{invoice.grandTotal.toLocaleString('en-IN')} | Remaining Due: ₹
                {Math.max(0, invoice.grandTotal - newAmountPaid).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg shadow-xs"
              >
                Save Settlement
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
