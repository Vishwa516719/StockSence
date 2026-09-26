import React, { useState } from 'react';
import { CompanyProfile, StaffUser, Product, WarehouseStack, MoveLedgerEntry } from '../types';
import { getStaffList, setCurrentUserId, getProducts, getStockLocations, getWarehouses, getMoveLedger } from '../utils/storage';
import { Package, Plus, LogOut, Shield, ChevronDown, Bell, AlertTriangle, Send, Sun, Moon, Search, Boxes, Layers, FileSpreadsheet, X, CheckCircle2, Clock } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface Props {
  company: CompanyProfile;
  currentUser: StaffUser;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onUserSwitch: () => void;
  onOpenAddStack: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const Navbar: React.FC<Props> = ({
  company,
  currentUser,
  isDarkMode,
  onToggleDarkMode,
  onUserSwitch,
  onOpenAddStack,
  onLogout,
  onNavigateTab,
  onShowToast
}) => {
  const staffList = getStaffList();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const products = getProducts();
  const stockLocations = getStockLocations();
  const warehouses = getWarehouses();
  const ledger = getMoveLedger();

  const lowStockItems = products.filter(p => {
    const totalStock = stockLocations
      .filter(l => l.productId === p.id)
      .reduce((sum, l) => sum + l.quantity, 0);
    return totalStock <= p.minThreshold && !dismissedAlerts.includes(p.id);
  });

  // Recent ledger audit events as additional notifications
  const recentLedgerEvents = ledger.slice(0, 5);

  const handleSelectUser = (user: StaffUser) => {
    setCurrentUserId(user.id);
    setIsDropdownOpen(false);
    onShowToast('info', 'Active User Switched', `Now operating as ${user.name} (${user.roleTitle})`);
    onUserSwitch();
  };

  const handleSendAutomatedEmail = () => {
    onShowToast('success', 'Automated Email Dispatched', `Reorder alert email sent to procurement@${company.email.split('@')[1] || 'company.com'} for ${lowStockItems.length} low-stock item(s).`);
    setIsNotifOpen(false);
  };

  const handleDismissAlert = (productId: string) => {
    setDismissedAlerts(prev => [...prev, productId]);
    onShowToast('info', 'Alert Dismissed', 'Stock threshold alert acknowledged.');
  };

  // Global search filtering
  const query = searchQuery.trim().toLowerCase();
  const matchedProducts = query.length >= 2 ? products.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)).slice(0, 5) : [];
  const matchedWarehouses = query.length >= 2 ? warehouses.filter(w => w.warehouseName.toLowerCase().includes(query) || w.stackName.toLowerCase().includes(query) || w.zone.toLowerCase().includes(query)).slice(0, 5) : [];
  const matchedLedger = query.length >= 2 ? ledger.filter(l => l.referenceNo.toLowerCase().includes(query) || l.productName.toLowerCase().includes(query) || l.sku.toLowerCase().includes(query)).slice(0, 5) : [];

  const hasSearchResults = matchedProducts.length > 0 || matchedWarehouses.length > 0 || matchedLedger.length > 0;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 w-full h-16 shrink-0 z-30 shadow-md">
      <div className="w-full px-6 h-full flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">StockSense</span>
            </div>
            <p className="text-xs text-slate-400">{company.name} • {company.currency}</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, SKUs, warehouses, ledger..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Global Search Dropdown Results */}
          {isSearchFocused && query.length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-3 z-50 text-slate-200 max-h-96 overflow-y-auto divide-y divide-slate-800">
              {!hasSearchResults ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No matching results found for "{searchQuery}".
                </div>
              ) : (
                <>
                  {matchedProducts.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">Products & SKUs</div>
                      {matchedProducts.map(prod => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            onNavigateTab('PRODUCTS');
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-white">{prod.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{prod.sku} • {prod.category}</div>
                          </div>
                          <Boxes className="w-4 h-4 text-slate-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedWarehouses.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Warehouses & Stacks</div>
                      {matchedWarehouses.map(wh => (
                        <div
                          key={wh.id}
                          onClick={() => {
                            onNavigateTab('WAREHOUSES');
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-white">{wh.warehouseName} → {wh.stackName}</div>
                            <div className="text-[10px] text-slate-400">Zone: {wh.zone} • Aisle: {wh.aisle}</div>
                          </div>
                          <Layers className="w-4 h-4 text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedLedger.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">Audit Ledger</div>
                      {matchedLedger.map(entry => (
                        <div
                          key={entry.id}
                          onClick={() => {
                            onNavigateTab('LEDGER');
                            setSearchQuery('');
                          }}
                          className="px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-white">{entry.referenceNo} ({entry.moveType})</div>
                            <div className="text-[10px] text-slate-400">{entry.productName} • Qty: {entry.quantity}</div>
                          </div>
                          <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions & Active User Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
          </button>

          {/* Notifications Panel */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Critical Stock & Audit Notifications"
            >
              <Bell className="w-4 h-4" />
              {lowStockItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-4 z-50 text-slate-200">
                <div className="px-4 pb-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Notifications Panel</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                    {lowStockItems.length} Critical Alert(s)
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {lowStockItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      All stock levels are healthy above reorder thresholds.
                    </div>
                  ) : (
                    lowStockItems.map(item => {
                      const totalStock = stockLocations.filter(l => l.productId === item.id).reduce((s, l) => s + l.quantity, 0);
                      return (
                        <div key={item.id} className="p-3.5 hover:bg-slate-800/60 transition-colors flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-white">{item.name}</span>
                              <span className="font-mono text-[9px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                                Low Stock
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">SKU: {item.sku} • On Hand: {totalStock} / Min: {item.minThreshold}</p>
                          </div>
                          <button
                            onClick={() => handleDismissAlert(item.id)}
                            className="text-[10px] text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded border border-slate-700 shrink-0"
                            title="Acknowledge alert"
                          >
                            Dismiss
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Recent Audit Events Section */}
                <div className="border-t border-slate-800 pt-3 px-4 mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Recent Audit Movements</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {recentLedgerEvents.map(evt => (
                      <div key={evt.id} className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-800/40 p-2 rounded-lg border border-slate-800">
                        <span className="font-mono text-blue-400">{evt.referenceNo}</span>
                        <span className="text-slate-400 truncate max-w-[150px]">{evt.productName}</span>
                        <span className="font-bold text-emerald-400">+{evt.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {lowStockItems.length > 0 && (
                  <div className="border-t border-slate-800 pt-3 px-4 mt-3">
                    <button
                      onClick={handleSendAutomatedEmail}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Automated Reorder Email
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Stack Button */}
          <button
            onClick={onOpenAddStack}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Stack / Location
          </button>

          {/* Active User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-xs transition-all cursor-pointer"
            >
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                {currentUser?.name.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-semibold text-slate-200">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400">{currentUser?.roleTitle}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Switch Active User (RBAC Demo)</p>
                  <p className="text-xs text-slate-300 mt-0.5">Test permissions instantly across staff profiles</p>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {staffList.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => handleSelectUser(staff)}
                      className={`w-full text-left px-4 py-2.5 hover:bg-slate-800 flex items-center justify-between text-xs transition-colors ${
                        staff.id === currentUser?.id ? 'bg-blue-600/20 text-blue-300 font-medium' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{staff.name}</div>
                        <div className="text-[10px] text-slate-400">{staff.roleTitle}</div>
                      </div>
                      {staff.isSuperAdmin && (
                        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 pt-1 mt-1 px-2">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out Portal
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
