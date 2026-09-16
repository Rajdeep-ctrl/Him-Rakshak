import React, { useState } from 'react';
import { Layers, MapPin, CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';

export default function MapOverlays({ activeLayer, setActiveLayer }) {
  const [selectedCity] = useState({
    name: 'Shillong',
    temp: '22°C',
    condition: 'Heavy Rainfall Zone',
    rainChance: '85%',
    humidity: '78%',
  });

  const layers = [
    { id: 'temp', label: 'Temperature', icon: Thermometer },
    { id: 'rain', label: 'Rainfall', icon: CloudRain },
    { id: 'wind', label: 'Wind', icon: Wind },
    { id: 'humidity', label: 'Humidity', icon: Droplets },
  ];

  return (
    <>
      <div className="absolute left-4 top-4 z-[1000] w-48 rounded-[20px] border border-[var(--border)] bg-[var(--panel)]/90 p-3 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2 border-b border-[var(--border)] pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--text)]">
          <Layers className="h-4 w-4 text-[var(--accent)]" />
          <span>Weather Layers</span>
        </div>
        <div className="space-y-1">
          {layers.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--muted)] hover:bg-[var(--panel-alt)] hover:text-[var(--text)]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="absolute right-4 top-4 z-[1000] w-64 rounded-[20px] border border-[var(--border)] bg-[var(--panel)]/90 p-4 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
          <MapPin className="h-4 w-4" />
          <span>Selected Location</span>
        </div>
        <div className="mb-3 flex items-baseline justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h3 className="text-lg font-black text-[var(--text)]">{selectedCity.name}</h3>
            <p className="text-xs text-[var(--muted)]">{selectedCity.condition}</p>
          </div>
          <span className="text-2xl font-black text-[var(--accent)]">{selectedCity.temp}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2">
            <p className="text-[var(--muted)]">Rain Chance</p>
            <p className="mt-0.5 font-black text-[var(--text)]">{selectedCity.rainChance}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2">
            <p className="text-[var(--muted)]">Humidity</p>
            <p className="mt-0.5 font-black text-[var(--text)]">{selectedCity.humidity}</p>
          </div>
        </div>
      </div>
    </>
  );
}