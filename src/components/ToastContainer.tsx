import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        const bgColors = {
          success: 'bg-emerald-900/95 text-emerald-100 border-emerald-700',
          error: 'bg-rose-900/95 text-rose-100 border-rose-700',
          warning: 'bg-amber-900/95 text-amber-100 border-amber-700',
          info: 'bg-slate-900/95 text-slate-100 border-slate-700'
        };

        const IconComponent = {
          success: CheckCircle2,
          error: XCircle,
          warning: AlertTriangle,
          info: Info
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-slide-in ${bgColors[toast.type]}`}
          >
            <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold">{toast.title}</h4>
              <p className="mt-0.5 opacity-90">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
