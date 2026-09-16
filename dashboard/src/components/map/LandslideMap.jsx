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
    <div className="relative h-full min-h-[500px] w-full overflow-hidden rounded-[20px]">
      <style>{`
        .leaflet-popup-content-wrapper {
          background-color: #fffdf9 !important;
          color: #201d1a !important;
          border: 1px solid #e4ddd3 !important;
          border-radius: 1rem !important;
          box-shadow: 0 18px 42px rgba(32,29,26,0.08) !important;
        }
        .leaflet-popup-tip {
          background-color: #fffdf9 !important;
          border: 1px solid #e4ddd3 !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #6d645d !important;
          padding: 8px 8px 0 0 !important;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: #201d1a !important;
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
              <div className="min-w-[200px] space-y-2 p-1 text-[var(--text)]">
                <div className="flex items-center justify-between gap-3 pr-4">
                  <span className="text-sm font-black text-[var(--text)]">Custom Location</span>
                  <span className="rounded border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                    Selected
                  </span>
                </div>
                <p className="font-mono text-xs text-[var(--muted)]">
                  Lat: {clickedSpot.lat.toFixed(4)}, Lng: {clickedSpot.lng.toFixed(4)}
                </p>

                <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2.5 text-xs">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                    Live Weather Report
                  </p>
                  {loadingWeather ? (
                    <p className="animate-pulse text-[11px] text-[var(--muted)]">Fetching weather...</p>
                  ) : weatherData ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Temperature:</span>
                        <span className="font-black text-[var(--text)]">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Condition:</span>
                        <span className="font-semibold text-[var(--accent)]">{parseWeatherCondition(weatherData.weatherCode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Wind Speed:</span>
                        <span className="font-medium text-[var(--text)]">{weatherData.windSpeed} km/h</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-[var(--muted)]">Weather info unavailable</p>
                  )}
                </div>

                <button
                  onClick={() => setSelectedLocation(clickedSpot)}
                  className="mt-2 w-full rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--accent-2)]"
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
              <div className="space-y-2 p-1 text-[var(--text)]">
                <div className="flex items-center justify-between gap-3 pr-4">
                  <span className="text-sm font-black text-[var(--text)]">{loc.district}</span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                      loc.riskLevel === 'CRITICAL'
                        ? 'border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]'
                        : loc.riskLevel === 'HIGH'
                          ? 'border-[var(--warning)]/20 bg-[var(--warning-soft)] text-[var(--warning)]'
                          : loc.riskLevel === 'MEDIUM'
                            ? 'border-[var(--amber)]/20 bg-[var(--amber-soft)] text-[var(--amber)]'
                            : 'border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]'
                    }`}
                  >
                    {loc.riskLevel}
                  </span>
                </div>
                <p className="text-xs font-medium text-[var(--muted)]">{loc.state}</p>

                <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2.5 text-xs">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                    Live Weather Report
                  </p>
                  {loadingWeather ? (
                    <p className="animate-pulse text-[11px] text-[var(--muted)]">Fetching current weather...</p>
                  ) : weatherData ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Temperature:</span>
                        <span className="font-black text-[var(--text)]">{weatherData.temperature}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Condition:</span>
                        <span className="font-semibold text-[var(--accent)]">{parseWeatherCondition(weatherData.weatherCode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--muted)]">Wind Speed:</span>
                        <span className="font-medium text-[var(--text)]">{weatherData.windSpeed} km/h</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-[11px] text-[var(--muted)]">Click pin to load live weather</p>
                  )}
                </div>

                <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--panel-alt)] p-2 text-xs text-[var(--muted)]">
                  <div className="flex justify-between">
                    <span>Rainfall (24h):</span>
                    <span className="font-black text-[var(--accent)]">{loc.rainfall24h || loc.rain || 0} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Risk Score:</span>
                    <span className="font-black text-[var(--success)]">{loc.aiConfidence || 90}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLocation(loc)}
                  className="mt-2 w-full rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--accent-2)]"
                >
                  Inspect Risk Factors
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 rounded-[18px] border border-[var(--border)] bg-[var(--panel)]/90 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur-md">
        <p className="mb-1 border-b border-[var(--border)] pb-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--text)]">
          Landslide Risk Level
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
            <span className="text-[var(--muted)]">Critical Risk (&gt;85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--warning)]" />
            <span className="text-[var(--muted)]">High Risk (70-85%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--amber)]" />
            <span className="text-[var(--muted)]">Medium Risk (50-70%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
            <span className="text-[var(--muted)]">Low Risk (&lt;50%)</span>
          </div>
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