import pandas as pd
import numpy as np
import rasterio
from pathlib import Path


# ============================================================
# FILE PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = PROJECT_ROOT / "data/processed/landslide_terrain.csv"
DEM_DIR = PROJECT_ROOT / "data/raw/elevation"
OUTPUT_FILE = PROJECT_ROOT / "data/processed/landslide_processed.csv"


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
# FIND SLOPE USING NEIGHBOURING PIXELS
# ============================================================

def get_slope(src, longitude, latitude):

    row, col = src.index(
        longitude,
        latitude
    )

    # Read a 3x3 window around the point.
    # Bound the window so it never goes outside the tile.
    row_start = max(0, row - 1)
    col_start = max(0, col - 1)

    row_end = min(src.height, row + 2)
    col_end = min(src.width, col + 2)

    window = rasterio.windows.Window(
        col_start,
        row_start,
        col_end - col_start,
        row_end - row_start
    )

    elevation = src.read(
        1,
        window=window
    )

    # Need at least 3x3 pixels for central-difference slope.
    if elevation.shape != (3, 3):
        return np.nan

    if src.nodata is not None:

        elevation = np.where(
            elevation == src.nodata,
            np.nan,
            elevation
        )

    if np.isnan(elevation).any():
        return np.nan

    transform = src.window_transform(window)

    dx = abs(transform.a)
    dy = abs(transform.e)

    latitude_radians = np.radians(latitude)

    meters_per_degree_lat = 111320

    meters_per_degree_lon = (
        111320 * np.cos(latitude_radians)
    )

    cell_x = dx * meters_per_degree_lon
    cell_y = dy * meters_per_degree_lat

    dzdx = (
        elevation[1, 2]
        - elevation[1, 0]
    ) / (2 * cell_x)

    dzdy = (
        elevation[2, 1]
        - elevation[0, 1]
    ) / (2 * cell_y)

    slope_radians = np.arctan(
        np.sqrt(
            dzdx ** 2 +
            dzdy ** 2
        )
    )

    slope_degrees = np.degrees(
        slope_radians
    )

    return float(slope_degrees)


# ============================================================
# MAIN
# ============================================================

def main():

    print("===================================")
    print("HIM-Rakshak Slope Extraction")
    print("===================================")

    print("\nLoading terrain data...")

    df = pd.read_csv(
        INPUT_FILE,
        keep_default_na=False
    )

    print(
        "Total records:",
        len(df)
    )

    # --------------------------------------------------------
    # Open DEM tiles
    # --------------------------------------------------------

    dem_files = {}

    for dem_path in sorted(
        DEM_DIR.glob("*.tif")
    ):

        print(
            "Opening:",
            dem_path.name
        )

        dem_files[
            dem_path.name
        ] = rasterio.open(
            dem_path
        )

    print(
        "DEM tiles opened:",
        len(dem_files)
    )

    # --------------------------------------------------------
    # Calculate slope
    # --------------------------------------------------------

    print("\nCalculating slope...")

    slopes = []

    failed = 0

    for i, row in df.iterrows():

        latitude = float(
            row["Latitude"]
        )

        longitude = float(
            row["Longitude"]
        )

        dem_path = find_dem_tile(
            latitude,
            longitude
        )

        if dem_path is None:

            slopes.append(np.nan)

            failed += 1

            continue

        src = dem_files.get(
            dem_path.name
        )

        if src is None:

            slopes.append(np.nan)

            failed += 1

            continue

        try:

            slope = get_slope(
                src,
                longitude,
                latitude
            )

            slopes.append(slope)

        except Exception:

            slopes.append(np.nan)

            failed += 1

        if (i + 1) % 500 == 0:

            print(
                f"Processed "
                f"{i + 1}/{len(df)}"
            )

    # --------------------------------------------------------
    # Add slope
    # --------------------------------------------------------

    df["Slope_deg"] = slopes

    # --------------------------------------------------------
    # Close DEM files
    # --------------------------------------------------------

    for src in dem_files.values():

        src.close()

    # --------------------------------------------------------
    # Save
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

    available = (
        df["Slope_deg"].notna().sum()
    )

    missing = (
        df["Slope_deg"].isna().sum()
    )

    print("\n===================================")
    print("Slope extraction completed")
    print("===================================")

    print(
        "Total records:",
        len(df)
    )

    print(
        "Slope available:",
        available
    )

    print(
        "Slope missing:",
        missing
    )

    print(
        "Failed records:",
        failed
    )

    print("\nOutput file:")
    print(OUTPUT_FILE)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()