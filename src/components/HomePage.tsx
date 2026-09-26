import React from 'react';
import { Package, Shield, Layers, ArrowRight, CheckCircle2, FileSpreadsheet, SlidersHorizontal, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface Props {
  onOpenSignUp: () => void;
  onOpenSignIn: () => void;
}

export const HomePage: React.FC<Props> = ({ onOpenSignUp, onOpenSignIn }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">StockSense</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSignIn}
              className="px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={onOpenSignUp}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              Sign Up <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 flex-1 flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Production-Ready Inventory Management System
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Master Your Supply Chain with <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">StockSense IMS</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            An advanced, Odoo-inspired modular ERP web application featuring granular role-based access control, dynamic multi-warehouse stack builders, and immutable audit ledgers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onOpenSignUp}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-3 text-base"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSignIn}
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl font-semibold transition-all cursor-pointer text-base"
            >
              Sign In to Portal
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left max-w-5xl mx-auto">
            
            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dynamic Stack Builder</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Configure physical warehouse layouts, zones, aisles, and color-coded tags dynamically with zero downtime.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Granular RBAC</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Define exact staff privileges across receipts, deliveries, transfers, adjustments, and product catalogs.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Immutable Audit Ledger</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track every transaction chronologically with complete visibility into source locations, handlers, and quantities.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-xs text-slate-500">
      </footer>

    </div>
  );
};
