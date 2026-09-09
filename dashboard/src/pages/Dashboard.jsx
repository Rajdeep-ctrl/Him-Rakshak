import React, { useEffect, useState } from 'react';
import { getRiskZones, getAlerts, getRainfallTrend } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import LandslideMap from '../components/map/LandslideMap';
import DosAndDontsModal from '../components/common/DosAndDontsModal';
import SkeletonLoader from '../components/common/SkeletonLoader';
import {
  AlertTriangle,
  ShieldAlert,
  CloudRain,
  Truck,
  Activity,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
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
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rainfallData, setRainfallData] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [locRes, altRes, rainRes] = await Promise.all([
          getRiskZones(isLiveApi),
          getAlerts(isLiveApi),
          getRainfallTrend(isLiveApi),
        ]);
        setLocations(locRes);
        setAlerts(altRes);
        setRainfallData(rainRes);
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
      <div className="p-6 space-y-6">
        <SkeletonLoader type="card" count={3} />
        <SkeletonLoader type="map" />
      </div>
    );
  }

  const criticalCount = locations.filter((l) => l.riskLevel === 'CRITICAL').length;
  const highCount = locations.filter((l) => l.riskLevel === 'HIGH').length;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <DosAndDontsModal />
      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-command-surface p-5 rounded-xl border border-command-border shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-command-muted">Critical Risk Zones</p>
              <h3 className="text-3xl font-extrabold text-red-400 mt-2">{criticalCount}</h3>
              <p className="text-[11px] text-red-300/80 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-red-400" /> +2 elevated in last 6 hrs
              </p>
            </div>
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-command-surface p-5 rounded-xl border border-command-border shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-command-muted">High Risk Zones</p>
              <h3 className="text-3xl font-extrabold text-orange-400 mt-2">{highCount}</h3>
              <p className="text-[11px] text-command-muted mt-1">Sustained moisture build-up</p>
            </div>
            <div className="p-3 bg-orange-950/40 border border-orange-500/30 rounded-xl text-orange-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-command-surface p-5 rounded-xl border border-command-border shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-command-muted">24h Max Rainfall</p>
              <h3 className="text-3xl font-extrabold text-cyan-300 mt-2">168 <span className="text-base font-normal">mm</span></h3>
              <p className="text-[11px] text-cyan-400/80 mt-1">Dima Hasao Sector</p>
            </div>
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-400">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-command-surface p-5 rounded-xl border border-command-border shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-command-muted">Vulnerable Roads</p>
              <h3 className="text-3xl font-extrabold text-amber-400 mt-2">3 Stretches</h3>
              <p className="text-[11px] text-amber-300/80 mt-1">NH-27 & NH-29 Blocked</p>
            </div>
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-400">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Map + Side Alerts Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GIS Map Command Center */}
        <div className="lg:col-span-2 bg-command-surface border border-command-border rounded-xl p-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live GIS Landslide Risk Surveillance
              </h2>
              <p className="text-xs text-command-muted">North Eastern Region Command View</p>
            </div>
          </div>
          <div className="flex-1">
            <LandslideMap locations={locations} />
          </div>
        </div>

        {/* Live Incident Alert Queue */}
        <div className="bg-command-surface border border-command-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-command-border pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Critical Alerts Feed
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {alerts.length} Active
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
              {alerts.map((alt) => (
                <div
                  key={alt.id}
                  className="p-3.5 rounded-lg bg-command-card border border-command-border hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-red-400">{alt.district}, {alt.state}</span>
                    <span className="text-[10px] text-command-muted">{alt.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100">{alt.title}</h4>
                  <p className="text-[11px] text-command-muted mt-1 line-clamp-2">{alt.description}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/alerts'}
            className="w-full mt-4 bg-command-bg hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2.5 rounded-lg border border-command-border transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Full Alert Management Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rainfall Trend Analytics Chart */}
      <div className="bg-command-surface border border-command-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Regional 24-Hour Rainfall Trend vs Critical Risk Threshold
            </h3>
            <p className="text-xs text-command-muted">Cumulative precipitation data across high-risk sectors</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rainfallData}>
              <defs>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#8A99AD" fontSize={12} />
              <YAxis stroke="#8A99AD" fontSize={12} unit="mm" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1A2333', borderColor: '#2A364F', color: '#E2E8F0' }}
              />
              <Area
                type="monotone"
                dataKey="rainfall"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
