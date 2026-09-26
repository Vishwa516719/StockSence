import {
  CompanyProfile,
  StaffUser,
  WarehouseStack,
  Product,
  StockItemLocation,
  Receipt,
  DeliveryOrder,
  InternalTransfer,
  StockAdjustment,
  MoveLedgerEntry
} from '../types';

const STORAGE_KEYS = {
  COMPANY: 'stocksense_company',
  STAFF: 'stocksense_staff',
  CURRENT_USER_ID: 'stocksense_current_user_id',
  WAREHOUSES: 'stocksense_warehouses',
  PRODUCTS: 'stocksense_products',
  STOCK_LOCATIONS: 'stocksense_stock_locations',
  RECEIPTS: 'stocksense_receipts',
  DELIVERIES: 'stocksense_deliveries',
  TRANSFERS: 'stocksense_transfers',
  ADJUSTMENTS: 'stocksense_adjustments',
  LEDGER: 'stocksense_ledger',
  OTP_STORE: 'stocksense_otp_store',
};

// Company
export function getCompany(): CompanyProfile | null {
  const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
  return data ? JSON.parse(data) : null;
}

export function saveCompany(company: CompanyProfile): void {
  localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
}

// Staff
export function getStaffList(): StaffUser[] {
  const data = localStorage.getItem(STORAGE_KEYS.STAFF);
  return data ? JSON.parse(data) : [];
}

export function saveStaffList(staff: StaffUser[]): void {
  localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
}

export function getCurrentUserId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
}

export function setCurrentUserId(id: string | null): void {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function getCurrentUser(): StaffUser | null {
  const currentId = getCurrentUserId();
  const staffList = getStaffList();
  if (!currentId) return staffList[0] || null; // fallback to first staff or admin
  return staffList.find(s => s.id === currentId) || staffList[0] || null;
}

// Warehouses & Stacks
export function getWarehouses(): WarehouseStack[] {
  const data = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
  return data ? JSON.parse(data) : [];
}

export function saveWarehouses(warehouses: WarehouseStack[]): void {
  localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehouses));
}

// Products
export function getProducts(): Product[] {
  const data = localStorage.getItem(STORAGE_PRODUCTS);
  return data ? JSON.parse(data) : [];
}

const STORAGE_PRODUCTS = 'stocksense_products';

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}

// Stock Locations (On-hand quantities per product per stack)
export function getStockLocations(): StockItemLocation[] {
  const data = localStorage.getItem(STORAGE_KEYS.STOCK_LOCATIONS);
  return data ? JSON.parse(data) : [];
}

export function saveStockLocations(locations: StockItemLocation[]): void {
  localStorage.setItem(STORAGE_KEYS.STOCK_LOCATIONS, JSON.stringify(locations));
}

export function getProductStockInStack(productId: string, stackId: string): number {
  const locations = getStockLocations();
  const loc = locations.find(l => l.productId === productId && l.stackId === stackId);
  return loc ? loc.quantity : 0;
}

export function getTotalProductStock(productId: string): number {
  const locations = getStockLocations();
  return locations
    .filter(l => l.productId === productId)
    .reduce((sum, l) => sum + l.quantity, 0);
}

export function updateProductStock(productId: string, stackId: string, delta: number): void {
  const locations = getStockLocations();
  const index = locations.findIndex(l => l.productId === productId && l.stackId === stackId);
  if (index >= 0) {
    locations[index].quantity += delta;
    if (locations[index].quantity < 0) locations[index].quantity = 0;
  } else if (delta > 0) {
    locations.push({ productId, stackId, quantity: delta });
  }
  saveStockLocations(locations);
}

// Receipts
export function getReceipts(): Receipt[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECEIPTS);
  return data ? JSON.parse(data) : [];
}

export function saveReceipts(receipts: Receipt[]): void {
  localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(receipts));
}

// Deliveries
export function getDeliveries(): DeliveryOrder[] {
  const data = localStorage.getItem(STORAGE_KEYS.DELIVERIES);
  return data ? JSON.parse(data) : [];
}

export function saveDeliveries(deliveries: DeliveryOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.DELIVERIES, JSON.stringify(deliveries));
}

// Transfers
export function getTransfers(): InternalTransfer[] {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
  return data ? JSON.parse(data) : [];
}

export function saveTransfers(transfers: InternalTransfer[]): void {
  localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
}

// Adjustments
export function getAdjustments(): StockAdjustment[] {
  const data = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS);
  return data ? JSON.parse(data) : [];
}

export function saveAdjustments(adjustments: StockAdjustment[]): void {
  localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
}

// Move Ledger
export function getMoveLedger(): MoveLedgerEntry[] {
  const data = localStorage.getItem(STORAGE_KEYS.LEDGER);
  return data ? JSON.parse(data) : [];
}

export function saveMoveLedger(ledger: MoveLedgerEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.LEDGER, JSON.stringify(ledger));
}

export function addLedgerEntry(entry: Omit<MoveLedgerEntry, 'id' | 'timestamp'>): void {
  const ledger = getMoveLedger();
  const newEntry: MoveLedgerEntry = {
    ...entry,
    id: 'LEDGER-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    timestamp: new Date().toISOString()
  };
  ledger.unshift(newEntry);
  saveMoveLedger(ledger);
}

// Helper to generate reference numbers
export function generateReferenceNumber(type: 'IN' | 'OUT' | 'INT' | 'ADJ'): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  switch (type) {
    case 'IN': return `WH/IN/${randomNum}`;
    case 'OUT': return `WH/OUT/${randomNum}`;
    case 'INT': return `WH/INT/${randomNum}`;
    case 'ADJ': return `INV/ADJ/${randomNum}`;
  }
}

// Activity Logs
import { ActivityLog } from '../types';

export function getActivityLogs(): ActivityLog[] {
  const data = localStorage.getItem('stocksense_activity_logs');
  return data ? JSON.parse(data) : [
    { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'System initialized', userName: 'System' },
    { id: '2', timestamp: new Date(Date.now() - 1800000).toISOString(), action: 'Warehouse stack configured', userName: 'Admin' }
  ];
}

export function logActivity(action: string, userName: string, details?: string): void {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    action,
    userName,
    details
  };
  localStorage.setItem('stocksense_activity_logs', JSON.stringify([newLog, ...logs].slice(0, 30)));
}
