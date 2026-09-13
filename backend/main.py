"""
Him-Rakshak - Main Backend (FastAPI)
------------------------------------------
Ties together everything the team has built so far:
  - api/rainfall.py       -> live rainfall (Open-Meteo)
  - api/elevation.py      -> live elevation/slope (Open-Meteo)
  - api/seismic.py        -> live seismic activity (USGS)
  - data/load_historical_data.py -> historical landslide count + proximity
                                     (NASA Global Landslide Catalog, 671 NER records)
  - ml_model/landslide_risk_model.pkl -> trained Random Forest model
  - database/connection.py -> Supabase PostgreSQL

Run with:
    uvicorn backend.main:app --reload
(from the project root folder)
"""

import sys
import os

# Allow importing sibling folders (api/, data/, database/, ml_model/) as
# plain modules, since they are not set up as installable packages.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for folder in ["api", "data", "database", "ml_model"]:
    sys.path.append(os.path.join(ROOT_DIR, folder))

import joblib
import pandas as pd
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Import our own modules (from api/, data/, database/)
import rainfall as rainfall_api
import elevation as elevation_api
import seismic as seismic_api
import landslides as historical_data

from connection import get_db, insert_risk_prediction, insert_field_report, \
    get_recent_predictions, get_all_reports

# ----------------------------------------------------------------------
# App setup
# ----------------------------------------------------------------------

app = FastAPI(title="Him-Rakshak API", version="1.0")

# Allow the dashboard (running on a different port/domain) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your dashboard's actual URL before final deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the ML model once at startup (not on every request - much faster)
MODEL_PATH = os.path.join(ROOT_DIR, "ml_model", "landslide_risk_model.pkl")
model = joblib.load(MODEL_PATH)

# Load the historical landslide dataset once at startup (671 records - small
# enough to keep in memory, avoids re-reading the CSV on every request)
try:
    HISTORICAL_DF = historical_data.load_dataset()
    print(f"✅ Loaded {len(HISTORICAL_DF)} historical landslide records into memory")
except FileNotFoundError as e:
    HISTORICAL_DF = None
    print(f"⚠️ {e}")
    print("⚠️ /predict will use historical_count=0 and nearest_historical_km=None until this is fixed")


# ----------------------------------------------------------------------
# Request/response schemas
# ----------------------------------------------------------------------

class PredictRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: str = None


class FieldReportRequest(BaseModel):
    latitude: float
    longitude: float
    reporter_name: str = None
    description: str = None
    photo_url: str = None
    report_type: str = "crack"  # 'crack' / 'blocked_road' / 'slope_movement'


# ----------------------------------------------------------------------
# Helper: estimate soil moisture from rainfall (no real sensors available)
# ----------------------------------------------------------------------

def estimate_soil_moisture(rainfall_24h_mm: float) -> float:
    """Simple estimate: more recent rainfall -> higher soil saturation.
    This is a documented simplification (see PPT: Current Scope vs Future
    Scope) since real soil-moisture sensors are not deployed in the field."""
    value = 0.3 + (rainfall_24h_mm / 300)
    return round(min(max(value, 0), 1), 3)


# ----------------------------------------------------------------------
# Core: assemble all 6 features for a location, then predict
# ----------------------------------------------------------------------

def build_features_and_predict(lat: float, lon: float):
    # 1. Rainfall (live)
    weather_data = rainfall_api.get_rainfall(lat, lon)
    rainfall_24h = rainfall_api.extract_rainfall_24h(weather_data) if weather_data else 0.0
    if rainfall_24h is None:
        rainfall_24h = 0.0

    # 2. Slope (live, derived from elevation)
    slope_deg = elevation_api.estimate_slope_degrees(lat, lon)
    if slope_deg is None:
        slope_deg = 0.0

    # 3. Soil moisture (estimated from rainfall)
    soil_moisture = estimate_soil_moisture(rainfall_24h)

    # 4 & 5. Historical count + nearest historical distance (from local dataset)
    if HISTORICAL_DF is not None:
        historical_count = historical_data.get_historical_count_near(
            lat, lon, radius_km=50, df=HISTORICAL_DF
        )
        nearest_historical_km = historical_data.get_nearest_historical_distance_km(
            lat, lon, df=HISTORICAL_DF
        )
    else:
        historical_count = 0
        nearest_historical_km = 100.0  # conservative default if dataset missing

    if nearest_historical_km is None:
        nearest_historical_km = 100.0

    # 6. Seismic activity (live)
    seismic_result = seismic_api.get_seismic_risk_factor(lat, lon)
    seismic_magnitude = seismic_result.get("max_magnitude", 0.0) if seismic_result else 0.0

    # ---- Assemble feature vector and predict ----
    features = pd.DataFrame([{
        "rainfall_24h_mm": rainfall_24h,
        "slope_deg": slope_deg,
        "soil_moisture_index": soil_moisture,
        "historical_landslide_count": historical_count,
        "nearest_historical_km": nearest_historical_km,
        "seismic_magnitude": seismic_magnitude,
    }])

    risk_level = model.predict(features)[0]
    proba = dict(zip(model.classes_, model.predict_proba(features)[0]))
    confidence = round(float(proba[risk_level]), 3)

    return {
        "rainfall_24h_mm": rainfall_24h,
        "slope_deg": slope_deg,
        "soil_moisture_index": soil_moisture,
        "historical_landslide_count": historical_count,
        "fault_distance_km": nearest_historical_km,  # stored under this name in DB (schema.sql)
        "seismic_magnitude": seismic_magnitude,
        "risk_level": risk_level,
        "confidence": confidence,
    }


# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------

@app.get("/")
def root():
    return {"message": "Him-Rakshak API is running", "status": "ok"}


@app.post("/predict")
def predict(request: PredictRequest, db: Session = Depends(get_db)):
    """
    Main prediction endpoint. Give it a lat/lon, it fetches all 6 live
    factors, runs the ML model, saves the result to the database, and
    returns the risk assessment.
    """
    try:
        result = build_features_and_predict(request.latitude, request.longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    db_record = {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "location_name": request.location_name,
        **result,
    }
    # Remove keys the DB doesn't expect (defensive, in case of extra fields)
    db_record.pop("risk_level", None)
    db_record["risk_level"] = result["risk_level"]

    try:
        prediction_id = insert_risk_prediction(db, db_record)
    except Exception as e:
        prediction_id = None
        print(f"⚠️ Could not save prediction to database: {e}")

    return {
        "prediction_id": prediction_id,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "location_name": request.location_name,
        **result,
    }


@app.get("/predictions/recent")
def recent_predictions(limit: int = 50, db: Session = Depends(get_db)):
    """Returns the most recent risk predictions - used by the dashboard heatmap."""
    return get_recent_predictions(db, limit=limit)


@app.post("/reports")
def submit_report(report: FieldReportRequest, db: Session = Depends(get_db)):
    """Citizens/field officials submit a geo-tagged report here."""
    try:
        report_id = insert_field_report(db, report.dict())
        return {"report_id": report_id, "status": "submitted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save report: {e}")


@app.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    """Returns all field reports - used by the dashboard."""
    return get_all_reports(db)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)