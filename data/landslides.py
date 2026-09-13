"""
Him-Rakshak - Load Historical Landslide Data (from local CSV)
-------------------------------------------------------------------
Reads the historical landslide dataset that was already downloaded
and saved locally (by running historical_landslides.py once).

This avoids hitting the NASA API every time - just reads from your
own saved file, which is faster and works even offline.

Usage:
    1. Run historical_landslides.py once to create the CSV file.
    2. Then use this file's functions anywhere else in your project.
"""

import pandas as pd
import math
import os

CSV_PATH = "data/raw/ner_historical_landslides_full.csv"


def load_dataset(filepath: str = CSV_PATH):
    """Loads the saved landslide CSV into a pandas DataFrame."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"'{filepath}' not found. Run download_full_catalog.py first "
            "to download and filter the dataset."
        )
    df = pd.read_csv(filepath, low_memory=False)
    return df


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """Calculates great-circle distance between two lat-lon points (in km)."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def get_historical_count_near(lat: float, lon: float, radius_km: float = 50,
                                df: pd.DataFrame = None):
    """
    Counts how many historical landslides (from the local CSV) happened
    within `radius_km` of a given location. This is the function your
    backend/ML model will call for the 'historical_landslide_count' feature.
    """
    if df is None:
        df = load_dataset()

    if "latitude" not in df.columns or "longitude" not in df.columns:
        raise ValueError("CSV is missing 'latitude'/'longitude' columns.")

    count = 0
    for _, row in df.iterrows():
        r_lat, r_lon = row.get("latitude"), row.get("longitude")
        if pd.isna(r_lat) or pd.isna(r_lon):
            continue
        if haversine_distance_km(lat, lon, r_lat, r_lon) <= radius_km:
            count += 1
    return count


def get_nearest_historical_distance_km(lat: float, lon: float, df: pd.DataFrame = None):
    """
    Finds the distance (in km) to the NEAREST historical landslide record.
    Used as a real-data-backed proxy for 'fault/weak-zone distance' - a
    location close to a documented past landslide is a reasonable proxy
    for being in a geologically weaker zone, since we don't have a direct
    fault-line dataset for NER.
    """
    if df is None:
        df = load_dataset()

    if "latitude" not in df.columns or "longitude" not in df.columns:
        raise ValueError("CSV is missing 'latitude'/'longitude' columns.")

    min_distance = float("inf")
    for _, row in df.iterrows():
        r_lat, r_lon = row.get("latitude"), row.get("longitude")
        if pd.isna(r_lat) or pd.isna(r_lon):
            continue
        dist = haversine_distance_km(lat, lon, r_lat, r_lon)
        min_distance = min(min_distance, dist)

    return round(min_distance, 2) if min_distance != float("inf") else None


if __name__ == "__main__":
    print("Loading historical landslide dataset from local CSV...\n")
    df = load_dataset()
    print(f" Loaded {len(df)} records from {CSV_PATH}\n")

    # Test: Shillong
    lat, lon = 25.5788, 91.8933  # Shillong
    count = get_historical_count_near(lat, lon, radius_km=50, df=df)
    nearest = get_nearest_historical_distance_km(lat, lon, df=df)
    print(f" Historical landslides within 50km of Shillong: {count}")
    print(f" Nearest historical landslide distance: {nearest} km")