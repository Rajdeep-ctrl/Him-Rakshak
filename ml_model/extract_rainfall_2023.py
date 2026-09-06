import pandas as pd
import xarray as xr
import re
from pathlib import Path


# ============================================================
# FILE PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INPUT_FILE = (
    PROJECT_ROOT
    / "data/processed/landslide_processed_clean.csv"
)

RAINFALL_FILE = (
    PROJECT_ROOT
    / "data/raw/rainfall/RF25_ind2023_rfp25.nc"
)

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data/processed/landslide_rainfall_2023.csv"
)


# ============================================================
# EXTRACT 2023 DATES
# ============================================================

def extract_2023_dates(history):

    text = str(history)

    # Remove ordinal suffixes
    text = re.sub(
        r"(\d{1,2})(st|nd|rd|th)",
        r"\1",
        text,
        flags=re.IGNORECASE
    )

    months = (
        "January|February|March|April|May|June|"
        "July|August|September|October|November|December"
    )

    dates = []

    # --------------------------------------------------------
    # Case 1:
    # 08 – 11 July 2023
    # 08-11 July 2023
    # --------------------------------------------------------

    range_pattern = re.compile(
        rf"(\d{{1,2}})\s*[-–]\s*(\d{{1,2}})"
        rf"\s+({months})\s+2023",
        re.IGNORECASE
    )

    for match in range_pattern.finditer(text):

        start_day = int(match.group(1))
        end_day = int(match.group(2))
        month = match.group(3)

        for day in range(start_day, end_day + 1):

            dates.append(
                f"{day} {month} 2023"
            )

    # Remove ranges before processing other formats
    text_without_ranges = range_pattern.sub("", text)

    # --------------------------------------------------------
    # Case 2:
    # 13 and 14 August 2023
    # --------------------------------------------------------

    and_pattern = re.compile(
        rf"(\d{{1,2}})\s+and\s+(\d{{1,2}})"
        rf"\s+({months})\s+2023",
        re.IGNORECASE
    )

    for match in and_pattern.finditer(
        text_without_ranges
    ):

        dates.append(
            f"{int(match.group(1))} "
            f"{match.group(3)} 2023"
        )

        dates.append(
            f"{int(match.group(2))} "
            f"{match.group(3)} 2023"
        )

    text_without_ranges = and_pattern.sub(
        "",
        text_without_ranges
    )

    # --------------------------------------------------------
    # Case 3:
    # 08,09 July 2023
    # 14,15 August 2023
    # --------------------------------------------------------

    comma_pattern = re.compile(
        rf"(\d{{1,2}})\s*,\s*(\d{{1,2}})"
        rf"\s+({months})\s+2023",
        re.IGNORECASE
    )

    for match in comma_pattern.finditer(
        text_without_ranges
    ):

        dates.append(
            f"{int(match.group(1))} "
            f"{match.group(3)} 2023"
        )

        dates.append(
            f"{int(match.group(2))} "
            f"{match.group(3)} 2023"
        )

    text_without_ranges = comma_pattern.sub(
        "",
        text_without_ranges
    )

    # --------------------------------------------------------
    # Case 4:
    # Single date
    # 14 August 2023
    # 17 August 2023
    # --------------------------------------------------------

    single_pattern = re.compile(
        rf"\b(\d{{1,2}})\s+({months})\s+2023\b",
        re.IGNORECASE
    )

    for match in single_pattern.finditer(
        text_without_ranges
    ):

        dates.append(
            f"{int(match.group(1))} "
            f"{match.group(2)} 2023"
        )

    # --------------------------------------------------------
    # Remove duplicates while preserving order
    # --------------------------------------------------------

    unique_dates = []

    for date in dates:

        if date not in unique_dates:

            unique_dates.append(date)

    return unique_dates


# ============================================================
# MAIN
# ============================================================

def main():

    print("===================================")
    print("HIM-Rakshak 2023 Rainfall")
    print("===================================")

    # --------------------------------------------------------
    # Load landslide data
    # --------------------------------------------------------

    print("\nLoading landslide data...")

    df = pd.read_csv(
        INPUT_FILE,
        keep_default_na=False
    )

    print(
        "Total records:",
        len(df)
    )

    # --------------------------------------------------------
    # Open rainfall dataset
    # --------------------------------------------------------

    print("\nOpening IMD rainfall dataset...")

    rain = xr.open_dataset(
        RAINFALL_FILE
    )

    rainfall = rain["RAINFALL"]

    print(
        "Rainfall days:",
        len(rain.TIME)
    )

    print(
        "Latitude range:",
        float(rain.LATITUDE.min()),
        "to",
        float(rain.LATITUDE.max())
    )

    print(
        "Longitude range:",
        float(rain.LONGITUDE.min()),
        "to",
        float(rain.LONGITUDE.max())
    )

    # --------------------------------------------------------
    # Extract rainfall
    # --------------------------------------------------------

    rainfall_values = []

    matched_dates = []

    for i, row in df.iterrows():

        history = str(
            row["History"]
        )

        dates = extract_2023_dates(
            history
        )

        if not dates:

            rainfall_values.append("")
            matched_dates.append("")

            continue

        lat = float(
            row["Latitude"]
        )

        lon = float(
            row["Longitude"]
        )

        values = []

        valid_dates = []

        for date_text in dates:

            try:

                date = pd.to_datetime(
                    date_text,
                    format="%d %B %Y"
                )

                value = rainfall.sel(
                    TIME=date,
                    LATITUDE=lat,
                    LONGITUDE=lon,
                    method="nearest"
                )

                value = float(
                    value.values
                )

                if pd.notna(value):

                    values.append(
                        value
                    )

                    valid_dates.append(
                        date.strftime(
                            "%Y-%m-%d"
                        )
                    )

            except Exception:

                continue

        if values:

            # Peak rainfall during the
            # reported 2023 event dates.
            rainfall_values.append(
                max(values)
            )

            matched_dates.append(
                ", ".join(valid_dates)
            )

        else:

            rainfall_values.append("")
            matched_dates.append("")

        if (i + 1) % 500 == 0:

            print(
                f"Processed "
                f"{i + 1}/{len(df)}"
            )

    # --------------------------------------------------------
    # Add columns
    # --------------------------------------------------------

    df["Rainfall_2023_mm"] = (
        rainfall_values
    )

    df["Rainfall_Dates_2023"] = (
        matched_dates
    )

    # --------------------------------------------------------
    # Close NetCDF
    # --------------------------------------------------------

    rain.close()

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    matched = (
        df["Rainfall_2023_mm"]
        .astype(str)
        .str.strip()
        .ne("")
        .sum()
    )

    missing = len(df) - matched

    print("\n===================================")
    print("2023 Rainfall Extraction Complete")
    print("===================================")

    print(
        "Total records:",
        len(df)
    )

    print(
        "Rainfall matched:",
        matched
    )

    print(
        "Rainfall unavailable:",
        missing
    )

    print("\nOutput:")
    print(OUTPUT_FILE)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()