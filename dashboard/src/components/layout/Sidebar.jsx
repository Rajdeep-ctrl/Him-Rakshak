import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  Mountain,
  LayoutDashboard,
  Map,
  Bell,
  Truck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/risk-map', label: t('riskMap'), icon: Map },
    { path: '/alerts', label: t('alerts'), icon: Bell },
    { path: '/roads', label: t('roads'), icon: Truck },
    { path: '/reports', label: t('reports'), icon: FileText },
    { path: '/analytics', label: t('analytics'), icon: BarChart3 },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#201b17]/40 z-40 lg:hidden backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-soft)] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 py-6 border-b border-[var(--border)]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent-soft)] text-white shadow-[var(--shadow-soft)]">
              <Mountain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-[0.12em] text-[var(--text)] uppercase">
                {t('appName')}
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                SIH26001 • MDoNER
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] shadow-[var(--shadow-soft)] ring-1 ring-[var(--accent)]/20'
                        : 'text-[var(--muted)] hover:bg-[var(--panel-alt)] hover:text-[var(--text)]'
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="space-y-4 border-t border-[var(--border)] p-4">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] p-3">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--success)]">
                <span className="h-2 w-2 rounded-full bg-[var(--success)] animate-pulse" />
                <ShieldCheck className="h-4 w-4" />
                <span>{t('systemStatus')}</span>
              </div>
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                GIS Engine: Active • Sync 100%
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)] transition hover:border-[var(--danger)]/30 hover:bg-[var(--danger-soft)]"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
