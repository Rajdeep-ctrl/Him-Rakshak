import React, { useEffect, useState } from 'react';
import { getRiskZones, getAlerts, getRainfallTrend, getRoads } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import { useLanguage } from '../context/LanguageContext';
import LandslideMap from '../components/map/LandslideMap';
import DosAndDontsModal from '../components/common/DosAndDontsModal';
import SkeletonLoader from '../components/common/SkeletonLoader';
import WeatherStatsGrid from '../components/common/WeatherStatsGrid';
import { playAlertSound } from '../utils/audioAlert';
import {
  AlertTriangle,
  ShieldAlert,
  CloudRain,
  Truck,
  Activity,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  X,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { isLiveApi } = useDataMode();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rainfallData, setRainfallData] = useState([]);
  const [roads, setRoads] = useState([]);
  const [activeKpiModal, setActiveKpiModal] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [locRes, altRes, rainRes, roadsRes] = await Promise.all([
          getRiskZones(isLiveApi),
          getAlerts(isLiveApi),
          getRainfallTrend(isLiveApi),
          getRoads(isLiveApi),
        ]);
        setLocations(locRes || []);
        
        // Keep live alert feeds empty when the API has no active alerts.
        const activeAlerts = altRes && altRes.length > 0 ? altRes : (isLiveApi ? [] : [
          {
            id: 'ALT-2026-091',
            title: 'Impending Mudslide Hazard — NH-27 Corridor',
            district: 'Dima Hasao',
            state: 'Assam',
            severity: 'CRITICAL',
            timestamp: '10 minutes ago',
            description: 'Multi-sensor analysis indicates accelerated soil creep near km-42.',
          },
          {
            id: 'ALT-2026-088',
            title: 'Pagla Pahar Subsidence Triggered',
            district: 'Kohima',
            state: 'Nagaland',
            severity: 'CRITICAL',
            timestamp: '28 minutes ago',
            description: 'Rapid increase in pore water pressure detected. Slope velocity 4.2 mm/hr.',
          },
        ]);
        
        setAlerts(activeAlerts);
        setRainfallData(rainRes || []);
        setRoads(roadsRes || []);

        if ((locRes && locRes.some((l) => l.riskLevel === 'CRITICAL')) || activeAlerts.length > 0) {
          playAlertSound();
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [isLiveApi]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-emerald-50/30 min-h-screen">
        <SkeletonLoader type="card" count={4} />
        <SkeletonLoader type="map" />
      </div>
    );
  }

  const criticalLocations = locations.filter((l) => l.riskLevel === 'CRITICAL');
  const highLocations = locations.filter((l) => l.riskLevel === 'HIGH');
  const vulnerableRoads = roads.filter((road) => road.status !== 'OPEN');
  const rainfallObservations = [...locations]
    .map((location) => ({
      ...location,
      rainfall24h: Number(location.rainfall24h ?? location.rainfall_24h_mm ?? location.rainfall_mm ?? location.rainfall),
    }))
    .filter((location) => Number.isFinite(location.rainfall24h))
    .sort((left, right) => right.rainfall24h - left.rainfall24h)
    .slice(0, 3);
  const trendMaximum = [...rainfallData]
    .map((item) => Number(item.rainfall ?? item.rainfall_24h_mm))
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0];
  const maxRainfallLocation = rainfallObservations[0];
  const maxRainfallValue = maxRainfallLocation?.rainfall24h ?? trendMaximum ?? 0;

  // Case-insensitive filtering for Critical alerts in the feed
  const criticalAlerts = alerts.filter(
    (alt) => !alt.severity || alt.severity.toUpperCase() === 'CRITICAL'
  );

  // KPI Modal handlers
  const handleCardClick = (type) => {
    if (type === 'critical') {
      setActiveKpiModal({
        title: 'Critical Risk Zones (>85% Soil Saturation)',
        type: 'critical',
        items: criticalLocations
      });
    } else if (type === 'high') {
      setActiveKpiModal({
        title: 'High Risk Zones (70% - 85% Saturation)',
        type: 'high',
        items: highLocations
      });
    } else if (type === 'rainfall') {
      setActiveKpiModal({
        title: '24-Hour Max Rainfall Observations',
        type: 'rainfall',
        items: rainfallObservations.map((location) => ({
          ...location,
          name: location.district || 'Regional observation',
          value: `${location.rainfall24h} mm`,
        }))
      });
    } else if (type === 'roads') {
      setActiveKpiModal({
        title: 'Vulnerable & Blocked Road Arteries',
        type: 'roads',
        items: roads,
      });
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-1 sm:p-2">
      <DosAndDontsModal />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          onClick={() => handleCardClick('critical')}
          className="group cursor-pointer overflow-hidden rounded-[26px] border border-[var(--danger)]/15 bg-[var(--panel)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{t('criticalZones')}</p>
              <h3 className="mt-3 text-3xl font-black text-[var(--danger)]">{criticalLocations.length}</h3>
              <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--danger)]">
                <ArrowUpRight className="h-3 w-3" /> +2 elevated in last 6 hrs
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-[var(--danger)] transition group-hover:scale-105">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Inspect locations →</p>
        </div>

        <div
          onClick={() => handleCardClick('high')}
          className="group cursor-pointer overflow-hidden rounded-[26px] border border-[var(--warning)]/15 bg-[var(--panel)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{t('highRiskZones')}</p>
              <h3 className="mt-3 text-3xl font-black text-[var(--warning)]">{highLocations.length}</h3>
              <p className="mt-2 text-[11px] font-semibold text-[var(--warning)]">Sustained moisture build-up</p>
            </div>
            <div className="rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning-soft)] p-3 text-[var(--warning)] transition group-hover:scale-105">
              <ShieldAlert className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">View zones →</p>
        </div>

        <div
          onClick={() => handleCardClick('rainfall')}
          className="group cursor-pointer overflow-hidden rounded-[26px] border border-[var(--success)]/15 bg-[var(--panel)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{t('rainfall24h')}</p>
              <h3 className="mt-3 text-3xl font-black text-[var(--accent)]">
                {maxRainfallValue} <span className="text-base font-bold">mm</span>
              </h3>
              <p className="mt-2 text-[11px] font-semibold text-[var(--success)]">
                {maxRainfallLocation?.district || (trendMaximum != null ? 'Regional observation' : 'No live observation')}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-3 text-[var(--success)] transition group-hover:scale-105">
              <CloudRain className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Station data →</p>
        </div>

        <div
          onClick={() => handleCardClick('roads')}
          className="group cursor-pointer overflow-hidden rounded-[26px] border border-[var(--amber)]/15 bg-[var(--panel)] p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{t('vulnerableRoads')}</p>
              <h3 className="mt-3 text-3xl font-black text-[var(--amber)]">{vulnerableRoads.length} Stretches</h3>
              <p className="mt-2 text-[11px] font-semibold text-[var(--amber)]">
                {vulnerableRoads.length > 0 ? `${vulnerableRoads.length} ${t('requireAttention')}` : t('allCorridorsOpen')}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--amber)]/20 bg-[var(--amber-soft)] p-3 text-[var(--amber)] transition group-hover:scale-105">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Status breakdown →</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">
          <CloudRain className="h-4 w-4 text-[var(--success)]" />
          {t('liveWeatherStats')}
        </h2>
        <WeatherStatsGrid />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex h-[600px] flex-col rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-3 px-2">
            <h2 className="flex items-center gap-2 text-base font-black tracking-[0.06em] text-[var(--text)]">
              <Activity className="h-4 w-4 text-[var(--success)]" />
              {t('liveGisSurveillance')}
            </h2>
            <p className="mt-1 text-xs font-medium text-[var(--muted)]">{t('regionalCommandView')}</p>
          </div>
          <div className="flex-1 overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--panel-alt)]">
            <LandslideMap locations={locations} />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[var(--text)]">
                <ShieldAlert className="h-4 w-4 text-[var(--danger)]" />
                {t('criticalAlertFeed')}
              </h2>
              <span className="rounded-full border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--danger)]">
                {criticalAlerts.length} Active
              </span>
            </div>

            <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="space-y-1 rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3.5 transition hover:border-[var(--accent)]/20"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[var(--danger)]">
                        {alt.district || alt.location || 'Assam Sector'}, {alt.state || 'NER'}
                      </span>
                      <span className="text-[10px] font-medium text-[var(--muted)]">{alt.timestamp || alt.time || 'Just now'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text)]">{alt.title}</h4>
                    <p className="text-[11px] leading-5 text-[var(--muted)]">{alt.description || alt.summary}</p>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs font-medium text-[var(--muted)]">No active critical alerts.</p>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/alerts'}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[var(--success)] transition hover:border-[var(--success)]/30"
            >
              <span>Alert management center</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[28px] border border-[var(--success)]/20 bg-[var(--success-soft)] p-4 shadow-[var(--shadow-card)]">
            <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--success)]">
              <ShieldCheck className="h-4 w-4" /> Community Emergency Protocol
            </h3>
            <p className="mt-2 text-[11px] leading-5 text-[var(--text)]">
              If operating in critical risk areas, maintain emergency contact with NDRF/SDMA controls at <strong>1070</strong>. Avoid slope cuts and steep stream banks.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-base font-black tracking-[0.06em] text-[var(--text)]">
            <TrendingUp className="h-4 w-4 text-[var(--success)]" />
            {t('rainfallTrend')}
          </h3>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">Cumulative precipitation data across high-risk sectors</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rainfallData}>
              <defs>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2c5c4d" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2c5c4d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#726961" fontSize={12} />
              <YAxis stroke="#726961" fontSize={12} unit="mm" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fffdf9', borderColor: '#e4ddd3', borderRadius: '14px', color: '#201d1a', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="rainfall"
                stroke="#2c5c4d"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {activeKpiModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#201d1a]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-[var(--text)]">
                <Info className="h-4 w-4 text-[var(--success)]" /> {activeKpiModal.title}
              </h3>
              <button onClick={() => setActiveKpiModal(null)} className="text-[var(--muted)] hover:text-[var(--text)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
              {activeKpiModal.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between rounded-[18px] border border-[var(--border)] bg-[var(--panel-alt)] p-3 text-xs">
                  <div>
                    <span className="block font-black text-[var(--text)]">{item.name || item.district}</span>
                    <span className="text-[10px] text-[var(--muted)]">{item.state}</span>
                  </div>
                  <span className="rounded-xl bg-[var(--success-soft)] px-2.5 py-1 font-black text-[var(--success)]">
                    {item.value || item.riskLevel}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveKpiModal(null)}
              className="w-full rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition hover:bg-[var(--accent-2)]"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}