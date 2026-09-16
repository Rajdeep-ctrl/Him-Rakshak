import React from 'react';
import { X, ShieldAlert, CheckCircle2, UserCheck, Check } from 'lucide-react';

export default function AlertModal({ alert, onClose, onAction }) {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201d1a]/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg space-y-5 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-soft)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-[var(--danger)]">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <span className="rounded-full border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--danger)]">
              {alert.severity} SEVERITY
            </span>
            <h2 className="mt-1 text-lg font-black text-[var(--text)]">{alert.id}</h2>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Alert Description</p>
            <p className="mt-0.5 text-sm font-black text-[var(--text)]">{alert.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{alert.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--panel-alt)] p-3">
            <div>
              <p className="text-[11px] text-[var(--muted)]">Target District</p>
              <p className="text-xs font-black text-[var(--text)]">{alert.district}, {alert.state}</p>
            </div>
            <div>
              <p className="text-[11px] text-[var(--muted)]">Monitored Rainfall</p>
              <p className="text-xs font-black text-[var(--accent)]">{alert.rainfall} mm</p>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--warning)]/20 bg-[var(--warning-soft)] p-3 text-[var(--warning)]">
            <p className="mb-1 text-xs font-black uppercase tracking-[0.14em]">Recommended Response Protocol</p>
            <p className="text-xs leading-relaxed text-[var(--warning)]/90">{alert.recommendedResponse}</p>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[var(--border)] pt-3">
          <button
            onClick={() => {
              onAction(alert.id, 'Assigned Response Force');
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-2)]"
          >
            <UserCheck className="h-4 w-4" />
            Assign SDRF Team
          </button>
          <button
            onClick={() => {
              onAction(alert.id, 'Resolved');
              onClose();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[var(--success)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--success)]/90"
          >
            <Check className="h-4 w-4" />
            Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}
