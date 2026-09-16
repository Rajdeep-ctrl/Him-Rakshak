import React, { useState, useEffect } from 'react';
import { getAlerts, broadcastEmergencyAlert } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import AlertModal from '../components/alerts/AlertModal';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Bell, Filter, ShieldAlert, CheckCircle, Send, Loader2 } from 'lucide-react';

export default function Alerts() {
  const { isLiveApi, addToast } = useDataMode();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [broadcastingId, setBroadcastingId] = useState(null);

  useEffect(() => {
    async function loadAlerts() {
      setLoading(true);
      try {
        const res = await getAlerts(isLiveApi);
        setAlerts(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, [isLiveApi]);

  const handleAction = (alertId, actionType) => {
    setAlerts((prev) =>
      prev.map((alt) =>
        alt.id === alertId ? { ...alt, status: actionType.toUpperCase() } : alt
      )
    );
    addToast(`Alert ${alertId} updated to ${actionType}`, 'success');
  };

  const handleBroadcast = async (alert) => {
    setBroadcastingId(alert.id);
    try {
      const payload = {
        location: alert.title || alert.location || "Mawsynram Sector",
        district: alert.district || "East Khasi Hills",
        severity: alert.severity || "CRITICAL",
        description: alert.description || "Continuous heavy rainfall triggering steep slope destabilization."
      };
      const res = await broadcastEmergencyAlert(payload);
      addToast(`Emergency Alert Dispatched via SMS & Email to ${res.email_details?.recipient || 'Command'}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to dispatch alert. Check server connection.', 'error');
    } finally {
      setBroadcastingId(null);
    }
  };

  const filteredAlerts = alerts.filter(
    (a) => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-[0.06em] text-[var(--text)]">
            <Bell className="h-5 w-5 text-[var(--danger)]" />
            Early Warning Incident Control Center
          </h1>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            Real-time landslide triggers and field dispatch management
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
          <Filter className="h-4 w-4 text-[var(--muted)]" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="cursor-pointer bg-transparent pr-1 text-[var(--text)] focus:outline-none"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader type="table" count={4} />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            const isBroadcasting = broadcastingId === alt.id;
            return (
              <div
                key={alt.id}
                className="flex flex-col items-start justify-between gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 md:flex-row md:items-center"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        isCritical
                          ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
                          : 'border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--accent)]">{alt.id}</span>
                    <span className="text-[11px] text-[var(--muted)]">• {alt.timestamp}</span>
                  </div>

                  <h3 className="text-lg font-black text-[var(--text)]">{alt.title}</h3>
                  <p className="text-sm text-[var(--muted)]">{alt.description}</p>
                  <p className="pt-1 text-xs font-medium text-[var(--muted)]">
                    Location: <span className="text-[var(--text)]">{alt.district}, {alt.state}</span> | Rainfall: <span className="text-[var(--accent)]">{alt.rainfall} mm</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleBroadcast(alt)}
                    disabled={isBroadcasting}
                    className="flex items-center gap-2 rounded-2xl bg-[var(--danger)] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[var(--danger)]/90 disabled:opacity-60"
                  >
                    {isBroadcasting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Broadcasting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        Broadcast Alert
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-4 py-2.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--accent)]/20"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={() => handleAction(alt.id, 'Acknowledged')}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-2.5 text-xs font-bold text-[var(--success)]"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAlert && (
        <AlertModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}