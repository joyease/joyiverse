import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const Icon = t.type === 'success' ? CheckCircle2 : t.type === 'error' ? AlertCircle : Info;
        const colorClasses =
          t.type === 'success'
            ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700/60'
            : t.type === 'error'
            ? 'bg-rose-900/90 text-rose-100 border-rose-700/60'
            : 'bg-slate-900/90 text-slate-100 border-slate-700/60';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl shadow-xl backdrop-blur-md border text-xs sm:text-sm animate-in slide-in-from-top-3 fade-in duration-200 ${colorClasses}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 flex-shrink-0" />
              <p className="font-medium truncate">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded-full hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
