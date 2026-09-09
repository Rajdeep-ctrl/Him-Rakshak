import React from 'react';
import { X, ShieldAlert, CheckCircle2, UserCheck, Check } from 'lucide-react';

export default function AlertModal({ alert, onClose, onAction }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-command-surface border border-command-border w-full max-w-lg rounded-2xl p-6 shadow-2xl relative space-y-5 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-command-card text-command-muted hover:text-white border border-command-border"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-command-border pb-4">
          <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-red-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
              {alert.severity} SEVERITY
            </span>
            <h2 className="text-lg font-bold text-white mt-1">{alert.id}</h2>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs text-command-muted font-medium">Alert Description</p>
            <p className="text-sm text-slate-200 font-semibold mt-0.5">{alert.title}</p>
            <p className="text-xs text-command-muted mt-1 leading-relaxed">{alert.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-command-bg p-3 rounded-xl border border-command-border">
            <div>
              <p className="text-[11px] text-command-muted">Target District</p>
              <p className="text-xs font-bold text-slate-200">{alert.district}, {alert.state}</p>
            </div>
            <div>
              <p className="text-[11px] text-command-muted">Monitored Rainfall</p>
              <p className="text-xs font-bold text-cyan-400">{alert.rainfall} mm</p>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl text-amber-200">
            <p className="text-xs font-bold uppercase tracking-wider mb-1">Recommended Response Protocol</p>
            <p className="text-xs text-amber-300/90">{alert.recommendedResponse}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-command-border flex gap-3">
          <button
            onClick={() => {
              onAction(alert.id, 'Assigned Response Force');
              onClose();
            }}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            Assign SDRF Team
          </button>
          <button
            onClick={() => {
              onAction(alert.id, 'Resolved');
              onClose();
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
