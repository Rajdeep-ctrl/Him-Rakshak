import {
  MOCK_RISK_ZONES,
  MOCK_ALERTS,
  MOCK_ROADS,
  MOCK_REPORTS,
  MOCK_RAINFALL_TREND,
  MOCK_ANALYTICS_STATE_RISK,
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper to get persistent mode selection (Defaults to LIVE if not set)
const isLiveApiSelected = () => {
  const savedMode = localStorage.getItem('app_data_mode');
  return savedMode ? savedMode === 'LIVE' : true;
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clampPercent = (value) => Math.round(Math.min(Math.max(toNumber(value), 0), 100));

const normaliseRiskZone = (item) => ({
  ...item,
  id: item.id ?? `${item.latitude ?? item.lat}-${item.longitude ?? item.lng}`,
  lat: toNumber(item.lat ?? item.latitude),
  lng: toNumber(item.lng ?? item.longitude),
  latitude: toNumber(item.latitude ?? item.lat),
  longitude: toNumber(item.longitude ?? item.lng),
  riskLevel: String(item.riskLevel ?? item.risk_level ?? 'LOW').toUpperCase(),
  aiConfidence: clampPercent(item.aiConfidence ?? (item.confidence != null ? item.confidence * 100 : String(item.riskLevel ?? item.risk_level).toUpperCase() === 'HIGH' ? 75 : 25)),
  rainfall24h: toNumber(item.rainfall24h ?? item.rainfall_24h_mm ?? item.rainfall_mm),
  slope: toNumber(item.slope ?? item.slope_deg),
  soilSaturation: toNumber(item.soilSaturation ?? (item.soil_moisture_index != null ? item.soil_moisture_index * 100 : item.soil_moisture_mm * 100)),
  historicalLandslides: toNumber(item.historicalLandslides ?? item.historical_landslide_count),
  features: item.features ?? [
    { name: '24h Rainfall Intensity', weight: clampPercent(toNumber(item.rainfall24h ?? item.rainfall_24h_mm ?? item.rainfall_mm) / 2) },
    { name: 'Terrain Slope Angle', weight: clampPercent(toNumber(item.slope ?? item.slope_deg) * 2.5) },
    { name: 'Soil Saturation Index', weight: clampPercent(toNumber(item.soilSaturation ?? (item.soil_moisture_index != null ? item.soil_moisture_index * 100 : item.soil_moisture_mm * 100))) },
    { name: 'Historical Landslide Density', weight: clampPercent(toNumber(item.historicalLandslides ?? item.historical_landslide_count) * 5) },
  ],
  summary: item.summary ?? 'Live risk indicators are being evaluated for this location using rainfall, terrain, and historical landslide data.',
  recommendedAction: item.recommendedAction ?? 'Maintain field awareness and follow local disaster-management instructions for this risk level.',
});

const normaliseAlert = (item) => ({
  ...item,
  id: item.id ?? `ALT-${item.created_at ?? Date.now()}`,
  severity: String(item.severity ?? item.risk_level ?? 'LOW').toUpperCase(),
  title: item.title ?? 'Landslide Risk Alert',
  description: item.description ?? item.message ?? '',
  timestamp: item.timestamp ?? item.created_at ?? 'Recently',
  rainfall: toNumber(item.rainfall ?? item.rainfall_24h_mm ?? item.rainfall_mm),
  state: item.state ?? 'NER',
  district: item.district ?? item.location_name ?? 'Regional location',
});

const normaliseReport = (item) => ({
  ...item,
  id: item.id ?? item.report_id,
  locationName: item.locationName ?? item.location_name ?? 'Geotagged Location',
  reporter: item.reporter ?? item.reporter_name ?? 'Field Officer / Citizen',
  hazardType: item.hazardType ?? item.report_type ?? 'Landslide',
  timestamp: item.timestamp ?? item.created_at ?? 'Recently',
  latitude: toNumber(item.latitude),
  longitude: toNumber(item.longitude),
  status: String(item.status ?? 'UNDER REVIEW').toUpperCase(),
});

const asArray = (data) => Array.isArray(data) ? data : [];

async function fetchWithFallback(endpoint, mockData, isLiveApiOverride) {
  // Check parameter override, otherwise fallback to localStorage setting
  const isLive = isLiveApiOverride !== undefined ? isLiveApiOverride : isLiveApiSelected();

  if (!isLive) {
    // Artificial latency simulation for realistic UI behavior
    await new Promise((res) => setTimeout(res, 300));
    return mockData;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API response failed with status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn(`Live API call to ${endpoint} failed. Switched fallback mode.`, err);
    return mockData; // Gracefully fallback to mock data on error
  }
}

export const getRiskZones = (isLiveApi) =>
  fetchWithFallback('/risk-zones', MOCK_RISK_ZONES, isLiveApi)
    .then((data) => asArray(data).map(normaliseRiskZone));

export const getAlerts = (isLiveApi) =>
  fetchWithFallback('/alerts', MOCK_ALERTS, isLiveApi)
    .then((data) => asArray(data).map(normaliseAlert));

export const getRoads = (isLiveApi) =>
  fetchWithFallback('/roads', MOCK_ROADS, isLiveApi);

export const getReports = (isLiveApi) =>
  fetchWithFallback('/reports', MOCK_REPORTS, isLiveApi)
    .then((data) => asArray(data).map(normaliseReport));

export const getRainfallTrend = (isLiveApi) =>
  fetchWithFallback('/analytics/rainfall-trend', MOCK_RAINFALL_TREND, isLiveApi)
    .then((data) => {
      let cumulativeRainfall = 0;
      return asArray(data).map((item, index) => {
        const rainfall = toNumber(item.rainfall ?? item.rainfall_24h_mm);
        cumulativeRainfall += rainfall;
        return {
          ...item,
          time: item.time ?? item.date ?? `${index + 1}`,
          rainfall,
          cumulativeRainfall: toNumber(item.cumulativeRainfall, cumulativeRainfall),
          criticalThreshold: toNumber(item.criticalThreshold, 100),
        };
      });
    });

export const getStateRiskAnalytics = (isLiveApi) =>
  fetchWithFallback('/analytics/state-risk', MOCK_ANALYTICS_STATE_RISK, isLiveApi);

export async function getSatelliteImage(latitude, longitude, halfWidthDeg = 1.5) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    half_width_deg: String(halfWidthDeg),
  });

  const response = await fetch(`${BASE_URL}/satellite-image?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Satellite image request failed with status ${response.status}`);
  }

  return response.json();
}

// Open-Meteo Weather API Integration (Free API, No Key Needed)
export async function getWeatherByCoords(lat, lng) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=relativehumidity_2m`
    );
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    const data = await response.json();
    return {
      temp: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode,
      humidity: data.hourly?.relativehumidity_2m[0] ?? 65,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

const weatherDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Light showers',
  81: 'Showers',
  82: 'Heavy showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

export async function getWeatherByPlace(place) {
  const search = place.trim();
  if (!search) throw new Error('Please include a city, state, or place name.');

  const request = async (url) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    try {
      return await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Live weather request timed out.');
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const geocodeResponse = await request(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search)}&count=1&language=en&format=json`
  );
  if (!geocodeResponse.ok) throw new Error('Location search failed.');
  const geocode = await geocodeResponse.json();
  const result = geocode.results?.[0];
  if (!result) throw new Error(`I could not find weather data for ${search}.`);

  const forecastResponse = await request(
    `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&daily=uv_index_max,precipitation_sum,weather_code&forecast_days=1&timezone=auto`
  );
  if (!forecastResponse.ok) throw new Error('Live weather request failed.');
  const forecast = await forecastResponse.json();
  const current = forecast.current;

  return {
    location: [result.name, result.admin1].filter(Boolean).join(', '),
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    precipitationProbability: forecast.hourly?.precipitation_probability?.[0] ?? 0,
    windSpeed: current.wind_speed_10m,
    condition: weatherDescriptions[current.weather_code] || 'Variable conditions',
    uvIndex: forecast.daily?.uv_index_max?.[0] ?? 0,
    dailyRainfall: forecast.daily?.precipitation_sum?.[0] ?? 0,
    timezone: forecast.timezone,
  };
}

export const submitReportApi = async (formData, isLiveApiOverride) => {
  const isLive = isLiveApiOverride !== undefined ? isLiveApiOverride : isLiveApiSelected();

  if (!isLive) {
    await new Promise((res) => setTimeout(res, 800));
    const newReport = {
      id: `HR-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      hazardType: formData.get('hazardType') || 'Landslide',
      locationName: formData.get('locationName') || 'Geotagged Location',
      latitude: parseFloat(formData.get('latitude')) || 25.17,
      longitude: parseFloat(formData.get('longitude')) || 93.01,
      timestamp: new Date().toLocaleString(),
      status: 'UNDER REVIEW',
      severity: 'HIGH',
      description: formData.get('description') || '',
      reporter: 'Field Officer / Citizen',
      mediaType: formData.get('photo') ? 'image' : 'none',
    };
    return { success: true, report: newReport };
  }

  const payload = {
    latitude: toNumber(formData.get('latitude')),
    longitude: toNumber(formData.get('longitude')),
    reporter_name: 'Field Officer / Citizen',
    description: formData.get('description') || null,
    photo_url: null,
    report_type: formData.get('hazardType') || 'Landslide',
  };

  const response = await fetch(`${BASE_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to submit report to live API');
  const result = await response.json();
  return {
    success: true,
    report: normaliseReport({
      ...payload,
      ...result,
      id: result.report_id,
      location_name: formData.get('locationName'),
    }),
  };
};

export const broadcastEmergencyAlert = async (alertData = {}) => {
  const payload = {
    location: alertData.location || "Mawsynram Sector",
    district: alertData.district || "East Khasi Hills",
    severity: alertData.severity || "CRITICAL",
    description: alertData.description || "Continuous heavy rainfall triggering steep slope destabilization."
  };

  const response = await fetch(`${BASE_URL}/alerts/broadcast-sms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Broadcast failed with status: ${response.status}`);
  }

  return await response.json();
};

export const recordAlertAction = async (alert, action) => {
  const response = await fetch(`${BASE_URL}/alerts/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_id: String(alert.id),
      action,
      severity: alert.severity,
      location: alert.district,
    }),
  });

  if (!response.ok) {
    throw new Error(`Alert action failed with status: ${response.status}`);
  }

  return await response.json();
};