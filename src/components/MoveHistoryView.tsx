import React, { useState } from 'react';
import { getMoveLedger, getProducts } from '../utils/storage';
import { exportToCSV } from '../utils/csvExport';
import { FileSpreadsheet, Search, Filter, Download } from 'lucide-react';

interface Props {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const MoveHistoryView: React.FC<Props> = ({ onShowToast }) => {
  const ledger = getMoveLedger();
  const products = getProducts();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.referenceNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || entry.moveType === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Reference #', 'Type', 'Product Name', 'SKU', 'From Location', 'To Location', 'Quantity', 'UoM', 'Handler Staff'];
    const rows = filteredLedger.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.referenceNo,
      entry.moveType,
      entry.productName,
      entry.sku,
      entry.fromLocation,
      entry.toLocation,
      entry.quantity,
      entry.uom,
      entry.handlerName
    ]);
    exportToCSV(`stocksense_audit_ledger_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    onShowToast('success', 'CSV Exported', 'Audit ledger exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Immutable Move History Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete audit trail logging every receipt, delivery, transfer, and stock adjustment</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search reference, SKU, product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto"
          >
            <option value="ALL">All Movement Types</option>
            <option value="RECEIPT">Receipts (IN)</option>
            <option value="DELIVERY">Deliveries (OUT)</option>
            <option value="TRANSFER">Transfers (INT)</option>
            <option value="ADJUSTMENT">Adjustments (ADJ)</option>
            <option value="INITIAL">Initial Balance</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredLedger.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No ledger movements found</p>
            <p className="text-xs text-slate-400 mt-1">Audit events will populate here as transactions are validated.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Reference #</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Product & SKU</th>
                  <th className="p-4">From Location</th>
                  <th className="p-4">To Location</th>
                  <th className="p-4">Handler Staff</th>
                  <th className="p-4 text-right pr-6">Quantity & UoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLedger.map(entry => {
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
                      <td className="p-4 pl-6 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 font-mono font-bold text-blue-600 whitespace-nowrap">{entry.referenceNo}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeColors}`}>
                          {entry.moveType}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{entry.productName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{entry.sku}</div>
                      </td>
                      <td className="p-4 text-slate-600 max-w-[180px] truncate">{entry.fromLocation}</td>
                      <td className="p-4 text-slate-600 max-w-[180px] truncate">{entry.toLocation}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{entry.handlerName}</td>
                      <td className={`p-4 text-right pr-6 whitespace-nowrap ${qtyColor}`}>
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
