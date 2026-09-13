"""
Him-Rakshak - Satellite Imagery (NASA GIBS)
------------------------------------------------
Fetches real satellite imagery (MODIS true-color) for any bounding box
using NASA's Global Imagery Browse Services (GIBS) - free, no API key,
no registration required.

Docs: https://nasa-gibs.github.io/gibs-api-docs/
Note: This provides REAL satellite images for visualization/reference
(e.g., to show on the dashboard or in the PPT). It does NOT do automated
change-detection / computer-vision analysis - that remains future scope,
since it would need a much larger CV pipeline than a hackathon prototype
can build in the available time.
"""

import requests
import os
from datetime import datetime, timedelta, timezone

GIBS_WMS_URL = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

# Bounding box covering the North Eastern Region of India (for a wide overview shot)
NER_BBOX = "88.0,21.5,97.5,29.5"  # minLon,minLat,maxLon,maxLat

# Individual NER cities (lat, lon) - used to build a small zoomed-in bounding
# box around each one for a closer satellite view
NER_CITIES = {
    "Shillong": (25.5788, 91.8933),
    "Guwahati": (26.1445, 91.7362),
    "Itanagar": (27.0844, 93.6053),
    "Aizawl": (23.7271, 92.7176),
    "Imphal": (24.8170, 93.9368),
    "Kohima": (25.6751, 94.1086),
    "Agartala": (23.8315, 91.2868),
}


def city_bbox(lat: float, lon: float, half_width_deg: float = 0.5):
    """
    Builds a small bounding box (~110km wide by default) centered on a
    city, formatted as 'minLon,minLat,maxLon,maxLat' for the GIBS API.
    """
    min_lon = lon - half_width_deg
    max_lon = lon + half_width_deg
    min_lat = lat - half_width_deg
    max_lat = lat + half_width_deg
    return f"{min_lon},{min_lat},{max_lon},{max_lat}"


def get_satellite_image(bbox: str = NER_BBOX, date: str = None,
                         layer: str = "MODIS_Terra_CorrectedReflectance_TrueColor",
                         width: int = 1024, height: int = 1024,
                         save_path: str = "data/raw/satellite_ner_latest.jpg"):
    """
    Fetches a true-color satellite image for the given bounding box and date.

    `date` should be in 'YYYY-MM-DD' format. If not given, uses yesterday's
    date (today's imagery is often not processed yet).
    """
    if date is None:
        date = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    params = {
        "SERVICE": "WMS",
        "VERSION": "1.1.1",
        "REQUEST": "GetMap",
        "LAYERS": layer,
        "STYLES": "",
        "FORMAT": "image/jpeg",
        "TRANSPARENT": "false",
        "HEIGHT": height,
        "WIDTH": width,
        "SRS": "EPSG:4326",
        "BBOX": bbox,
        "TIME": date,
    }

    try:
        response = requests.get(GIBS_WMS_URL, params=params, timeout=30)
        response.raise_for_status()

        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(response.content)

        print(f" Satellite image saved to {save_path} (date: {date})")
        return save_path
    except requests.exceptions.RequestException as e:
        print(f" GIBS API error: {e}")
        return None


def is_image_mostly_blank(filepath: str, brightness_threshold: int = 15):
    """
    Checks if a downloaded image is mostly black/blank (indicating no
    valid satellite pass for that date/location). Returns True if the
    image should be considered invalid.
    """
    try:
        from PIL import Image
        img = Image.open(filepath).convert("L")  # grayscale
        pixels = list(img.getdata())
        avg_brightness = sum(pixels) / len(pixels)
        return avg_brightness < brightness_threshold
    except Exception as e:
        print(f" Could not check image validity: {e}")
        return False


def get_satellite_image_with_fallback(bbox: str, base_date: str, save_path: str,
                                        max_days_shift: int = 5, layer: str = None):
    """
    Fetches a satellite image for `base_date`. If the image comes back
    mostly black (no valid satellite pass), tries nearby dates (day
    before, day after, etc.) up to `max_days_shift` days away.
    """
    base_dt = datetime.strptime(base_date, "%Y-%m-%d")

    # Try base date first, then +1, -1, +2, -2, ... days
    offsets = [0]
    for i in range(1, max_days_shift + 1):
        offsets.extend([i, -i])

    for offset in offsets:
        try_date = (base_dt + timedelta(days=offset)).strftime("%Y-%m-%d")
        kwargs = {"bbox": bbox, "date": try_date, "save_path": save_path}
        if layer:
            kwargs["layer"] = layer
        result = get_satellite_image(**kwargs)

        if result and not is_image_mostly_blank(result):
            if offset != 0:
                print(f"   (used {try_date} instead - original date had no valid image)")
            return result
        elif result:
            print(f"    {try_date} came back blank/black, trying another date...")

    print(f"    No valid image found within {max_days_shift} days of {base_date}")
    return None
    """
    Fetches a zoomed-in satellite image for each NER city, for each date
    given in `dates`. Saves them in:
        data/raw/satellite/<city_name>_<date>.jpg

    If `dates` is not given, defaults to THREE dates:
      1. A dry-season reference date (Jan 15, clear skies, shows terrain
         clearly - good for the dashboard/PPT as a baseline view)
      2. ~30 days ago (monsoon period)
      3. Yesterday (most recent monsoon conditions - may be cloudy, which
         is itself meaningful: dense cloud cover correlates with active
         rainfall/landslide-risk conditions)
    """
    if dates is None:
        current_year = datetime.now(timezone.utc).year
        dry_season = f"{current_year}-01-15"
        recent = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        older = (datetime.now(timezone.utc) - timedelta(days=31)).strftime("%Y-%m-%d")
        dates = [dry_season, older, recent]

    results = {}
    for city, (lat, lon) in cities.items():
        bbox = city_bbox(lat, lon)
        results[city] = {}
        for date in dates:
            save_path = f"data/raw/satellite/{city.lower()}_{date}.jpg"
            print(f"Fetching image for {city} on {date}...")
            result = get_satellite_image_with_fallback(bbox=bbox, base_date=date, save_path=save_path)
            results[city][date] = result
    return results


if __name__ == "__main__":
    print("Fetching real satellite imagery for each NER city, at 2 dates each...\n")
    results = get_all_city_images()

    print("\n--- Summary ---")
    for city, date_results in results.items():
        for date, path in date_results.items():
            status = " saved" if path else " failed"
            print(f"{city} ({date}): {status}")