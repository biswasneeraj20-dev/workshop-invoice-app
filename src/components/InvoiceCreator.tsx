import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { useAuth } from '../context/AuthContext';
import {
  Invoice,
  InvoiceItem,
  LaborService,
  SparePart,
  PaymentStatus,
  ServiceCategory,
  PartCategory,
  PartUnit,
} from '../types';
import {
  Wrench,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Car,
  User,
  Phone,
  Gauge,
  Percent,
  Search,
  X,
  IndianRupee,
  Receipt,
  FileCheck,
  Edit2,
  Check,
  Save,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';

interface InvoiceCreatorProps {
  onInvoiceCreated: (invoice: Invoice) => void;
  onCancel?: () => void;
}

const POPULAR_CARS = [
  'Maruti Swift',
  'Maruti Baleno',
  'Maruti Dzire',
  'Maruti Brezza',
  'Maruti WagonR',
  'Hyundai Creta',
  'Hyundai i20',
  'Hyundai Venue',
  'Tata Nexon',
  'Tata Punch',
  'Mahindra Scorpio',
  'Mahindra Bolero',
  'Mahindra XUV700',
  'Kia Seltos',
  'Honda City',
  'Toyota Innova',
];

export const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ onInvoiceCreated, onCancel }) => {
  const {
    laborServices,
    spareParts,
    profile,
    addInvoice,
    updateProfile,
    addLaborService,
    updateLaborService,
    addSparePart,
    updateSparePart,
  } = useWorkshop();
  const { recordBillCreated } = useAuth();

  // Customer & Car Details
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [kilometers, setKilometers] = useState<number | ''>('');
  const [fuelLevel, setFuelLevel] = useState('1/2 Tank');
  const [mechanicName, setMechanicName] = useState(profile.defaultMechanicName || '');
  const [customerComplaints, setCustomerComplaints] = useState('');

  // Invoice Items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Financials
  const [gstApplied, setGstApplied] = useState<boolean>(() =>
    profile.defaultGstApplied !== undefined ? profile.defaultGstApplied : true
  );
  const [gstRate, setGstRate] = useState<number>(profile.defaultGstRate || 18);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [amountPaidCustom, setAmountPaidCustom] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Pickers Modal State
  const [showLaborPicker, setShowLaborPicker] = useState(false);
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [laborSearch, setLaborSearch] = useState('');
  const [laborCategoryFilter, setLaborCategoryFilter] = useState<string>('All');
  const [partSearch, setPartSearch] = useState('');
  const [partCategoryFilter, setPartCategoryFilter] = useState<string>('All');

  // Editing existing labor inside picker modal
  const [editingLaborItem, setEditingLaborItem] = useState<LaborService | null>(null);
  const [editingLaborName, setEditingLaborName] = useState('');
  const [editingLaborPrice, setEditingLaborPrice] = useState<number | ''>('');
  const [editingLaborCategory, setEditingLaborCategory] = useState<ServiceCategory>('General Service');

  // Adding new master labor service from picker modal
  const [showAddMasterLabor, setShowAddMasterLabor] = useState(false);
  const [newMasterLaborName, setNewMasterLaborName] = useState('');
  const [newMasterLaborCategory, setNewMasterLaborCategory] = useState<ServiceCategory>('General Service');
  const [newMasterLaborPrice, setNewMasterLaborPrice] = useState<number | ''>('');
  const [newMasterLaborAutoAdd, setNewMasterLaborAutoAdd] = useState(true);

  // Editing existing spare part inside picker modal
  const [editingPartItem, setEditingPartItem] = useState<SparePart | null>(null);
  const [editingPartName, setEditingPartName] = useState('');
  const [editingPartSellingPrice, setEditingPartSellingPrice] = useState<number | ''>('');
  const [editingPartPurchasePrice, setEditingPartPurchasePrice] = useState<number | ''>('');
  const [editingPartStock, setEditingPartStock] = useState<number | ''>('');
  const [editingPartBrand, setEditingPartBrand] = useState('');

  // Adding new master spare part from picker modal
  const [showAddMasterPart, setShowAddMasterPart] = useState(false);
  const [newMasterPartNumber, setNewMasterPartNumber] = useState('');
  const [newMasterPartName, setNewMasterPartName] = useState('');
  const [newMasterPartBrand, setNewMasterPartBrand] = useState('Bosch');
  const [newMasterPartCategory, setNewMasterPartCategory] = useState<PartCategory>('Filters');
  const [newMasterPartPurchasePrice, setNewMasterPartPurchasePrice] = useState<number | ''>('');
  const [newMasterPartSellingPrice, setNewMasterPartSellingPrice] = useState<number | ''>('');
  const [newMasterPartStock, setNewMasterPartStock] = useState<number | ''>(10);
  const [newMasterPartUnit, setNewMasterPartUnit] = useState<PartUnit>('Pcs');
  const [newMasterPartCars, setNewMasterPartCars] = useState('');
  const [newMasterPartAutoAdd, setNewMasterPartAutoAdd] = useState(true);

  // Custom One-off Item Modal State (for unlisted/bespoke items on bill)
  const [showCustomLaborModal, setShowCustomLaborModal] = useState(false);
  const [customLaborName, setCustomLaborName] = useState('');
  const [customLaborPrice, setCustomLaborPrice] = useState<number | ''>('');

  const [showCustomPartModal, setShowCustomPartModal] = useState(false);
  const [customPartName, setCustomPartName] = useState('');
  const [customPartNo, setCustomPartNo] = useState('');
  const [customPartPrice, setCustomPartPrice] = useState<number | ''>('');

  // Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    itemToAdd: InvoiceItem;
    existingItem: InvoiceItem;
    existingCount: number;
    sourcePicker?: 'labor' | 'part' | 'customLabor' | 'customPart';
  } | null>(null);

  // Calculations
  const laborSubtotal = items
    .filter(it => it.type === 'labor')
    .reduce((sum, it) => sum + it.total, 0);

  const partsSubtotal = items
    .filter(it => it.type === 'part')
    .reduce((sum, it) => sum + it.total, 0);

  const rawSubtotal = laborSubtotal + partsSubtotal;
  const taxableAmount = rawSubtotal;
  const gstAmount = gstApplied ? Math.round((taxableAmount * (gstRate / 100)) * 100) / 100 : 0;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  const resolvedAmountPaid =
    paymentStatus === 'Paid'
      ? grandTotal
      : paymentStatus === 'Pending'
      ? 0
      : amountPaidCustom === ''
      ? 0
      : Number(amountPaidCustom);

  const balanceDue = Math.max(0, Math.round((grandTotal - resolvedAmountPaid) * 100) / 100);

  // Add a pre-made labor service (checks for duplicates)
  const handleAddLabor = (service: LaborService, forceAdd = false) => {
    const existing = items.filter(
      it =>
        it.type === 'labor' &&
        (it.itemId === service.id || it.name.trim().toLowerCase() === service.name.trim().toLowerCase())
    );

    const newItem: InvoiceItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'labor',
      itemId: service.id,
      name: service.name,
      unitPrice: service.standardPrice,
      quantity: 1,
      discount: 0,
      total: service.standardPrice,
    };

    if (existing.length > 0 && !forceAdd) {
      setDuplicateWarning({
        itemToAdd: newItem,
        existingItem: existing[0],
        existingCount: existing.length,
        sourcePicker: 'labor',
      });
      return;
    }

    setItems(prev => [...prev, newItem]);
    setShowLaborPicker(false);
  };

  // Add custom labor (checks for duplicates)
  const handleAddCustomLabor = (e?: React.FormEvent, forceAdd = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customLaborName.trim() || customLaborPrice === '') return;
    const price = Number(customLaborPrice);

    const existing = items.filter(
      it => it.type === 'labor' && it.name.trim().toLowerCase() === customLaborName.trim().toLowerCase()
    );

    const newItem: InvoiceItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'labor',
      name: customLaborName.trim(),
      unitPrice: price,
      quantity: 1,
      discount: 0,
      total: price,
    };

    if (existing.length > 0 && !forceAdd) {
      setDuplicateWarning({
        itemToAdd: newItem,
        existingItem: existing[0],
        existingCount: existing.length,
        sourcePicker: 'customLabor',
      });
      return;
    }

    setItems(prev => [...prev, newItem]);
    setCustomLaborName('');
    setCustomLaborPrice('');
    setShowCustomLaborModal(false);
  };

  // Add a pre-made spare part (checks for duplicates)
  const handleAddPart = (part: SparePart, forceAdd = false) => {
    const existing = items.filter(
      it =>
        it.type === 'part' &&
        (it.itemId === part.id ||
          (part.partNumber && it.partNumber && it.partNumber.trim().toLowerCase() === part.partNumber.trim().toLowerCase()) ||
          it.name.trim().toLowerCase() === part.name.trim().toLowerCase())
    );

    const newItem: InvoiceItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'part',
      itemId: part.id,
      name: part.name,
      partNumber: part.partNumber,
      unitPrice: part.sellingPrice,
      quantity: 1,
      discount: 0,
      total: part.sellingPrice,
    };

    if (existing.length > 0 && !forceAdd) {
      setDuplicateWarning({
        itemToAdd: newItem,
        existingItem: existing[0],
        existingCount: existing.length,
        sourcePicker: 'part',
      });
      return;
    }

    setItems(prev => [...prev, newItem]);
    setShowPartPicker(false);
  };

  // Add custom part (checks for duplicates)
  const handleAddCustomPart = (e?: React.FormEvent, forceAdd = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!customPartName.trim() || customPartPrice === '') return;
    const price = Number(customPartPrice);

    const existing = items.filter(
      it =>
        it.type === 'part' &&
        ((customPartNo.trim() && it.partNumber && it.partNumber.trim().toLowerCase() === customPartNo.trim().toLowerCase()) ||
          it.name.trim().toLowerCase() === customPartName.trim().toLowerCase())
    );

    const newItem: InvoiceItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'part',
      name: customPartName.trim(),
      partNumber: customPartNo.trim() || 'GENERIC',
      unitPrice: price,
      quantity: 1,
      discount: 0,
      total: price,
    };

    if (existing.length > 0 && !forceAdd) {
      setDuplicateWarning({
        itemToAdd: newItem,
        existingItem: existing[0],
        existingCount: existing.length,
        sourcePicker: 'customPart',
      });
      return;
    }

    setItems(prev => [...prev, newItem]);
    setCustomPartName('');
    setCustomPartNo('');
    setCustomPartPrice('');
    setShowCustomPartModal(false);
  };

  // Duplicate Action 1: Cancel adding duplicate item
  const handleCancelDuplicate = () => {
    setDuplicateWarning(null);
  };

  // Duplicate Action 2: Confirm adding duplicate item anyway
  const handleConfirmAddDuplicate = () => {
    if (!duplicateWarning) return;
    setItems(prev => [...prev, duplicateWarning.itemToAdd]);
    if (duplicateWarning.sourcePicker === 'labor') setShowLaborPicker(false);
    if (duplicateWarning.sourcePicker === 'part') setShowPartPicker(false);
    if (duplicateWarning.sourcePicker === 'customLabor') {
      setCustomLaborName('');
      setCustomLaborPrice('');
      setShowCustomLaborModal(false);
    }
    if (duplicateWarning.sourcePicker === 'customPart') {
      setCustomPartName('');
      setCustomPartNo('');
      setCustomPartPrice('');
      setShowCustomPartModal(false);
    }
    setDuplicateWarning(null);
  };

  // Duplicate Action 3: Increase quantity of existing item by 1
  const handleIncreaseQuantityDuplicate = () => {
    if (!duplicateWarning) return;
    setItems(prev =>
      prev.map(it => {
        if (it.id === duplicateWarning.existingItem.id) {
          const newQty = it.quantity + 1;
          const newTotal = Math.max(0, it.unitPrice * newQty - it.discount);
          return {
            ...it,
            quantity: newQty,
            total: newTotal,
          };
        }
        return it;
      })
    );
    if (duplicateWarning.sourcePicker === 'labor') setShowLaborPicker(false);
    if (duplicateWarning.sourcePicker === 'part') setShowPartPicker(false);
    if (duplicateWarning.sourcePicker === 'customLabor') {
      setCustomLaborName('');
      setCustomLaborPrice('');
      setShowCustomLaborModal(false);
    }
    if (duplicateWarning.sourcePicker === 'customPart') {
      setCustomPartName('');
      setCustomPartNo('');
      setCustomPartPrice('');
      setShowCustomPartModal(false);
    }
    setDuplicateWarning(null);
  };

  // Save changes to an existing pre-made Labor Service
  const handleSaveEditedLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLaborItem || !editingLaborName.trim() || editingLaborPrice === '') return;
    const price = Number(editingLaborPrice);
    
    updateLaborService(editingLaborItem.id, {
      name: editingLaborName.trim(),
      nameHi: editingLaborName.trim(),
      category: editingLaborCategory,
      standardPrice: price,
    });

    // Also sync price in current invoice if already added
    setItems(prev =>
      prev.map(it => {
        if (it.itemId === editingLaborItem.id) {
          const total = Math.max(0, price * it.quantity - it.discount);
          return {
            ...it,
            name: editingLaborName,
            unitPrice: price,
            total,
          };
        }
        return it;
      })
    );

    setEditingLaborItem(null);
  };

  // Create brand new Labor Service in the master catalog
  const handleCreateMasterLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterLaborName.trim() || newMasterLaborPrice === '') return;
    const price = Number(newMasterLaborPrice);

    const created = addLaborService({
      name: newMasterLaborName.trim(),
      nameHi: newMasterLaborName.trim(),
      category: newMasterLaborCategory,
      standardPrice: price,
      estimatedHours: 1.0,
      description: 'Added directly from billing catalog',
    });

    if (newMasterLaborAutoAdd) {
      handleAddLabor(created);
    }

    setNewMasterLaborName('');
    setNewMasterLaborPrice('');
    setShowAddMasterLabor(false);
  };

  // Save changes to an existing pre-made Spare Part
  const handleSaveEditedPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartItem || !editingPartName.trim() || editingPartSellingPrice === '') return;
    const sellPrice = Number(editingPartSellingPrice);
    const costPrice = editingPartPurchasePrice === '' ? editingPartItem.purchasePrice : Number(editingPartPurchasePrice);
    const stockVal = editingPartStock === '' ? editingPartItem.currentStock : Number(editingPartStock);

    updateSparePart(editingPartItem.id, {
      name: editingPartName.trim(),
      nameHi: editingPartName.trim(),
      brand: editingPartBrand.trim() || editingPartItem.brand,
      sellingPrice: sellPrice,
      purchasePrice: costPrice,
      currentStock: stockVal,
    });

    // Also sync in current invoice if already added
    setItems(prev =>
      prev.map(it => {
        if (it.itemId === editingPartItem.id) {
          const total = Math.max(0, sellPrice * it.quantity - it.discount);
          return {
            ...it,
            name: editingPartName,
            unitPrice: sellPrice,
            total,
          };
        }
        return it;
      })
    );

    setEditingPartItem(null);
  };

  // Create brand new Spare Part in the master inventory
  const handleCreateMasterPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPartName.trim() || newMasterPartSellingPrice === '') return;
    const sellPrice = Number(newMasterPartSellingPrice);
    const costPrice = newMasterPartPurchasePrice === '' ? Math.round(sellPrice * 0.75) : Number(newMasterPartPurchasePrice);
    const stockVal = newMasterPartStock === '' ? 5 : Number(newMasterPartStock);

    const created = addSparePart({
      partNumber: newMasterPartNumber.trim().toUpperCase() || `PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newMasterPartName.trim(),
      nameHi: newMasterPartName.trim(),
      brand: newMasterPartBrand.trim() || 'Genuine',
      category: newMasterPartCategory,
      purchasePrice: costPrice,
      sellingPrice: sellPrice,
      currentStock: stockVal,
      minStockLevel: 2,
      unit: newMasterPartUnit,
      compatibleCars: newMasterPartCars.trim() || 'Universal / Multi-Car Fitment',
      location: 'Rack Main',
    });

    if (newMasterPartAutoAdd) {
      handleAddPart(created);
    }

    setNewMasterPartNumber('');
    setNewMasterPartName('');
    setNewMasterPartSellingPrice('');
    setNewMasterPartPurchasePrice('');
    setNewMasterPartCars('');
    setShowAddMasterPart(false);
  };

  // Update item field
  const handleUpdateItem = (id: string, field: 'unitPrice' | 'quantity' | 'discount', value: number) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const unitPrice = field === 'unitPrice' ? Math.max(0, value) : it.unitPrice;
        const quantity = field === 'quantity' ? Math.max(1, value) : it.quantity;
        const discount = field === 'discount' ? Math.max(0, value) : it.discount;
        const total = Math.max(0, unitPrice * quantity - discount);
        return {
          ...it,
          unitPrice,
          quantity,
          discount,
          total,
        };
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Submit invoice
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleNumber.trim()) {
      alert('Please enter vehicle registration number!');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter customer name!');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one labor service or spare part!');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newInvoice = addInvoice({
      date: todayStr,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      vehicleNumber: vehicleNumber.toUpperCase().trim(),
      carModel: carModel.trim() || 'Car / Passenger Vehicle',
      kilometers: Number(kilometers) || 0,
      fuelLevel,
      mechanicName,
      customerComplaints,
      items,
      laborSubtotal,
      partsSubtotal,
      gstApplied,
      gstRate: gstApplied ? Number(gstRate) : 0,
      gstAmount,
      grandTotal,
      paymentStatus,
      amountPaid: resolvedAmountPaid,
      balanceDue,
      notes,
    });

    // Record bill created for trial count
    recordBillCreated();

    // Remember user's preferences (mechanic name, GST checkbox choice)
    updateProfile({
      defaultMechanicName: mechanicName.trim(),
      defaultGstApplied: gstApplied,
    });

    onInvoiceCreated(newInvoice);
  };

  // Filtered Labor List
  const filteredLabor = laborServices.filter(service => {
    const matchCat = laborCategoryFilter === 'All' || service.category === laborCategoryFilter;
    const matchSearch =
      service.name.toLowerCase().includes(laborSearch.toLowerCase()) ||
      service.category.toLowerCase().includes(laborSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered Parts List
  const filteredParts = spareParts.filter(part => {
    const matchCat = partCategoryFilter === 'All' || part.category === partCategoryFilter;
    const matchSearch =
      part.name.toLowerCase().includes(partSearch.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(partSearch.toLowerCase()) ||
      part.brand.toLowerCase().includes(partSearch.toLowerCase()) ||
      part.compatibleCars.toLowerCase().includes(partSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span>Create New Car Service Invoice & Job Card</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Add customer & car info, choose pre-made labor charges & spare parts, and generate instant invoice
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Date:</span>
          <span className="font-bold text-amber-400">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>

      <form onSubmit={handleSubmitInvoice} className="p-6 space-y-6">
        
        {/* SECTION 1: Customer & Vehicle Information */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Vehicle & Customer Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Reg. Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. DL 01 AB 1234"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full pl-3 pr-3 py-2 text-sm font-mono font-bold uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Car Make & Model */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Car Make & Model *
              </label>
              <input
                type="text"
                required
                list="popular-cars"
                placeholder="e.g. Maruti Swift ZXi / Creta"
                value={carModel}
                onChange={e => setCarModel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <datalist id="popular-cars">
                {POPULAR_CARS.map(c => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Odometer KM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kilometers (KM)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="e.g. 45000"
                  value={kilometers}
                  onChange={e => setKilometers(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Fuel Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel Level
              </label>
              <select
                value={fuelLevel}
                onChange={e => setFuelLevel(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="Reserve / Empty">Reserve / Low</option>
                <option value="1/4 Tank">1/4 Tank</option>
                <option value="1/2 Tank">1/2 Tank (Half)</option>
                <option value="3/4 Tank">3/4 Tank</option>
                <option value="Full Tank">Full Tank</option>
              </select>
            </div>

            {/* Assigned Mechanic */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mechanic / Technician
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Mistry / Raju"
                value={mechanicName}
                onChange={e => setMechanicName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            {/* Customer Complaints / Requests */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complaints / Work Note
              </label>
              <input
                type="text"
                placeholder="e.g. Regular service + Brake check"
                value={customerComplaints}
                onChange={e => setCustomerComplaints(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Service Labor Charges & Spare Parts Selection */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>2. Labor Charges & Spare Parts List</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select pre-made service labor charges and spare parts from catalog or add custom item
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Add Pre-made Labor */}
              <button
                type="button"
                onClick={() => setShowLaborPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>+ Add Labor</span>
              </button>

              {/* Add Pre-made Spare Part */}
              <button
                type="button"
                onClick={() => setShowPartPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition"
              >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>+ Add Spare Part</span>
              </button>

              {/* Add Custom Labor */}
              <button
                type="button"
                onClick={() => setShowCustomLaborModal(true)}
                className="px-2.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition"
              >
                + Custom Labor
              </button>

              {/* Add Custom Part */}
              <button
                type="button"
                onClick={() => setShowCustomPartModal(true)}
                className="px-2.5 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs transition"
              >
                + Custom Part
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                No service labor or spare parts added yet
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click "+ Add Labor" or "+ Add Spare Part" above to add items, or use custom item buttons.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-20">Type</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Item Description / Part No</th>
                      <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-24 text-right">Discount (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                              it.type === 'labor' ? 'text-amber-700' : 'text-blue-700'
                            }`}
                          >
                            {it.type === 'labor' ? <Wrench className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                            {it.type === 'labor' ? 'Labor' : 'Part'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-900">{it.name}</div>
                          {it.partNumber && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              Part #: {it.partNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={it.unitPrice}
                            onChange={e => handleUpdateItem(it.id, 'unitPrice', Number(e.target.value))}
                            className="w-24 px-2 py-1 text-right font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={e => handleUpdateItem(it.id, 'quantity', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-center font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={it.discount}
                            onChange={e => handleUpdateItem(it.id, 'discount', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-right font-mono text-xs border border-slate-300 rounded focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ₹{it.total.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal Split Bar */}
              <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-600">
                  <span>
                    Labor Total: <strong className="font-mono text-slate-900">₹{laborSubtotal.toLocaleString('en-IN')}</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Parts Total: <strong className="font-mono text-slate-900">₹{partsSubtotal.toLocaleString('en-IN')}</strong>
                  </span>
                </div>
                <div className="text-slate-700">
                  Total Items: <strong className="font-mono">{items.length}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Calculations, GST & Payment Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Payment & Workshop Notes */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>3. Payment & Settlement Status</span>
            </h3>

            <div>
              {/* Payment Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  <option value="Paid">Paid Fully</option>
                  <option value="Pending">Payment Pending</option>
                  <option value="Partial">Partial Payment</option>
                </select>
              </div>
            </div>

            {/* Custom Amount Paid if Partial */}
            {paymentStatus === 'Partial' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Amount Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  placeholder="Enter advance or paid amount"
                  value={amountPaidCustom}
                  onChange={e => setAmountPaidCustom(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="text-[11px] text-amber-700 mt-1 font-mono">
                  Balance Due will be: ₹{balanceDue.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Workshop Notes / Advice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workshop Notes & Advice to Customer
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Next service due at 55,000 KM. Brake discs skimming done."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Grand Totals Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-amber-400 border-b border-slate-800 pb-2">
              Bill Breakdown & Summary
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Labor Charges Subtotal:</span>
                <span className="font-mono font-medium tabular-nums text-white">₹{laborSubtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Spare Parts Subtotal:</span>
                <span className="font-mono font-medium tabular-nums text-white">₹{partsSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* GST Toggle & Rate */}
              <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gstApplied}
                    onChange={e => {
                      const checked = e.target.checked;
                      setGstApplied(checked);
                      updateProfile({ defaultGstApplied: checked });
                    }}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                  />
                  <span className="text-xs font-medium">
                    Apply GST Tax
                  </span>
                </label>

                {gstApplied && (
                  <div className="flex items-center gap-1">
                    <select
                      value={gstRate}
                      onChange={e => setGstRate(Number(e.target.value))}
                      className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white font-mono"
                    >
                      <option value="18">18% GST (Std Auto)</option>
                      <option value="28">28% GST (Parts)</option>
                      <option value="12">12% GST</option>
                      <option value="5">5% GST</option>
                    </select>
                    <span className="font-mono text-white tabular-nums">
                      ₹{gstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                    Grand Total Amount
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {gstApplied ? `Inclusive of ${gstRate}% GST` : 'No Tax / Non-GST Estimate'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Payment Settlement Breakdown */}
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60 mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Paid Amount:</span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    ₹{resolvedAmountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Balance Due:</span>
                  <span className={`font-mono font-bold tabular-nums ${balanceDue > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-sm shadow-md transition"
          >
            <FileCheck className="w-4 h-4" />
            <span>
              Save & Generate Invoice
            </span>
          </button>
        </div>
      </form>

      {/* MODAL 1: Pre-Made Labor Picker (Browse Labor Charges) */}
      {showLaborPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Browse Labor Charges Catalog
                  </h3>
                  <span className="text-[11px] text-slate-400 block">
                    Edit name & price or create new labor
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewMasterLaborName('');
                    setNewMasterLaborCategory('General Service');
                    setNewMasterLaborPrice('');
                    setNewMasterLaborAutoAdd(true);
                    setShowAddMasterLabor(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Labor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLaborPicker(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search service name (e.g. Brake, Service, AC, Clutch)..."
                  value={laborSearch}
                  onChange={e => setLaborSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'General Service', 'Brakes', 'Electrical & AC', 'Suspension & Steering', 'Engine & Transmission', 'Washing & Detailing', 'Denting & Painting'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLaborCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium transition ${
                      laborCategoryFilter === cat
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List with In-place Edit Button */}
            <div className="overflow-y-auto p-4 divide-y divide-slate-100 space-y-1 flex-1">
              {filteredLabor.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No labor services found matching search.
                </div>
              ) : (
                filteredLabor.map(service => (
                  <div
                    key={service.id}
                    className="py-2.5 px-3 rounded-lg hover:bg-amber-50/50 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {service.name}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {service.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Est. Time: ~{service.estimatedHours} hrs
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          ₹{service.standardPrice.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400">Standard Rate</span>
                      </div>

                      {/* Edit Name & Price Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLaborItem(service);
                          setEditingLaborName(service.name);
                          setEditingLaborPrice(service.standardPrice);
                          setEditingLaborCategory(service.category);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition border border-slate-200 hover:border-amber-300"
                        title="Edit Service Name & Price"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Add to Bill Button */}
                      <button
                        type="button"
                        onClick={() => handleAddLabor(service)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold rounded-lg shadow-2xs transition"
                      >
                        + Add to Bill
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pre-Made Spare Parts Picker (Browse Parts Catalog) */}
      {showPartPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Browse Spare Parts Catalog
                  </h3>
                  <span className="text-[11px] text-slate-400 block">
                    Edit part name & price or create new part
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewMasterPartNumber(`PRT-${Math.floor(1000 + Math.random() * 9000)}`);
                    setNewMasterPartName('');
                    setNewMasterPartBrand('Bosch');
                    setNewMasterPartCategory('Filters');
                    setNewMasterPartPurchasePrice('');
                    setNewMasterPartSellingPrice('');
                    setNewMasterPartStock(10);
                    setNewMasterPartUnit('Pcs');
                    setNewMasterPartCars('');
                    setNewMasterPartAutoAdd(true);
                    setShowAddMasterPart(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Part</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPartPicker(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search part name, part # (e.g. 5W-30, Bosch, Filter, Brake Pad)..."
                  value={partSearch}
                  onChange={e => setPartSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {['All', 'Lubricants & Fluids', 'Filters', 'Braking', 'Ignition & Electrical', 'Clutch & Transmission', 'Suspension & Steering', 'Wiper & Lighting'].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPartCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium transition ${
                      partCategoryFilter === cat
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List with In-place Edit Button */}
            <div className="overflow-y-auto p-4 divide-y divide-slate-100 space-y-1 flex-1">
              {filteredParts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No spare parts found matching search.
                </div>
              ) : (
                filteredParts.map(part => {
                  const isLow = part.currentStock <= part.minStockLevel;
                  const isOut = part.currentStock === 0;

                  return (
                    <div
                      key={part.id}
                      className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {part.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                            {part.partNumber}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {part.brand} <span className="text-slate-300">·</span> Fits: {part.compatibleCars} <span className="text-slate-300">·</span> Loc: {part.location || 'Rack'}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                            ₹{part.sellingPrice.toLocaleString('en-IN')}
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold block ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                            }`}
                          >
                            Stock: {part.currentStock} {part.unit}
                          </span>
                        </div>

                        {/* Edit Name, Price & Stock Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPartItem(part);
                            setEditingPartName(part.name);
                            setEditingPartSellingPrice(part.sellingPrice);
                            setEditingPartPurchasePrice(part.purchasePrice);
                            setEditingPartStock(part.currentStock);
                            setEditingPartBrand(part.brand);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition border border-slate-200 hover:border-blue-300"
                          title="Edit Part Name, Price & Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Add to Bill Button */}
                        <button
                          type="button"
                          onClick={() => handleAddPart(part)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-lg shadow-2xs transition"
                        >
                          + Add to Bill
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 1.1: EDIT PRE-MADE LABOR SERVICE NAME & PRICE */}
      {editingLaborItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedLabor}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Edit Labor Service Name & Rate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLaborItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingLaborName}
                  onChange={e => setEditingLaborName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Labor Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingLaborPrice}
                    onChange={e => setEditingLaborPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingLaborCategory}
                    onChange={e => setEditingLaborCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {['General Service', 'Brakes', 'Electrical & AC', 'Suspension & Steering', 'Engine & Transmission', 'Washing & Detailing', 'Denting & Painting', 'Diagnostics & Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingLaborItem(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                Save Changes to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-MODAL 1.2: CREATE NEW MASTER LABOR SERVICE */}
      {showAddMasterLabor && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMasterLabor}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Add New Labor Service to Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMasterLabor(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steering Rack Bushing Replacement"
                  value={newMasterLaborName}
                  onChange={e => setNewMasterLaborName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 750"
                    value={newMasterLaborPrice}
                    onChange={e => setNewMasterLaborPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newMasterLaborCategory}
                    onChange={e => setNewMasterLaborCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {['General Service', 'Brakes', 'Electrical & AC', 'Suspension & Steering', 'Engine & Transmission', 'Washing & Detailing', 'Denting & Painting', 'Diagnostics & Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newMasterLaborAutoAdd}
                  onChange={e => setNewMasterLaborAutoAdd(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Also add to current bill immediately
                </span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMasterLabor(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                Save & Add to Catalog
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-MODAL 2.1: EDIT PRE-MADE SPARE PART NAME & PRICE */}
      {editingPartItem && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditedPart}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Edit Spare Part Details & Price
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spare Part Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingPartName}
                  onChange={e => setEditingPartName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price / MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPartSellingPrice}
                    onChange={e => setEditingPartSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingPartPurchasePrice}
                    onChange={e => setEditingPartPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    In-Stock Quantity ({editingPartItem.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingPartStock}
                    onChange={e => setEditingPartStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={editingPartBrand}
                    onChange={e => setEditingPartBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPartItem(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
              >
                Save Changes to Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-MODAL 2.2: CREATE NEW MASTER SPARE PART */}
      {showAddMasterPart && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMasterPart}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Add New Spare Part to Inventory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMasterPart(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Part Number / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BOS-BP-990"
                    value={newMasterPartNumber}
                    onChange={e => setNewMasterPartNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch / Castrol / Lumax"
                    value={newMasterPartBrand}
                    onChange={e => setNewMasterPartBrand(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spare Part Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rear Brake Drum Shoe Set"
                  value={newMasterPartName}
                  onChange={e => setNewMasterPartName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newMasterPartCategory}
                    onChange={e => setNewMasterPartCategory(e.target.value as PartCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Lubricants & Fluids', 'Filters', 'Braking', 'Ignition & Electrical', 'Clutch & Transmission', 'Suspension & Steering', 'Wiper & Lighting', 'Engine Parts', 'Body & Accessories'].map(c => (
                      <option key={c} value={c as PartCategory}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newMasterPartUnit}
                    onChange={e => setNewMasterPartUnit(e.target.value as PartUnit)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Pcs', 'Litre', 'Can', 'Bottle', 'Set', 'Pair'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1250"
                    value={newMasterPartSellingPrice}
                    onChange={e => setNewMasterPartSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 850"
                    value={newMasterPartPurchasePrice}
                    onChange={e => setNewMasterPartPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMasterPartStock}
                    onChange={e => setNewMasterPartStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compatible Cars
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Swift, Dzire, Baleno"
                  value={newMasterPartCars}
                  onChange={e => setNewMasterPartCars(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newMasterPartAutoAdd}
                  onChange={e => setNewMasterPartAutoAdd(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Also add to current bill immediately
                </span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMasterPart(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
              >
                Save & Add to Inventory
              </button>
            </div>
          </form>
        </div>
      )}


      {/* MODAL 3: Custom Labor Input */}
      {showCustomLaborModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomLabor}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Add Custom Labor Charge</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomLaborModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Service / Work Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silencer welding / Horn wiring"
                  value={customLaborName}
                  onChange={e => setCustomLaborName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Labor Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 450"
                  value={customLaborPrice}
                  onChange={e => setCustomLaborPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomLaborModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                Add to Bill
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Custom Part Input */}
      {showCustomPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddCustomPart}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Add Custom Spare Part</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCustomPartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Spare Part Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Side Mirror Glass Left"
                  value={customPartName}
                  onChange={e => setCustomPartName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Part Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MIR-GL-01"
                    value={customPartNo}
                    onChange={e => setCustomPartNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 350"
                    value={customPartPrice}
                    onChange={e => setCustomPartPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomPartModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
              >
                Add to Bill
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 5: Duplicate Item Warning Notice Modal */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-amber-400 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-between border-b border-amber-600">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-950 text-amber-400 rounded-xl shadow-xs">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base leading-tight">
                    Duplicate Item Notice
                  </h3>
                  <span className="text-xs font-bold text-slate-900 block">
                    यह आइटम पहले से बिल में जुड़ा हुआ है!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelDuplicate}
                className="p-1.5 text-slate-950 hover:bg-amber-400 rounded-lg transition"
                title="Cancel / Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`inline-block text-[10px] uppercase font-black px-2 py-0.5 rounded mb-1 ${
                        duplicateWarning.itemToAdd.type === 'labor'
                          ? 'bg-amber-200 text-amber-950 border border-amber-300'
                          : 'bg-blue-100 text-blue-950 border border-blue-300'
                      }`}
                    >
                      {duplicateWarning.itemToAdd.type === 'labor' ? 'Labor Charge' : 'Spare Part'}
                    </span>
                    <h4 className="font-black text-slate-950 text-sm">
                      {duplicateWarning.itemToAdd.name}
                    </h4>
                    {duplicateWarning.itemToAdd.partNumber && (
                      <span className="text-[11px] text-slate-600 font-mono block mt-0.5">
                        Part No: {duplicateWarning.itemToAdd.partNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-950 text-sm">
                      ₹{duplicateWarning.itemToAdd.unitPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Rate</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/70 text-slate-800 text-xs font-medium">
                  ⚠️ यह आइटम वर्तमान बिल में पहले से{' '}
                  <strong className="text-amber-950 font-black">
                    {duplicateWarning.existingCount} बार
                  </strong>{' '}
                  मौजूद है (वर्तमान मात्रा:{' '}
                  <strong className="text-slate-950 font-black">
                    {duplicateWarning.existingItem.quantity}
                  </strong>
                  )।
                </div>
              </div>

              <p className="text-xs text-slate-700 font-semibold text-center">
                क्या आप इसे बिल में दोबारा जोड़ना चाहते हैं या रद्द करना चाहते हैं?
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* 1. Cancel */}
                <button
                  type="button"
                  onClick={handleCancelDuplicate}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 transition text-center shadow-2xs"
                >
                  ✕ Cancel (रद्द करें)
                </button>

                {/* 2. Increase Qty */}
                <button
                  type="button"
                  onClick={handleIncreaseQuantityDuplicate}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-900 font-extrabold rounded-xl text-xs border border-emerald-300 transition text-center shadow-2xs"
                  title="Increase existing item quantity by 1"
                >
                  +1 Qty (मात्रा बढ़ाएं)
                </button>

                {/* 3. Add Again / Add Duplicate */}
                <button
                  type="button"
                  onClick={handleConfirmAddDuplicate}
                  className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs shadow-md transition text-center"
                >
                  + Add (दोबारा जोड़ें)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
