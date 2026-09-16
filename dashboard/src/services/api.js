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
  fetchWithFallback('/risk-zones', MOCK_RISK_ZONES, isLiveApi);

export const getAlerts = (isLiveApi) =>
  fetchWithFallback('/alerts', MOCK_ALERTS, isLiveApi);

export const getRoads = (isLiveApi) =>
  fetchWithFallback('/roads', MOCK_ROADS, isLiveApi);

export const getReports = (isLiveApi) =>
  fetchWithFallback('/reports', MOCK_REPORTS, isLiveApi);

export const getRainfallTrend = (isLiveApi) =>
  fetchWithFallback('/analytics/rainfall-trend', MOCK_RAINFALL_TREND, isLiveApi);

export const getStateRiskAnalytics = (isLiveApi) =>
  fetchWithFallback('/analytics/state-risk', MOCK_ANALYTICS_STATE_RISK, isLiveApi);

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

  const response = await fetch(`${BASE_URL}/reports/submit`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to submit report to live API');
  return await response.json();
};

export const broadcastEmergencyAlert = async (alertData = {}) => {
  const payload = {
    location: alertData.location || "Mawsynram Sector",
    district: alertData.district || "East Khasi Hills",
    severity: alertData.severity || "CRITICAL",
    description: alertData.description || "Continuous heavy rainfall triggering steep slope destabilization."
  };

  const response = await fetch("http://127.0.0.1:8000/api/alerts/broadcast-sms", {
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