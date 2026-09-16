import React, { useEffect, useRef, useState } from 'react';
import { User, BotMessageSquare, Moon, Sun, Bell, Check, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDataMode } from '../../context/DataModeContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAlerts, recordAlertAction } from '../../services/api';

export default function Topbar({ title, setMobileOpen, onOpenVoice }) {
  const navigate = useNavigate();
  const { isLiveApi, toggleDataMode } = useDataMode();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('him-rakshak-read-notifications') || '[]');
    } catch {
      return [];
    }
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isNotificationLoading, setIsNotificationLoading] = useState(true);
  const [notificationError, setNotificationError] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      setIsNotificationLoading(true);
      try {
        const alerts = await getAlerts(isLiveApi);
        if (isMounted) {
          setNotifications(Array.isArray(alerts) ? alerts.slice(0, 8) : []);
          setNotificationError(false);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
          setNotificationError(true);
        }
      } finally {
        if (isMounted) setIsNotificationLoading(false);
      }
    };

    loadNotifications();
    const refreshTimer = window.setInterval(loadNotifications, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [isLiveApi]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getNotificationId = (notification, index) => notification.id || notification.alertId || `${notification.title}-${index}`;
  const unreadNotifications = notifications.filter(
    (notification, index) => !readNotificationIds.includes(getNotificationId(notification, index))
  );

  const isNotificationRead = (notification, index) =>
    readNotificationIds.includes(getNotificationId(notification, index));

  const markAsRead = (notification, index) => {
    const id = getNotificationId(notification, index);
    const nextReadIds = [...new Set([...readNotificationIds, id])];
    setReadNotificationIds(nextReadIds);
    window.localStorage.setItem('him-rakshak-read-notifications', JSON.stringify(nextReadIds));
  };

  const markAllAsRead = async () => {
    if (isMarkingAllRead || notifications.length === 0) return;
    setIsMarkingAllRead(true);
    try {
      if (isLiveApi) {
        await Promise.all(
          notifications
            .filter((notification, index) => !isNotificationRead(notification, index))
            .map((notification) => recordAlertAction(notification, 'Acknowledged'))
        );
      }

    const allIds = notifications.map((notification, index) => getNotificationId(notification, index));
    setReadNotificationIds(allIds);
    window.localStorage.setItem('him-rakshak-read-notifications', JSON.stringify(allIds));
    setIsNotificationOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const openAlertCenter = () => {
    setIsNotificationOpen(false);
    navigate('/alerts');
  };

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

        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] px-2.5 py-2 text-[var(--muted)]" title="Select language">
          <Languages className="h-4 w-4" />
          <select
            value={lang}
            onChange={(event) => setLang(event.target.value)}
            aria-label="Select language"
            className="cursor-pointer bg-transparent text-[11px] font-black uppercase tracking-[0.08em] text-[var(--text)] outline-none"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="as">অসমীয়া</option>
          </select>
        </div>

        <div ref={notificationRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationOpen((open) => !open)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] text-[var(--muted)] transition hover:border-[var(--accent)]/30 hover:text-[var(--accent)]"
            aria-label={`Notifications${unreadNotifications.length ? `, ${unreadNotifications.length} unread` : ''}`}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full border-2 border-[var(--panel)] bg-[var(--danger)] px-1 text-[9px] font-black text-white shadow-[0_0_0_3px_var(--danger-soft)]">
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-12 z-[1200] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text)]">{t('notifications')}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">{unreadNotifications.length} {t('unreadAlerts')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      disabled={isMarkingAllRead || unreadNotifications.length === 0}
                      className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--accent)] hover:text-[var(--accent-2)]"
                    >
                      {isMarkingAllRead ? 'Saving...' : unreadNotifications.length > 0 ? t('markAllRead') : t('allRead')}
                    </button>
                  )}
                  <Bell className="h-4 w-4 text-[var(--accent)]" />
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isNotificationLoading ? (
                  <p className="px-4 py-8 text-center text-xs text-[var(--muted)]">{t('loadingAlerts')}</p>
                ) : notificationError ? (
                  <p className="px-4 py-8 text-center text-xs text-[var(--danger)]">{t('unableLoadAlerts')}</p>
                ) : notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div
                      key={getNotificationId(notification, index)}
                      className={`cursor-pointer border-b border-[var(--border)] px-4 py-3 last:border-b-0 ${
                        isNotificationRead(notification, index) ? 'opacity-65' : 'bg-[var(--accent-soft)]/35'
                      }`}
                      onClick={() => openAlertCenter()}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-[var(--text)]">
                            {!isNotificationRead(notification, index) && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--danger)] align-middle" />}
                            {notification.title || notification.message || 'Risk alert'}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--muted)]">{notification.description || notification.message || 'New risk information is available.'}</p>
                        </div>
                        {!isNotificationRead(notification, index) && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              markAsRead(notification, index);
                            }}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--success)]/20 bg-[var(--success-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--success)] transition hover:border-[var(--success)]/40"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                            Read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Check className="mx-auto h-5 w-5 text-[var(--success)]" />
                    <p className="mt-2 text-xs font-bold text-[var(--text)]">{t('allCaughtUp')}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{t('noUnreadAlerts')}</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={openAlertCenter}
                  className="w-full border-t border-[var(--border)] px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                >
                  {t('openAlertManagement')}
                </button>
              )}
            </div>
          )}
        </div>

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