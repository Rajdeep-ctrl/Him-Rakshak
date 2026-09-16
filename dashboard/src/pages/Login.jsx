import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mountain, Lock, Mail, Shield, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('officer@mdoner.gov.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Disaster Management Officer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-page)] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(44,92,77,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(212,117,72,0.12),_transparent_28%)]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-soft)]">
        <div className="bg-[var(--panel-alt)] px-8 pb-8 pt-10">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] via-[var(--accent)] to-[var(--accent-2)] text-white shadow-[var(--shadow-card)]">
              <Mountain className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-[0.18em] text-[var(--text)]">HIM-RAKSHAK</h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              NER Disaster Intelligence
            </p>
            <span className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              SIH 2026 • SIH26001
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Official Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] py-3 pl-10 pr-4 text-sm text-[var(--text)]"
                  placeholder="officer@mdoner.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Access Credentials
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[var(--muted)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] py-3 pl-10 pr-4 text-sm text-[var(--text)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                Operational Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3 text-sm text-[var(--text)]"
              >
                <option value="Disaster Management Officer">Disaster Management Officer</option>
                <option value="Field Patrol Inspector">Field Patrol Inspector</option>
                <option value="System Administrator">System Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--accent-2)]"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  <span>Authorize Access</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-[var(--border)] bg-[var(--panel)] px-6 py-4 text-center text-[11px] font-medium text-[var(--muted)]">
          <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
          <span>Restricted Government Access • Authorized Officers Only</span>
        </div>
      </div>
    </div>
  );
}
