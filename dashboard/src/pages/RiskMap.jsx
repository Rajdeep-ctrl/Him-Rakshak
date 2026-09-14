import React, { useState, useEffect } from 'react';
import LandslideMap from '../components/map/LandslideMap';
import { getRiskZones } from '../services/api';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function RiskMapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');

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
    <div className="p-4 space-y-4 h-[calc(100vh-80px)] flex flex-col bg-slate-950">
      {/* Top Action Bar with Search & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white">GIS Landslide Surveillance Map</h1>
          <p className="text-xs text-slate-400">Search and filter active risk sectors across NER</p>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search district, state, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-800 text-white text-xs rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500 w-64"
            />
          </div>

          {/* RISK FILTER */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-slate-900">All Risks</option>
              <option value="CRITICAL" className="bg-slate-900">Critical</option>
              <option value="HIGH" className="bg-slate-900">High</option>
              <option value="MEDIUM" className="bg-slate-900">Medium</option>
              <option value="LOW" className="bg-slate-900">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800">
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating Map Layers...</span>
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