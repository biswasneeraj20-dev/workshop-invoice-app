export type ServiceCategory =
  | 'General Service'
  | 'Brakes'
  | 'Engine & Transmission'
  | 'Electrical & AC'
  | 'Suspension & Steering'
  | 'Denting & Painting'
  | 'Washing & Detailing'
  | 'Diagnostics & Other';

export interface LaborService {
  id: string;
  name: string;
  nameHi?: string;
  category: ServiceCategory;
  standardPrice: number;
  estimatedHours: number;
  description: string;
}

export type PartCategory =
  | 'Lubricants & Fluids'
  | 'Filters'
  | 'Braking'
  | 'Ignition & Electrical'
  | 'Clutch & Transmission'
  | 'Suspension & Steering'
  | 'Wiper & Lighting'
  | 'Engine Parts'
  | 'Body & Accessories';

export type PartUnit = 'Pcs' | 'Litre' | 'Set' | 'Can' | 'Bottle' | 'Pair';

export interface SparePart {
  id: string;
  partNumber: string;
  name: string;
  nameHi?: string;
  category: PartCategory;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  unit: PartUnit;
  compatibleCars: string;
  location?: string;
  lastRestockedAt?: string;
}

export interface InvoiceItem {
  id: string;
  type: 'labor' | 'part';
  itemId?: string;
  name: string;
  partNumber?: string;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Unpaid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  jobCardNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  vehicleNumber: string;
  carModel: string;
  kilometers: number;
  fuelLevel?: string;
  mechanicName?: string;
  customerComplaints?: string;
  items: InvoiceItem[];
  laborSubtotal: number;
  partsSubtotal: number;
  discountTotal?: number;
  gstApplied: boolean;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  createdAt: string;
}

export type PaperSize = 'A4' | 'A5';
export type TableBorderStyle = 'none' | 'thin' | 'medium' | 'thick';

export interface WorkshopProfile {
  name: string;
  tagline: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  gstin: string;
  email?: string;
  defaultGstRate: number;
  upiId: string;
  termsAndConditions: string[];
  logoUrl?: string;
  defaultMechanicName?: string;
  defaultGstApplied?: boolean;
  defaultPaperSize?: PaperSize;
  tableBorderStyle?: TableBorderStyle;
}

export interface UserSubscriptionProfile {
  id: string;
  email: string;
  workshop_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  gstin?: string;
  upi_id?: string;
  logo_url?: string;
  is_active: boolean;
  bills_created_count: number;
  max_free_bills: number;
  subscription_plan?: string;
  subscription_end_date?: string;
  current_session_id?: string;
  created_at?: string;
}
