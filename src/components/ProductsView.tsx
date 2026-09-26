import React, { useState } from 'react';
import {
  Product,
  StaffUser
} from '../types';
import {
  getProducts,
  saveProducts,
  getStockLocations,
  getTotalProductStock,
  getProductStockInStack,
  updateProductStock,
  getWarehouses,
  addLedgerEntry,
  logActivity
} from '../utils/storage';
import { exportToCSV } from '../utils/csvExport';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { undoManager } from '../services/undoService';
import { Boxes, Search, Plus, AlertTriangle, Layers, Tag, X, Download, Upload, Scan } from 'lucide-react';

interface Props {
  currentUser: StaffUser;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const ProductsView: React.FC<Props> = ({ currentUser, onShowToast }) => {
  const [products, setProducts] = useState<Product[]>(getProducts());
  const warehouses = getWarehouses();
  const stockLocations = getStockLocations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form state for new product
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [uom, setUom] = useState('Units');
  const [minThreshold, setMinThreshold] = useState(10);
  const [initialStackId, setInitialStackId] = useState(warehouses[0]?.id || '');
  const [initialCount, setInitialCount] = useState<number>(0);

  // Bulk import state
  const [csvContent, setCsvContent] = useState('');
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'overwrite'>('skip');

  const handleAutoGenerateSku = () => {
    const randomCode = 'SKU-' + Math.floor(100000 + Math.random() * 900000);
    setSku(randomCode);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.manageProducts && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to manage products.');
      return;
    }

    if (!name.trim() || !sku.trim()) {
      onShowToast('error', 'Missing Fields', 'Please provide a product name and SKU code.');
      return;
    }

    if (products.some(p => p.sku.toLowerCase() === sku.toLowerCase())) {
      onShowToast('error', 'Duplicate SKU', 'A product with this SKU already exists.');
      return;
    }

    const newProduct: Product = {
      id: 'PROD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      uom,
      minThreshold: Number(minThreshold) || 0,
      createdAt: new Date().toISOString()
    };

    const updatedProducts = [...products, newProduct];
    saveProducts(updatedProducts);
    setProducts(updatedProducts);

    undoManager.push({
      description: `Created product "${newProduct.name}"`,
      undo: () => {
        const currentProducts = getProducts().filter(p => p.id !== newProduct.id);
        saveProducts(currentProducts);
        setProducts(currentProducts);
        onShowToast('info', 'Undo Successful', `Product "${newProduct.name}" creation reverted.`);
      }
    });

    logActivity(`Product "${newProduct.name}" added`, currentUser.name, `SKU: ${newProduct.sku}`);

    if (initialCount > 0 && initialStackId) {
      updateProductStock(newProduct.id, initialStackId, Number(initialCount));
      const stack = warehouses.find(w => w.id === initialStackId);
      const stackNameStr = stack ? `${stack.warehouseName} - ${stack.stackName}` : 'Initial Location';

      addLedgerEntry({
        referenceNo: 'INIT/' + Math.floor(1000 + Math.random() * 9000),
        moveType: 'INITIAL',
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        fromLocation: 'System Initial Balance',
        toLocation: stackNameStr,
        quantity: Number(initialCount),
        uom: newProduct.uom,
        handlerName: currentUser.name
      });
    }

    onShowToast('success', 'Product Created', `Successfully created "${newProduct.name}" (${newProduct.sku}).`);
    setIsCreateModalOpen(false);
    setName('');
    setSku('');
    setInitialCount(0);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'UoM', 'Min Threshold', 'Total On-Hand', 'Created At'];
    const rows = filteredProducts.map(p => {
      const totalStock = getTotalProductStock(p.id);
      return [p.sku, p.name, p.category, p.uom, p.minThreshold, totalStock, p.createdAt];
    });
    exportToCSV(`stocksense_products_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    onShowToast('success', 'CSV Exported', 'Product directory exported successfully.');
  };

  const handleDownloadTemplate = () => {
    const headers = ['sku', 'name', 'category', 'uom', 'minThreshold'];
    const rows = [
      ['SKU-ELE-001', 'Wireless Ergonomic Mouse', 'Electronics', 'Units', '10'],
      ['SKU-HW-002', 'Stainless Steel Hex Bolt M8', 'Hardware & Fasteners', 'Packs', '50'],
    ];
    exportToCSV('stocksense_product_import_template.csv', headers, rows);
    onShowToast('info', 'Template Downloaded', 'Product CSV import template downloaded.');
  };

  const handleBulkImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.permissions.manageProducts && !currentUser.isSuperAdmin) {
      onShowToast('error', 'Access Denied', 'You lack permission to import products.');
      return;
    }

    if (!csvContent.trim()) {
      onShowToast('error', 'Empty CSV', 'Please paste or upload CSV data.');
      return;
    }

    const lines = csvContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      onShowToast('error', 'Invalid CSV', 'CSV must contain a header row and at least one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const skuIdx = headers.findIndex(h => h.includes('sku'));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const catIdx = headers.findIndex(h => h.includes('cat'));
    const uomIdx = headers.findIndex(h => h.includes('uom'));
    const minIdx = headers.findIndex(h => h.includes('min') || h.includes('thresh'));

    if (skuIdx === -1 || nameIdx === -1) {
      onShowToast('error', 'Invalid Headers', 'CSV headers must include "sku" and "name".');
      return;
    }

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let currentProducts = [...products];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const skuVal = cols[skuIdx];
      const nameVal = cols[nameIdx];
      if (!skuVal || !nameVal) continue;

      const categoryVal = catIdx !== -1 && cols[catIdx] ? cols[catIdx] : 'Electronics';
      const uomVal = uomIdx !== -1 && cols[uomIdx] ? cols[uomIdx] : 'Units';
      const minVal = minIdx !== -1 && !isNaN(Number(cols[minIdx])) ? Number(cols[minIdx]) : 10;

      const existingIndex = currentProducts.findIndex(p => p.sku.toLowerCase() === skuVal.toLowerCase());

      if (existingIndex !== -1) {
        if (duplicateAction === 'overwrite') {
          currentProducts[existingIndex] = {
            ...currentProducts[existingIndex],
            name: nameVal,
            category: categoryVal,
            uom: uomVal,
            minThreshold: minVal
          };
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        const newProduct: Product = {
          id: 'PROD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          sku: skuVal.toUpperCase(),
          name: nameVal,
          category: categoryVal,
          uom: uomVal,
          minThreshold: minVal,
          createdAt: new Date().toISOString()
        };
        currentProducts.push(newProduct);
        addedCount++;
      }
    }

    saveProducts(currentProducts);
    setProducts(currentProducts);
    setIsBulkModalOpen(false);
    setCsvContent('');

    onShowToast(
      'success',
      'Bulk Import Complete',
      `Added: ${addedCount}, Updated: ${updatedCount}, Skipped duplicates: ${skippedCount}.`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleScanSuccess = (sku: string) => {
    setSearchQuery(sku);
    onShowToast('success', 'Barcode Scanned', `Filtered product catalog by scanned SKU: ${sku}`);
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Barcode Scanner Modal */}
      {isScannerOpen && (
        <BarcodeScannerModal
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog & Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage SKUs, reorder thresholds, and multi-stack on-hand stock levels</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-indigo-200"
          >
            <Scan className="w-4 h-4" /> Scan Barcode
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {(currentUser.permissions.manageProducts || currentUser.isSuperAdmin) && (
            <>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-indigo-200"
              >
                <Upload className="w-4 h-4" /> Bulk Import
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Product
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Boxes className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-semibold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400 mt-1">Click "+ Create Product" or "Bulk Import" to add items.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <th className="p-4 pl-6">SKU Code</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">UoM</th>
                  <th className="p-4 text-center">Min Threshold</th>
                  <th className="p-4 text-right">Total On-Hand</th>
                  <th className="p-4 pr-6">Stack Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(product => {
                  const totalStock = getTotalProductStock(product.id);
                  const isLowStock = totalStock <= product.minThreshold;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 pl-6 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{product.uom}</td>
                      <td className="p-4 text-center font-medium text-slate-700">{product.minThreshold}</td>
                      <td className="p-4 text-right font-extrabold text-slate-900">
                        <div className="flex items-center justify-end gap-2">
                          <span>{totalStock} {product.uom}</span>
                          {isLowStock && (
                            <span className="flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200" title="Low stock alert triggered">
                              <AlertTriangle className="w-3 h-3" /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {warehouses.map(wh => {
                            const qty = getProductStockInStack(product.id, wh.id);
                            if (qty === 0) return null;
                            return (
                              <span key={wh.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-medium border border-blue-200">
                                <Layers className="w-2.5 h-2.5" />
                                {wh.stackName}: <strong className="font-bold">{qty}</strong>
                              </span>
                            );
                          })}
                          {warehouses.every(wh => getProductStockInStack(product.id, wh.id) === 0) && (
                            <span className="text-slate-400 italic text-[11px]">No stock in stacks</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-indigo-700 to-blue-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Upload className="w-6 h-6 text-indigo-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Bulk Import Products via CSV</h2>
                  <p className="text-indigo-100 text-xs mt-0.5">Upload a CSV file or paste raw CSV data with duplicate handling</p>
                </div>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="p-1.5 text-indigo-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Need the CSV Template?</h4>
                  <p className="text-slate-500 text-[11px] mt-0.5">Download our standardized sample CSV format to get started.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Or Paste CSV Content</label>
                <textarea
                  rows={6}
                  placeholder={`sku,name,category,uom,minThreshold\nSKU-ABC-001,Widget Pro,Electronics,Units,10`}
                  value={csvContent}
                  onChange={e => setCsvContent(e.target.value)}
                  className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Duplicate SKU Handling</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      checked={duplicateAction === 'skip'}
                      onChange={() => setDuplicateAction('skip')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Skip duplicate SKUs</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dupAction"
                      checked={duplicateAction === 'overwrite'}
                      onChange={() => setDuplicateAction('overwrite')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Overwrite existing products</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 text-sm transition-all"
                >
                  Process Bulk Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-scale-up my-8">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <Boxes className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Create New Product</h2>
                  <p className="text-blue-100 text-xs mt-0.5">Add SKU, category, and optional initial balance</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Industrial Steel Bolt M10"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">SKU / Code</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Auto-Generate SKU
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SKU-BOLT-10"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  className="w-full font-mono px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Packaging & Boxes">Packaging & Boxes</option>
                    <option value="Finished Goods">Finished Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Unit of Measure (UoM)</label>
                  <select
                    value={uom}
                    onChange={e => setUom(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="Units">Units</option>
                    <option value="kg">kg</option>
                    <option value="Liters">Liters</option>
                    <option value="Packs">Packs</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Min Reorder Threshold</label>
                  <input
                    type="number"
                    min={0}
                    value={minThreshold}
                    onChange={e => setMinThreshold(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Initial Stock Count</label>
                  <input
                    type="number"
                    min={0}
                    value={initialCount}
                    onChange={e => setInitialCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-blue-600 focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              </div>

              {initialCount > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Initial Destination Stack</label>
                  <select
                    value={initialStackId}
                    onChange={e => setInitialStackId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.warehouseName} → {wh.stackName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 text-sm transition-all"
                >
                  Save Product Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
