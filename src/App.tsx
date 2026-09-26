import React, { useState, useEffect } from 'react';
import {
  getCompany,
  getCurrentUser
} from './utils/storage';
import { getSupabaseClient } from './utils/supabaseClient';
import { CompanyProfile, StaffUser, ToastMessage } from './types';
import { CompanySetupModal } from './components/CompanySetupModal';
import { LoginModal } from './components/LoginModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { AddStackModal } from './components/AddStackModal';
import { ToastContainer } from './components/ToastContainer';
import { UndoToastBar } from './components/UndoToastBar';
import { HomePage } from './components/HomePage';

import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { ReceiptsView } from './components/ReceiptsView';
import { DeliveriesView } from './components/DeliveriesView';
import { TransfersView } from './components/TransfersView';
import { AdjustmentsView } from './components/AdjustmentsView';
import { MoveHistoryView } from './components/MoveHistoryView';
import { StaffManagementView } from './components/StaffManagementView';
import { WarehouseManagementView } from './components/WarehouseManagementView';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(getCompany());
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');

  // Dark Mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('stocksense_dark_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('stocksense_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Modals
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showAddStackModal, setShowAddStackModal] = useState<boolean>(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { id, type, title, message };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRefreshUser = () => {
    setCompany(getCompany());
    setCurrentUser(getCurrentUser());
  };

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setCurrentUser(null);
    showToast('info', 'Signed Out', 'You have been signed out of StockSense.');
  };

  const isAuthenticated = Boolean(session || currentUser);

  return (
    <div className={`w-screen h-screen m-0 p-0 overflow-hidden flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <UndoToastBar onShowToast={showToast} />

      {/* Onboarding Setup Modal (Zero-Data Start / Sign Up) */}
      {showSetupModal && (
        <CompanySetupModal
          onComplete={() => {
            setShowSetupModal(false);
            handleRefreshUser();
          }}
          onClose={() => setShowSetupModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onLoginSuccess={() => {
            setShowLoginModal(false);
            handleRefreshUser();
          }}
          onOpenForgotPassword={() => {
            setShowLoginModal(false);
            setShowForgotPassword(true);
          }}
          onClose={() => setShowLoginModal(false)}
          onShowToast={showToast}
        />
      )}

      {/* Forgot Password OTP Modal */}
      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          onShowToast={showToast}
        />
      )}

      {/* Add Stack Modal */}
      {showAddStackModal && (
        <AddStackModal
          onClose={() => setShowAddStackModal(false)}
          onSuccess={() => handleRefreshUser()}
          onShowToast={showToast}
        />
      )}

      {/* Public Home Page when Not Authenticated */}
      {!isAuthenticated ? (
        <div className="w-full h-full overflow-y-auto">
          <HomePage
            onOpenSignUp={() => setShowSetupModal(true)}
            onOpenSignIn={() => setShowLoginModal(true)}
          />
        </div>
      ) : (
        /* Authenticated App Layout - Edge-to-Edge */
        <div className="w-full h-full flex flex-col overflow-hidden">
          <Navbar
            company={company || { name: session?.user?.email || 'StockSense', email: session?.user?.email || '', passwordHash: '', industry: '', currency: 'USD', primaryWarehouseName: 'Main', createdAt: '' }}
            currentUser={currentUser || {
              id: session?.user?.id || 'USR-SUPABASE',
              name: session?.user?.email?.split('@')[0] || 'Admin',
              email: session?.user?.email || '',
              password: '',
              roleTitle: 'Inventory Director / Super Admin',
              isSuperAdmin: true,
              permissions: {
                viewDashboard: true,
                manageProducts: true,
                processReceipts: true,
                processDeliveries: true,
                processTransfers: true,
                processAdjustments: true,
                manageWarehouses: true,
                manageStaff: true
              },
              createdAt: new Date().toISOString()
            }}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onUserSwitch={handleRefreshUser}
            onOpenAddStack={() => setShowAddStackModal(true)}
            onLogout={handleLogout}
            onNavigateTab={setActiveTab}
            onShowToast={showToast}
          />

          <div className="flex flex-1 w-full h-[calc(100vh-4rem)] overflow-hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }}
            />

            <main className="flex-1 h-full p-6 md:p-8 overflow-y-auto">
              {activeTab === 'DASHBOARD' && <DashboardView onNavigate={setActiveTab} onShowToast={showToast} />}
              {activeTab === 'PRODUCTS' && <ProductsView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onShowToast={showToast} />}
              {activeTab === 'RECEIPTS' && <ReceiptsView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onShowToast={showToast} />}
              {activeTab === 'DELIVERIES' && <DeliveriesView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onShowToast={showToast} />}
              {activeTab === 'TRANSFERS' && <TransfersView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onShowToast={showToast} />}
              {activeTab === 'ADJUSTMENTS' && <AdjustmentsView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
          }} onShowToast={showToast} />}
              {activeTab === 'LEDGER' && <MoveHistoryView onShowToast={showToast} />}
              {activeTab === 'WAREHOUSES' && <WarehouseManagementView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onOpenAddStack={() => setShowAddStackModal(true)} />}
              {activeTab === 'STAFF' && <StaffManagementView currentUser={currentUser || {
                id: session?.user?.id || 'USR-SUPABASE',
                name: session?.user?.email?.split('@')[0] || 'Admin',
                email: session?.user?.email || '',
                password: '',
                roleTitle: 'Inventory Director / Super Admin',
                isSuperAdmin: true,
                permissions: {
                  viewDashboard: true,
                  manageProducts: true,
                  processReceipts: true,
                  processDeliveries: true,
                  processTransfers: true,
                  processAdjustments: true,
                  manageWarehouses: true,
                  manageStaff: true
                },
                createdAt: new Date().toISOString()
              }} onShowToast={showToast} />}
            </main>
          </div>
        </div>
      )}

    </div>
  );
}
