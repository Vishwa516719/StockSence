import React, { useState, useEffect } from 'react';
import { StockAdjustment, StaffUser, AdjustmentReason } from '../types';
import {
  getAdjustments,
  saveAdjustments,
  getProducts,
  getWarehouses,
  getProductStockInStack,
  updateProductStock,
  addLedgerEntry,
  generateReferenceNumber
} from '../utils/storage';
import { SlidersHorizontal, Plus, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const AdjustmentsView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(getAdjustments());
  const products = getProducts();
  const warehouses = getWarehouses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [stackId, setStackId] = useState(warehouses[0]?.id || '');
  const [countedQty, setCountedQty] = useState<number>(0);
  const [reason, setReason] = useState<AdjustmentReason>('Counting Discrepancy');
  const [notes, setNotes] = useState('');

  const theoreticalQty = getProductStockInStack(productId, stackId);

  useEffect(() => {
    setCountedQty(theoreticalQty);
  }, [productId, stackId]);

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.processAdjustments && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to perform stock adjustments.');
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const diff = Number(countedQty) - theoreticalQty;
    const stack = warehouses.find(w => w.id === stackId);
    const stackNameStr = stack ? `${stack.warehouseName} - ${stack.stackName}` : 'Warehouse Stack';

    const refNo = generateReferenceNumber('ADJ');
    const newAdj: StockAdjustment = {
      id: 'ADJ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      referenceNo: refNo,
      productId,
      stackId,
      theoreticalQty,
      countedQty: Number(countedQty),
      difference: diff,
      reason,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      handlerName: currentUser.name
    };

    // Update stock quantity directly to match physical count
    updateProductStock(productId, stackId, diff);

    // Record ledger entry
    addLedgerEntry({
      referenceNo: refNo,
      moveType: 'ADJUSTMENT',
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      fromLocation: stackNameStr,
      toLocation: `Stock Reconciliation (${reason})`,
      quantity: diff,
      uom: prod.uom,
      handlerName: currentUser.name
    });

    const updated = [newAdj, ...adjustments];
    saveAdjustments(updated);
    setAdjustments(updated);
    setIsModalOpen(false);
    setNotes('');
    onShowToast('success', 'Adjustment Validated', `Stock adjustment ${refNo} recorded. Discrepancy: ${diff > 0 ? '+' : ''}${diff} ${prod.uom}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Adjustments & Cycle Counts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Reconcile theoretical system inventory with physical stock counts and audit logs</p>
        </div>
        {(currentUser.permissions.processAdjustments || currentUser.isSuperAdmin) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Stock Adjustment
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {adjustments.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No stock adjustments recorded</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Stock Adjustment" to perform cycle counts and reconciliations.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">Reference #</th>
                  <th className="p-4">Product & SKU</th>
                  <th className="p-4">Stack Location</th>
                  <th className="p-4">Reason / Discrepancy</th>
                  <th className="p-4 text-center">Theoretical</th>
                  <th className="p-4 text-center">Counted</th>
                  <th className="p-4 text-right pr-6">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map(adj => {
                  const p = products.find(prod => prod.id === adj.productId);
                  const stack = warehouses.find(w => w.id === adj.stackId);
                  const diffColor = adj.difference > 0
                    ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200'
                    : adj.difference < 0
                    ? 'text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                    : 'text-slate-700';

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-600 whitespace-nowrap">{adj.referenceNo}</td>
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{p ? p.name : 'Unknown'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p?.sku}</div>
                      </td>
                      <td className="p-4 text-slate-600">{stack ? `${stack.warehouseName} → ${stack.stackName}` : 'Stack'}</td>
                      <td className="p-4">
                        <span className="font-medium text-slate-900">{adj.reason}</span>
                        {adj.notes && <div className="text-[10px] text-slate-500 mt-0.5">{adj.notes}</div>}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-700">{adj.theoreticalQty}</td>
                      <td className="p-4 text-center font-bold text-slate-900">{adj.countedQty}</td>
                      <td className="p-4 text-right pr-6 whitespace-nowrap">
                        <span className={diffColor}>
                          {adj.difference > 0 ? '+' : ''}{adj.difference} {p?.uom || ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-amber-700 to-orange-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <SlidersHorizontal className="w-6 h-6 text-amber-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Stock Adjustment & Cycle Count</h2>
                  <p className="text-amber-100 text-xs mt-0.5">Reconcile theoretical vs physical inventory</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select Product</label>
                <select
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Stack Location</label>
                <select
                  value={stackId}
                  onChange={e => setStackId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.stackName} ({wh.warehouseName})</option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Theoretical System Qty</span>
                  <span className="text-2xl font-bold text-slate-900">{theoreticalQty}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Discrepancy</span>
                  <span className={`text-xl font-bold ${countedQty - theoreticalQty > 0 ? 'text-emerald-600' : countedQty - theoreticalQty < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                    {countedQty - theoreticalQty > 0 ? '+' : ''}{countedQty - theoreticalQty}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Physical Counted Quantity</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={countedQty}
                  onChange={e => setCountedQty(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-amber-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Adjustment Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value as AdjustmentReason)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                >
                  <option value="Counting Discrepancy">Counting Discrepancy</option>
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Theft/Loss">Theft/Loss</option>
                  <option value="Found Inventory">Found Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Notes / Audit Remarks (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cycle count Q3 audit by manager"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-lg shadow-amber-500/25 text-sm"
                >
                  Validate Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
