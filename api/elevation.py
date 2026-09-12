"""
Him-Rakshak - Elevation & Slope API (Open-Meteo)
----------------------------------------------------
Fetches elevation data for any location, and estimates slope angle
by comparing elevation at two nearby points.

Docs: https://open-meteo.com/en/docs/elevation-api
No API key required.
"""

import requests
import math

ELEVATION_BASE_URL = "https://api.open-meteo.com/v1/elevation"

NER_LOCATIONS = {
    "Shillong": (25.5788, 91.8933),
    "Guwahati": (26.1445, 91.7362),
    "Itanagar": (27.0844, 93.6053),
    "Aizawl": (23.7271, 92.7176),
    "Imphal": (24.8170, 93.9368),
    "Kohima": (25.6751, 94.1086),
    "Agartala": (23.8315, 91.2868),
}


def get_elevation(lat: float, lon: float, retries: int = 3, timeout: int = 30):
    """
    Fetches elevation (in meters) for a single point.
    Retries a few times with a longer timeout, since Open-Meteo's
    servers are in Europe/North America and requests from India can
    occasionally be slow.
    """
    params = {"latitude": lat, "longitude": lon}
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(ELEVATION_BASE_URL, params=params, timeout=timeout)
            response.raise_for_status()
            data = response.json()
            return data["elevation"][0] if data.get("elevation") else None
        except requests.exceptions.RequestException as e:
            last_error = e
            print(f" Attempt {attempt}/{retries} failed: {e}")
    print(f" Open-Meteo elevation API error after {retries} attempts: {last_error}")
    return None


def estimate_slope_degrees(lat: float, lon: float, offset: float = 0.01):
    """
    Estimates slope angle (in degrees) by sampling elevation at the
    target point and a nearby point, then calculating the incline.

    `offset` (~0.01 degrees ≈ 1.1 km) controls how far apart the two
    sample points are - smaller offset = more local slope estimate.
    """
    elev_center = get_elevation(lat, lon)
    elev_offset = get_elevation(lat + offset, lon)

    if elev_center is None or elev_offset is None:
        return None

    horizontal_distance_m = offset * 111320  # ~111,320 m per degree latitude
    vertical_diff_m = abs(elev_offset - elev_center)

    if horizontal_distance_m == 0:
        return 0.0

    slope_rad = math.atan(vertical_diff_m / horizontal_distance_m)
    slope_deg = math.degrees(slope_rad)
    return round(slope_deg, 2)


if __name__ == "__main__":
    print("Testing Elevation/Slope API for Shillong, Meghalaya...\n")
    lat, lon = NER_LOCATIONS["Shillong"]

    elevation = get_elevation(lat, lon)
    print(f" Elevation: {elevation} m")

    slope = estimate_slope_degrees(lat, lon)
    print(f" Estimated slope: {slope}°")