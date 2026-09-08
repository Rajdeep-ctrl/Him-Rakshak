"""
Him-Rakshak - Database Connection
-----------------------------------
Handles connection to the Supabase PostgreSQL database and provides
simple helper functions to insert/fetch data from the 4 tables:
risk_predictions, field_reports, alerts_log, road_status.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Load DATABASE_URL from .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found. Make sure you have a .env file in the "
        "database/ folder with: DATABASE_URL=your_supabase_connection_string"
    )

# Create the SQLAlchemy engine (this manages the actual connection pool)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

# Session factory - used to talk to the DB safely
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency function - used by FastAPI to get a DB session per-request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """Quick sanity check - run this file directly to test your .env setup."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT NOW();"))
            row = result.fetchone()
            print(f"Connected successfully! Server time: {row[0]}")
    except Exception as e:
        print(f"Connection failed: {e}")


# ----------------------------------------------------------------------
# Helper functions (used by the backend API routes)
# ----------------------------------------------------------------------

def insert_risk_prediction(db, data: dict):
    """Insert a new risk-prediction record. `data` should match the
    risk_predictions table columns."""
    query = text("""
        INSERT INTO risk_predictions
        (latitude, longitude, location_name, rainfall_24h_mm, slope_deg,
         soil_moisture_index, historical_landslide_count, fault_distance_km,
         seismic_magnitude, risk_level, confidence)
        VALUES
        (:latitude, :longitude, :location_name, :rainfall_24h_mm, :slope_deg,
         :soil_moisture_index, :historical_landslide_count, :fault_distance_km,
         :seismic_magnitude, :risk_level, :confidence)
        RETURNING id;
    """)
    result = db.execute(query, data)
    db.commit()
    return result.fetchone()[0]


def get_recent_predictions(db, limit: int = 50):
    """Fetch the most recent risk predictions (used by dashboard heatmap)."""
    query = text("""
        SELECT * FROM risk_predictions
        ORDER BY created_at DESC
        LIMIT :limit;
    """)
    result = db.execute(query, {"limit": limit})
    return [dict(row._mapping) for row in result]


def insert_field_report(db, data: dict):
    """Insert a citizen/field-official report."""
    query = text("""
        INSERT INTO field_reports
        (latitude, longitude, reporter_name, description, photo_url, report_type)
        VALUES
        (:latitude, :longitude, :reporter_name, :description, :photo_url, :report_type)
        RETURNING id;
    """)
    result = db.execute(query, data)
    db.commit()
    return result.fetchone()[0]


def get_all_reports(db):
    """Fetch all field reports (used by dashboard)."""
    query = text("SELECT * FROM field_reports ORDER BY created_at DESC;")
    result = db.execute(query)
    return [dict(row._mapping) for row in result]


def log_alert(db, data: dict):
    """Log an alert that was triggered."""
    query = text("""
        INSERT INTO alerts_log
        (risk_prediction_id, location_name, risk_level, message, language,
         alert_channel, sent_status)
        VALUES
        (:risk_prediction_id, :location_name, :risk_level, :message, :language,
         :alert_channel, :sent_status)
        RETURNING id;
    """)
    result = db.execute(query, data)
    db.commit()
    return result.fetchone()[0]


if __name__ == "__main__":
    # Run this file directly to test your database connection:
    #   python connection.py
    test_connection()