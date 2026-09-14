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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className="bg-command-surface/80 border border-command-border rounded-xl p-4 flex flex-col justify-between hover:border-cyan-500/40 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-command-muted uppercase tracking-wider">
                {stat.title}
              </span>
              <IconComponent className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
              <p className="text-xs text-command-muted mt-1">{stat.status}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}