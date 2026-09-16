import pickle
import json
import pandas as pd

with open('/content/landslide_risk_model (1).pkl', 'rb') as f:
    model = pickle.load(f)

with open('flood_thresholds.json', 'r') as f:
    flood_thresholds = json.load(f)
    flood_thresholds = {float(k): v for k, v in flood_thresholds.items()}

flood_prone_districts = ['Bongaigaon', 'Cachar', 'Goalpara', 'Hailakandi', 'Jorhat',
                          'Kamrup', 'Kamrup (Rural)', 'Kamrup (Metro)', 'Karimganj',
                          'Morigaon', 'Nagaon', 'Sonitpur', 'Udalguri']

def predict_hazards(district, lat, lon, slope_deg, rainfall_mm, soil_moisture_mm, distance_to_river_km):
    result = {"district": district, "hazards": []}

    # --- LANDSLIDE ---
    input_df = pd.DataFrame([{
        'Latitude': lat, 'Longitude': lon,
        'slope_deg': slope_deg, 'rainfall_mm': rainfall_mm, 'soil_moisture_mm': soil_moisture_mm
    }])
    prob = model.predict_proba(input_df)[:, 1][0]

    if prob < 0.2:
        landslide_severity = 'Low'
    elif prob < 0.5:
        landslide_severity = 'Medium'
    elif prob < 0.8:
        landslide_severity = 'High'
    else:
        landslide_severity = 'Critical'
    result["hazards"].append({"type": "landslide", "severity": landslide_severity, "probability": round(float(prob), 3)})

    # --- FLOOD ---
    flood_severity = None
    if district in flood_prone_districts:
        flood_score = (1/(slope_deg+1)) * rainfall_mm * (1/(distance_to_river_km+1))
        if flood_score <= flood_thresholds[0.5]:
            flood_severity = "Low"
        elif flood_score <= flood_thresholds[0.8]:
            flood_severity = "Moderate"
        elif flood_score <= flood_thresholds[0.95]:
            flood_severity = "High"
        else:
            flood_severity = "Critical"
        result["hazards"].append({"type": "flood", "severity": flood_severity, "flood_score": round(float(flood_score), 3)})

    # --- ROAD BLOCKAGE (rule-based, landslide/flood severity ke basis par) ---
    high_risk_levels = ['High', 'Critical']
    road_blocked = (landslide_severity in high_risk_levels) or (flood_severity in high_risk_levels)

    reasons = []
    if landslide_severity in high_risk_levels:
        reasons.append(f"landslide ({landslide_severity})")
    if flood_severity in high_risk_levels:
        reasons.append(f"flood ({flood_severity})")

    result["hazards"].append({
        "type": "road_blockage",
        "status": "Likely Blocked" if road_blocked else "Likely Clear",
        "reason": ", ".join(reasons) if reasons else "No major hazard"
    })

    return result
