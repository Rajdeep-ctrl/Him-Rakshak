import React from 'react';
import { User, BotMessageSquare } from 'lucide-react';
import { useDataMode } from '../../context/DataModeContext';

export default function Topbar({ title, setMobileOpen, onOpenVoice }) {
  const { isLiveApi, toggleDataMode } = useDataMode();

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-white tracking-wide">
          {title || 'GIS Landslide Surveillance Map'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Persistent Mode Switcher Controls Connected to DataModeContext */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => toggleDataMode('mock')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              !isLiveApi
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            MOCK DATA
          </button>

          <button
            type="button"
            onClick={() => toggleDataMode('live')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              isLiveApi
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white border border-transparent'
            }`}
          >
            ((o)) LIVE API
          </button>
        </div>

        {/* WEATHER AI CHATBOT / VOICE ASSISTANT BUTTON */}
        <button
          type="button"
          onClick={() => {
            if (onOpenVoice) {
              onOpenVoice();
            } else {
              window.dispatchEvent(new Event('openWeatherChat'));
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          title="Open Weather AI Assistant"
        >
          <BotMessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Weather AI Chat</span>
        </button>

        {/* User Badge */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left text-xs">
            <p className="font-semibold text-slate-200 leading-tight">Control Officer</p>
            <p className="text-[10px] text-slate-400">MDoNER Command</p>
          </div>
        </div>
      </div>
    </header>
  );
}