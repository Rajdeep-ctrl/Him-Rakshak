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
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

for folder in ("api", "data", "database", "ml_model", "alerts"):
    path = os.path.join(ROOT_DIR, folder)
    if path not in sys.path:
        sys.path.insert(0, path)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import elevation as elevation_api
import flood_risk
import rainfall as rainfall_api
import seismic as seismic_api
import landslides as historical_data
import alert_engine
import notification_service

from connection import (
    get_all_reports,
    get_db,
    get_recent_predictions,
    insert_field_report,
    insert_risk_prediction,
    log_alert,
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
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
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
    print("✅ ML model loaded successfully")
    print(f"✅ Model features: {getattr(model, 'feature_names_in_', [])}")
except Exception as exc:
    model = None
    print(f"❌ ML model load failed: {exc}")

try:
    HISTORICAL_DF = historical_data.load_dataset()
    print(f"✅ Loaded {len(HISTORICAL_DF)} historical records (NASA catalog, used for /predict context)")
except Exception as exc:
    HISTORICAL_DF = pd.DataFrame()
    print(f"⚠️ Historical data unavailable: {exc}")

# The team's own extracted-and-engineered dataset (2059 real NER landslide
# records + generated negative samples, with State/Latitude/Longitude/
# slope_deg/rainfall_mm/soil_moisture_mm/label columns). This is what the
# ML model was actually TRAINED on, and is what the dashboard's map and
# analytics endpoints (get_ner_data, risk_zones, state_risk, rainfall_trend)
# need - NOT the smaller NASA catalog above.
TRAINING_DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "training_data_final .csv")
try:
    TRAINING_DF = pd.read_csv(TRAINING_DATA_PATH)
    print(f"✅ Loaded {len(TRAINING_DF)} training records for dashboard from {TRAINING_DATA_PATH}")
except Exception as exc:
    TRAINING_DF = pd.DataFrame()
    print(f"⚠️ Training dataset unavailable at {TRAINING_DATA_PATH}: {exc}")


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


class AlertBroadcastRequest(BaseModel):
    location: str
    district: str = "NER Sector"
    severity: str = "CRITICAL"
    description: str = "Landslide hazard detected. Follow local disaster-management instructions."
    recipient_email: Optional[str] = None


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


def display_dataset_risk(row: Any) -> str:
    """Assign a visible severity to an engineered dataset observation."""
    label = row.get("label", 0)
    if not is_high_risk(label):
        return "Low"

    rainfall = safe_float(row.get("rainfall_mm"))
    slope = safe_float(row.get("slope_deg"))
    if rainfall >= 35 or slope >= 20:
        return "Critical"

    return "High"


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
        print(f"⚠️ Rainfall API failed: {exc}")
        rainfall_mm = 0.0

    try:
        slope_deg = elevation_api.estimate_slope_degrees(
            latitude,
            longitude,
        )
    except Exception as exc:
        print(f"⚠️ Elevation API failed: {exc}")
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
            print(f"⚠️ Historical lookup failed: {exc}")

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
        print(f"⚠️ Seismic API failed: {exc}")
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


# ...existing code...
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
        print(f"⚠️ Database save failed: {exc}")

    # Trigger real SMS + Email alerts if risk is High/Critical
    alert_sent = False
    alert_message = None
    if alert_engine.should_trigger_alert(result.get("risk_level", "")):
        location_label = request.location_name or f"{request.latitude},{request.longitude}"
        alert_payload = {
            "location": location_label,
            "district": request.state or "NER",
            "severity": result.get("risk_level", "HIGH"),
        }

        try:
            sms_results = notification_service.broadcast_regional_sms(
                contacts=[], alert=alert_payload
            )
            email_result = notification_service.send_emergency_email(
                subject=f"{result.get('risk_level', '').upper()} Landslide Risk - {location_label}",
                message_body=(
                    f"A {result.get('risk_level', '')} landslide risk has been detected "
                    f"near {location_label} (confidence: {int((result.get('confidence') or 0) * 100)}%). "
                    f"Please alert district administration and nearby communities."
                ),
            )
            alert_sent = any(r.get("status") in ("delivered", "simulated") for r in sms_results) \
                or email_result.get("status") == "delivered"
            alert_message = f"SMS: {sms_results[0].get('status') if sms_results else 'none'}, " \
                             f"Email: {email_result.get('status')}"
            print(f"📱📧 Alert attempt: {alert_message}")
        except Exception as exc:
            alert_message = f"Alert dispatch failed: {exc}"
            print(f"⚠️ {alert_message}")

    return {
        "prediction_id": prediction_id,
        "alert_sent": alert_sent,
        "alert_message": alert_message,
        **record,
    }
# ...existing code...


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
@app.post("/api/reports")
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

  # ...existing code...
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
# ...existing code...

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

    # Database empty hone par NER historical points return honge
    if not result:
        data = get_ner_data()

        # The engineered dataset is ordered by label, so head(limit) would
        # expose only positive samples and make the map look uniformly high risk.
        sample = data.sample(
            n=min(limit, len(data)),
            random_state=42,
        )

        for index, row in sample.iterrows():
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
                    "risk_level": display_dataset_risk(row),
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

    if len(result) < limit:
        data = get_ner_data()
        sample = data.sample(
            n=min(limit - len(result), len(data)),
            random_state=42,
        )

        for index, row in sample.iterrows():
            risk = display_dataset_risk(row)
            result.append(
                {
                    "id": f"ZONE-{index}",
                    "state": str(row.get("State", "NER")),
                    "district": str(row.get("State", "Regional")),
                    "latitude": safe_float(row.get("Latitude")),
                    "longitude": safe_float(row.get("Longitude")),
                    "severity": risk.upper(),
                    "title": f"{risk} Landslide Risk Zone",
                    "message": "Live risk zone generated from the engineered landslide dataset.",
                    "description": (
                        f"Rainfall: {safe_float(row.get('rainfall_mm')):.1f} mm; "
                        f"slope: {safe_float(row.get('slope_deg')):.1f} degrees."
                    ),
                    "rainfall": safe_float(row.get("rainfall_mm")),
                    "status": "ACTIVE" if risk in {"Critical", "High"} else "MONITORING",
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

    observations = []

    for index, item in enumerate(rows):
        rainfall = safe_float(
            item.get("rainfall_24h_mm"),
            item.get("rainfall_mm", 0.0),
        )

        observations.append({
            "date": item.get("created_at", item.get("timestamp", index)),
            "rainfall": rainfall,
        })

    observations.sort(key=lambda item: str(item["date"]))
    result = []
    cumulative_rainfall = 0.0

    for index, item in enumerate(observations):
        cumulative_rainfall += item["rainfall"]
        result.append({
            "date": item["date"],
            "time": str(item["date"]),
            "rainfall": item["rainfall"],
            "rainfall_24h_mm": item["rainfall"],
            "cumulativeRainfall": round(cumulative_rainfall, 2),
            "criticalThreshold": 100.0,
        })

    if result:
        return result

    data = get_ner_data()

    if "rainfall_mm" in data.columns:
        cumulative_rainfall = 0.0
        for index, row in data.head(limit).iterrows():
            rainfall = safe_float(row.get("rainfall_mm"))
            cumulative_rainfall += rainfall
            result.append(
                {
                    "date": index,
                    "time": str(index),
                    "rainfall": rainfall,
                    "rainfall_24h_mm": rainfall,
                    "cumulativeRainfall": round(cumulative_rainfall, 2),
                    "criticalThreshold": 100.0,
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
        risk_levels = [display_dataset_risk(row) for _, row in group.iterrows()]
        critical_count = risk_levels.count("Critical")
        high_count = risk_levels.count("High")
        total = len(group)

        result.append(
            {
                "state": str(state),
                "total": total,
                "high": high_count,
                "critical": critical_count,
                "medium": 0,
                "low": risk_levels.count("Low"),
            }
        )

    return result


@app.get("/api/reports")
def dashboard_reports(db: Session = Depends(get_db)):
    return get_all_reports(db)


@app.post("/predict-flood")
def predict_flood(request: PredictRequest, db: Session = Depends(get_db)):
    """
    Flood risk endpoint - separate from the landslide /predict endpoint.
    Uses live rainfall + distance to nearest major NER river to assess
    flood risk (Low/Medium/High/Critical).
    """
    try:
        weather_data = rainfall_api.get_rainfall(request.latitude, request.longitude)
        rainfall_24h = rainfall_api.extract_rainfall_24h(weather_data) if weather_data else 0.0
        if rainfall_24h is None:
            rainfall_24h = 0.0

        result = flood_risk.get_flood_risk(
            request.latitude, request.longitude, rainfall_24h
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flood prediction failed: {e}")

    return {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "location_name": request.location_name,
        "rainfall_24h_mm": rainfall_24h,
        **result,
    }


@app.post("/test-alert")
def test_alert(risk_level: str = Query("Critical", description="Low/Medium/High/Critical"),
                location_name: str = Query("Test Location")):
    """
    TEST ONLY - directly triggers the SMS + Email alert system without
    running the ML model, to verify Twilio/Gmail credentials are working.
    Remove or disable this endpoint before final production deployment.
    """
    alert_sent = False
    alert_message = None

    if alert_engine.should_trigger_alert(risk_level):
        alert_payload = {
            "location": location_name,
            "district": "NER Test Sector",
            "severity": risk_level,
        }
        try:
            sms_results = notification_service.broadcast_regional_sms(
                contacts=[], alert=alert_payload
            )
            email_result = notification_service.send_emergency_email(
                subject=f"TEST ALERT - {risk_level.upper()} Risk - {location_name}",
                message_body=(
                    f"This is a TEST alert. Simulated {risk_level} risk detected "
                    f"near {location_name}."
                ),
            )
            alert_sent = True
            alert_message = f"SMS: {sms_results[0].get('status') if sms_results else 'none'}, " \
                             f"Email: {email_result.get('status')}"
        except Exception as exc:
            alert_message = f"Test alert failed: {exc}"
    else:
        alert_message = f"'{risk_level}' does not trigger alerts (only High/Critical do)"

    return {"alert_sent": alert_sent, "alert_message": alert_message}


@app.get("/api/roads")
def roads():
    data = get_ner_data()
    if data.empty or "State" not in data.columns:
        return []

    roads = []
    status_by_risk = {
        "Critical": "BLOCKED",
        "High": "AT RISK",
        "Low": "OPEN",
    }

    for state, group in data.groupby("State"):
        observations = [
            (display_dataset_risk(row), row)
            for _, row in group.iterrows()
        ]
        risk_counts = {
            level: sum(item_risk == level for item_risk, _ in observations)
            for level in ("Critical", "High", "Low")
        }
        vulnerable_count = risk_counts["Critical"] + risk_counts["High"]
        critical_share = risk_counts["Critical"] / len(observations)
        if critical_share >= 0.1:
            risk = "Critical"
        elif vulnerable_count >= risk_counts["Low"]:
            risk = "High"
        else:
            risk = "Low"
        observation = next(
            row for item_risk, row in observations if item_risk == risk
        )
        rainfall = safe_float(observation.get("rainfall_mm"))
        slope = safe_float(observation.get("slope_deg"))

        roads.append(
            {
                "id": f"ROAD-{normalise_state(state).replace(' ', '-')}",
                "name": f"{state} monitored highway network",
                "stretch": "Live risk corridor observations",
                "state": str(state),
                "status": status_by_risk[risk],
                "riskLevel": risk.upper(),
                "lastUpdate": "Live API",
                "cause": (
                    f"{risk} risk observation from {rainfall:.1f} mm rainfall "
                    f"and {slope:.1f} degree slope conditions."
                ),
            }
        )

    return roads


@app.post("/api/alerts/broadcast-sms")
def broadcast_alert(
    payload: AlertBroadcastRequest,
    db: Session = Depends(get_db),
):
    """Dispatch an emergency alert through the configured SMS and email services."""
    alert = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()
    alert["severity"] = alert["severity"].upper()

    try:
        sms_results = notification_service.broadcast_regional_sms(
            contacts=[],
            alert=alert,
        )
        email_result = notification_service.send_emergency_email(
            subject=f"{alert['severity']} Landslide Risk - {alert['location']}",
            message_body=(
                f"{alert['description']} Location: {alert['location']}, "
                f"{alert['district']}."
            ),
            recipient=alert.get("recipient_email"),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Alert dispatch failed: {exc}") from exc

    channel_statuses = [result.get("status") for result in sms_results]
    channel_statuses.append(email_result.get("status"))
    delivered = any(status in {"delivered", "simulated"} for status in channel_statuses)

    try:
        log_alert(
            db,
            {
                "risk_prediction_id": None,
                "location_name": alert["location"],
                "risk_level": alert["severity"],
                "message": alert["description"],
                "language": "en",
                "alert_channel": "sms,email",
                "sent_status": "delivered" if delivered else "failed",
            },
        )
    except Exception as exc:
        print(f"⚠️ Alert dispatch log failed: {exc}")

    return {
        "status": "dispatched" if delivered else "failed",
        "alert_sent": delivered,
        "sms_results": sms_results,
        "email_details": email_result,
    }

class AlertActionRequest(BaseModel):
    alert_id: str
    action: str
    severity: str = "LOW"
    location: Optional[str] = None


@app.post("/api/alerts/action")
def record_alert_action(
    payload: AlertActionRequest,
    db: Session = Depends(get_db),
):
    action = payload.action.strip().lower()
    allowed_actions = {"acknowledged", "assigned response force", "resolved"}
    if action not in allowed_actions:
        raise HTTPException(status_code=400, detail="Unsupported alert action")

    log_alert(
        db,
        {
            "risk_prediction_id": int(payload.alert_id) if payload.alert_id.isdigit() else None,
            "location_name": payload.location or payload.alert_id,
            "risk_level": payload.severity.upper(),
            "message": f"Alert {payload.alert_id} marked {action}",
            "language": "en",
            "alert_channel": "dashboard",
            "sent_status": action,
        },
    )

    return {
        "status": "recorded",
        "alert_id": payload.alert_id,
        "action": action,
    }

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