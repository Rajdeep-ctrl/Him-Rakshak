import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import LocationDrawer from './LocationDrawer';

// Helper component to auto-pan map when search matches a location
function MapViewUpdater({ targetLocation }) {
  const map = useMap();
  useEffect(() => {
    if (targetLocation && targetLocation.lat && targetLocation.lng) {
      map.flyTo([targetLocation.lat, targetLocation.lng], 10, {
        duration: 1.5,
      });
    }
  }, [targetLocation, map]);
  return null;
}

// Map Click Listener to capture coordinates anywhere on the map
function MapClickListener({ onLocationClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationClick(lat, lng);
    },
  });
  return null;
}

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
  CLICKED: createCustomIcon('#06B6D4'), // Cyan pin for user-clicked spot
};

export default function LandslideMap({ locations = [], filterRisk = 'ALL', searchQuery = '' }) {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [clickedSpot, setClickedSpot] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Fetch live weather data from Open-Meteo REST API
  const fetchLiveWeather = async (lat, lng) => {
    setLoadingWeather(true);
    setWeatherData(null);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&relative_humidity_2m=true`
      );
      const data = await response.json();
      if (data && data.current_weather) {
        setWeatherData({
          temperature: data.current_weather.temperature,
          windSpeed: data.current_weather.windspeed,
          weatherCode: data.current_weather.weathercode,
        });
      }
    } catch (error) {
      console.error('Error fetching real-time weather:', error);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Handle map click anywhere
  const handleMapClick = (lat, lng) => {
    const newSpot = {
      district: 'Selected Spot',
      state: 'Custom Coordinates',
      riskLevel: 'LOW',
      lat,
      lng,
      rainfall24h: 0,
      aiConfidence: 0,
    };
    setClickedSpot(newSpot);
    fetchLiveWeather(lat, lng);
  };

  // Convert WMO weather codes into human-readable descriptions
  const parseWeatherCondition = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code >= 51 && code <= 67) return 'Light / Moderate Rain';
    if (code >= 80 && code <= 82) return 'Heavy Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
  };

  // Filter locations by risk level and search text
  const filteredLocations = locations.filter((loc) => {
    const matchesRisk = filterRisk === 'ALL' || loc.riskLevel === filterRisk;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      (loc.district && loc.district.toLowerCase().includes(query)) ||
      (loc.state && loc.state.toLowerCase().includes(query)) ||
      (loc.name && loc.name.toLowerCase().includes(query));

    return matchesRisk && matchesSearch;
  });

  const activeSearchTarget =
    searchQuery.trim() && filteredLocations.length > 0 ? filteredLocations[0] : null;

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-command-border shadow-2xl">
      {/* Leaflet Popup Style Override (Theme Matched) */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background-color: #0F172A !important;
          color: #F8FAFC !important;
          border: 1px solid #334155 !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5) !important;
        }
        .leaflet-popup-tip {
          background-color: #0F172A !important;
          border: 1px solid #334155 !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94A3B8 !important;
          padding: 8px 8px 0 0 !important;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #FFFFFF !important;
        }
      `}</style>

      <MapContainer
        center={[26.2006, 92.9376]}
        zoom={7}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewUpdater targetLocation={activeSearchTarget} />

        {/* Listens to clicks on blank areas of the map */}
        <MapClickListener onLocationClick={handleMapClick} />

        {/* User Clicked Custom Point Popup */}
        {clickedSpot && (
          <Marker
            position={[clickedSpot.lat, clickedSpot.lng]}
            icon={icons.CLICKED}
          >
            <Popup
              className="custom-popup"
              eventHandlers={{
                remove: () => setClickedSpot(null),
              }}
            >
              <div className="p-1 space-y-2 text-white min-w-[200px]">
                <div className="flex items-center justify-between gap-3 pr-4">
                  <span className="font-bold text-sm text-white">Custom Location</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/30 text-cyan-400 border border-cyan-500/40">
                    SELECTED
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Lat: {clickedSpot.lat.toFixed(4)}, Lng: {clickedSpot.lng.toFixed(4)}
                </p>

                {/* Real-time Weather Box */}
                <div className="text-xs space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    Live Weather Report
                  </p>
                  {loadingWeather ? (
                    <p className="text-slate-400 text-[11px] animate-pulse">Fetching weather...</p>
                  ) : weatherData ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Temperature:</span>
                        <span className="text-white font-bold">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Condition:</span>
                        <span className="text-cyan-300 font-semibold">
                          {parseWeatherCondition(weatherData.weatherCode)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wind Speed:</span>
                        <span className="text-slate-200 font-medium">{weatherData.windSpeed} km/h</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-[11px]">Weather info unavailable</p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedLocation(clickedSpot)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                >
                  Inspect Risk Factors
                </button>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing Risk Locations Markers */}
        {filteredLocations.map((loc) => (
          <Marker
            key={loc.id || loc.district}
            position={[loc.lat, loc.lng]}
            icon={icons[loc.riskLevel] || icons.MEDIUM}
            eventHandlers={{
              click: () => {
                setClickedSpot(null);
                fetchLiveWeather(loc.lat, loc.lng);
              },
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-2 text-white">
                <div className="flex items-center justify-between gap-3 pr-4">
                  <span className="font-bold text-sm text-white">{loc.district}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      loc.riskLevel === 'CRITICAL'
                        ? 'bg-red-500/30 text-red-400 border border-red-500/40'
                        : loc.riskLevel === 'HIGH'
                        ? 'bg-orange-500/30 text-orange-400 border border-orange-500/40'
                        : loc.riskLevel === 'MEDIUM'
                        ? 'bg-amber-500/30 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {loc.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{loc.state}</p>

                {/* Real-time Weather Box */}
                <div className="text-xs space-y-1 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                    Live Weather Report
                  </p>
                  {loadingWeather ? (
                    <p className="text-slate-400 text-[11px] animate-pulse">Fetching current weather...</p>
                  ) : weatherData ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Temperature:</span>
                        <span className="text-white font-bold">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Condition:</span>
                        <span className="text-cyan-300 font-semibold">
                          {parseWeatherCondition(weatherData.weatherCode)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Wind Speed:</span>
                        <span className="text-slate-200 font-medium">{weatherData.windSpeed} km/h</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-400 text-[11px]">Click pin to load live weather</p>
                  )}
                </div>

                {/* Risk and Precipitation Parameters */}
                <div className="text-xs text-slate-300 space-y-1 bg-slate-800/40 p-2 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rainfall (24h):</span>
                    <span className="text-cyan-400 font-semibold">{loc.rainfall24h || loc.rain || 0} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AI Risk Score:</span>
                    <span className="text-emerald-400 font-semibold">{loc.aiConfidence || 90}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(loc)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
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