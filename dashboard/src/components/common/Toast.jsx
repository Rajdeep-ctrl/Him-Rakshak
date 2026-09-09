import React from 'react';
import { useDataMode } from '../../context/DataModeContext';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toasts, removeToast } = useDataMode();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-2xl border text-sm animate-slide-in backdrop-blur-md ${
              isError
                ? 'bg-red-950/90 border-red-500/50 text-red-200'
                : isSuccess
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/90 border-cyan-500/50 text-cyan-200'
            }`}
          >
            {isError && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
            {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {!isError && !isSuccess && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}

            <span className="flex-1 font-medium">{toast.message}</span>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
