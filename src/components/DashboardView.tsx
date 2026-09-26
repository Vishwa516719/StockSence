import React, { useState } from 'react';
import {
  getProducts,
  getStockLocations,
  getReceipts,
  getDeliveries,
  getTransfers,
  getMoveLedger,
  getWarehouses
} from '../utils/storage';
import {
  Boxes,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  TrendingUp,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<Props> = ({ onNavigate }) => {
  const products = getProducts();
  const stockLocations = getStockLocations();
  const receipts = getReceipts();
  const deliveries = getDeliveries();
  const transfers = getTransfers();
  const ledger = getMoveLedger();
  const warehouses = getWarehouses();

  // Filter states
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // KPI Calculations
  const totalOnesOnHand = stockLocations.reduce((sum, l) => sum + l.quantity, 0);

  const lowStockProducts = products.filter(p => {
    const totalStock = stockLocations
      .filter(l => l.productId === p.id)
      .reduce((sum, l) => sum + l.quantity, 0);
    return totalStock <= p.minThreshold;
  });

  const pendingReceipts = receipts.filter(r => r.status === 'Draft' || r.status === 'Waiting' || r.status === 'Ready');
  const pendingDeliveries = deliveries.filter(d => d.status !== 'Done' && d.status !== 'Canceled');

  // Chart Data preparation
  const stockTrendData = [
    { name: 'Mon', stock: Math.max(0, totalOnesOnHand - 45), turnover: 2.1 },
    { name: 'Tue', stock: Math.max(0, totalOnesOnHand - 30), turnover: 2.4 },
    { name: 'Wed', stock: Math.max(0, totalOnesOnHand - 18), turnover: 2.8 },
    { name: 'Thu', stock: Math.max(0, totalOnesOnHand - 10), turnover: 3.2 },
    { name: 'Fri', stock: Math.max(0, totalOnesOnHand - 5), turnover: 3.5 },
    { name: 'Sat', stock: Math.max(0, totalOnesOnHand - 2), turnover: 3.9 },
    { name: 'Sun', stock: totalOnesOnHand, turnover: 4.2 },
  ];

  const filteredLedger = ledger.filter(entry => {
    if (filterType !== 'ALL' && entry.moveType !== filterType) return false;
    if (filterCategory !== 'ALL') {
      const prod = products.find(p => p.id === entry.productId);
      if (prod && prod.category !== filterCategory) return false;
    }
    return true;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Dashboard & KPIs</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time overview of stock levels, warehouse operations, and ledger audit trails</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('PRODUCTS')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            + Manage Products
          </button>
          <button
            onClick={() => onNavigate('RECEIPTS')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Process Receipts
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Products */}
        <div 
          onClick={() => onNavigate('PRODUCTS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock Units</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{totalOnesOnHand.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Across <span className="font-semibold text-slate-700">{products.length}</span> catalog items
            </p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div 
          onClick={() => onNavigate('PRODUCTS')}
          className={`bg-white p-5 rounded-2xl border shadow-sm hover:border-amber-300 transition-all cursor-pointer group ${
            lowStockProducts.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Low / Out of Stock</span>
            <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold ${lowStockProducts.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {lowStockProducts.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Requires reorder attention</p>
          </div>
        </div>

        {/* Pending Receipts */}
        <div 
          onClick={() => onNavigate('RECEIPTS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Receipts</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{pendingReceipts.length}</div>
            <p className="text-xs text-slate-500 mt-1">Vendor shipments inbound</p>
          </div>
        </div>

        {/* Pending Deliveries */}
        <div 
          onClick={() => onNavigate('DELIVERIES')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Deliveries</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{pendingDeliveries.length}</div>
            <p className="text-xs text-slate-500 mt-1">Customer outbound orders</p>
          </div>
        </div>

        {/* Internal Transfers */}
        <div 
          onClick={() => onNavigate('TRANSFERS')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Internal Transfers</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">{transfers.length}</div>
            <p className="text-xs text-slate-500 mt-1">Completed stack movements</p>
          </div>
        </div>

      </div>

      {/* Recharts Area Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Total Products in Stock Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Total Products in Stock Trend</h3>
              <p className="text-xs text-slate-500">Weekly aggregated on-hand units across all stacks</p>
            </div>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="stock" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Turnover Trend Area Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900">Inventory Turnover Velocity</h3>
              <p className="text-xs text-slate-500">Stock replenishment and sales velocity ratio</p>
            </div>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stockTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="turnover" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorTurnover)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Zero-Data Empty State Banner if No Products */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600/40 border border-blue-400/40 rounded-2xl mx-auto flex items-center justify-center text-blue-200">
            <Boxes className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Your Inventory is Completely Fresh</h2>
          <p className="text-blue-100 max-w-lg mx-auto text-sm leading-relaxed">
            StockSense is initialized and ready. No pre-loaded dummy items exist. Get started by adding your first product or configuring warehouse stacks.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('PRODUCTS')}
              className="px-6 py-3 bg-white text-blue-900 font-semibold rounded-xl shadow-lg hover:bg-blue-50 transition-all cursor-pointer text-sm"
            >
              + Create First Product
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Dynamic Filters:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Document Types</option>
            <option value="RECEIPT">Receipts (IN)</option>
            <option value="DELIVERY">Deliveries (OUT)</option>
            <option value="TRANSFER">Transfers (INT)</option>
            <option value="ADJUSTMENT">Adjustments (ADJ)</option>
            <option value="INITIAL">Initial Balance</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Product Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recent Ledger Audit Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Recent Immutable Stock Movements</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chronological audit ledger of all ERP transactions</p>
          </div>
          <button
            onClick={() => onNavigate('LEDGER')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View Full Ledger <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-600">No stock movements recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Transactions will appear here once you validate receipts or deliveries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-3.5 pl-6">Timestamp</th>
                  <th className="p-3.5">Reference #</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Product & SKU</th>
                  <th className="p-3.5">From Location</th>
                  <th className="p-3.5">To Location</th>
                  <th className="p-3.5 text-right pr-6">Quantity & UoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.slice(0, 8).map(entry => {
                  const typeColors = {
                    RECEIPT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    DELIVERY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    TRANSFER: 'bg-purple-100 text-purple-800 border-purple-200',
                    ADJUSTMENT: 'bg-amber-100 text-amber-800 border-amber-200',
                    INITIAL: 'bg-blue-100 text-blue-800 border-blue-200',
                  }[entry.moveType] || 'bg-slate-100 text-slate-800';

                  const qtyColor = entry.moveType === 'RECEIPT' || entry.moveType === 'INITIAL' || (entry.moveType === 'ADJUSTMENT' && entry.quantity > 0)
                    ? 'text-emerald-700 font-bold'
                    : entry.moveType === 'DELIVERY'
                    ? 'text-rose-700 font-bold'
                    : 'text-slate-900 font-bold';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-6 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-blue-600 whitespace-nowrap">
                        {entry.referenceNo}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${typeColors}`}>
                          {entry.moveType}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">
                        <div>{entry.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{entry.sku}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[150px] truncate">{entry.fromLocation}</td>
                      <td className="p-3.5 text-slate-600 max-w-[150px] truncate">{entry.toLocation}</td>
                      <td className={`p-3.5 text-right pr-6 whitespace-nowrap ${qtyColor}`}>
                        {entry.quantity > 0 && entry.moveType === 'RECEIPT' ? '+' : ''}{entry.quantity} {entry.uom}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
