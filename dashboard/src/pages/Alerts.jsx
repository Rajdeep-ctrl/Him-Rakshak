import React, { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import AlertModal from '../components/alerts/AlertModal';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Bell, Filter, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Alerts() {
  const { isLiveApi, addToast } = useDataMode();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);

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

  const filteredAlerts = alerts.filter(
    (a) => filterSeverity === 'ALL' || a.severity === filterSeverity
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-command-surface p-6 rounded-xl border border-command-border">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            Early Warning Incident Control Center
          </h1>
          <p className="text-xs text-command-muted mt-1">
            Real-time automated landslide risk triggers and field dispatch management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-command-muted" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-command-bg border border-command-border text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Severity Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Table / Cards */}
      {loading ? (
        <SkeletonLoader type="table" count={4} />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alt) => {
            const isCritical = alt.severity === 'CRITICAL';
            return (
              <div
                key={alt.id}
                className="bg-command-surface p-5 rounded-xl border border-command-border hover:border-slate-600 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-xs font-semibold text-cyan-400">{alt.id}</span>
                    <span className="text-[11px] text-command-muted">• {alt.timestamp}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">{alt.title}</h3>
                  <p className="text-xs text-command-muted">{alt.description}</p>
                  <p className="text-xs text-slate-300 font-medium pt-1">
                    Location: <span className="text-slate-100">{alt.district}, {alt.state}</span> | Rainfall: <span className="text-cyan-400">{alt.rainfall} mm</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedAlert(alt)}
                    className="px-4 py-2 bg-command-card hover:bg-slate-700 border border-command-border text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Inspect Details
                  </button>

                  <button
                    onClick={() => handleAction(alt.id, 'Acknowledged')}
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
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
