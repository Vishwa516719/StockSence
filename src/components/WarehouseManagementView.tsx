import React from 'react';
import { WarehouseStack, StaffUser } from '../types';
import { getWarehouses } from '../utils/storage';
import { Layers, Plus, MapPin, Tag } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onOpenAddStack: () => void;
}

export const WarehouseManagementView: React.FC<Props> = ({ currentUser, onOpenAddStack }) => {
  const warehouses = getWarehouses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses & Stack Layout Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Dynamic physical layout configuration, zones, aisles, and color-coded tags</p>
        </div>
        {(currentUser.permissions.manageWarehouses || currentUser.isSuperAdmin) && (
          <button
            onClick={onOpenAddStack}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Stack / Location
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {warehouses.map(wh => (
          <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-semibold">
                {wh.warehouseName}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-slate-900">{wh.stackName}</h3>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {wh.zone || 'Zone A'}</span>
                <span>•</span>
                <span>{wh.aisle || 'Aisle 01'}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Assigned Tags</div>
              <div className="flex flex-wrap gap-1.5">
                {wh.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-medium border border-indigo-100">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
