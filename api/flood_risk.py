"""
Him-Rakshak - Flood Risk Module
------------------------------------
Estimates flood risk for a location using:
  1. Distance to the nearest major NER river (ner_rivers.geojson - real
     Natural Earth river data, 16 major NER rivers)
  2. Rainfall (24h) - reused from api/rainfall.py

Flood Index Formula:
    flood_index = rainfall_24h_mm / (distance_to_river_km + 1)

Reasoning: flood risk increases with heavier rainfall AND with proximity
to a river (river overflow is the primary flood mechanism in NER). The
+1 avoids division-by-zero right at the riverbank, and naturally decays
risk as distance grows.

Classification uses flood_thresholds.json, which defines score cutoffs
at the 50th, 80th, and 95th percentiles (of a broader reference
distribution) - used here as Low/Medium/High/Critical boundaries:
    score < P50           -> Low
    P50 <= score < P80     -> Medium
    P80 <= score < P95     -> High
    score >= P95           -> Critical
"""

import json
import math
import os

RIVERS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ner_rivers.geojson")
THRESHOLDS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "flood_thresholds.json")

_rivers_cache = None
_thresholds_cache = None


def load_rivers():
    global _rivers_cache
    if _rivers_cache is None:
        with open(RIVERS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        _rivers_cache = data["features"]
    return _rivers_cache


def load_thresholds():
    global _thresholds_cache
    if _thresholds_cache is None:
        with open(THRESHOLDS_PATH, "r", encoding="utf-8") as f:
            _thresholds_cache = json.load(f)
    return _thresholds_cache


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _point_to_segment_km(lat, lon, lat1, lon1, lat2, lon2):
    """Approximate distance (km) from a point to a line segment, using a
    local flat-earth projection (fine at regional/NER scale)."""
    # Convert to a local planar approximation (km), centered near the segment
    ref_lat = (lat1 + lat2) / 2
    km_per_deg_lat = 111.32
    km_per_deg_lon = 111.32 * math.cos(math.radians(ref_lat))

    px = (lon - lon1) * km_per_deg_lon
    py = (lat - lat1) * km_per_deg_lat
    dx = (lon2 - lon1) * km_per_deg_lon
    dy = (lat2 - lat1) * km_per_deg_lat

    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        return _haversine_km(lat, lon, lat1, lon1)

    t = max(0, min(1, (px * dx + py * dy) / seg_len_sq))
    proj_x = t * dx
    proj_y = t * dy
    return math.hypot(px - proj_x, py - proj_y)


def distance_to_nearest_river_km(lat: float, lon: float) -> float:
    """Finds the minimum distance (km) from a point to any of the 16
    major NER rivers (line geometries)."""
    rivers = load_rivers()
    min_dist = float("inf")

    for feature in rivers:
        geom = feature.get("geometry", {})
        geom_type = geom.get("type")
        coords = geom.get("coordinates", [])

        # Normalise to a list of line-strings (each a list of [lon, lat] pairs)
        if geom_type == "LineString":
            lines = [coords]
        elif geom_type == "MultiLineString":
            lines = coords
        else:
            continue

        for line in lines:
            for i in range(len(line) - 1):
                lon1, lat1 = line[i][0], line[i][1]
                lon2, lat2 = line[i + 1][0], line[i + 1][1]
                dist = _point_to_segment_km(lat, lon, lat1, lon1, lat2, lon2)
                min_dist = min(min_dist, dist)

    return round(min_dist, 2) if min_dist != float("inf") else None


def classify_flood_risk(flood_index: float) -> str:
    """Classifies a flood_index value into Low/Medium/High/Critical
    using the percentile thresholds from flood_thresholds.json."""
    thresholds = load_thresholds()
    p50 = thresholds["0.5"]
    p80 = thresholds["0.8"]
    p95 = thresholds["0.95"]

    if flood_index < p50:
        return "Low"
    elif flood_index < p80:
        return "Medium"
    elif flood_index < p95:
        return "High"
    else:
        return "Critical"


def get_flood_risk(lat: float, lon: float, rainfall_24h_mm: float):
    """
    Main function: given a location and its current rainfall, returns
    the flood risk assessment.
    """
    river_distance_km = distance_to_nearest_river_km(lat, lon)
    if river_distance_km is None:
        river_distance_km = 999.0  # no river data available - treat as far

    flood_index = round(rainfall_24h_mm / (river_distance_km + 1), 4)
    risk_level = classify_flood_risk(flood_index)

    return {
        "river_distance_km": river_distance_km,
        "flood_index": flood_index,
        "flood_risk_level": risk_level,
    }


if __name__ == "__main__":
    print("Testing Flood Risk Module...\n")

    test_cases = [
        ("Shillong", 25.5788, 91.8933, 50),
        ("Guwahati (near Brahmaputra)", 26.1445, 91.7362, 50),
        ("Guwahati - heavy rain", 26.1445, 91.7362, 300),
    ]

    for name, lat, lon, rainfall in test_cases:
        result = get_flood_risk(lat, lon, rainfall)
        print(f"{name} (rainfall={rainfall}mm):")
        print(f"  Nearest river: {result['river_distance_km']} km")
        print(f"  Flood index: {result['flood_index']}")
        print(f"  Risk level: {result['flood_risk_level']}\n")