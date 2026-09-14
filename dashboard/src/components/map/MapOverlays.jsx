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
      {/* Left Control Panel: Weather Layer Selector */}
      <div className="absolute top-4 left-4 z-[1000] bg-command-surface/90 backdrop-blur-md border border-command-border rounded-xl p-3 shadow-xl w-48">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-command-border text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-cyan-400" />
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-command-muted hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Control Panel: Selected Location Details Card */}
      <div className="absolute top-4 right-4 z-[1000] bg-command-surface/90 backdrop-blur-md border border-command-border rounded-xl p-4 shadow-xl w-64 text-slate-100">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
          <MapPin className="w-4 h-4" />
          <span>Selected Location</span>
        </div>
        <div className="flex items-baseline justify-between border-b border-command-border pb-3 mb-3">
          <div>
            <h3 className="text-lg font-bold">{selectedCity.name}</h3>
            <p className="text-xs text-command-muted">{selectedCity.condition}</p>
          </div>
          <span className="text-2xl font-black text-cyan-300">{selectedCity.temp}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-command-bg p-2 rounded-lg border border-command-border">
            <p className="text-command-muted">Rain Chance</p>
            <p className="font-semibold text-slate-200 mt-0.5">{selectedCity.rainChance}</p>
          </div>
          <div className="bg-command-bg p-2 rounded-lg border border-command-border">
            <p className="text-command-muted">Humidity</p>
            <p className="font-semibold text-slate-200 mt-0.5">{selectedCity.humidity}</p>
          </div>
        </div>
      </div>
    </>
  );
}