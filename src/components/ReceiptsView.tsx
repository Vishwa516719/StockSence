import React, { useState } from 'react';
import { StaffUser, Receipt, Product, WarehouseStack } from '../types';
import { getReceipts, saveReceipts, getProducts, getWarehouses, updateProductStock, addLedgerEntry } from '../utils/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ArrowDownLeft, Plus, CheckCircle2, Clock, Scan, X, Building, Layers } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const ReceiptsView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [receipts, setReceipts] = useState<Receipt[]>(getReceipts());
  const products: Product[] = getProducts();
  const warehouses: WarehouseStack[] = getWarehouses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // New receipt form state
  const [supplier, setSupplier] = useState('');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 10 }
  ]);

  const handleAddItemRow = () => {
    if (products.length === 0) {
      onShowToast('warning', 'No Products', 'Please create products in the catalog first.');
      return;
    }
    setItems(prev => [...prev, { productId: products[0].id, quantity: 5 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim()) {
      onShowToast('error', 'Missing Supplier', 'Please enter a vendor/supplier name.');
      return;
    }
    if (items.length === 0) {
      onShowToast('error', 'No Items', 'Please include at least one product item.');
      return;
    }

    const newReceipt: Receipt = {
      id: 'RCP-' + Math.floor(100000 + Math.random() * 900000),
      referenceNo: 'WH/IN/' + Math.floor(10000 + Math.random() * 90000),
      supplierName: supplier.trim(),
      targetStackId: warehouseId,
      status: 'Ready',
      items: items.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1
      })),
      createdAt: new Date().toISOString(),
      handlerName: currentUser.name
    };

    const updated = [newReceipt, ...receipts];
    saveReceipts(updated);
    setReceipts(updated);
    setIsModalOpen(false);
    setSupplier('');
    onShowToast('success', 'Receipt Created', `Vendor shipment ${newReceipt.referenceNo} created successfully.`);
  };

  const handleValidateReceipt = (receiptId: string) => {
    if (!currentUser.permissions.processReceipts && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to validate receipts.');
      return;
    }

    const target = receipts.find(r => r.id === receiptId);
    if (!target || target.status === 'Done') return;

    const wh = warehouses.find(w => w.id === target.targetStackId);
    const locationStr = wh ? `${wh.warehouseName} → ${wh.stackName}` : 'Main Warehouse';

    target.items.forEach((item: { productId: string; quantity: number }) => {
      const qtyToAdd = item.quantity;
      updateProductStock(item.productId, target.targetStackId, qtyToAdd);

      const prod = products.find(p => p.id === item.productId);
      const productName = prod ? prod.name : 'Unknown Product';
      const sku = prod ? prod.sku : 'SKU-UNKNOWN';
      const uom = prod ? prod.uom : 'Units';

      addLedgerEntry({
        referenceNo: target.referenceNo,
        moveType: 'RECEIPT',
        productId: item.productId,
        productName,
        sku,
        fromLocation: `Vendor (${target.supplierName})`,
        toLocation: locationStr,
        quantity: qtyToAdd,
        uom,
        handlerName: currentUser.name
      });
    });

    target.status = 'Done';
    target.validatedAt = new Date().toISOString();
    const updated = receipts.map(r => r.id === receiptId ? { ...target } : r);
    saveReceipts(updated);
    setReceipts(updated);
    onShowToast('success', 'Receipt Validated', `Stock updated and ledger entry logged for ${target.referenceNo}.`);
  };

  const handleScanSuccess = (sku: string) => {
    const matched = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
    if (matched) {
      setItems(prev => [...prev, { productId: matched.id, quantity: 10 }]);
      onShowToast('success', 'Barcode Scanned', `Added ${matched.name} (${matched.sku}) via scanner.`);
    } else {
      onShowToast('warning', 'SKU Not Found', `Scanned barcode ${sku} does not match any catalog SKU.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Receipts (IN)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage inbound purchase orders and validate incoming stock arrivals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-indigo-200"
          >
            <Scan className="w-4 h-4" /> Scan Barcode
          </button>
          {(currentUser.permissions.processReceipts || currentUser.isSuperAdmin) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Receipt
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {receipts.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <ArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No vendor receipts recorded</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ New Receipt" to create inbound purchase orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">Reference #</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Destination Stack</th>
                  <th className="p-4">Items Summary</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map(rcp => {
                  const wh = warehouses.find(w => w.id === rcp.targetStackId);
                  const isDone = rcp.status === 'Done';

                  return (
                    <tr key={rcp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-600">{rcp.referenceNo}</td>
                      <td className="p-4 font-semibold text-slate-900">{rcp.supplierName}</td>
                      <td className="p-4 text-slate-600">
                        {wh ? `${wh.warehouseName} → ${wh.stackName}` : 'Main Warehouse'}
                      </td>
                      <td className="p-4 text-slate-700">
                        {rcp.items.map((it: { productId: string; quantity: number }, idx: number) => {
                          const prod = products.find(p => p.id === it.productId);
                          return (
                            <div key={idx}>
                              {it.quantity} {prod?.uom || 'Units'} of <strong className="text-slate-900">{prod?.name || 'Product'}</strong> ({prod?.sku || 'SKU'})
                            </div>
                          );
                        })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isDone ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {rcp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        {!isDone && (
                          <button
                            onClick={() => handleValidateReceipt(rcp.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all cursor-pointer shadow-sm"
                          >
                            Validate Receipt
                          </button>
                        )}
                        {isDone && <span className="text-emerald-700 font-semibold text-xs">Completed</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Receipt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <ArrowDownLeft className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Create Vendor Receipt (IN)</h2>
                  <p className="text-blue-100 text-xs mt-0.5">Record inbound shipment and destination warehouse stack</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Supplier / Vendor Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Global Logistics"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Destination Warehouse & Stack</label>
                <select
                  value={warehouseId}
                  onChange={e => setWarehouseId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.warehouseName} → {wh.stackName}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Order Items</label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <select
                        value={item.productId}
                        onChange={e => {
                          const val = e.target.value;
                          setItems(prev => prev.map((it, i) => i === index ? { ...it, productId: val } : it));
                        }}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: val } : it));
                        }}
                        className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
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
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 text-sm transition-all"
                >
                  Create Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
