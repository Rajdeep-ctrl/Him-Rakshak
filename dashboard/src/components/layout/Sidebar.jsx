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
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-command-surface border-r border-command-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-command-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-cyan-950/50">
              <Mountain className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wider leading-none">
                {t('appName')}
              </h1>
              <p className="text-[10px] text-command-muted font-medium mt-1">
                SIH26001 • MDoNER
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                        : 'text-command-muted hover:text-slate-100 hover:bg-command-card/50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer & Status */}
        <div className="p-4 border-t border-command-border space-y-4">
          <div className="bg-command-bg/80 border border-command-border rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('systemStatus')}</span>
            </div>
            <p className="text-[11px] text-command-muted mt-1">
              GIS Engine: Active • Sync 100%
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
