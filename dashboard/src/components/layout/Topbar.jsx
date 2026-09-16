import React from 'react';
import { User, BotMessageSquare, Moon, Sun } from 'lucide-react';
import { useDataMode } from '../../context/DataModeContext';
import { useTheme } from '../../context/ThemeContext';

export default function Topbar({ title, setMobileOpen, onOpenVoice }) {
  const { isLiveApi, toggleDataMode } = useDataMode();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4 py-3 shadow-[var(--shadow-soft)] sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2 text-[var(--muted)] lg:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span className="block h-0.5 w-4 bg-current" />
          <span className="mt-1 block h-0.5 w-4 bg-current" />
          <span className="mt-1 block h-0.5 w-4 bg-current" />
        </button>
        <h1 className="text-lg font-black tracking-[0.04em] text-[var(--text)] sm:text-xl">
          {title || 'GIS Landslide Surveillance Map'}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] p-1">
          <button
            type="button"
            onClick={() => toggleDataMode('mock')}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              !isLiveApi
                ? 'bg-[var(--amber-soft)] text-[var(--amber)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Mock
          </button>

          <button
            type="button"
            onClick={() => toggleDataMode('live')}
            className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${
              isLiveApi
                ? 'bg-[var(--success-soft)] text-[var(--success)] shadow-[var(--shadow-soft)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            Live API
          </button>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={() => {
            if (onOpenVoice) {
              onOpenVoice();
            } else {
              window.dispatchEvent(new Event('openWeatherChat'));
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-2 text-[11px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent-soft)]/80"
          title="Open Weather AI Assistant"
        >
          <BotMessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Weather AI</span>
        </button>

        <div className="hidden items-center gap-3 border-l border-[var(--border)] pl-4 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--panel-alt)] text-[var(--accent)] ring-1 ring-[var(--border)]">
            <User className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-bold text-[var(--text)] leading-tight">Control Officer</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">MDoNER</p>
          </div>
        </div>
      </div>
    </header>
  );
}