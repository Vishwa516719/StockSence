import React, { useState } from 'react';
import { InternalTransfer, StaffUser } from '../types';
import {
  getTransfers,
  saveTransfers,
  getProducts,
  getWarehouses,
  getProductStockInStack,
  updateProductStock,
  addLedgerEntry,
  generateReferenceNumber
} from '../utils/storage';
import { RefreshCw, Plus, ArrowRight, CheckCircle2, X } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const TransfersView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [transfers, setTransfers] = useState<InternalTransfer[]>(getTransfers());
  const products = getProducts();
  const warehouses = getWarehouses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(5);
  const [sourceStackId, setSourceStackId] = useState(warehouses[0]?.id || '');
  const [destinationStackId, setDestinationStackId] = useState(warehouses[1]?.id || warehouses[0]?.id || '');

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.processTransfers && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to perform internal transfers.');
      return;
    }

    if (sourceStackId === destinationStackId) {
      onShowToast('error', 'Invalid Transfer', 'Source and destination stacks cannot be identical.');
      return;
    }

    const available = getProductStockInStack(productId, sourceStackId);
    if (available < quantity) {
      const prod = products.find(p => p.id === productId);
      onShowToast(
        'error',
        'Insufficient Stock in Source Stack',
        `Cannot transfer ${quantity} units of "${prod?.name || 'Item'}". Source stack has only ${available} units available.`
      );
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const sourceStack = warehouses.find(w => w.id === sourceStackId);
    const destStack = warehouses.find(w => w.id === destinationStackId);
    const fromStr = sourceStack ? `${sourceStack.warehouseName} - ${sourceStack.stackName}` : 'Source Stack';
    const toStr = destStack ? `${destStack.warehouseName} - ${destStack.stackName}` : 'Destination Stack';

    const refNo = generateReferenceNumber('INT');
    const newTransfer: InternalTransfer = {
      id: 'TRF-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      referenceNo: refNo,
      productId,
      quantity: Number(quantity),
      sourceStackId,
      destinationStackId,
      status: 'Done',
      createdAt: new Date().toISOString(),
      handlerName: currentUser.name
    };

    // Execute stock transfer
    updateProductStock(productId, sourceStackId, -Number(quantity));
    updateProductStock(productId, destinationStackId, Number(quantity));

    // Log ledger entry
    addLedgerEntry({
      referenceNo: refNo,
      moveType: 'TRANSFER',
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      fromLocation: fromStr,
      toLocation: toStr,
      quantity: Number(quantity),
      uom: prod.uom,
      handlerName: currentUser.name
    });

    const updated = [newTransfer, ...transfers];
    saveTransfers(updated);
    setTransfers(updated);
    setIsModalOpen(false);
    onShowToast('success', 'Transfer Completed', `Transferred ${quantity} ${prod.uom} of ${prod.name} from ${fromStr} to ${toStr}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Stock Transfers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Move inventory seamlessly between warehouse racks, zones, and internal stacks</p>
        </div>
        {(currentUser.permissions.processTransfers || currentUser.isSuperAdmin) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Internal Transfer
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {transfers.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No internal transfers recorded</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Internal Transfer" to move stock between stacks.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">Reference #</th>
                  <th className="p-4">Product & SKU</th>
                  <th className="p-4">Source Stack</th>
                  <th className="p-4">Destination Stack</th>
                  <th className="p-4 text-right">Quantity</th>
                  <th className="p-4">Handler</th>
                  <th className="p-4 text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map(trf => {
                  const p = products.find(prod => prod.id === trf.productId);
                  const src = warehouses.find(w => w.id === trf.sourceStackId);
                  const dst = warehouses.find(w => w.id === trf.destinationStackId);

                  return (
                    <tr key={trf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-600 whitespace-nowrap">{trf.referenceNo}</td>
                      <td className="p-4 font-semibold text-slate-900">
                        <div>{p ? p.name : 'Unknown Product'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p?.sku}</div>
                      </td>
                      <td className="p-4 text-slate-600">{src ? `${src.warehouseName} → ${src.stackName}` : 'Source'}</td>
                      <td className="p-4 text-slate-600">{dst ? `${dst.warehouseName} → ${dst.stackName}` : 'Destination'}</td>
                      <td className="p-4 text-right font-extrabold text-slate-900">{trf.quantity} {p?.uom || ''}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{trf.handlerName}</td>
                      <td className="p-4 text-right pr-6 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
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

      {/* Internal Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Internal Stock Transfer</h2>
                  <p className="text-purple-100 text-xs mt-0.5">Move inventory between warehouse racks and stacks</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-purple-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Select Product</label>
                <select
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Total On-Hand: {p.minThreshold}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Source Stack</label>
                  <select
                    value={sourceStackId}
                    onChange={e => setSourceStackId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.stackName} ({wh.warehouseName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Destination Stack</label>
                  <select
                    value={destinationStackId}
                    onChange={e => setDestinationStackId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.stackName} ({wh.warehouseName})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Transfer Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-purple-600 outline-none"
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
                  className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-lg shadow-purple-500/25 text-sm"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
