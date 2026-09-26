import React, { useEffect, useState } from 'react';
import { UndoableAction, undoManager } from '../services/undoService';
import { RotateCcw, Clock } from 'lucide-react';

interface Props {
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
}

export const UndoToastBar: React.FC<Props> = ({ onShowToast }) => {
  const [actions, setActions] = useState<UndoableAction[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsubscribe = undoManager.subscribe(current => {
      setActions(current);
    });

    // Update countdown every 100ms
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 100);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  if (actions.length === 0) return null;

  const handleUndo = (action: UndoableAction) => {
    const success = undoManager.undoAction(action.id);
    if (success) {
      onShowToast('info', 'Action Undone', `Reverted: "${action.description}"`);
    } else {
      onShowToast('error', 'Undo Failed', 'Action could not be reverted or has expired.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {actions.map(action => {
        const remainingMs = Math.max(0, action.expiresAt - Date.now());
        const progressPercent = (remainingMs / 30000) * 100;

        return (
          <div
            key={action.id}
            className="pointer-events-auto bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-slate-100 flex flex-col gap-2 transition-all transform animate-in slide-in-from-bottom-4 duration-300"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Undo Available</h4>
                  <p className="text-sm font-medium text-white truncate max-w-[180px]" title={action.description}>
                    {action.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleUndo(action)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Undo
              </button>
            </div>

            {/* Countdown bar */}
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
