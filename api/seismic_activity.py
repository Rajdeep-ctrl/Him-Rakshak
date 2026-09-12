"""
Him-Rakshak - USGS Earthquake API Integration
------------------------------------------------
Fetches recent seismic activity (earthquakes) near a given location.
Used as the 6th risk-prediction factor: recent/nearby seismic activity
can loosen soil and trigger landslides on already-saturated slopes.

Docs: https://earthquake.usgs.gov/fdsnws/event/1/
No API key required - fully free and public.
"""

import requests
import math
from datetime import datetime, timedelta, timezone

USGS_BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


def get_recent_earthquakes(lat: float, lon: float, radius_km: float = 300,
                            days_back: int = 30, min_magnitude: float = 2.0):
    """
    Fetches earthquakes within `radius_km` of a location, in the last
    `days_back` days, with magnitude >= `min_magnitude`.
    """
    start_time = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%d")

    params = {
        "format": "geojson",
        "latitude": lat,
        "longitude": lon,
        "maxradiuskm": radius_km,
        "starttime": start_time,
        "minmagnitude": min_magnitude,
        "orderby": "time",
    }
    try:
        response = requests.get(USGS_BASE_URL, params=params, timeout=20)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"⚠️ USGS API error: {e}")
        return None


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two lat-lon points (in km)."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def get_seismic_risk_factor(lat: float, lon: float):
    """
    Returns a simple summary for the ML model:
      - max_magnitude: strongest nearby earthquake in the last 30 days
      - nearest_distance_km: distance to the closest recent earthquake
      - count: how many quakes happened nearby

    If no earthquakes found, returns zeros (meaning: no recent seismic risk).
    """
    data = get_recent_earthquakes(lat, lon)

    if not data or "features" not in data or len(data["features"]) == 0:
        return {"max_magnitude": 0.0, "nearest_distance_km": None, "count": 0}

    max_magnitude = 0.0
    nearest_distance = float("inf")
    count = len(data["features"])

    for quake in data["features"]:
        mag = quake["properties"].get("mag", 0) or 0
        quake_lon, quake_lat = quake["geometry"]["coordinates"][:2]
        dist = haversine_distance_km(lat, lon, quake_lat, quake_lon)

        max_magnitude = max(max_magnitude, mag)
        nearest_distance = min(nearest_distance, dist)

    return {
        "max_magnitude": round(max_magnitude, 1),
        "nearest_distance_km": round(nearest_distance, 1) if nearest_distance != float("inf") else None,
        "count": count,
    }


if __name__ == "__main__":
    print("Testing USGS Earthquake API for Shillong, Meghalaya...\n")
    lat, lon = 25.5788, 91.8933  # Shillong

    # Wider test first - to confirm the API itself is working correctly
    print("Wider test (1000km radius, last 365 days, magnitude 1.0+):")
    wide_data = get_recent_earthquakes(lat, lon, radius_km=1000, days_back=365, min_magnitude=1.0)
    if wide_data:
        print(f"   Found {len(wide_data['features'])} earthquakes\n")
    else:
        print("   No data received (API error)\n")

    # Original narrower test (what the ML model will actually use)
    result = get_seismic_risk_factor(lat, lon)
    print(f"✅ Seismic summary (last 30 days, 300km radius):")
    print(f"   Max magnitude: {result['max_magnitude']}")
    print(f"   Nearest earthquake distance: {result['nearest_distance_km']} km")
    print(f"   Number of quakes: {result['count']}")