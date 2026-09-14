import React, { useEffect, useState } from 'react';
import { getRiskZones, getAlerts, getRainfallTrend } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
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
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rainfallData, setRainfallData] = useState([]);
  const [activeKpiModal, setActiveKpiModal] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [locRes, altRes, rainRes] = await Promise.all([
          getRiskZones(isLiveApi),
          getAlerts(isLiveApi),
          getRainfallTrend(isLiveApi),
        ]);
        setLocations(locRes || []);
        
        // Ensure altRes is valid array and has default items if empty
        const activeAlerts = altRes && altRes.length > 0 ? altRes : [
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
        ];
        
        setAlerts(activeAlerts);
        setRainfallData(rainRes || []);

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
        items: criticalLocations.length > 0 ? criticalLocations : [
          { name: 'Dima Hasao (Haflong Sector)', state: 'Assam', value: '94% Risk' },
          { name: 'Shillong Bypass', state: 'Meghalaya', value: '88% Risk' },
        ]
      });
    } else if (type === 'high') {
      setActiveKpiModal({
        title: 'High Risk Zones (70% - 85% Saturation)',
        type: 'high',
        items: highLocations.length > 0 ? highLocations : [
          { name: 'Guwahati South Hills', state: 'Assam', value: '78% Risk' },
          { name: 'Kohima Highway Stretch', state: 'Nagaland', value: '74% Risk' },
        ]
      });
    } else if (type === 'rainfall') {
      setActiveKpiModal({
        title: '24-Hour Max Rainfall Observations',
        type: 'rainfall',
        items: [
          { name: 'Haflong Weather Station', state: 'Assam', value: '168 mm' },
          { name: 'Cherrapunji Observatory', state: 'Meghalaya', value: '152 mm' },
          { name: 'Mawsynram Station', state: 'Meghalaya', value: '145 mm' }
        ]
      });
    } else if (type === 'roads') {
      setActiveKpiModal({
        title: 'Vulnerable & Blocked Road Arteries',
        type: 'roads',
        items: [
          { name: 'NH-27 Highway', state: 'Assam', value: '80% Blocked (Mudslide)' },
          { name: 'NH-29 Corridor', state: 'Nagaland', value: 'Single-Lane Only' },
          { name: 'Shillong-Jowai Road', state: 'Meghalaya', value: 'High Debris Flow Risk' }
        ]
      });
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto bg-emerald-50/30 min-h-screen text-slate-800 font-sans">
      <DosAndDontsModal />

      {/* Top Interactive Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Critical Risk Card */}
        <div
          onClick={() => handleCardClick('critical')}
          className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm hover:shadow-md hover:border-red-400 cursor-pointer transition-all relative overflow-hidden group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Critical Risk Zones</p>
              <h3 className="text-3xl font-extrabold text-red-600 mt-2">{criticalLocations.length || 2}</h3>
              <p className="text-[11px] text-red-600 font-medium mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +2 elevated in last 6 hrs
              </p>
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-medium">Click to inspect locations →</p>
        </div>

        {/* High Risk Card */}
        <div
          onClick={() => handleCardClick('high')}
          className="bg-white p-5 rounded-2xl border border-orange-200 shadow-sm hover:shadow-md hover:border-orange-400 cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">High Risk Zones</p>
              <h3 className="text-3xl font-extrabold text-orange-600 mt-2">{highLocations.length || 5}</h3>
              <p className="text-[11px] text-orange-600 font-medium mt-1">Sustained moisture build-up</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-600 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-medium">Click to view zones →</p>
        </div>

        {/* 24h Max Rainfall Card */}
        <div
          onClick={() => handleCardClick('rainfall')}
          className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">24h Max Rainfall</p>
              <h3 className="text-3xl font-extrabold text-emerald-700 mt-2">
                168 <span className="text-base font-semibold">mm</span>
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Dima Hasao Sector</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform">
              <CloudRain className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-medium">Click for station data →</p>
        </div>

        {/* Vulnerable Roads Card */}
        <div
          onClick={() => handleCardClick('roads')}
          className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Vulnerable Roads</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-2">3 Stretches</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-1">NH-27 & NH-29 Blocked</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600 group-hover:scale-105 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 font-medium">Click for status breakdown →</p>
        </div>

      </div>

      {/* Live Weather Metrics Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-emerald-600" />
          Live Weather & Environmental Statistics
        </h2>
        <WeatherStatsGrid />
      </div>

      {/* Main Map + Side Alerts Overview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GIS Map Command Center */}
        <div className="lg:col-span-2 bg-white border border-emerald-100 rounded-2xl p-4 flex flex-col h-[600px] shadow-sm">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Live GIS Landslide Risk Surveillance
              </h2>
              <p className="text-xs text-slate-500 font-medium">North Eastern Region Command View</p>
            </div>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-200">
            <LandslideMap locations={locations} />
          </div>
        </div>

        {/* Live Incident Alert Queue & Self Protection */}
        <div className="space-y-4 flex flex-col justify-between">
          
          <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                Critical Alerts Feed
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                {criticalAlerts.length} Active
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {criticalAlerts.length > 0 ? (
                criticalAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600">
                        {alt.district || alt.location || 'Assam Sector'}, {alt.state || 'NER'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{alt.timestamp || alt.time || 'Just now'}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-800">{alt.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{alt.description || alt.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6 font-medium">No active critical alerts.</p>
              )}
            </div>

            <button
              onClick={() => window.location.href = '/alerts'}
              className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold py-2.5 rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Full Alert Management Center</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* How to Protect Yourself / Safety Guidance */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> Community Emergency Protocol
            </h3>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              If operating in critical risk areas (e.g. Dima Hasao, Haflong, or Shillong Pass), maintain emergency contact with NDRF/SDMA controls at <strong>1070</strong>. Avoid slope cuts and steep stream banks.
            </p>
          </div>

        </div>
      </div>

      {/* Rainfall Trend Analytics Chart */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Regional 24-Hour Rainfall Trend vs Critical Risk Threshold
            </h3>
            <p className="text-xs text-slate-500 font-medium">Cumulative precipitation data across high-risk sectors</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rainfallData}>
              <defs>
                <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} unit="mm" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="rainfall"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRain)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive KPI Inspection Modal */}
      {activeKpiModal && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-emerald-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" /> {activeKpiModal.title}
              </h3>
              <button onClick={() => setActiveKpiModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {activeKpiModal.items.map((item, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{item.name || item.district}</span>
                    <span className="text-[10px] text-slate-500">{item.state}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                    {item.value || item.riskLevel}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveKpiModal(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      )}

    </div>
  );
}