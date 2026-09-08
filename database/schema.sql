-- ============================================================
-- Him-Rakshak Database Schema
-- Run this in Supabase SQL Editor (left sidebar -> SQL Editor -> New Query)
-- ============================================================

-- 1. RISK PREDICTIONS TABLE
-- Stores every risk-score the ML model generates for a location
CREATE TABLE risk_predictions (
    id SERIAL PRIMARY KEY,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    location_name TEXT,                     -- e.g. "Shillong, Meghalaya"
    rainfall_24h_mm FLOAT,
    slope_deg FLOAT,
    soil_moisture_index FLOAT,
    historical_landslide_count INT,
    fault_distance_km FLOAT,
    seismic_magnitude FLOAT,                -- from USGS Earthquake API
    risk_level TEXT NOT NULL,               -- 'Low' / 'Medium' / 'High' / 'Critical'
    confidence FLOAT,                       -- model's confidence score (0-1)
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. CITIZEN / FIELD REPORTS TABLE
-- Stores geo-tagged reports uploaded via the web-form
CREATE TABLE field_reports (
    id SERIAL PRIMARY KEY,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    reporter_name TEXT,
    description TEXT,                       -- e.g. "Crack seen on hillside"
    photo_url TEXT,                         -- link to uploaded image
    report_type TEXT,                       -- 'crack' / 'blocked_road' / 'slope_movement'
    status TEXT DEFAULT 'pending',          -- 'pending' / 'verified' / 'resolved'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ALERTS LOG TABLE
-- Stores every alert that was triggered (for history + dashboard panel)
CREATE TABLE alerts_log (
    id SERIAL PRIMARY KEY,
    risk_prediction_id INT REFERENCES risk_predictions(id),
    location_name TEXT,
    risk_level TEXT,
    message TEXT,
    language TEXT DEFAULT 'en',             -- 'en' / 'hi' / 'as' (Assamese)
    alert_channel TEXT,                     -- 'sms' / 'whatsapp' / 'app'
    sent_status TEXT DEFAULT 'simulated',   -- 'simulated' / 'sent' / 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. ROAD STATUS TABLE
-- Stores road-connectivity status shown on dashboard
CREATE TABLE road_status (
    id SERIAL PRIMARY KEY,
    road_name TEXT NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    status TEXT DEFAULT 'open',             -- 'open' / 'at_risk' / 'blocked'
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Quick sanity check: run this after creating tables
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';