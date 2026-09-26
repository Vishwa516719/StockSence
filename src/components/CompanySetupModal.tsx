import React, { useState } from 'react';
import { CompanyProfile, StaffUser } from '../types';
import { saveCompany, saveStaffList, setCurrentUserId, saveWarehouses } from '../utils/storage';
import { getSupabaseClient } from '../utils/supabaseClient';
import { Building2, ShieldCheck, Mail, Lock, Globe, DollarSign, Layers, X, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const CompanySetupModal: React.FC<Props> = ({ onComplete, onClose, onShowToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [industry, setIndustry] = useState('Manufacturing & Hardware');
  const [currency, setCurrency] = useState('USD ($)');
  const [warehouseName, setWarehouseName] = useState('Main Warehouse');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onShowToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!name.trim() || !password.trim()) {
      onShowToast('error', 'Incomplete Form', 'Please fill in all required company registration fields.');
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            company_name: name.trim(),
            industry,
            currency,
            primary_warehouse: warehouseName
          }
        }
      });

      if (error) {
        setIsLoading(false);
        onShowToast('error', 'Registration Failed', error.message);
        return;
      }
    }

    // Save local profile state
    const companyData: CompanyProfile = {
      name: name.trim(),
      email: email.trim(),
      passwordHash: password,
      industry,
      currency,
      primaryWarehouseName: warehouseName,
      createdAt: new Date().toISOString()
    };

    const adminUser: StaffUser = {
      id: 'USR-ADMIN-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: 'Super Admin (' + name.trim() + ')',
      email: email.trim(),
      password,
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
    };

    const defaultStack = {
      id: 'STACK-MAIN-01',
      warehouseName: warehouseName || 'Main Warehouse',
      stackName: 'Receiving Dock & Zone A',
      zone: 'Zone A',
      aisle: 'Aisle 01',
      tags: ['Fast Moving', 'Primary Storage'],
      createdAt: new Date().toISOString()
    };

    saveCompany(companyData);
    saveStaffList([adminUser]);
    setCurrentUserId(adminUser.id);
    saveWarehouses([defaultStack]);

    setIsLoading(false);
    onShowToast('success', 'Registration Successful', 'Registration successful! Please check your email to verify your account.');
    onComplete();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-[94vw] max-w-6xl h-[90vh] max-h-[880px] overflow-hidden border border-slate-800 flex flex-col lg:flex-row animate-scale-up"
      >
        {/* Prominent Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-all cursor-pointer shadow-lg border border-slate-700"
          title="Return to Home Page"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Left Informational Banner */}
        <div className="lg:w-5/12 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">StockSense IMS</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Launch Your Enterprise Inventory Engine
            </h2>
            <p className="text-slate-300 text-sm mt-4 leading-relaxed">
              Register your company profile with secure Supabase backend authentication to activate zero-data initialization and super admin RBAC privileges.
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Supabase Production Auth & Email Verification</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Multi-warehouse stack & zone configuration</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
              <span>Odoo-inspired transactional ledger engine</span>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:w-7/12 p-8 lg:p-12 overflow-y-auto bg-slate-900 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Company Registration Wizard</h3>
              <p className="text-slate-400 text-sm mt-1">Set up your enterprise core in seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corp Industries"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-slate-900 transition-all outline-none text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Business Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="admin@acme.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-slate-900 transition-all outline-none text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Admin Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-slate-900 transition-all outline-none text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Industry Category</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-white cursor-pointer"
                    >
                      <option value="Manufacturing & Hardware">Manufacturing & Hardware</option>
                      <option value="Retail & E-commerce">Retail & E-commerce</option>
                      <option value="Food & Cold Storage">Food & Cold Storage</option>
                      <option value="Pharmaceuticals & Medical">Pharmaceuticals & Medical</option>
                      <option value="Automotive & Spare Parts">Automotive & Spare Parts</option>
                      <option value="Electronics & Technology">Electronics & Technology</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Base Currency</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500 pointer-events-none" />
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none appearance-none text-white cursor-pointer"
                    >
                      <option value="USD ($)">USD ($)</option>
                      <option value="EUR (€)">EUR (€)</option>
                      <option value="GBP (£)">GBP (£)</option>
                      <option value="INR (₹)">INR (₹)</option>
                      <option value="JPY (¥)">JPY (¥)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Primary Warehouse Name</label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Main Warehouse"
                      value={warehouseName}
                      onChange={e => setWarehouseName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-slate-900 transition-all outline-none text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 transition-all cursor-pointer text-base mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Initialize StockSense System'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
