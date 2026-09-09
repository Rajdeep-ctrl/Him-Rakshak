import React, { useState, useEffect } from 'react';
import { getRoads } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Truck, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export default function Roads() {
  const { isLiveApi } = useDataMode();
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadRoads() {
      setLoading(true);
      try {
        const res = await getRoads(isLiveApi);
        setRoads(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRoads();
  }, [isLiveApi]);

  const filteredRoads = roads.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.stretch.toLowerCase().includes(search.toLowerCase()) ||
    r.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-command-surface p-6 rounded-xl border border-command-border">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            Critical Highway & Road Arteries Monitoring
          </h1>
          <p className="text-xs text-command-muted mt-1">
            Status of vital transport corridors across North Eastern hill states
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-command-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Road or Corridor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-command-bg border border-command-border rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoads.map((rd) => {
            const isBlocked = rd.status === 'BLOCKED';
            const isAtRisk = rd.status === 'AT RISK' || rd.status === 'PARTIALLY BLOCKED';

            return (
              <div
                key={rd.id}
                className="bg-command-surface p-5 rounded-xl border border-command-border flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBlocked
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isAtRisk
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {rd.status}
                    </span>
                    <span className="text-[11px] text-command-muted">{rd.lastUpdate}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{rd.name}</h3>
                  <p className="text-xs text-cyan-400 font-medium">{rd.stretch}</p>
                  <p className="text-xs text-command-muted mt-1">{rd.state}</p>

                  <div className="mt-3 p-3 bg-command-bg rounded-lg border border-command-border text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Cause / Condition:</span> {rd.cause}
                  </div>
                </div>

                <div className="pt-2 border-t border-command-border flex items-center justify-between text-xs">
                  <span className="text-command-muted">Risk Profile:</span>
                  <span className="font-bold text-slate-200">{rd.riskLevel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
