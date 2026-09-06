import pandas as pd
import numpy as np
import rasterio
from pathlib import Path


# ============================================================
# FILE PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "data/processed/himachal_landslides.csv"
DEM_DIR = PROJECT_ROOT / "data/raw/elevation"
OUTPUT_FILE = PROJECT_ROOT / "data/processed/landslide_terrain.csv"


# ============================================================
# FIND DEM TILE
# ============================================================

def find_dem_tile(latitude, longitude):

    lat = int(np.floor(latitude))
    lon = int(np.floor(longitude))

    filename = (
        f"Copernicus_DSM_10_N{lat:02d}_00_E{lon:03d}_00_DEM.tif"
    )

    path = DEM_DIR / filename

    if path.exists():
        return path

    return None


# ============================================================
# MAIN
# ============================================================

def main():

    print("===================================")
    print("HIM-Rakshak Terrain Extraction")
    print("===================================")

    # --------------------------------------------------------
    # Load landslide CSV
    # --------------------------------------------------------

    print("\nLoading landslide data...")

    df = pd.read_csv(
        INPUT_FILE,
        keep_default_na=False
    )

    print("Total records:", len(df))

    # --------------------------------------------------------
    # Open DEM files
    # --------------------------------------------------------

    dem_files = {}

    for dem_path in sorted(DEM_DIR.glob("*.tif")):

        print("Opening:", dem_path.name)

        dem_files[dem_path.name] = rasterio.open(
            dem_path
        )

    print("DEM tiles opened:", len(dem_files))

    # --------------------------------------------------------
    # Extract elevation
    # --------------------------------------------------------

    print("\nExtracting elevation...")

    elevations = []

    missing_tiles = 0
    failed_points = 0

    for i, row in df.iterrows():

        latitude = float(row["Latitude"])
        longitude = float(row["Longitude"])

        dem_path = find_dem_tile(
            latitude,
            longitude
        )

        if dem_path is None:

            elevations.append(np.nan)

            missing_tiles += 1

            continue

        src = dem_files.get(
            dem_path.name
        )

        if src is None:

            elevations.append(np.nan)

            missing_tiles += 1

            continue

        try:

            value = next(
                src.sample(
                    [(longitude, latitude)]
                )
            )[0]

            if (
                src.nodata is not None
                and value == src.nodata
            ):

                elevations.append(np.nan)

            else:

                elevations.append(
                    float(value)
                )

        except Exception:

            elevations.append(np.nan)

            failed_points += 1

        if (i + 1) % 500 == 0:

            print(
                f"Processed {i + 1}/{len(df)}"
            )

    # --------------------------------------------------------
    # Add elevation column
    # --------------------------------------------------------

    df["Elevation_m"] = elevations

    # --------------------------------------------------------
    # Close DEM files
    # --------------------------------------------------------

    for src in dem_files.values():

        src.close()

    # --------------------------------------------------------
    # Save output
    # --------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    available = df["Elevation_m"].notna().sum()
    missing = df["Elevation_m"].isna().sum()

    print("\n===================================")
    print("Elevation extraction completed")
    print("===================================")

    print("Total records:", len(df))
    print("Elevation available:", available)
    print("Elevation missing:", missing)
    print("Missing DEM tiles:", missing_tiles)
    print("Failed points:", failed_points)

    print("\nOutput file:")
    print(OUTPUT_FILE)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()