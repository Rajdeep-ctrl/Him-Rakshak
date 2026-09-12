"""
Him-Rakshak - Rainfall API (Open-Meteo)
------------------------------------------
Fetches current + last 24hr rainfall for any location using
Open-Meteo's free forecast API (no key needed).

Docs: https://open-meteo.com/en/docs
"""

import requests

WEATHER_BASE_URL = "https://api.open-meteo.com/v1/forecast"

# A few reference NER locations (lat, lon) for testing
NER_LOCATIONS = {
    "Shillong": (25.5788, 91.8933),
    "Guwahati": (26.1445, 91.7362),
    "Itanagar": (27.0844, 93.6053),
    "Aizawl": (23.7271, 92.7176),
    "Imphal": (24.8170, 93.9368),
    "Kohima": (25.6751, 94.1086),
    "Agartala": (23.8315, 91.2868),
}


def get_rainfall(lat: float, lon: float, retries: int = 3, timeout: int = 20):
    """
    Fetches current + last 24hr rainfall data for a given location.
    Retries a few times in case of slow network/server response.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "precipitation",
        "current": "precipitation",
        "past_days": 1,       # gives us last 24 hours too
        "timezone": "Asia/Kolkata",
    }
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(WEATHER_BASE_URL, params=params, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            last_error = e
            print(f" Attempt {attempt}/{retries} failed: {e}")
    print(f" Open-Meteo weather API error after {retries} attempts: {last_error}")
    return None


def extract_rainfall_24h(weather_data):
    """
    Sums up hourly precipitation values from the last 24 hours
    to get a single 'rainfall_24h_mm' figure for the ML model.
    """
    if not weather_data or "hourly" not in weather_data:
        return None
    try:
        precipitation_values = weather_data["hourly"]["precipitation"]
        last_24h = precipitation_values[-24:]
        return round(sum(v for v in last_24h if v is not None), 2)
    except (KeyError, TypeError) as e:
        print(f" Could not parse rainfall data: {e}")
        return None


if __name__ == "__main__":
    print("Testing Rainfall API for Shillong, Meghalaya...\n")
    lat, lon = NER_LOCATIONS["Shillong"]

    weather = get_rainfall(lat, lon)
    if weather:
        rainfall_24h = extract_rainfall_24h(weather)
        print(f" Rainfall (last 24h): {rainfall_24h} mm")
    else:
        print(" Could not fetch rainfall data")