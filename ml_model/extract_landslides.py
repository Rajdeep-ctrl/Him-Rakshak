import csv
import re
from pathlib import Path


# ============================================================
# FILE PATHS
# ============================================================

INPUT_FILE = Path("/tmp/landslides.txt")
OUTPUT_FILE = Path("data/processed/himachal_landslides.csv")


# ============================================================
# DISTRICTS
# ============================================================

DISTRICTS = [
    "Lahaul & Spiti",
    "Lahaul and Spiti",
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra",
    "Kinnaur",
    "Kullu",
    "Mandi",
    "Shimla",
    "Sirmur",
    "Sirmaur",
    "Solan",
    "Una",
    "Nathpa",
]


# ============================================================
# MOVEMENT TYPES
# ============================================================

MOVEMENTS = [
    "Slide/Subsidenc",
    "Flow/Subsidenc",
    "Subsidence/Slid",
    "Subsidence/Flo",
    "Subsidence/",
    "Ground Cracks",
    "Fall/Slide",
    "Falls",
    "Complex",
    "Composite",
    "Subsidence",
    "Topple",
    "Slump",
    "Creep",
    "Slide",
    "Fall",
    "Flow",
    "NA",
    "----",
]


# ============================================================
# FIND COORDINATES
# ============================================================

def find_coordinates(rest):
    """
    Extract latitude and longitude from a GSI record.

    The source contains road numbers such as:
        NH 22
        SH 9
        NH 305
        NH72
        MDR3

    These must not be confused with coordinates.

    Approximate Himachal Pradesh coordinate range:
        Latitude  : 29.5 - 34.5
        Longitude : 74.0 - 81.0
    """

    number_pattern = r"-?\d+(?:\.\d+)?"

    # Find every number with its exact position.
    numbers = list(
        re.finditer(
            number_pattern,
            rest,
        )
    )

    valid_pairs = []

    # Check every pair of consecutive numbers.
    for i in range(len(numbers) - 1):

        lat_match = numbers[i]
        lon_match = numbers[i + 1]

        lat = float(lat_match.group())
        lon = float(lon_match.group())

        # Check whether this looks like a real
        # Himachal latitude/longitude pair.
        if (
            29.5 <= lat <= 34.5
            and
            74.0 <= lon <= 81.0
        ):
            valid_pairs.append(
                (
                    lat_match,
                    lon_match,
                )
            )

    if not valid_pairs:
        return None

    # Use the last valid geographic pair.
    lat_match, lon_match = valid_pairs[-1]

    return {
        "latitude": lat_match.group(),
        "longitude": lon_match.group(),
        "start": lat_match.start(),
        "end": lon_match.end(),
    }


# ============================================================
# FIND DISTRICT + LOCATION
# ============================================================

def find_district_and_location(text):
    """
    Identify district and location.

    Example:

        Shimla NH 22

    becomes:

        District = Shimla
        Location = NH 22
    """

    text = re.sub(
        r"\s+",
        " ",
        text,
    ).strip()

    # Longest names first.
    sorted_districts = sorted(
        DISTRICTS,
        key=len,
        reverse=True,
    )

    for district in sorted_districts:

        # Exact district.
        if text.lower() == district.lower():
            return district, ""

        # District + location.
        pattern = (
            r"^"
            + re.escape(district)
            + r"(?:\s+|$)"
        )

        match = re.match(
            pattern,
            text,
            re.IGNORECASE,
        )

        if match:

            location = text[
                match.end():
            ].strip()

            return district, location

    return None, None


# ============================================================
# FIND MOVEMENT
# ============================================================

def find_movement(text):
    """
    Find movement type from the text.

    Returns:
        movement
        start position
        end position
    """

    found = []

    for movement in MOVEMENTS:

        pattern = (
            r"(?<!\S)"
            + re.escape(movement)
            + r"(?!\S)"
        )

        for match in re.finditer(
            pattern,
            text,
            re.IGNORECASE,
        ):

            found.append(
                (
                    match.start(),
                    match.end(),
                    match.group(0).strip(),
                )
            )

    if not found:
        return None

    # Movement occurring furthest to the right.
    start, end, movement = max(
        found,
        key=lambda item: item[0],
    )

    return movement, start, end


# ============================================================
# NORMALIZE MOVEMENT
# ============================================================

def normalize_movement(movement):

    value = movement.strip().lower()

    mapping = {
        "slide": "Slide",
        "fall": "Fall",
        "flow": "Flow",
        "creep": "Creep",
        "topple": "Topple",
        "composite": "Composite",
        "subsidence": "Subsidence",
        "slump": "Slump",
        "na": "NA",
        "----": "NA",
        "slide/subsidenc": "Slide/Subsidenc",
        "flow/subsidenc": "Flow/Subsidenc",
        "subsidence/slid": "Subsidence/Slid",
        "ground cracks": "Ground Cracks",
        "fall/slide": "Fall/Slide",
        "complex": "Complex",
        "falls": "Falls",
        "subsidence/flo": "Subsidence/Flo",
        "subsidence/": "Subsidence/",
    }

    return mapping.get(
        value,
        movement.strip(),
    )

# ============================================================
# PARSE ONE RECORD
# ============================================================

def parse_record(line):

    line = line.strip()

    # --------------------------------------------------------
    # Extract:
    #
    # Sl_No
    # Slide_No
    # text after "Himachal Pradesh"
    #
    # Non-greedy HP pattern is intentional because some
    # Slide_No values contain spaces.
    # --------------------------------------------------------

    start = re.match(
        r"^(\d+)\s+(HP/.*?)\s+Himachal Pradesh\s+(.*)$",
        line,
        re.IGNORECASE,
    )

    if not start:
        return None

    sl_no = start.group(1).strip()

    slide_no = start.group(2).strip()

    rest = start.group(3).strip()

    # --------------------------------------------------------
    # Coordinates
    # --------------------------------------------------------

    coord = find_coordinates(rest)

    if coord is None:
        return None

    latitude = coord["latitude"]

    longitude = coord["longitude"]

    coord_start = coord["start"]

    coord_end = coord["end"]

    before_coords = rest[
        :coord_start
    ].strip()

    after_coords = rest[
        coord_end:
    ].strip()

    # --------------------------------------------------------
    # District + Location
    # --------------------------------------------------------

    district, location = (
        find_district_and_location(
            before_coords
        )
    )

    if district is None:
        return None

    # Normalize district.
    if district.lower() == "lahaul and spiti":
        district = "Lahaul & Spiti"

    # --------------------------------------------------------
    # Movement
    # --------------------------------------------------------

    movement_result = find_movement(
        after_coords
    )

    if movement_result is None:
        return None

    (
        movement,
        movement_start,
        movement_end,
    ) = movement_result

    movement = normalize_movement(
        movement
    )

    # --------------------------------------------------------
    # Material
    # --------------------------------------------------------

    material = after_coords[
        :movement_start
    ].strip()

    # --------------------------------------------------------
    # History
    # --------------------------------------------------------

    history = after_coords[
        movement_end:
    ].strip()

    # --------------------------------------------------------
    # Return record
    # --------------------------------------------------------

    return [
        sl_no,
        slide_no,
        district,
        location,
        latitude,
        longitude,
        material,
        movement,
        history,
    ]


# ============================================================
# MAIN
# ============================================================

def main():

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    records = []

    failed = []

    # --------------------------------------------------------
    # Read source
    # --------------------------------------------------------

    with INPUT_FILE.open(
        "r",
        encoding="utf-8",
        errors="ignore",
    ) as file:

        for line_no, line in enumerate(
            file,
            1,
        ):

            # Only process records beginning
            # with a serial number followed by HP/.
            if not re.match(
                r"^\s*\d+\s+HP/",
                line,
                re.IGNORECASE,
            ):
                continue

            record = parse_record(line)

            if record is not None:

                records.append(record)

            else:

                failed.append(
                    (
                        line_no,
                        line.rstrip(),
                    )
                )

    # --------------------------------------------------------
    # Write CSV
    # --------------------------------------------------------

    with OUTPUT_FILE.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as file:

        writer = csv.writer(file)

        writer.writerow(
            [
                "Sl_No",
                "Slide_No",
                "District",
                "Location",
                "Latitude",
                "Longitude",
                "Material_Involved",
                "Movement",
                "History",
            ]
        )

        writer.writerows(records)

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print()
    print("===================================")
    print("HIM-Rakshak Landslide Extraction")
    print("===================================")

    print(
        "Records extracted:",
        len(records),
    )

    print(
        "Records not parsed:",
        len(failed),
    )

    print(
        "Output file:",
        OUTPUT_FILE,
    )

    # --------------------------------------------------------
    # Failed records
    # --------------------------------------------------------

    if failed:

        print()
        print(
            "First 20 failed records:"
        )

        for line_no, line in failed[:20]:

            print(
                f"{line_no}: {line}"
            )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()