import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { SparePart, PartCategory, PartUnit } from '../types';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  PlusCircle,
  CheckCircle2,
  X,
  IndianRupee,
  Layers,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

const CATEGORIES: PartCategory[] = [
  'Lubricants & Fluids',
  'Filters',
  'Braking',
  'Ignition & Electrical',
  'Clutch & Transmission',
  'Suspension & Steering',
  'Wiper & Lighting',
  'Engine Parts',
  'Body & Accessories',
];

const UNITS: PartUnit[] = ['Pcs', 'Litre', 'Can', 'Bottle', 'Set', 'Pair'];

export const PartsInventory: React.FC = () => {
  const { spareParts, addSparePart, updateSparePart, deleteSparePart, adjustPartStock, stats } = useWorkshop();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Add / Edit Modal
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [partNumber, setPartNumber] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PartCategory>('Filters');
  const [brand, setBrand] = useState('Bosch');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>(10);
  const [minStockLevel, setMinStockLevel] = useState<number | ''>(3);
  const [unit, setUnit] = useState<PartUnit>('Pcs');
  const [compatibleCars, setCompatibleCars] = useState('');
  const [location, setLocation] = useState('Rack A-1');

  // Quick Restock Modal
  const [restockPart, setRestockPart] = useState<SparePart | null>(null);
  const [restockQty, setRestockQty] = useState<number>(5);

  const openAddModal = () => {
    setEditingId(null);
    setPartNumber(`PRT-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('Filters');
    setBrand('Bosch');
    setPurchasePrice('');
    setSellingPrice('');
    setCurrentStock(10);
    setMinStockLevel(3);
    setUnit('Pcs');
    setCompatibleCars('Maruti Swift, Baleno, Dzire');
    setLocation('Rack A-1');
    setShowPartModal(true);
  };

  const openEditModal = (part: SparePart) => {
    setEditingId(part.id);
    setPartNumber(part.partNumber);
    setName(part.name);
    setCategory(part.category);
    setBrand(part.brand);
    setPurchasePrice(part.purchasePrice);
    setSellingPrice(part.sellingPrice);
    setCurrentStock(part.currentStock);
    setMinStockLevel(part.minStockLevel);
    setUnit(part.unit);
    setCompatibleCars(part.compatibleCars);
    setLocation(part.location || '');
    setShowPartModal(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !partNumber || purchasePrice === '' || sellingPrice === '') return;

    if (editingId) {
      updateSparePart(editingId, {
        partNumber: partNumber.toUpperCase().trim(),
        name: name.trim(),
        nameHi: name.trim(),
        category,
        brand: brand.trim(),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock) || 0,
        minStockLevel: Number(minStockLevel) || 1,
        unit,
        compatibleCars: compatibleCars.trim(),
        location: location.trim(),
      });
    } else {
      addSparePart({
        partNumber: partNumber.toUpperCase().trim(),
        name: name.trim(),
        nameHi: name.trim(),
        category,
        brand: brand.trim(),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        currentStock: Number(currentStock) || 0,
        minStockLevel: Number(minStockLevel) || 1,
        unit,
        compatibleCars: compatibleCars.trim(),
        location: location.trim(),
      });
    }
    setShowPartModal(false);
  };

  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockPart || restockQty <= 0) return;
    adjustPartStock(restockPart.id, restockQty);
    setRestockPart(null);
  };

  const filteredParts = spareParts.filter(part => {
    const matchCategory = selectedCategory === 'All' || part.category === selectedCategory;
    const matchLowStock = !lowStockOnly || part.currentStock <= part.minStockLevel;
    const matchSearch =
      part.name.toLowerCase().includes(search.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      part.brand.toLowerCase().includes(search.toLowerCase()) ||
      part.compatibleCars.toLowerCase().includes(search.toLowerCase()) ||
      (part.location && part.location.toLowerCase().includes(search.toLowerCase()));

    return matchCategory && matchLowStock && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Spare Parts & Inventory Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track auto parts, engine oils, filters & stock levels in real-time with purchase & selling prices
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-lg text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Add New Spare Part</span>
        </button>
      </div>

      {/* Inventory Financial Valuation Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Inventory Units
          </span>
          <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {stats.totalPartsCount} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Across {spareParts.length} unique catalog SKUs
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Stock Cost Value (Purchase)
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            ₹{stats.inventoryCostValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Wholesale investment in inventory
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Retail Potential Value (MRP)
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            ₹{stats.inventoryRetailValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Expected revenue on sale
          </span>
        </div>

        <div
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`p-4 rounded-xl shadow-xs cursor-pointer border transition ${
            stats.lowStockCount > 0
              ? 'bg-rose-50 border-rose-300 hover:border-rose-400'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
              Low Stock Reorder Alert
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
            {stats.lowStockCount} <span className="text-xs font-normal text-rose-500">items</span>
          </div>
          <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
            {lowStockOnly ? '✓ Viewing low stock only' : 'Click to filter reorders'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search part name, part number, OEM brand, vehicle fitment..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                lowStockOnly
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alert ({stats.lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Parts ({spareParts.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = spareParts.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-3 min-w-[240px]">Part Details / Hindi Name</th>
                <th className="py-3 px-3 w-28">Brand & Loc</th>
                <th className="py-3 px-3 min-w-[180px]">Fits Vehicles</th>
                <th className="py-3 px-3 w-24 text-right">Cost (₹)</th>
                <th className="py-3 px-3 w-24 text-right">Sell (₹)</th>
                <th className="py-3 px-3 w-28 text-center">In Stock</th>
                <th className="py-3 px-3 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No spare parts found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredParts.map((part, idx) => {
                  const isOut = part.currentStock === 0;
                  const isLow = part.currentStock <= part.minStockLevel;
                  const marginPct = Math.round(((part.sellingPrice - part.purchasePrice) / part.purchasePrice) * 100);

                  return (
                    <tr key={part.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {part.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-bold">
                            {part.partNumber}
                          </span>
                          <span>·</span>
                          <span>{part.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{part.brand}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {part.location || 'Rack'}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-xs text-slate-700 line-clamp-2">
                          {part.compatibleCars || 'Universal All Models'}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600 tabular-nums">
                        ₹{part.purchasePrice.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          ₹{part.sellingPrice.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-mono block">
                          +{marginPct}% margin
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded border tabular-nums ${
                              isOut
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {part.currentStock} {part.unit}
                          </span>
                        </div>
                        {isLow && (
                          <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                            Min: {part.minStockLevel} (Reorder)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Restock (+) */}
                          <button
                            type="button"
                            onClick={() => {
                              setRestockPart(part);
                              setRestockQty(5);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                            title="Restock Part (Add Quantity)"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => openEditModal(part)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Edit Part"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete spare part "${part.name}"?`)) {
                                deleteSparePart(part.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete Part"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD / EDIT SPARE PART */}
      {showPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePart}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span>{editingId ? 'Edit Spare Part Details' : 'Add New Spare Part to Inventory'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Part Number / SKU *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOS-OF-0081"
                    value={partNumber}
                    onChange={e => setPartNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacturer / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch / Castrol / Mobil"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
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
                  placeholder="e.g. Castrol MAGNATEC 5W-30 Full Synthetic Engine Oil (3.5L)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as PartCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as PartUnit)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price / Cost (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1450"
                    value={purchasePrice}
                    onChange={e => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price / MRP (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1850"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Stock Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={currentStock}
                    onChange={e => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low Stock Alert Level *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={minStockLevel}
                    onChange={e => setMinStockLevel(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Shelf / Rack
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-2"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compatible Car Models
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maruti Swift, Baleno, Dzire, Hyundai i20"
                  value={compatibleCars}
                  onChange={e => setCompatibleCars(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPartModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-xs"
              >
                {editingId ? 'Save Changes' : 'Add Part to Inventory'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: QUICK RESTOCK DIALOG */}
      {restockPart && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleExecuteRestock}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Restock Part</h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockPart(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="font-bold text-xs text-slate-900">{restockPart.name}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                SKU: {restockPart.partNumber} · Current Stock: {restockPart.currentStock} {restockPart.unit}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Add ({restockPart.unit})
              </label>
              <input
                type="number"
                min="1"
                required
                value={restockQty}
                onChange={e => setRestockQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="text-[11px] text-slate-500 mt-1">
                New Stock will be: <strong className="font-mono text-slate-900">{restockPart.currentStock + restockQty} {restockPart.unit}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRestockPart(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 font-bold text-white rounded-lg shadow-xs"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
