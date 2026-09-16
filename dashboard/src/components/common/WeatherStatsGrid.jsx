import React from 'react';
import { Droplets, Wind, Eye, Gauge, Sun, Sunrise, Sunset } from 'lucide-react';

export default function WeatherStatsGrid() {
  const stats = [
    {
      title: 'Humidity',
      value: '64%',
      status: 'Comfortable',
      icon: Droplets,
      color: 'text-cyan-400',
    },
    {
      title: 'Wind Speed',
      value: '14 km/h',
      status: 'NW • Gusts up to 20 km/h',
      icon: Wind,
      color: 'text-blue-400',
    },
    {
      title: 'Visibility',
      value: '8 km',
      status: 'Good visibility',
      icon: Eye,
      color: 'text-emerald-400',
    },
    {
      title: 'Pressure',
      value: '1012 hPa',
      status: 'Normal atmospheric pressure',
      icon: Gauge,
      color: 'text-purple-400',
    },
    {
      title: 'UV Index',
      value: '6 of 11',
      status: 'High • Protection recommended',
      icon: Sun,
      color: 'text-amber-400',
    },
    {
      title: 'Sunrise & Sunset',
      value: '05:58 AM / 06:42 PM',
      status: '12h 44m daylight',
      icon: Sunrise,
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className="flex min-h-[140px] flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                {stat.title}
              </span>
              <IconComponent className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-black text-[var(--text)]">{stat.value}</p>
              <p className="mt-2 text-xs font-medium text-[var(--muted)]">{stat.status}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}