import React, { useState, useEffect } from 'react';
import { getRoads } from '../services/api';
import { useDataMode } from '../context/DataModeContext';
import { useLanguage } from '../context/LanguageContext';
import SkeletonLoader from '../components/common/SkeletonLoader';
import { Truck, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export default function Roads() {
  const { isLiveApi } = useDataMode();
  const { t } = useLanguage();
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
    <div className="mx-auto max-w-[1600px] space-y-6 p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-black tracking-[0.06em] text-[var(--text)]">
            <Truck className="h-5 w-5 text-[var(--amber)]" />
            {t('highwayMonitoring')}
          </h1>
          <p className="mt-2 text-xs font-medium text-[var(--muted)]">
            Status of vital transport corridors across the North Eastern hill states
          </p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
            isLiveApi
              ? 'border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]'
              : 'border-[var(--border)] bg-[var(--panel-alt)] text-[var(--muted)]'
          }`}>
            {isLiveApi ? 'Live API' : 'Mock data'}
          </span>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search Road or Corridor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] py-2.5 pl-9 pr-4 text-xs text-[var(--text)]"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRoads.map((rd) => {
            const isBlocked = rd.status === 'BLOCKED';
            const isAtRisk = rd.status === 'AT RISK' || rd.status === 'PARTIALLY BLOCKED';

            return (
              <div
                key={rd.id}
                className="flex flex-col justify-between space-y-4 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow-card)]"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                        isBlocked
                          ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
                          : isAtRisk
                            ? 'border-[var(--amber)]/20 bg-[var(--amber-soft)] text-[var(--amber)]'
                            : 'border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]'
                      }`}
                    >
                      {rd.status}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--muted)]">{rd.lastUpdate}</span>
                  </div>

                  <h3 className="text-lg font-black text-[var(--text)]">{rd.name}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{rd.stretch}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{rd.state}</p>

                  <div className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--panel-alt)] p-3 text-xs leading-5 text-[var(--muted)]">
                    <span className="font-bold text-[var(--text)]">Cause / Condition:</span> {rd.cause}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
                  <span className="text-[var(--muted)]">Risk Profile:</span>
                  <span className="font-black text-[var(--text)]">{rd.riskLevel}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
