import React, { useState } from 'react';
import { useDataMode } from '../context/DataModeContext';
import { useLanguage } from '../context/LanguageContext';
import { Settings as SettingsIcon, Server, Shield, Radio, RefreshCw } from 'lucide-react';

export default function Settings() {
  const { isLiveApi, toggleDataMode, addToast } = useDataMode();
  const { t } = useLanguage();
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Configuration settings updated', 'success');
  };

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 p-1 sm:p-2">
      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="flex items-center gap-2 text-xl font-black tracking-[0.06em] text-[var(--text)]">
          <SettingsIcon className="h-5 w-5 text-[var(--accent)]" />
          {t('settings')}
        </h1>
        <p className="mt-2 text-xs font-medium text-[var(--muted)]">
          Adjust API connectors, auto-refresh intervals, and system parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="flex items-center gap-2 border-b border-[var(--border)] pb-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">
            <Server className="h-4 w-4 text-[var(--accent)]" />
            Backend API Connection Settings
          </h2>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Base API Target URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2.5 text-xs text-[var(--text)]"
            />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--text)]">Data Source Mode</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Toggle between client mock data and live FastAPI endpoint</p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => toggleDataMode('mock')}
                className={`rounded-xl px-3 py-2 ${!isLiveApi ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--muted)]'}`}
              >
                Mock Data
              </button>
              <button
                type="button"
                onClick={() => toggleDataMode('live')}
                className={`rounded-xl px-3 py-2 ${isLiveApi ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'text-[var(--muted)]'}`}
              >
                Live API
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <h2 className="flex items-center gap-2 border-b border-[var(--border)] pb-3 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">
            <RefreshCw className="h-4 w-4 text-[var(--accent)]" />
            Automated Refresh Cycle
          </h2>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--text)]">60-Second Auto Refresh</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">Automatically poll backend for rainfall and slope telemetry updates</p>
            </div>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="rounded-2xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[var(--accent-2)]"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
