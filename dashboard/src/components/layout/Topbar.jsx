import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useDataMode } from '../../context/DataModeContext';
import { Menu, Globe, Radio, Bell, User } from 'lucide-react';

export default function Topbar({ title, setMobileOpen }) {
  const { lang, setLang, t } = useLanguage();
  const { isLiveApi, toggleDataMode, addToast } = useDataMode();

  return (
    <header className="h-16 bg-command-surface/90 backdrop-blur-md border-b border-command-border sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-command-muted hover:text-white p-2 rounded-lg bg-command-card border border-command-border"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-100">{title}</h1>
          <p className="text-xs text-command-muted hidden sm:block">
            North Eastern Region Landslide Surveillance & Early Warning Command
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Data Mode Switcher */}
        <div className="flex items-center bg-command-bg p-1 rounded-lg border border-command-border text-xs font-semibold">
          <button
            onClick={() => toggleDataMode('mock')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              !isLiveApi
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-command-muted hover:text-white'
            }`}
          >
            {t('mockData')}
          </button>
          <button
            onClick={() => toggleDataMode('live')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              isLiveApi
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-command-muted hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            {t('liveApi')}
          </button>
        </div>

        {/* Language Selector */}
        <div className="relative flex items-center bg-command-bg px-2.5 py-1.5 rounded-lg border border-command-border text-xs text-slate-200">
          <Globe className="w-3.5 h-3.5 text-cyan-400 mr-2" />
          <select
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              addToast(`Language updated to ${e.target.value.toUpperCase()}`, 'info');
            }}
            className="bg-transparent text-slate-200 border-none focus:outline-none cursor-pointer pr-1"
          >
            <option value="en" className="bg-command-card text-white">English</option>
            <option value="hi" className="bg-command-card text-white">हिन्दी</option>
            <option value="as" className="bg-command-card text-white">অসমীয়া</option>
          </select>
        </div>

        {/* Notifications */}
        <button
          onClick={() => addToast('3 Critical Risk alerts requiring review', 'error')}
          className="relative p-2 rounded-lg bg-command-card border border-command-border text-command-muted hover:text-white transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        </button>

        {/* User Badge */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-command-border">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left text-xs">
            <p className="font-semibold text-slate-200 leading-tight">Control Officer</p>
            <p className="text-[10px] text-command-muted">MDoNER Command</p>
          </div>
        </div>
      </div>
    </header>
  );
}
