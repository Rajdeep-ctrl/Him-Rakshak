"""
Him-Rakshak - Download NASA's Full Global Landslide Catalog (filtered to NER)
-----------------------------------------------------------------------------
Downloads NASA's official bulk CSV export of the Global Landslide Catalog
(11,000+ worldwide records, 2007-2019, compiled by NASA Goddard Space
Flight Center), then filters it down to just the North Eastern Region
of India bounding box.

Source: https://data.nasa.gov/dataset/global-landslide-catalog-export
Citation: Kirschbaum, D.B., Adler, R., Hong, Y., Hill, S., & Lerner-Lam, A.
(2010). A global landslide catalog for hazard applications. Natural Hazards.

Note: This CSV covers 2007-2019 and is skewed toward well-reported/media-
covered events, so India/NER coverage may still be sparse compared to
GSI's full internal inventory - but it is a genuine, citable, much larger
real dataset (11,000+ records) vs a small hand-curated list.
"""

import requests
import pandas as pd
import os

CSV_URL = "https://data.nasa.gov/docs/legacy/Global_Landslide_Catalog_Export/Global_Landslide_Catalog_Export_rows.csv"
RAW_PATH = "data/raw/global_landslide_catalog_full.csv"
NER_FILTERED_PATH = "data/raw/ner_historical_landslides_full.csv"

NER_BBOX = {"min_lat": 21.5, "max_lat": 29.5, "min_lon": 88.0, "max_lon": 97.5}


def download_full_catalog(url: str = CSV_URL, save_path: str = RAW_PATH):
    """Downloads the full global CSV using a browser-like User-Agent
    (some government sites block requests with no User-Agent header)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    }
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    print("Downloading full NASA Global Landslide Catalog (may take a moment)...")
    response = requests.get(url, headers=headers, timeout=60)
    response.raise_for_status()

    with open(save_path, "wb") as f:
        f.write(response.content)

    print(f" Downloaded full catalog to {save_path} ({len(response.content) / 1024:.1f} KB)")
    return save_path


def filter_to_ner(csv_path: str = RAW_PATH, output_path: str = NER_FILTERED_PATH):
    """Loads the full catalog and filters rows within the NER bounding box."""
    df = pd.read_csv(csv_path, low_memory=False)
    print(f"\nTotal global records loaded: {len(df)}")
    print(f"Columns found: {list(df.columns)}\n")

    # Try common column-name variants for latitude/longitude
    lat_col = next((c for c in df.columns if c.lower() == "latitude"), None)
    lon_col = next((c for c in df.columns if c.lower() == "longitude"), None)

    if not lat_col or not lon_col:
        print("⚠️ Could not auto-detect latitude/longitude columns. "
              "Please check the printed column list above and adjust manually.")
        return None

    df[lat_col] = pd.to_numeric(df[lat_col], errors="coerce")
    df[lon_col] = pd.to_numeric(df[lon_col], errors="coerce")

    ner_df = df[
        (df[lat_col] >= NER_BBOX["min_lat"]) & (df[lat_col] <= NER_BBOX["max_lat"]) &
        (df[lon_col] >= NER_BBOX["min_lon"]) & (df[lon_col] <= NER_BBOX["max_lon"])
    ].copy()

    ner_df.to_csv(output_path, index=False)
    print(f" Found {len(ner_df)} records within the NER bounding box")
    print(f" Saved filtered dataset to {output_path}")
    return ner_df


if __name__ == "__main__":
    download_full_catalog()
    filter_to_ner()