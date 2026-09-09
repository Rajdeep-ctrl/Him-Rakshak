import React, { useState, useEffect } from 'react';
import { getRiskZones } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import LandslideMap from '../components/map/LandslideMap';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Filter, Search } from 'lucide-react';

export default function RiskMap() {
  const { isLiveApi } = useDataMode();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getRiskZones(isLiveApi);
        setLocations(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isLiveApi]);

  const searchedLocations = locations.filter((loc) =>
    loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-4 max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Search & Filter Top Bar */}
      <div className="bg-command-surface p-4 rounded-xl border border-command-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-command-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search District or State (e.g. Dima Hasao, Assam)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-command-bg border border-command-border rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-command-muted" />
          <span className="text-xs text-command-muted font-medium">Risk Severity:</span>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-command-bg border border-command-border text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>
        </div>
      </div>

      {/* Map Window */}
      <div className="flex-1 w-full relative">
        {loading ? (
          <SkeletonLoader type="map" />
        ) : (
          <LandslideMap locations={searchedLocations} filterRisk={filterRisk} />
        )}
      </div>
    </div>
  );
}
