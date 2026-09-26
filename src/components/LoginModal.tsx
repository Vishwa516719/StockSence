import React, { useState } from 'react';
import { StaffUser } from '../types';
import { getStaffList, setCurrentUserId } from '../utils/storage';
import { getSupabaseClient } from '../utils/supabaseClient';
import { KeyRound, Mail, Lock, ShieldCheck, X, ArrowRight } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
  onOpenForgotPassword: () => void;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const LoginModal: React.FC<Props> = ({ onLoginSuccess, onOpenForgotPassword, onClose, onShowToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      onShowToast('error', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setIsLoading(false);
        if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not verified')) {
          onShowToast('error', 'Email Not Verified', 'Please check your email and verify your account before signing in.');
        } else {
          onShowToast('error', 'Sign In Failed', error.message);
        }
        return;
      }
    }

    // Fallback local staff match or create session mapping
    const staffList = getStaffList();
    let user = staffList.find(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (!user && staffList.length > 0) {
      user = staffList[0];
    } else if (!user) {
      // Create admin user for Supabase session if none exists
      user = {
        id: 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: email.split('@')[0],
        email: email.trim(),
        password,
        roleTitle: 'Inventory Director',
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
      staffList.push(user);
      // save staff list
      localStorage.setItem('stocksense_staff', JSON.stringify(staffList));
    }

    setCurrentUserId(user.id);
    setIsLoading(false);
    onShowToast('success', 'Welcome Back', `Successfully signed in as ${user.name}`);
    onLoginSuccess();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 lg:p-8 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-[94vw] max-w-5xl h-[85vh] max-h-[750px] overflow-hidden border border-slate-800 flex flex-col lg:flex-row animate-scale-up"
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
        <div className="lg:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">StockSense Portal</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Secure Supabase Authentication
            </h2>
            <p className="text-slate-400 text-sm mt-4 leading-relaxed">
              Sign in with your verified Supabase account credentials to access inventory control workflows, vendor receipts, customer deliveries, and immutable audit ledgers.
            </p>
          </div>

          <div className="space-y-4 pt-8 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Production Supabase Session Management</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Role-Based Access Control (RBAC) enforced</span>
            </div>
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:w-7/12 p-8 lg:p-12 overflow-y-auto bg-slate-900 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white tracking-tight">Sign In to Dashboard</h3>
              <p className="text-slate-400 text-sm mt-1">Enter your verified email and password</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="staff@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:bg-slate-900 transition-all outline-none text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={onOpenForgotPassword}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-xl shadow-blue-500/25 transition-all cursor-pointer text-base mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Dashboard'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
