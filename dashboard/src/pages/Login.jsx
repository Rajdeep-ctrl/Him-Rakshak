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
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full bg-command-surface/90 border border-command-border rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-blue-700 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-cyan-950/50">
            <Mountain className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">HIM-RAKSHAK</h1>
          <p className="text-xs text-command-muted font-medium mt-1">
            NER Disaster Intelligence & Early Warning Command Center
          </p>
          <span className="inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            SIH 2026 • Problem SIH26001
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Identity Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-command-muted absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="officer@mdoner.gov.in"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Access Credentials
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-command-muted absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-command-bg border border-command-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Assigned Operational Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="Disaster Management Officer">Disaster Management Officer</option>
              <option value="Field Patrol Inspector">Field Patrol Inspector</option>
              <option value="System Administrator">System Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-cyan-950/50 transition-colors flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Authorize & Access Command Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-command-border text-center text-[11px] text-command-muted flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Restricted Government System — Authorized Officers Only</span>
        </div>
      </div>
    </div>
  );
}
