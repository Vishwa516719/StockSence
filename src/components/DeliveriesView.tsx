import React, { useState } from 'react';
import { DeliveryOrder, StaffUser, DeliveryStatus } from '../types';
import {
  getDeliveries,
  saveDeliveries,
  getProducts,
  getWarehouses,
  getProductStockInStack,
  updateProductStock,
  addLedgerEntry,
  generateReferenceNumber
} from '../utils/storage';
import { ArrowUpRight, Plus, CheckCircle2, ShieldAlert, X, PackageCheck } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const DeliveriesView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>(getDeliveries());
  const products = getProducts();
  const warehouses = getWarehouses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [sourceStackId, setSourceStackId] = useState(warehouses[0]?.id || '');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 5 }
  ]);

  const addItemRow = () => {
    setItems([...items, { productId: products[0]?.id || '', quantity: 5 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.processDeliveries && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to process delivery orders.');
      return;
    }

    if (!customerName.trim() || items.length === 0) {
      onShowToast('error', 'Incomplete Form', 'Please provide a customer name and line items.');
      return;
    }

    const refNo = generateReferenceNumber('OUT');
    const newDelivery: DeliveryOrder = {
      id: 'DEL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      referenceNo: refNo,
      customerName: customerName.trim(),
      sourceStackId,
      items: [...items],
      status: 'Draft',
      createdAt: new Date().toISOString(),
      handlerName: currentUser.name
    };

    const updated = [newDelivery, ...deliveries];
    saveDeliveries(updated);
    setDeliveries(updated);
    setIsModalOpen(false);
    setCustomerName('');
    onShowToast('success', 'Delivery Created', `Delivery order ${refNo} created as Draft.`);
  };

  const handleAdvanceStatus = (delivery: DeliveryOrder) => {
    if (!currentUser.permissions.processDeliveries && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to update deliveries.');
      return;
    }

    const sequence: DeliveryStatus[] = ['Draft', 'Pick Items', 'Pack Items', 'Ready', 'Done'];
    const currentIndex = sequence.indexOf(delivery.status);

    if (currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];

      // If moving to 'Done', validate stock availability
      if (nextStatus === 'Done') {
        const stack = warehouses.find(w => w.id === delivery.sourceStackId);
        const stackNameStr = stack ? `${stack.warehouseName} - ${stack.stackName}` : 'Main Warehouse';

        // Check negative inventory constraint
        for (const item of delivery.items) {
          const available = getProductStockInStack(item.productId, delivery.sourceStackId);
          if (available < item.quantity) {
            const prod = products.find(p => p.id === item.productId);
            onShowToast(
              'error',
              'Negative Inventory Blocked',
              `Cannot validate delivery ${delivery.referenceNo}. Insufficient stock for "${prod?.name || 'Item'}". Available: ${available}, Required: ${item.quantity}.`
            );
            return;
          }
        }

        // Deduct stock and record ledger entries
        delivery.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            updateProductStock(prod.id, delivery.sourceStackId, -item.quantity);
            addLedgerEntry({
              referenceNo: delivery.referenceNo,
              moveType: 'DELIVERY',
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              fromLocation: stackNameStr,
              toLocation: `Customer / ${delivery.customerName}`,
              quantity: item.quantity,
              uom: prod.uom,
              handlerName: currentUser.name
            });
          }
        });

        delivery.validatedAt = new Date().toISOString();
      }

      delivery.status = nextStatus;
      const updated = deliveries.map(d => d.id === delivery.id ? delivery : d);
      saveDeliveries(updated);
      setDeliveries(updated);
      onShowToast('success', 'Status Updated', `Delivery ${delivery.referenceNo} advanced to "${nextStatus}".`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Outgoing Deliveries (Customers)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Pick, pack, and validate customer shipments with negative inventory protection</p>
        </div>
        {(currentUser.permissions.processDeliveries || currentUser.isSuperAdmin) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Delivery Order
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {deliveries.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No delivery orders recorded</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ New Delivery Order" to create outgoing shipments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">Reference #</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Source Warehouse Stack</th>
                  <th className="p-4">Line Items</th>
                  <th className="p-4">Status Flow</th>
                  <th className="p-4">Handler</th>
                  <th className="p-4 text-right pr-6">Workflow Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map(del => {
                  const stack = warehouses.find(w => w.id === del.sourceStackId);
                  const statusColors = {
                    Draft: 'bg-slate-100 text-slate-700 border-slate-200',
                    'Pick Items': 'bg-amber-100 text-amber-800 border-amber-200',
                    'Pack Items': 'bg-blue-100 text-blue-800 border-blue-200',
                    Ready: 'bg-purple-100 text-purple-800 border-purple-200',
                    Done: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    Canceled: 'bg-rose-100 text-rose-800 border-rose-200'
                  }[del.status];

                  return (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-600 whitespace-nowrap">{del.referenceNo}</td>
                      <td className="p-4 font-semibold text-slate-900">{del.customerName}</td>
                      <td className="p-4 text-slate-600">
                        {stack ? `${stack.warehouseName} → ${stack.stackName}` : 'Main Warehouse'}
                      </td>
                      <td className="p-4 text-slate-700">
                        {del.items.map((it, idx) => {
                          const p = products.find(prod => prod.id === it.productId);
                          return (
                            <div key={idx} className="font-medium">
                              • {p ? p.name : 'Unknown'}: <strong className="text-slate-900">-{it.quantity} {p?.uom || ''}</strong>
                            </div>
                          );
                        })}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors}`}>
                          {del.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{del.handlerName}</td>
                      <td className="p-4 text-right pr-6 whitespace-nowrap">
                        {del.status !== 'Done' ? (
                          <button
                            onClick={() => handleAdvanceStatus(del)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            {del.status === 'Draft' ? 'Start Picking' : del.status === 'Pick Items' ? 'Pack Items' : del.status === 'Pack Items' ? 'Mark Ready' : 'Validate & Ship'}
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Shipped / Done
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Delivery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <ArrowUpRight className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">New Delivery Order</h2>
                  <p className="text-indigo-100 text-xs mt-0.5">Create customer shipment & pick-pack workflow</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-indigo-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Enterprises Ltd."
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Source Stock Stack</label>
                <select
                  value={sourceStackId}
                  onChange={e => setSourceStackId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.warehouseName} → {wh.stackName}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Required Items</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={it.productId}
                        onChange={e => {
                          const updated = [...items];
                          updated[idx].productId = e.target.value;
                          setItems(updated);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={it.quantity}
                        onChange={e => {
                          const updated = [...items];
                          updated[idx].quantity = Number(e.target.value);
                          setItems(updated);
                        }}
                        className="w-24 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-indigo-600 outline-none"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
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
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 text-sm"
                >
                  Create Delivery (Draft)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
