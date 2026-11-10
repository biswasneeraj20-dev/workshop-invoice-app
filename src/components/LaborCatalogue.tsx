import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { LaborService, ServiceCategory } from '../types';
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  IndianRupee,
  Check,
  X,
  FilePlus,
} from 'lucide-react';

interface LaborCatalogueProps {
  onSelectForBill?: (service: LaborService) => void;
}

const CATEGORIES: ServiceCategory[] = [
  'General Service',
  'Brakes',
  'Electrical & AC',
  'Suspension & Steering',
  'Engine & Transmission',
  'Washing & Detailing',
  'Denting & Painting',
  'Diagnostics & Other',
];

export const LaborCatalogue: React.FC<LaborCatalogueProps> = ({ onSelectForBill }) => {
  const { laborServices, addLaborService, updateLaborService, deleteLaborService } = useWorkshop();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('General Service');
  const [standardPrice, setStandardPrice] = useState<number | ''>('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>(1.0);
  const [description, setDescription] = useState('');

  // Inline Price Editing
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlinePrice, setInlinePrice] = useState<number>(0);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory('General Service');
    setStandardPrice('');
    setEstimatedHours(1.0);
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (service: LaborService) => {
    setEditingId(service.id);
    setName(service.name);
    setCategory(service.category);
    setStandardPrice(service.standardPrice);
    setEstimatedHours(service.estimatedHours);
    setDescription(service.description);
    setShowModal(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || standardPrice === '') return;

    if (editingId) {
      updateLaborService(editingId, {
        name,
        nameHi: name,
        category,
        standardPrice: Number(standardPrice),
        estimatedHours: Number(estimatedHours) || 1.0,
        description,
      });
    } else {
      addLaborService({
        name,
        nameHi: name,
        category,
        standardPrice: Number(standardPrice),
        estimatedHours: Number(estimatedHours) || 1.0,
        description,
      });
    }
    setShowModal(false);
  };

  const handleInlineSave = (id: string) => {
    updateLaborService(id, { standardPrice: inlinePrice });
    setInlineEditingId(null);
  };

  const filteredServices = laborServices.filter(service => {
    const matchCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchSearch =
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase()) ||
      service.category.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            <span>Service Labor Charges & Rates Catalog</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard car service & repair labor charges. Edit standard rates, add custom labor, or bill directly.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Labor Service</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search labor service or work description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="text-xs text-slate-500 self-center">
            Showing <strong className="text-slate-900 font-mono">{filteredServices.length}</strong> of {laborServices.length} services
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
            All Categories ({laborServices.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = laborServices.filter(s => s.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Grid / Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[260px]">Service Description</th>
                <th className="py-3 px-4 w-44">Category</th>
                <th className="py-3 px-4 w-28 text-center">Est. Time</th>
                <th className="py-3 px-4 w-36 text-right">Standard Rate (₹)</th>
                <th className="py-3 px-4 w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No service labor charges found matching filters.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service, idx) => (
                  <tr key={service.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {service.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block text-slate-700 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-mono text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {service.estimatedHours} hrs
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inlineEditingId === service.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            value={inlinePrice}
                            onChange={e => setInlinePrice(Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-mono text-right border border-amber-400 rounded focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleInlineSave(service.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setInlineEditingId(null)}
                            className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setInlineEditingId(service.id);
                            setInlinePrice(service.standardPrice);
                          }}
                          className="font-mono font-bold text-sm text-slate-900 cursor-pointer hover:text-amber-600 tabular-nums flex items-center justify-end gap-1 group"
                          title="Click to quickly edit rate"
                        >
                          <span>₹{service.standardPrice.toLocaleString('en-IN')}</span>
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onSelectForBill && (
                          <button
                            type="button"
                            onClick={() => onSelectForBill(service)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded"
                            title="Add to New Bill"
                          >
                            <FilePlus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="Edit Service"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete labor service "${service.name}"?`)) {
                              deleteLaborService(service.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ADD / EDIT LABOR SERVICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveService}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>{editingId ? 'Edit Labor Service' : 'Add New Labor Service'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
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
                  placeholder="e.g. Brake Caliper Pin Greasing & Overhaul"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as ServiceCategory)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Labor Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 500"
                    value={standardPrice}
                    onChange={e => setStandardPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Time (Hours)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 1.5"
                    value={estimatedHours}
                    onChange={e => setEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scope of Work / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of what is checked or repaired in this service..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-xs"
              >
                {editingId ? 'Save Changes' : 'Add Labor Service'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
