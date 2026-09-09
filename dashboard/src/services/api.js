import {
  MOCK_RISK_ZONES,
  MOCK_ALERTS,
  MOCK_ROADS,
  MOCK_REPORTS,
  MOCK_RAINFALL_TREND,
  MOCK_ANALYTICS_STATE_RISK,
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function fetchWithFallback(endpoint, mockData, isLiveApi) {
  if (!isLiveApi) {
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
    throw err;
  }
}

export const getRiskZones = (isLiveApi = false) =>
  fetchWithFallback('/risk-zones', MOCK_RISK_ZONES, isLiveApi);

export const getAlerts = (isLiveApi = false) =>
  fetchWithFallback('/alerts', MOCK_ALERTS, isLiveApi);

export const getRoads = (isLiveApi = false) =>
  fetchWithFallback('/roads', MOCK_ROADS, isLiveApi);

export const getReports = (isLiveApi = false) =>
  fetchWithFallback('/reports', MOCK_REPORTS, isLiveApi);

export const getRainfallTrend = (isLiveApi = false) =>
  fetchWithFallback('/analytics/rainfall-trend', MOCK_RAINFALL_TREND, isLiveApi);

export const getStateRiskAnalytics = (isLiveApi = false) =>
  fetchWithFallback('/analytics/state-risk', MOCK_ANALYTICS_STATE_RISK, isLiveApi);

export const submitReportApi = async (formData, isLiveApi = false) => {
  if (!isLiveApi) {
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
