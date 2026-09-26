export interface CompanyProfile {
  name: string;
  email: string;
  passwordHash: string; // Simulated password
  industry: string;
  currency: string;
  primaryWarehouseName: string;
  createdAt: string;
}

export interface Permissions {
  viewDashboard: boolean;
  manageProducts: boolean;
  processReceipts: boolean;
  processDeliveries: boolean;
  processTransfers: boolean;
  processAdjustments: boolean;
  manageWarehouses: boolean;
  manageStaff: boolean;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  password: string;
  roleTitle: string;
  isSuperAdmin: boolean;
  permissions: Permissions;
  createdAt: string;
}

export interface WarehouseStack {
  id: string;
  warehouseName: string;
  stackName: string;
  zone: string;
  aisle: string;
  tags: string[]; // e.g. "Fast Moving", "Heavy Goods", "Fragile", "Raw Material"
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: string; // Units, kg, Liters, Packs, etc.
  minThreshold: number;
  initialStackId?: string;
  createdAt: string;
}

export interface StockItemLocation {
  productId: string;
  stackId: string;
  quantity: number;
}

export type ReceiptStatus = 'Draft' | 'Waiting' | 'Ready' | 'Done' | 'Canceled';

export interface ReceiptItem {
  productId: string;
  quantity: number;
}

export interface Receipt {
  id: string;
  referenceNo: string; // WH/IN/0001
  supplierName: string;
  targetStackId: string;
  items: ReceiptItem[];
  status: ReceiptStatus;
  createdAt: string;
  validatedAt?: string;
  handlerName: string;
}

export type DeliveryStatus = 'Draft' | 'Pick Items' | 'Pack Items' | 'Ready' | 'Done' | 'Canceled';

export interface DeliveryItem {
  productId: string;
  quantity: number;
}

export interface DeliveryOrder {
  id: string;
  referenceNo: string; // WH/OUT/0001
  customerName: string;
  sourceStackId: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  createdAt: string;
  validatedAt?: string;
  handlerName: string;
}

export interface InternalTransfer {
  id: string;
  referenceNo: string; // WH/INT/0001
  productId: string;
  quantity: number;
  sourceStackId: string;
  destinationStackId: string;
  status: 'Done' | 'Canceled';
  createdAt: string;
  handlerName: string;
}

export type AdjustmentReason = 'Damaged Goods' | 'Counting Discrepancy' | 'Theft/Loss' | 'Found Inventory' | 'Initial Stock';

export interface StockAdjustment {
  id: string;
  referenceNo: string; // INV/ADJ/0001
  productId: string;
  stackId: string;
  theoreticalQty: number;
  countedQty: number;
  difference: number;
  reason: AdjustmentReason;
  notes?: string;
  createdAt: string;
  handlerName: string;
}

export type LedgerMoveType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT' | 'INITIAL';

export interface MoveLedgerEntry {
  id: string;
  timestamp: string;
  referenceNo: string;
  moveType: LedgerMoveType;
  productId: string;
  productName: string;
  sku: string;
  fromLocation: string; // e.g. "Vendor / Acme Corp" or "Main Warehouse - Rack A"
  toLocation: string;   // e.g. "Main Warehouse - Rack A" or "Customer / John Doe"
  quantity: number;
  uom: string;
  handlerName: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  userName: string;
  details?: string;
}
