"""
Him-Rakshak - Database Connection
-----------------------------------
Handles connection to the Supabase PostgreSQL database and provides
simple helper functions to insert/fetch data from the 4 tables:
risk_predictions, field_reports, alerts_log, road_status.

If a DATABASE_URL is not configured (for example in local development),
this module falls back to a local SQLite database so the app can still run.
"""

import os
import sqlite3
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_DIR = Path(__file__).resolve().parent
ROOT_DIR = DB_DIR.parent
for env_path in (DB_DIR / ".env", ROOT_DIR / ".env"):
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")


def _postgres_driver_available() -> bool:
    try:
        import psycopg2  # noqa: F401
        return True
    except ModuleNotFoundError:
        return False


def _initialize_sqlite_schema() -> str:
    """Create the local SQLite schema when a database URL is not configured."""
    db_path = DB_DIR / "him_rakshak.db"

    with sqlite3.connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS risk_predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                location_name TEXT,
                rainfall_24h_mm REAL,
                slope_deg REAL,
                soil_moisture_index REAL,
                historical_landslide_count INTEGER,
                fault_distance_km REAL,
                seismic_magnitude REAL,
                risk_level TEXT NOT NULL,
                confidence REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS field_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                reporter_name TEXT,
                description TEXT,
                photo_url TEXT,
                report_type TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                risk_prediction_id INTEGER,
                location_name TEXT,
                risk_level TEXT,
                message TEXT,
                language TEXT DEFAULT 'en',
                alert_channel TEXT,
                sent_status TEXT DEFAULT 'simulated',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS road_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                road_name TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                status TEXT DEFAULT 'open',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS local_contacts (
                id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                district TEXT NOT NULL,
                village_or_zone TEXT NOT NULL,
                language_pref TEXT DEFAULT 'en',
                role TEXT DEFAULT 'citizen',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()

    return f"sqlite:///{db_path.as_posix()}"


if DATABASE_URL and DATABASE_URL.startswith(("postgresql://", "postgres://")) and not _postgres_driver_available():
    print("⚠️ psycopg2 is not installed for the configured PostgreSQL DATABASE_URL. Falling back to local SQLite database.")
    DATABASE_URL = None

if not DATABASE_URL:
    DATABASE_URL = _initialize_sqlite_schema()
    print("⚠️ DATABASE_URL not found or unusable. Using local SQLite database at database/him_rakshak.db")

# Create the SQLAlchemy engine (this manages the actual connection pool)
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, **engine_kwargs)

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
            if DATABASE_URL.startswith("sqlite"):
                result = conn.execute(text("SELECT datetime('now');"))
            else:
                result = conn.execute(text("SELECT NOW();"))
            row = result.fetchone()
            print(f" Connected successfully! Server time: {row[0]}")
    except Exception as exc:
        print(f" Connection failed: {exc}")


# ----------------------------------------------------------------------
# Helper functions (used by the backend API routes)
# ----------------------------------------------------------------------

def _execute_insert_and_return_id(db, query: str, params: dict):
    """Support both PostgreSQL RETURNING and SQLite lastrowid semantics."""
    result = db.execute(text(query), params)
    db.commit()

    try:
        row = result.fetchone()
        if row is not None:
            return row[0]
    except Exception:
        pass

    return getattr(result, "lastrowid", None)


def insert_risk_prediction(db, data: dict):
    """Insert a new risk-prediction record. `data` should match the
    risk_predictions table columns."""
    query = """
        INSERT INTO risk_predictions
        (latitude, longitude, location_name, rainfall_24h_mm, slope_deg,
         soil_moisture_index, historical_landslide_count, fault_distance_km,
         seismic_magnitude, risk_level, confidence)
        VALUES
        (:latitude, :longitude, :location_name, :rainfall_24h_mm, :slope_deg,
         :soil_moisture_index, :historical_landslide_count, :fault_distance_km,
         :seismic_magnitude, :risk_level, :confidence)
    """
    if not DATABASE_URL.startswith("sqlite"):
        query += " RETURNING id;"
    return _execute_insert_and_return_id(db, query, data)


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
    query = """
        INSERT INTO field_reports
        (latitude, longitude, reporter_name, description, photo_url, report_type)
        VALUES
        (:latitude, :longitude, :reporter_name, :description, :photo_url, :report_type)
    """
    if not DATABASE_URL.startswith("sqlite"):
        query += " RETURNING id;"
    return _execute_insert_and_return_id(db, query, data)


def get_all_reports(db):
    """Fetch all field reports (used by dashboard)."""
    query = text("SELECT * FROM field_reports ORDER BY created_at DESC;")
    result = db.execute(query)
    return [dict(row._mapping) for row in result]


def log_alert(db, data: dict):
    """Log an alert that was triggered."""
    query = """
        INSERT INTO alerts_log
        (risk_prediction_id, location_name, risk_level, message, language,
         alert_channel, sent_status)
        VALUES
        (:risk_prediction_id, :location_name, :risk_level, :message, :language,
         :alert_channel, :sent_status)
    """
    if not DATABASE_URL.startswith("sqlite"):
        query += " RETURNING id;"
    return _execute_insert_and_return_id(db, query, data)


if __name__ == "__main__":
    # Run this file directly to test your database connection:
    #   python connection.py
    test_connection()