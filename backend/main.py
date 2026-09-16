from __future__ import annotations

import os
import sys
from typing import Any, Optional

import joblib
import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for folder in ("backend", "api", "data", "database", "ml_model"):
    path = os.path.join(ROOT_DIR, folder)
    if path not in sys.path:
        sys.path.insert(0, path)

import elevation as elevation_api
import rainfall as rainfall_api
import seismic as seismic_api
import landslides as historical_data

from connection import (
    get_all_reports,
    get_db,
    get_recent_predictions,
    insert_field_report,
    insert_risk_prediction,
)

app = FastAPI(title="Him-Rakshak API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(
    ROOT_DIR,
    "ml_model",
    "landslide_risk_model.pkl",
)

NER_STATES = {
    "arunachal pradesh",
    "assam",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "sikkim",
    "tripura",
}

try:
    model = joblib.load(MODEL_PATH)
    print(" ML model loaded successfully")
    print(f"Model features: {getattr(model, 'feature_names_in_', [])}")
except Exception as exc:
    model = None
    print(f" ML model load failed: {exc}")

try:
    HISTORICAL_DF = historical_data.load_dataset()
    print(f" Loaded {len(HISTORICAL_DF)} historical records (NASA catalog, used for /predict context)")
except Exception as exc:
    HISTORICAL_DF = pd.DataFrame()
    print(f" Historical data unavailable: {exc}")


TRAINING_DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "training_data_final .csv")
try:
    TRAINING_DF = pd.read_csv(TRAINING_DATA_PATH)
    print(f" Loaded {len(TRAINING_DF)} training records for dashboard from {TRAINING_DATA_PATH}")
except Exception as exc:
    TRAINING_DF = pd.DataFrame()
    print(f" Training dataset unavailable at {TRAINING_DATA_PATH}: {exc}")


class PredictRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    location_name: Optional[str] = None
    state: Optional[str] = None


class FieldReportRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    reporter_name: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    report_type: str = "crack"


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def row_to_dict(row: Any) -> dict:
    if isinstance(row, dict):
        return row

    if hasattr(row, "_mapping"):
        return dict(row._mapping)

    if hasattr(row, "model_dump"):
        return row.model_dump()

    if hasattr(row, "__dict__"):
        return {
            key: value
            for key, value in row.__dict__.items()
            if not key.startswith("_")
        }

    return {}


def rows_to_dicts(rows: Any) -> list[dict]:
    if rows is None:
        return []

    if isinstance(rows, dict):
        rows = rows.get("data", [rows])

    return [row_to_dict(row) for row in rows]


def normalise_state(value: Any) -> str:
    return " ".join(
        str(value or "").strip().lower().split()
    )


def is_high_risk(value: Any) -> bool:
    value = str(value).strip().lower()

    return value in {
        "1",
        "high",
        "critical",
        "very high",
        "severe",
    }


def display_risk(value: Any) -> str:
    return "High" if is_high_risk(value) else "Low"


def get_ner_data() -> pd.DataFrame:
    if TRAINING_DF is None or TRAINING_DF.empty:
        return pd.DataFrame()

    if "State" not in TRAINING_DF.columns:
        return TRAINING_DF.copy()

    data = TRAINING_DF.copy()
    data["_state_normalised"] = data["State"].apply(
        normalise_state
    )

    return data[
        data["_state_normalised"].isin(NER_STATES)
    ].copy()


def build_features_and_predict(
    latitude: float,
    longitude: float,
) -> dict:
    if model is None:
        raise RuntimeError("ML model load nahi hua")

    try:
        weather_data = rainfall_api.get_rainfall(
            latitude,
            longitude,
        )

        rainfall_mm = (
            rainfall_api.extract_rainfall_24h(weather_data)
            if weather_data
            else 0.0
        )
    except Exception as exc:
        print(f" Rainfall API failed: {exc}")
        rainfall_mm = 0.0

    try:
        slope_deg = elevation_api.estimate_slope_degrees(
            latitude,
            longitude,
        )
    except Exception as exc:
        print(f" Elevation API failed: {exc}")
        slope_deg = 0.0

    rainfall_mm = max(safe_float(rainfall_mm), 0.0)
    slope_deg = max(safe_float(slope_deg), 0.0)

    historical_count = 0
    nearest_distance_km = 100.0

    if HISTORICAL_DF is not None and not HISTORICAL_DF.empty:
        try:
            historical_count = (
                historical_data.get_historical_count_near(
                    latitude,
                    longitude,
                    radius_km=50,
                    df=HISTORICAL_DF,
                )
            )

            nearest_distance_km = (
                historical_data.get_nearest_historical_distance_km(
                    latitude,
                    longitude,
                    df=HISTORICAL_DF,
                )
                or 100.0
            )
        except Exception as exc:
            print(f" Historical lookup failed: {exc}")

    try:
        seismic_data = (
            seismic_api.get_seismic_risk_factor(
                latitude,
                longitude,
            )
            or {}
        )

        seismic_magnitude = safe_float(
            seismic_data.get("max_magnitude"),
            0.0,
        )
    except Exception as exc:
        print(f" Seismic API failed: {exc}")
        seismic_magnitude = 0.0

    # Model ke exact features
    soil_moisture_mm = max(rainfall_mm * 0.3, 0.0)

    features = pd.DataFrame(
        [
            {
                "Latitude": latitude,
                "Longitude": longitude,
                "slope_deg": slope_deg,
                "rainfall_mm": rainfall_mm,
                "soil_moisture_mm": soil_moisture_mm,
            }
        ],
        columns=[
            "Latitude",
            "Longitude",
            "slope_deg",
            "rainfall_mm",
            "soil_moisture_mm",
        ],
    )

    prediction = model.predict(features)[0]
    risk_level = display_risk(prediction)

    confidence = None

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)[0]
        confidence = round(
            float(max(probabilities)),
            3,
        )

    return {
        "rainfall_24h_mm": rainfall_mm,
        "rainfall_mm": rainfall_mm,
        "slope_deg": slope_deg,
        "soil_moisture_mm": soil_moisture_mm,
        "soil_moisture_index": round(
            min(max(0.3 + rainfall_mm / 300, 0), 1),
            3,
        ),
        "historical_landslide_count": int(
            historical_count or 0
        ),
        "fault_distance_km": safe_float(
            nearest_distance_km,
            100.0,
        ),
        "nearest_historical_km": safe_float(
            nearest_distance_km,
            100.0,
        ),
        "seismic_magnitude": seismic_magnitude,
        "risk_level": risk_level,
        "risk_label": risk_level,
        "confidence": confidence,
    }


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "Him-Rakshak API is running",
        "region": "North Eastern Region of India",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "historical_data_loaded": not HISTORICAL_DF.empty,
        "region": "NER",
        "states": sorted(NER_STATES),
    }


@app.get("/api/ner/states")
def ner_states():
    data = get_ner_data()

    if data.empty or "State" not in data.columns:
        return sorted(NER_STATES)

    return sorted(
        data["State"]
        .dropna()
        .astype(str)
        .unique()
        .tolist()
    )



@app.post("/predict")
def predict(
    request: PredictRequest,
    db: Session = Depends(get_db),
):
    if not request.state:
        raise HTTPException(
            status_code=400,
            detail="NER state is required",
        )

    state = normalise_state(request.state)

    if state not in NER_STATES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only NER states are supported: "
                + ", ".join(sorted(NER_STATES))
            ),
        )

    try:
        result = build_features_and_predict(
            request.latitude,
            request.longitude,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Prediction failed: {exc}",
        ) from exc

    record = {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "location_name": request.location_name,
        "state": state,
        **result,
    }

    try:
        prediction_id = insert_risk_prediction(db, record)
    except Exception as exc:
        prediction_id = None
        print(f" Database save failed: {exc}")

    return {
        "prediction_id": prediction_id,
        **record,
    }



@app.get("/predictions/recent")
def recent_predictions(
    limit: int = Query(50, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_recent_predictions(
        db,
        limit=limit,
    )


@app.post("/reports")
def submit_report(
    report: FieldReportRequest,
    db: Session = Depends(get_db),
):
    try:
        data = (
            report.model_dump()
            if hasattr(report, "model_dump")
            else report.dict()
        )

        report_id = insert_field_report(db, data)

        return {
            "report_id": report_id,
            "status": "submitted",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save report: {exc}",
        ) from exc


@app.get("/reports")
def reports(db: Session = Depends(get_db)):
    return get_all_reports(db)


@app.get("/api/risk-zones")
def risk_zones(
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db),
):
    rows = rows_to_dicts(
        get_recent_predictions(db, limit=limit)
    )

    result = []

  
    for item in rows:
        item_state = normalise_state(item.get("state"))

        # Sirf NER states; Dehradun/other states exclude
        if item_state not in NER_STATES:
            continue

        latitude = item.get(
            "latitude",
            item.get("lat"),
        )
        longitude = item.get(
            "longitude",
            item.get("lng", item.get("lon")),
        )


        if latitude is None or longitude is None:
            continue

        result.append(
            {
                **item,
                "latitude": safe_float(latitude),
                "longitude": safe_float(longitude),
                "lat": safe_float(latitude),
                "lng": safe_float(longitude),
                "risk_level": display_risk(
                    item.get("risk_level", "low")
                ),
            }
        )

    
    if not result:
        data = get_ner_data()

        for index, row in data.head(limit).iterrows():
            latitude = row.get("Latitude")
            longitude = row.get("Longitude")

            if pd.isna(latitude) or pd.isna(longitude):
                continue

            label = row.get("label", 0)

            result.append(
                {
                    "id": str(index),
                    "state": row.get("State", "Unknown"),
                    "latitude": safe_float(latitude),
                    "longitude": safe_float(longitude),
                    "lat": safe_float(latitude),
                    "lng": safe_float(longitude),
                    "risk_level": display_risk(label),
                    "label": safe_float(label),
                    "slope_deg": safe_float(
                        row.get("slope_deg")
                    ),
                    "rainfall_mm": safe_float(
                        row.get("rainfall_mm")
                    ),
                    "soil_moisture_mm": safe_float(
                        row.get("soil_moisture_mm")
                    ),
                }
            )

    return result


@app.get("/api/alerts")
def alerts(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = rows_to_dicts(
        get_recent_predictions(db, limit=limit)
    )

    result = []

    for item in rows:
        risk = item.get("risk_level", "low")

        if is_high_risk(risk):
            result.append(
                {
                    **item,
                    "severity": "high",
                    "title": "High Landslide Risk",
                    "message": (
                        "Risk detected near "
                        f"{item.get('location_name', 'NER location')}"
                    ),
                }
            )

    return result[:limit]


@app.get("/api/analytics/rainfall-trend")
def rainfall_trend(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = rows_to_dicts(
        get_recent_predictions(db, limit=limit)
    )

    result = []

    for index, item in enumerate(rows):
        rainfall = safe_float(
            item.get("rainfall_24h_mm"),
            item.get("rainfall_mm", 0.0),
        )

        result.append(
            {
                "date": item.get(
                    "created_at",
                    item.get("timestamp", index),
                ),
                "rainfall": rainfall,
                "rainfall_24h_mm": rainfall,
            }
        )

    if result:
        return result

    data = get_ner_data()

    if "rainfall_mm" in data.columns:
        for index, row in data.head(limit).iterrows():
            result.append(
                {
                    "date": index,
                    "rainfall": safe_float(
                        row.get("rainfall_mm")
                    ),
                    "rainfall_24h_mm": safe_float(
                        row.get("rainfall_mm")
                    ),
                }
            )

    return result


@app.get("/api/analytics/state-risk")
def state_risk():
    data = get_ner_data()

    if data.empty or "State" not in data.columns:
        return []

    result = []

    for state, group in data.groupby("State"):
        high_count = 0

        if "label" in group.columns:
            high_count = sum(
                is_high_risk(value)
                for value in group["label"]
            )

        total = len(group)

        result.append(
            {
                "state": str(state),
                "total": total,
                "high": high_count,
                "critical": high_count,
                "medium": 0,
                "low": total - high_count,
            }
        )

    return result


@app.get("/api/reports")
def dashboard_reports(db: Session = Depends(get_db)):
    return get_all_reports(db)


@app.get("/api/roads")
def roads():
    return []


@app.get("/api/satellite-image")
def satellite_image(latitude: float = Query(...), longitude: float = Query(...),
                     half_width_deg: float = Query(0.5, description="Zoom level - smaller = closer zoom")):
    """
    Returns a ready-to-use NASA satellite image URL for a given location.
    This does NOT download/process anything server-side - it just builds
    the URL. The frontend puts this directly in an <img src="..."> tag,
    so NASA's server handles the actual image loading (fast, no added
    latency to this endpoint or to /predict).
    """
    from datetime import datetime, timedelta, timezone

    min_lon = longitude - half_width_deg
    max_lon = longitude + half_width_deg
    min_lat = latitude - half_width_deg
    max_lat = latitude + half_width_deg
    bbox = f"{min_lon},{min_lat},{max_lon},{max_lat}"

    # Use yesterday's date (today's imagery often isn't processed yet)
    date = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")

    image_url = (
        "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
        "?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap"
        "&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor"
        "&STYLES=&FORMAT=image/jpeg&TRANSPARENT=false"
        "&HEIGHT=512&WIDTH=512&SRS=EPSG:4326"
        f"&BBOX={bbox}&TIME={date}"
    )

    return {
        "latitude": latitude,
        "longitude": longitude,
        "date": date,
        "image_url": image_url,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )