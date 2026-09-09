import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((_, i) => (
          <div
            key={i}
            className="h-28 bg-command-card/50 border border-command-border rounded-xl p-4 animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-1/2 bg-slate-700/50 rounded"></div>
            <div className="h-8 w-1/3 bg-slate-700/50 rounded"></div>
            <div className="h-3 w-2/3 bg-slate-700/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full bg-command-card/40 border border-command-border rounded-xl p-4 animate-pulse space-y-3">
        {items.map((_, i) => (
          <div key={i} className="h-10 bg-slate-800/40 rounded w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-command-card/50 border border-command-border rounded-xl animate-pulse"></div>
  );
}
