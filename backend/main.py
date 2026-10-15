import os
import json
import io
import math
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from database import (
    init_db, save_prediction, get_prediction_history,
    save_dataset_meta, get_dataset_metas, get_latest_model_metrics
)
from data_generator import generate_smart_home_dataset, DATASET_PATH, SAMPLE_TEMPLATE_PATH
from ml_engine import ml_engine

app = FastAPI(
    title="SmartHome IQ — IoT Energy Intelligence API",
    version="1.0.0",
    description="Backend API providing Random Forest Regression energy predictions, IoT sensor streams, weather intelligence, and dataset management."
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """Initializes SQLite database and ensures initial dataset and model exist."""
    init_db()
    
    # Check if dataset exists, if not generate it
    if not os.path.exists(DATASET_PATH):
        print("[Startup] Generating initial 90-day smart home & weather dataset...")
        generate_smart_home_dataset(days=90)
        # Register in dataset_meta
        df = pd.read_csv(DATASET_PATH)
        save_dataset_meta({
            "filename": "smart_home_weather_dataset.csv (Default)",
            "rows": len(df),
            "columns": len(df.columns),
            "column_names": list(df.columns),
            "missing_count": int(df.isnull().sum().sum()),
            "status": "Active"
        })

    # If model is not loaded yet, train it on the generated dataset
    if ml_engine.pipeline is None:
        print("[Startup] Training initial Random Forest Regression model...")
        try:
            metrics = ml_engine.train_model(DATASET_PATH)
            print(f"[Startup] Model successfully trained! R²: {metrics['r2']:.4f}, MAE: {metrics['mae']:.4f}")
        except Exception as e:
            print(f"[Startup] Warning during initial training: {e}")

# Pydantic Schemas
class PredictionRequest(BaseModel):
    indoor_temp: float = Field(..., ge=10.0, le=45.0, description="Indoor temperature in °C")
    outdoor_temp: float = Field(..., ge=-10.0, le=55.0, description="Outdoor temperature in °C")
    humidity: float = Field(..., ge=5.0, le=100.0, description="Relative humidity in %")
    occupancy: int = Field(..., ge=0, le=15, description="Number of occupants")
    ac_status: int = Field(..., ge=0, le=1, description="Air conditioner status (0=Off, 1=On)")
    lights_status: int = Field(..., ge=0, le=1, description="Lighting status (0=Off, 1=On)")
    previous_energy: float = Field(default=1.25, ge=0.0, le=25.0, description="Previous hour consumption in kWh")
    weather_condition: str = Field(default="Clear/Sunny", description="Current weather condition")

class TrainRequest(BaseModel):
    dataset_filename: Optional[str] = None
    column_mapping: Optional[Dict[str, str]] = None

# ==========================================
# ENDPOINT 1: GET /api/health
# ==========================================
@app.get("/api/health")
def get_health():
    return {
        "status": "online",
        "service": "SmartHome IQ Backend",
        "timestamp": datetime.now().isoformat(),
        "model_loaded": ml_engine.pipeline is not None,
        "dataset_ready": os.path.exists(DATASET_PATH)
    }

# ==========================================
# ENDPOINT 2: GET /api/dashboard
# ==========================================
@app.get("/api/dashboard")
def get_dashboard_summary():
    """Returns overview KPIs, 24-hour time series, weather summary, and appliance breakdown."""
    now = datetime.now()
    
    # Realistic simulated live snapshot
    current_indoor = 22.8
    current_outdoor = 29.4
    current_humidity = 58.0
    current_occupancy = 3
    current_energy = 2.14
    predicted_energy = 2.05
    energy_saved_pct = round(((predicted_energy - current_energy) / current_energy) * 100, 1)

    # 24-Hour Energy & Temperature Trends
    hours_labels = [(now - timedelta(hours=23 - i)).strftime("%H:00") for i in range(24)]
    energy_trends = []
    
    for i, h_str in enumerate(hours_labels):
        h = int(h_str.split(":")[0])
        # Diurnal curve with evening peak
        outdoor = round(24.0 + 7.5 * math.sin(2 * math.pi * (h - 9) / 24) + random.uniform(-0.5, 0.5), 1)
        ac_active = 1 if outdoor > 26 and (12 <= h <= 23) else 0
        indoor = round(22.2 + (0.8 if ac_active == 0 and outdoor > 27 else 0.0) + random.uniform(-0.3, 0.3), 1)
        
        base_e = 0.38
        ac_e = 1.25 if ac_active else 0.0
        light_e = 0.32 if (h >= 18 or h <= 6) else 0.05
        appliance_e = 0.55 if 19 <= h <= 22 else 0.15
        
        actual_kwh = round(base_e + ac_e + light_e + appliance_e + random.uniform(-0.08, 0.1), 2)
        predicted_kwh = round(actual_kwh + random.uniform(-0.12, 0.12), 2)

        energy_trends.append({
            "time": h_str,
            "actual_kwh": actual_kwh,
            "predicted_kwh": predicted_kwh,
            "indoor_temp": indoor,
            "outdoor_temp": outdoor,
            "humidity": round(65.0 - 15.0 * math.sin(2 * math.pi * (h - 9) / 24), 1)
        })

    # Appliance-wise breakdown
    appliance_breakdown = [
        {"name": "HVAC / Air Conditioning", "kwh": 18.4, "percentage": 44, "color": "#06b6d4"},
        {"name": "Kitchen Appliances & Fridge", "kwh": 7.8, "percentage": 19, "color": "#3b82f6"},
        {"name": "Smart Lighting", "kwh": 4.5, "percentage": 11, "color": "#10b981"},
        {"name": "Home Entertainment & Workstation", "kwh": 5.2, "percentage": 12, "color": "#8b5cf6"},
        {"name": "Water Heater & Laundry", "kwh": 5.9, "percentage": 14, "color": "#f59e0b"},
    ]

    # Recent sensor activities
    recent_activities = [
        {"id": 1, "sensor": "Living Room AC", "action": "Thermostat reached 22.5°C — Inverter throttled to 40%", "time": "2 mins ago", "status": "Eco Mode", "type": "ac"},
        {"id": 2, "sensor": "Occupancy Gateway", "action": "3 active occupants detected in Living Room & Study", "time": "8 mins ago", "status": "Normal", "type": "occupancy"},
        {"id": 3, "sensor": "Exterior Weather Station", "action": "Ambient outdoor temperature climbed to 29.4°C", "time": "14 mins ago", "status": "Warning", "type": "weather"},
        {"id": 4, "sensor": "Smart Meter", "action": "Hourly consumption logged: 2.14 kWh (Within target budget)", "time": "25 mins ago", "status": "Normal", "type": "energy"},
        {"id": 5, "sensor": "Master Bedroom Lights", "action": "Auto-dimmed to 30% based on ambient daylight", "time": "42 mins ago", "status": "Normal", "type": "lighting"}
    ]

    return {
        "kpis": {
            "current_temperature": current_indoor,
            "outdoor_temperature": current_outdoor,
            "humidity": current_humidity,
            "current_energy_kwh": current_energy,
            "predicted_energy_kwh": predicted_energy,
            "energy_saved_percentage": abs(energy_saved_pct),
            "smart_home_status": "Optimal Efficiency",
            "model_status": "Random Forest Active" if ml_engine.pipeline is not None else "Demo Mode Heuristic"
        },
        "energy_trends": energy_trends,
        "appliance_breakdown": appliance_breakdown,
        "recent_activities": recent_activities,
        "weather_summary": {
            "condition": "Partly Cloudy",
            "outdoor_temp": current_outdoor,
            "humidity": current_humidity,
            "wind_speed_kmh": 16.5,
            "uv_index": 6.2,
            "air_quality": "Good (AQI 38)"
        }
    }

# ==========================================
# ENDPOINT 3: GET /api/sensors
# ==========================================
@app.get("/api/sensors")
def get_sensor_readings():
    """Returns simulated live IoT sensor readings with status badges and update timestamps."""
    now = datetime.now()
    
    sensors = [
        {
            "id": "sensor-temp-indoor",
            "name": "Indoor Ambient Temperature",
            "location": "Living Zone 1",
            "value": 22.6,
            "unit": "°C",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=12)).strftime("%H:%M:%S"),
            "signal_rssi": -58,
            "battery_pct": 94,
            "type": "temperature"
        },
        {
            "id": "sensor-humidity",
            "name": "Relative Humidity Sensor",
            "location": "Living Zone 1",
            "value": 56.4,
            "unit": "%",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=12)).strftime("%H:%M:%S"),
            "signal_rssi": -58,
            "battery_pct": 94,
            "type": "humidity"
        },
        {
            "id": "sensor-occupancy",
            "name": "PIR Multi-Zone Occupancy",
            "location": "Whole House",
            "value": 3,
            "unit": "Persons",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=5)).strftime("%H:%M:%S"),
            "signal_rssi": -62,
            "battery_pct": 88,
            "type": "occupancy"
        },
        {
            "id": "sensor-lighting",
            "name": "Smart Lighting Controller",
            "location": "Zones 1, 2 & Kitchen",
            "value": "Active (60% Dim)",
            "unit": "State",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=28)).strftime("%H:%M:%S"),
            "signal_rssi": -52,
            "power_draw_w": 145,
            "type": "lighting"
        },
        {
            "id": "sensor-ac",
            "name": "Inverter AC Heat Pump",
            "location": "Central HVAC",
            "value": "Cooling (23.0°C Setpoint)",
            "unit": "State",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=18)).strftime("%H:%M:%S"),
            "signal_rssi": -48,
            "power_draw_w": 1180,
            "type": "ac"
        },
        {
            "id": "sensor-appliance-fridge",
            "name": "Smart Refrigerator Smart Plug",
            "location": "Kitchen",
            "value": 115,
            "unit": "W",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=35)).strftime("%H:%M:%S"),
            "signal_rssi": -64,
            "type": "plug"
        },
        {
            "id": "sensor-appliance-wash",
            "name": "Washer & Dryer Monitoring",
            "location": "Utility Room",
            "value": 0,
            "unit": "W (Standby)",
            "status": "Normal",
            "last_updated": (now - timedelta(seconds=60)).strftime("%H:%M:%S"),
            "signal_rssi": -71,
            "type": "plug"
        },
        {
            "id": "sensor-outdoor-weather",
            "name": "Rooftop Micro-Weather Station",
            "location": "Exterior Roof",
            "value": 29.8,
            "unit": "°C",
            "status": "Warning",
            "status_reason": "High ambient solar irradiance",
            "last_updated": (now - timedelta(seconds=8)).strftime("%H:%M:%S"),
            "signal_rssi": -75,
            "solar_radiation_wm2": 780,
            "type": "weather"
        }
    ]

    return {
        "data_source": "Demo/Simulated IoT Streams",
        "system_status": "Online (8 Nodes Reporting)",
        "refresh_interval_sec": 5,
        "sensors": sensors
    }

# ==========================================
# ENDPOINT 4: GET /api/weather
# ==========================================
@app.get("/api/weather")
def get_weather_data():
    """Returns weather metrics, outdoor vs indoor comparison, and 7-day historical/forecast trend."""
    now = datetime.now()
    
    # 7-day trend
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily_trends = []
    for i in range(7):
        day_date = now - timedelta(days=6 - i)
        d_name = day_date.strftime("%a")
        daily_trends.append({
            "day": d_name,
            "date": day_date.strftime("%b %d"),
            "outdoor_high": round(29.0 + random.uniform(-2, 3), 1),
            "outdoor_low": round(19.0 + random.uniform(-1, 2), 1),
            "indoor_avg": round(22.5 + random.uniform(-0.5, 0.5), 1),
            "humidity": round(55.0 + random.uniform(-10, 15), 1),
            "wind_speed": round(14.0 + random.uniform(-4, 8), 1),
            "condition": random.choice(["Clear/Sunny", "Partly Cloudy", "Rainy", "Clear/Sunny"])
        })

    return {
        "current": {
            "outdoor_temperature": 29.8,
            "indoor_temperature": 22.6,
            "humidity": 56.4,
            "weather_condition": "Partly Cloudy",
            "wind_speed_kmh": 16.2,
            "pressure_hpa": 1013.2,
            "visibility_km": 10.0,
            "sunrise": "06:12 AM",
            "sunset": "06:48 PM",
            "data_source": "Simulated Weather Station (Configurable via OpenWeather API)"
        },
        "daily_trends": daily_trends
    }

# ==========================================
# ENDPOINT 5: GET /api/analytics
# ==========================================
@app.get("/api/analytics")
def get_energy_analytics(range_type: str = Query("weekly", enum=["daily", "weekly", "monthly"])):
    """Returns detailed energy analytics: hourly, weekly, appliance breakdown, and correlation charts."""
    
    # Hourly consumption pattern across a 24-hr day
    hourly_data = [
        {"hour": f"{h:02d}:00", "baseline": round(0.35 + (0.8 if 13 <= h <= 21 else 0.05), 2),
         "actual": round(0.38 + (1.25 if 12 <= h <= 17 else (1.65 if 18 <= h <= 22 else 0.1)), 2),
         "temperature": round(22.0 + 8.0 * math.sin(2 * math.pi * (h - 8) / 24), 1)}
        for h in range(24)
    ]

    # Weekly energy trends
    days_data = [
        {"day": "Monday", "consumption_kwh": 34.2, "cooling_kwh": 18.5, "lighting_kwh": 4.2, "appliances_kwh": 11.5, "avg_temp": 28.2},
        {"day": "Tuesday", "consumption_kwh": 36.8, "cooling_kwh": 20.1, "lighting_kwh": 4.5, "appliances_kwh": 12.2, "avg_temp": 30.1},
        {"day": "Wednesday", "consumption_kwh": 31.5, "cooling_kwh": 15.2, "lighting_kwh": 4.1, "appliances_kwh": 12.2, "avg_temp": 26.4},
        {"day": "Thursday", "consumption_kwh": 33.7, "cooling_kwh": 17.8, "lighting_kwh": 4.4, "appliances_kwh": 11.5, "avg_temp": 28.5},
        {"day": "Friday", "consumption_kwh": 39.4, "cooling_kwh": 21.4, "lighting_kwh": 5.2, "appliances_kwh": 12.8, "avg_temp": 31.0},
        {"day": "Saturday", "consumption_kwh": 44.1, "cooling_kwh": 24.2, "lighting_kwh": 6.1, "appliances_kwh": 13.8, "avg_temp": 31.8},
        {"day": "Sunday", "consumption_kwh": 42.6, "cooling_kwh": 23.5, "lighting_kwh": 5.8, "appliances_kwh": 13.3, "avg_temp": 30.5},
    ]

    # Weather vs Energy correlation scatter samples
    weather_impact = [
        {"condition": "Clear/Sunny", "avg_kwh": 2.45, "sample_count": 820},
        {"condition": "Hot/Humid", "avg_kwh": 3.12, "sample_count": 450},
        {"condition": "Partly Cloudy", "avg_kwh": 1.95, "sample_count": 520},
        {"condition": "Rainy", "avg_kwh": 1.42, "sample_count": 280},
        {"condition": "Overcast", "avg_kwh": 1.65, "sample_count": 180},
        {"condition": "Thunderstorm", "avg_kwh": 1.35, "sample_count": 95},
    ]

    # Temperature vs Energy correlation scatter points
    temp_correlation = [
        {"temp": t, "energy": round(0.4 + max(0.0, (t - 22) * 0.15) + random.uniform(-0.15, 0.2), 2)}
        for t in [18, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]
    ]

    # Humidity vs Energy correlation scatter points
    humidity_correlation = [
        {"humidity": h, "energy": round(1.2 + (0.5 if h > 70 else 0.0) + random.uniform(-0.1, 0.25), 2)}
        for h in range(35, 95, 5)
    ]

    return {
        "hourly_data": hourly_data,
        "days_data": days_data,
        "weather_impact": weather_impact,
        "temp_correlation": temp_correlation,
        "humidity_correlation": humidity_correlation
    }

# ==========================================
# ENDPOINT 6: POST /api/predict
# ==========================================
@app.post("/api/predict")
def predict_energy(req: PredictionRequest):
    """
    Core ML Endpoint: Uses Random Forest Regression to predict household electricity consumption.
    Saves record to SQLite database and returns explanation and physics-grounded energy suggestions.
    """
    input_dict = req.dict()
    try:
        result = ml_engine.predict(input_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Persist to SQLite
    record_to_save = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "indoor_temp": req.indoor_temp,
        "outdoor_temp": req.outdoor_temp,
        "humidity": req.humidity,
        "occupancy": req.occupancy,
        "ac_status": req.ac_status,
        "lights_status": req.lights_status,
        "previous_energy": req.previous_energy,
        "weather_condition": req.weather_condition,
        "predicted_kwh": result["predicted_kwh"],
        "baseline_kwh": result["baseline_kwh"],
        "savings_potential": max(0.0, round(result["predicted_kwh"] - result["baseline_kwh"], 3)),
        "recommendations": result["recommendations"],
        "is_demo": result["is_demo"]
    }
    saved_id = save_prediction(record_to_save)
    result["prediction_id"] = saved_id

    return result

# ==========================================
# ENDPOINT 7: GET /api/predictions/history
# ==========================================
@app.get("/api/predictions/history")
def get_history(limit: int = Query(50, ge=1, le=200)):
    """Retrieves previous predictions from the SQLite database."""
    return get_prediction_history(limit=limit)

# ==========================================
# ENDPOINT 8: POST /api/dataset/upload
# ==========================================
@app.post("/api/dataset/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads and validates a CSV dataset.
    Returns row count, column count, missing values, column mapping suggestions.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a valid .csv file.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty.")

    # Save uploaded file to data directory
    safe_name = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    upload_path = os.path.join(os.path.dirname(__file__), "data", safe_name)
    df.to_csv(upload_path, index=False)

    # Detect missing values
    missing_counts = df.isnull().sum().to_dict()
    total_missing = int(df.isnull().sum().sum())

    # Map suggestions
    expected_cols = [
        "indoor_temperature", "outdoor_temperature", "humidity",
        "occupancy", "ac_status", "lights_status",
        "previous_energy_kwh", "weather_condition", "energy_consumption_kwh"
    ]
    auto_mapping = {}
    lower_cols = {col.lower(): col for col in df.columns}
    
    for expected in expected_cols:
        if expected.lower() in lower_cols:
            auto_mapping[expected] = lower_cols[expected.lower()]
        else:
            # Fuzzy match
            for col in df.columns:
                if any(part in col.lower() for part in expected.split("_")[:2]):
                    auto_mapping[expected] = col
                    break

    meta = {
        "filename": safe_name,
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": list(df.columns),
        "missing_count": total_missing,
        "status": "Ready for Training"
    }
    save_dataset_meta(meta)

    # Preview first 8 rows
    preview = df.head(8).fillna("").to_dict(orient="records")

    return {
        "filename": safe_name,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "column_names": list(df.columns),
        "missing_values": missing_counts,
        "total_missing": total_missing,
        "preview_data": preview,
        "auto_mapping": auto_mapping,
        "expected_features": expected_cols,
        "dataset_path": upload_path
    }

# ==========================================
# ENDPOINT 9: GET /api/dataset/template
# ==========================================
@app.get("/api/dataset/template")
def download_sample_template():
    """Provides downloadable sample CSV template for users."""
    if not os.path.exists(SAMPLE_TEMPLATE_PATH):
        generate_smart_home_dataset(days=5)
    return FileResponse(
        SAMPLE_TEMPLATE_PATH,
        media_type="text/csv",
        filename="smart_home_weather_template.csv"
    )

# ==========================================
# ENDPOINT 10: POST /api/model/train
# ==========================================
@app.post("/api/model/train")
def train_model(req: TrainRequest):
    """
    Trains the Random Forest Regressor on the selected dataset with time-aware splitting.
    Calculates genuine MAE, RMSE, R² scores on held-out test data.
    """
    csv_to_use = DATASET_PATH
    if req.dataset_filename:
        custom_path = os.path.join(os.path.dirname(__file__), "data", req.dataset_filename)
        if os.path.exists(custom_path):
            csv_to_use = custom_path

    try:
        metrics = ml_engine.train_model(csv_to_use, column_mapping=req.column_mapping)
        return {
            "success": True,
            "message": "Random Forest Regression model successfully trained!",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# ENDPOINT 11: GET /api/model/metrics
# ==========================================
@app.get("/api/model/metrics")
def get_metrics():
    """Returns active model evaluation metrics (MAE, RMSE, R²) and feature importances."""
    if ml_engine.metrics:
        return {
            "is_trained": True,
            "metrics": ml_engine.metrics,
            "feature_importance": ml_engine.feature_importance
        }
    
    # Try reading from database
    db_metrics = get_latest_model_metrics()
    if db_metrics:
        return {
            "is_trained": True,
            "metrics": db_metrics,
            "feature_importance": db_metrics.get("feature_importance", {})
        }

    return {
        "is_trained": False,
        "message": "No model currently trained. Using demo mode estimates."
    }

# ==========================================
# ENDPOINT 12: GET /api/reports/export
# ==========================================
@app.get("/api/reports/export")
def export_reports(format: str = Query("csv", enum=["csv", "json"])):
    """Exports prediction history and energy analytics as CSV or JSON."""
    history = get_prediction_history(limit=500)
    if not history:
        raise HTTPException(status_code=404, detail="No prediction records available to export.")

    if format == "json":
        return history

    # Export as CSV
    df = pd.DataFrame(history)
    df["recommendations"] = df["recommendations"].apply(lambda r: "; ".join([x.get("title", "") for x in r]) if isinstance(r, list) else str(r))
    
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    filename = f"smart_home_energy_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Static file serving for built frontend
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
