import React from 'react';

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex h-28 animate-pulse flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4"
          >
            <div className="h-4 w-1/2 rounded-full bg-[var(--panel-alt)]" />
            <div className="h-8 w-1/3 rounded-full bg-[var(--panel-alt)]" />
            <div className="h-3 w-2/3 rounded-full bg-[var(--panel-alt)]" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full animate-pulse space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4">
        {items.map((_, i) => (
          <div key={i} className="h-12 w-full rounded-2xl bg-[var(--panel-alt)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-64 w-full animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--panel)]" />
  );
}
