import React, { useState } from 'react';
import { WarehouseStack } from '../types';
import { getWarehouses, saveWarehouses } from '../utils/storage';
import { Layers, MapPin, Tag, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

const PRESET_TAGS = ['Fast Moving', 'Heavy Goods', 'Fragile', 'Raw Material', 'Finished Goods', 'Cold Storage', 'High Security'];

export const AddStackModal: React.FC<Props> = ({ onClose, onSuccess, onShowToast }) => {
  const warehousesList = getWarehouses();
  const defaultWh = warehousesList[0]?.warehouseName || 'Main Warehouse';

  const [warehouseName, setWarehouseName] = useState(defaultWh);
  const [stackName, setStackName] = useState('');
  const [zone, setZone] = useState('Zone A');
  const [aisle, setAisle] = useState('Aisle 01');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Fast Moving']);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stackName.trim() || !warehouseName.trim()) {
      onShowToast('error', 'Missing Information', 'Please provide a warehouse name and stack/rack name.');
      return;
    }

    const newStack: WarehouseStack = {
      id: 'STACK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      warehouseName,
      stackName,
      zone,
      aisle,
      tags: selectedTags,
      createdAt: new Date().toISOString()
    };

    const existing = getWarehouses();
    saveWarehouses([...existing, newStack]);
    onShowToast('success', 'Stack Created', `Location "${warehouseName} -> ${stackName}" registered successfully.`);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-500/30">
              <Layers className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Add Stack / Location</h2>
              <p className="text-slate-400 text-xs mt-0.5">Configure warehouse layout and tags</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Warehouse Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Main Warehouse or Plant B"
              value={warehouseName}
              onChange={e => setWarehouseName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Stack / Rack Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rack A-01, Cold Storage B"
              value={stackName}
              onChange={e => setStackName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Zone</label>
              <input
                type="text"
                placeholder="e.g. Zone A"
                value={zone}
                onChange={e => setZone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Aisle / Shelf</label>
              <input
                type="text"
                placeholder="e.g. Aisle 03"
                value={aisle}
                onChange={e => setAisle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Color-Coded Labels & Tags</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer text-sm"
            >
              Save Stack Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
