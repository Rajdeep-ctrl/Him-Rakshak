# Him-Rakshak 

**AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region (NER)**

Built for **Smart India Hackathon 2026** — Problem Statement **SIH26001**

---

##  Problem Statement

| | |
|---|---|
| **Organization** | Ministry of Development of North Eastern Region (MDoNER) |
| **Category** | Software |
| **Theme** | Disaster Management |

The North Eastern Region frequently faces landslides, flash floods, and road blockages due to heavy rainfall and fragile terrain. Monitoring today is reactive and manual. **Him-Rakshak** shifts this to a **predictive, real-time AI-based early-warning system.**

---

##  What It Does

-  Collects real-time rainfall data from the **IMD Public Weather API**
-  Uses terrain/slope data (SRTM / ISRO Bhuvan) and historical landslide records (GSI Bhukosh)
-  ML model (Random Forest / XGBoost) classifies zones into **Low / Medium / High / Critical** risk
-  Live **GIS dashboard** with risk heatmaps, road-connectivity status, weather forecasts, and emergency-response prioritisation
-  Citizens/field officials can upload **geo-tagged photos/videos** of cracks or blocked roads
-  Automated **multilingual (English/Hindi/Assamese)** alerts to authorities and communities

---

##  Architecture

```
IMD API + GSI Historical Data + Bhuvan/SRTM Terrain
                    │
                    ▼
        Data Pipeline & Feature Engineering
                    │
                    ▼
      ML Risk Prediction Model (Random Forest / XGBoost)
                    │
                    ▼
        FastAPI Backend  ──────►  PostgreSQL (Supabase)
                    │
                    ▼
     React + Leaflet.js GIS Dashboard  ◄──── Citizen Web-Report Form
                    │
                    ▼
        Multilingual Alert Engine (SMS / App)
```

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Machine Learning | Python, scikit-learn, XGBoost |
| Backend / API | FastAPI |
| Database | PostgreSQL (Supabase) |
| Frontend / Dashboard | React, Leaflet.js, Tailwind CSS |
| Alerts | Twilio (simulated for prototype) |
| External Data | IMD Weather API, GSI Bhukosh, ISRO Bhuvan / SRTM DEM |
| Deployment | Vercel (frontend) · Render/Railway (backend) · Supabase (DB) |

---

##  Project Structure

```
Him-Rakshak/
├── ml_model/       # Data prep, training, and the saved risk-prediction model
├── backend/        # FastAPI server (API endpoints, DB models)
├── dashboard/      # React + Leaflet GIS dashboard
├── data/           # Downloaded datasets (rainfall, DEM, historical records)
├── docs/           # PPT, architecture diagrams, notes
└── README.md


##  Data Sources

- **Rainfall / Weather:** [IMD Public API](https://api.imd.gov.in) — live district rainfall, warnings, nowcasts
- **Historical Landslides:** [GSI Bhukosh](https://bhukosh.gsi.gov.in)
- **Terrain / Slope:** ISRO Bhuvan & SRTM Digital Elevation Model
- **Satellite Imagery:** ISRO Bhuvan / Sentinel-2 (sample imagery for prototype)

---

##  Future Scope

- Real IoT sensor network (soil-moisture, tiltmeters, seismic sensors)
- Fully offline-first mobile app with local caching and auto-sync
- Automated satellite change-detection pipeline (computer vision)
- Drone-based real-time monitoring integration
- Cross-border monitoring and collaboration
- Scale-up across all seven NER states with government system integration

---

##  Team

Team Him-Rakshak — Smart India Hackathon 2026

---

##  License

This project was built for Smart India Hackathon 2026 (SIH26001) under MDoNER's disaster-management theme.
