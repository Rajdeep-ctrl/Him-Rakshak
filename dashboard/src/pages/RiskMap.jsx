import React, { useState, useEffect } from 'react';
import LandslideMap from '../components/map/LandslideMap';
import { getRiskZones } from '../services/api';
import { Search, Filter, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RiskMapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const { t } = useLanguage();

  // Load locations from service (handles both MOCK & LIVE API persistent mode)
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await getRiskZones();
      setLocations(data || []);
    } catch (err) {
      console.error('Failed to load risk zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchLocations();

    // Listen for mode changes triggered from Topbar
    const handleModeChange = () => {
      fetchLocations();
    };

    window.addEventListener('dataModeChanged', handleModeChange);
    return () => {
      window.removeEventListener('dataModeChanged', handleModeChange);
    };
  }, []);

  // Real-time Filtering based on Search Input & Selected Risk Level
  const filteredLocations = locations.filter((item) => {
    const matchesSearch =
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.district && item.district.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.state && item.state.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRisk =
      filterRisk === 'ALL' ||
      (item.riskLevel && item.riskLevel.toUpperCase() === filterRisk.toUpperCase());

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="flex h-[calc(100vh-88px)] flex-col gap-4 p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-lg font-black tracking-[0.06em] text-[var(--text)]">{t('riskMap')}</h1>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">Search and filter active risk sectors across the North East region</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search district, state, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] py-2.5 pl-9 pr-4 text-xs text-[var(--text)]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] px-3 py-2 text-xs font-semibold text-[var(--text)]">
            <Filter className="h-3.5 w-3.5 text-[var(--muted)]" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="cursor-pointer bg-transparent pr-1 text-[var(--text)] focus:outline-none"
            >
              <option value="ALL">All Risks</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-card)]">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(245,241,234,0.72)] backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating map layers</span>
            </div>
          </div>
        )}
        <LandslideMap
          locations={filteredLocations}
          searchQuery={searchQuery}
          filterRisk={filterRisk}
        />
      </div>
    </div>
  );
}