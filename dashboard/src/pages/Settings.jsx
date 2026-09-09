import React, { useState } from 'react';
import { useDataMode } from '../context/DataModeContext';
import { Settings as SettingsIcon, Server, Shield, Radio, RefreshCw } from 'lucide-react';

export default function Settings() {
  const { isLiveApi, toggleDataMode, addToast } = useDataMode();
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/api');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Configuration settings updated', 'success');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1000px] mx-auto">
      <div className="bg-command-surface p-6 rounded-xl border border-command-border">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-cyan-400" />
          Command System Configuration
        </h1>
        <p className="text-xs text-command-muted mt-1">
          Adjust API connectors, auto-refresh intervals, and system parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Settings */}
        <div className="bg-command-surface p-6 rounded-xl border border-command-border space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-command-border pb-3">
            <Server className="w-4 h-4 text-cyan-400" />
            Backend API Connection Settings
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Base API Target URL (VITE_API_BASE_URL)
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-command-bg border border-command-border rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="text-xs font-semibold text-slate-200">Data Source Mode</p>
              <p className="text-[11px] text-command-muted">Toggle between client mock data and live FastAPI endpoint</p>
            </div>

            <div className="flex items-center gap-2 bg-command-bg p-1 rounded-lg border border-command-border text-xs">
              <button
                type="button"
                onClick={() => toggleDataMode('mock')}
                className={`px-3 py-1 rounded ${!isLiveApi ? 'bg-cyan-500/20 text-cyan-300' : 'text-command-muted'}`}
              >
                Mock Data
              </button>
              <button
                type="button"
                onClick={() => toggleDataMode('live')}
                className={`px-3 py-1 rounded ${isLiveApi ? 'bg-emerald-500/20 text-emerald-300' : 'text-command-muted'}`}
              >
                Live API
              </button>
            </div>
          </div>
        </div>

        {/* Refresh Settings */}
        <div className="bg-command-surface p-6 rounded-xl border border-command-border space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-command-border pb-3">
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            Automated Refresh Cycle
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">60-Second Auto Refresh</p>
              <p className="text-[11px] text-command-muted">Automatically poll backend for rainfall and slope telemetry updates</p>
            </div>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs shadow-lg transition-colors"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
