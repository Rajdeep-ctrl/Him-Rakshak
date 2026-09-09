import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import LocationDrawer from './LocationDrawer';

// Custom DivIcons for Map Markers
const createCustomIcon = (color) =>
  L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      background-color: ${color};
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 3px solid #0B0F17;
      box-shadow: 0 0 12px ${color};
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const icons = {
  CRITICAL: createCustomIcon('#EF4444'),
  HIGH: createCustomIcon('#F97316'),
  MEDIUM: createCustomIcon('#F59E0B'),
  LOW: createCustomIcon('#10B981'),
};

export default function LandslideMap({ locations = [], filterRisk = 'ALL' }) {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const filteredLocations = locations.filter(
    (loc) => filterRisk === 'ALL' || loc.riskLevel === filterRisk
  );

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-command-border shadow-2xl">
      <MapContainer
        center={[26.2006, 92.9376]} // Centered on North East India
        zoom={7}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=cb1_30ob_1_108ba0f83fb72328bfd96782"
        />

        {filteredLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={icons[loc.riskLevel] || icons.MEDIUM}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-white">{loc.district}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      loc.riskLevel === 'CRITICAL'
                        ? 'bg-red-500/30 text-red-300'
                        : 'bg-amber-500/30 text-amber-300'
                    }`}
                  >
                    {loc.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{loc.state}</p>
                <div className="text-xs text-command-muted space-y-0.5">
                  <div>Rainfall: <span className="text-cyan-400 font-semibold">{loc.rainfall24h} mm</span></div>
                  <div>AI Confidence: <span className="text-emerald-400 font-semibold">{loc.aiConfidence}%</span></div>
                </div>
                <button
                  onClick={() => setSelectedLocation(loc)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1.5 rounded transition-colors"
                >
                  Inspect Risk Factors
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-command-surface/90 backdrop-blur-md p-3 rounded-lg border border-command-border text-xs space-y-1.5 shadow-xl">
        <p className="font-bold text-slate-200 mb-1 border-b border-command-border pb-1">
          Landslide Risk Level
        </p>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
          <span className="text-command-muted">Critical Risk (&gt;85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span className="text-command-muted">High Risk (70-85%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
          <span className="text-command-muted">Medium Risk (50-70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-command-muted">Low Risk (&lt;50%)</span>
        </div>
      </div>

      {/* Side Detail Drawer */}
      <LocationDrawer
        location={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
    </div>
  );
}
