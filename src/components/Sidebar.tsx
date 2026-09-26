import React from 'react';
import { StaffUser } from '../types';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  SlidersHorizontal,
  FileSpreadsheet,
  Users,
  Layers,
  Lock
} from 'lucide-react';

export type ActiveTab =
  | 'DASHBOARD'
  | 'PRODUCTS'
  | 'RECEIPTS'
  | 'DELIVERIES'
  | 'TRANSFERS'
  | 'ADJUSTMENTS'
  | 'LEDGER'
  | 'STAFF'
  | 'WAREHOUSES';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: StaffUser;
}

export const Sidebar: React.FC<Props> = ({ activeTab, onTabChange, currentUser }) => {
  const p = currentUser.permissions;

  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard & KPIs', icon: LayoutDashboard, allowed: p.viewDashboard },
    { id: 'PRODUCTS', label: 'Products Catalog', icon: Boxes, allowed: p.manageProducts || p.viewDashboard },
    { id: 'RECEIPTS', label: 'Receipts (Vendors)', icon: ArrowDownLeft, allowed: p.processReceipts || p.viewDashboard },
    { id: 'DELIVERIES', label: 'Deliveries (Customers)', icon: ArrowUpRight, allowed: p.processDeliveries || p.viewDashboard },
    { id: 'TRANSFERS', label: 'Internal Transfers', icon: RefreshCw, allowed: p.processTransfers || p.viewDashboard },
    { id: 'ADJUSTMENTS', label: 'Stock Adjustments', icon: SlidersHorizontal, allowed: p.processAdjustments || p.viewDashboard },
    { id: 'LEDGER', label: 'Move History Ledger', icon: FileSpreadsheet, allowed: p.viewDashboard },
    { id: 'WAREHOUSES', label: 'Warehouses & Stacks', icon: Layers, allowed: p.manageWarehouses || p.viewDashboard },
    { id: 'STAFF', label: 'Staff & RBAC', icon: Users, allowed: p.manageStaff },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:block min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Inventory Modules
        </div>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.allowed;

          return (
            <button
              key={item.id}
              onClick={() => isAllowed && onTabChange(item.id as ActiveTab)}
              disabled={!isAllowed}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : isAllowed
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {!isAllowed && <Lock className="w-3 h-3 text-slate-600" />}
            </button>
          );
        })}
      </div>

      <div className="mt-8 p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          ERP Engine Active
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Odoo transactional state persisted securely in browser localStorage.
        </p>
      </div>
    </aside>
  );
};
