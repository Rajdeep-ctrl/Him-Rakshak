export const MOCK_RISK_ZONES = [
  {
    id: "zone-1",
    district: "Dima Hasao",
    state: "Assam",
    lat: 25.1711,
    lng: 93.0158,
    riskLevel: "CRITICAL",
    aiConfidence: 91,
    rainfall24h: 168,
    slope: 34,
    soilSaturation: 82,
    historicalLandslides: 12,
    roadBlockageProb: "HIGH",
    summary: "Torrential downpours over steep slopes exceeding 30 degrees have led to high soil saturation in Dima Hasao, creating severe risk along NH-27.",
    features: [
      { name: "24h Rainfall Intensity", weight: 92 },
      { name: "Soil Saturation Index", weight: 88 },
      { name: "Terrain Slope Angle", weight: 81 },
      { name: "Historical Landslide Density", weight: 63 }
    ],
    recommendedAction: "Deploy immediate inspection team to Haflong-Jatinga corridor and set up traffic diversions."
  },
  {
    id: "zone-2",
    district: "Tawang",
    state: "Arunachal Pradesh",
    lat: 27.5860,
    lng: 91.8594,
    riskLevel: "HIGH",
    aiConfidence: 84,
    rainfall24h: 124,
    slope: 38,
    soilSaturation: 74,
    historicalLandslides: 8,
    roadBlockageProb: "MEDIUM",
    summary: "Continuous rainfall combined with steep mountain cuts has heightened slope movement probabilities near Sela Pass.",
    features: [
      { name: "Terrain Slope Angle", weight: 89 },
      { name: "24h Rainfall Intensity", weight: 79 },
      { name: "Soil Saturation Index", weight: 70 },
      { name: "Historical Landslide Density", weight: 55 }
    ],
    recommendedAction: "Pre-position heavy earthmovers along BCT Road stretch."
  },
  {
    id: "zone-3",
    district: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.5788,
    lng: 91.8933,
    riskLevel: "HIGH",
    aiConfidence: 81,
    rainfall24h: 145,
    slope: 28,
    soilSaturation: 79,
    historicalLandslides: 15,
    roadBlockageProb: "HIGH",
    summary: "Prolonged monsoon precipitation around Cherrapunji/Sohra cliff edges poses imminent threat to village access roads.",
    features: [
      { name: "24h Rainfall Intensity", weight: 90 },
      { name: "Soil Saturation Index", weight: 82 },
      { name: "Historical Landslide Density", weight: 75 },
      { name: "Terrain Slope Angle", weight: 62 }
    ],
    recommendedAction: "Issue travel advisories for Shillong-Sohra route and activate district response force."
  },
  {
    id: "zone-4",
    district: "Aizawl",
    state: "Mizoram",
    lat: 23.7271,
    lng: 92.7176,
    riskLevel: "MEDIUM",
    aiConfidence: 72,
    rainfall24h: 88,
    slope: 31,
    soilSaturation: 62,
    historicalLandslides: 6,
    roadBlockageProb: "MEDIUM",
    summary: "Moderate rain with soil loosening reported in eastern residential slopes.",
    features: [
      { name: "Terrain Slope Angle", weight: 75 },
      { name: "24h Rainfall Intensity", weight: 65 },
      { name: "Soil Saturation Index", weight: 60 },
      { name: "Historical Landslide Density", weight: 40 }
    ],
    recommendedAction: "Maintain routine field sensors monitoring."
  },
  {
    id: "zone-5",
    district: "Kohima",
    state: "Nagaland",
    lat: 25.6751,
    lng: 94.1086,
    riskLevel: "CRITICAL",
    aiConfidence: 89,
    rainfall24h: 152,
    slope: 32,
    soilSaturation: 85,
    historicalLandslides: 10,
    roadBlockageProb: "HIGH",
    summary: "Major active sinking zone activated along NH-29 near Pagla Pahar.",
    features: [
      { name: "Soil Saturation Index", weight: 91 },
      { name: "24h Rainfall Intensity", weight: 87 },
      { name: "Historical Landslide Density", weight: 80 },
      { name: "Terrain Slope Angle", weight: 72 }
    ],
    recommendedAction: "Restrict night heavy vehicle movement on NH-29."
  },
  {
    id: "zone-6",
    district: "Gangtok",
    state: "Sikkim",
    lat: 27.3389,
    lng: 88.6138,
    riskLevel: "LOW",
    aiConfidence: 65,
    rainfall24h: 42,
    slope: 29,
    soilSaturation: 45,
    historicalLandslides: 4,
    roadBlockageProb: "LOW",
    summary: "Stable weather conditions. Minimal slope instability detected.",
    features: [
      { name: "Terrain Slope Angle", weight: 50 },
      { name: "24h Rainfall Intensity", weight: 30 },
      { name: "Soil Saturation Index", weight: 28 },
      { name: "Historical Landslide Density", weight: 25 }
    ],
    recommendedAction: "Standard monitoring."
  }
];

export const MOCK_ALERTS = [
  {
    id: "ALT-2026-091",
    severity: "CRITICAL",
    district: "Dima Hasao",
    state: "Assam",
    timestamp: "10 minutes ago",
    title: "Impending Mudslide Hazard — NH-27 Corridor",
    description: "Multi-sensor analysis indicates accelerated soil creep along slope face near km-42. High probability of debris flow blocking highway within 3 hours.",
    rainfall: 168,
    status: "ACTIVE",
    recommendedResponse: "Dispath SDRF team & close eastbound lane."
  },
  {
    id: "ALT-2026-088",
    severity: "CRITICAL",
    district: "Kohima",
    state: "Nagaland",
    timestamp: "28 minutes ago",
    title: "Pagla Pahar Subsidence Triggered",
    description: "Rapid increase in pore water pressure detected. Slope displacement velocity increased to 4.2 mm/hr.",
    rainfall: 152,
    status: "ACTIVE",
    recommendedResponse: "Divert traffic to bypass route via Dimapur."
  },
  {
    id: "ALT-2026-084",
    severity: "HIGH",
    district: "East Khasi Hills",
    state: "Meghalaya",
    timestamp: "1 hour ago",
    title: "Rockfall Risk at Sohra Escarpment",
    description: "Overhanging boulder cluster shifting detected following 145mm cumulative precipitation.",
    rainfall: 145,
    status: "ACTIVE",
    recommendedResponse: "Erect warning barriers and deploy alert patrol."
  },
  {
    id: "ALT-2026-079",
    severity: "MEDIUM",
    district: "Tawang",
    state: "Arunachal Pradesh",
    timestamp: "3 hours ago",
    title: "Sela Pass Access Slope Saturation Alert",
    description: "Sustained rainfall causing moderate runoff build-up on feeder road bypasses.",
    rainfall: 124,
    status: "ACKNOWLEDGED",
    recommendedResponse: "Clear drainage channels using JCB excavators."
  }
];

export const MOCK_ROADS = [
  {
    id: "RD-01",
    name: "National Highway 27 (NH-27)",
    stretch: "Haflong - Jatinga Stretch",
    state: "Assam",
    status: "BLOCKED",
    riskLevel: "CRITICAL",
    lastUpdate: "12 mins ago",
    cause: "Major debris flow and mudslide at km 44."
  },
  {
    id: "RD-02",
    name: "National Highway 29 (NH-29)",
    stretch: "Dimapur - Kohima Corridor",
    state: "Nagaland",
    status: "PARTIALLY BLOCKED",
    riskLevel: "CRITICAL",
    lastUpdate: "35 mins ago",
    cause: "Active road sinking and crack formation at Pagla Pahar."
  },
  {
    id: "RD-03",
    name: "Shillong - Sohra Highway",
    stretch: "Laitkor to Elephant Falls bypass",
    state: "Meghalaya",
    status: "AT RISK",
    riskLevel: "HIGH",
    lastUpdate: "1 hour ago",
    cause: "Continuous heavy runoff and minor rock fall debris."
  },
  {
    id: "RD-04",
    name: "Trans-Arunachal Highway (NH-13)",
    stretch: "Ziro to Daporijo Route",
    state: "Arunachal Pradesh",
    status: "OPEN",
    riskLevel: "MEDIUM",
    lastUpdate: "2 hours ago",
    cause: "Minor soil loosening; traffic passing cautiously."
  },
  {
    id: "RD-05",
    name: "NH-10 Siliguri-Gangtok Highway",
    stretch: "Teesta Bazar Section",
    state: "Sikkim",
    status: "OPEN",
    riskLevel: "LOW",
    lastUpdate: "4 hours ago",
    cause: "All lanes clear."
  }
];

export const MOCK_REPORTS = [
  {
    id: "HR-2026-00421",
    hazardType: "Landslide",
    locationName: "Jatinga Hill Slope, Dima Hasao",
    latitude: 25.1580,
    longitude: 93.0210,
    timestamp: "2026-09-07 08:30 AM",
    status: "VERIFIED",
    severity: "CRITICAL",
    description: "Large section of hill slope collapsed onto road shoulder. Water gushing with thick mud.",
    reporter: "Rakesh Kalita (Field Patrol Officer)",
    mediaType: "image"
  },
  {
    id: "HR-2026-00418",
    hazardType: "Ground Crack",
    locationName: "NH-29 Hill Edge, Kohima",
    latitude: 25.6620,
    longitude: 94.0950,
    timestamp: "2026-09-07 07:15 AM",
    status: "UNDER REVIEW",
    severity: "HIGH",
    description: "4-inch wide fissure formed across asphalt highway over a 30 meter span.",
    reporter: "Citizen via App",
    mediaType: "image"
  }
];

export const MOCK_RAINFALL_TREND = [
  { time: '00:00', rainfall: 12, criticalThreshold: 100 },
  { time: '04:00', rainfall: 28, criticalThreshold: 100 },
  { time: '08:00', rainfall: 64, criticalThreshold: 100 },
  { time: '12:00', rainfall: 112, criticalThreshold: 100 },
  { time: '16:00', rainfall: 158, criticalThreshold: 100 },
  { time: '20:00', rainfall: 168, criticalThreshold: 100 },
  { time: '24:00', rainfall: 140, criticalThreshold: 100 },
];

export const MOCK_ANALYTICS_STATE_RISK = [
  { state: 'Assam', critical: 3, high: 5, medium: 8, low: 4 },
  { state: 'Arunachal', critical: 2, high: 6, medium: 4, low: 5 },
  { state: 'Meghalaya', critical: 1, high: 4, medium: 6, low: 3 },
  { state: 'Nagaland', critical: 1, high: 3, medium: 2, low: 2 },
  { state: 'Mizoram', critical: 0, high: 2, medium: 5, low: 4 },
  { state: 'Sikkim', critical: 0, high: 1, medium: 3, low: 6 },
];
