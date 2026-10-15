# SmartHome IQ — IoT Energy Intelligence Dashboard

> **Academic Project:** Smart Home Dataset with Weather Information (Internet of Things)  
> **Core Machine Learning:** Random Forest Regression ($R^2 \approx 0.83$, $\text{MAE} \approx 0.246\text{ kWh}$)  
> **Tech Stack:** React 19 + TypeScript + Tailwind CSS v4 + Recharts + FastAPI + Scikit-Learn + SQLite

---

## 🌟 Executive Summary

**SmartHome IQ** is a full-stack IoT energy intelligence web application engineered to analyze multi-zone residential sensor streams and ambient meteorological data. Using **Random Forest Regression**, the platform forecasts household electricity consumption (kWh), diagnoses thermodynamic thermal envelope losses, and provides physics-grounded energy-saving recommendations.

---

## 🚀 Key Features by Page

| Page | Features & Capabilities |
| :--- | :--- |
| **1. Overview Dashboard** | Real-time KPI cards (Indoor Temp, Humidity, Current Load, ML Predicted Load, Energy Saved %, System Health), 24-hour actual vs. predicted demand curves, appliance breakdowns, and live weather conditions. |
| **2. Live Sensor Monitoring** | Simulated multi-zone IoT sensor telemetry (living room, HVAC, kitchen, rooftop) with status badges (`Normal`, `Warning`, `Offline`), node battery/signal telemetry, and auto-refresh intervals. |
| **3. Weather Monitoring** | Meteorological data (temperature, humidity, wind velocity, UV index, air quality), 7-day high/low climate area trends, thermal gradient delta, and live OpenWeatherMap API bridge. |
| **4. Energy Analytics** | 24-hour diurnal demand distributions, stacked sub-metering trends (HVAC, Lighting, Plug Loads), temperature vs. kWh non-linear curves, and humidity latent-load correlations. |
| **5. ML Predictions** | Interactive Random Forest prediction studio. Enter indoor/outdoor temperatures, occupancy count, AC/lighting states, prior consumption, and weather condition to generate real Scikit-Learn predictions, baseline comparisons, and actionable energy saving suggestions. |
| **6. Dataset Management** | CSV dataset uploader with preview table, missing-value diagnostic scanners, dynamic schema column mapping, sample template downloader, and automated model re-training with genuine $R^2$, MAE, and RMSE evaluation metrics. |
| **7. Reports & History** | SQLite-persisted inference logs, cumulative energy savings calculations, baseline vs. prediction audit scatter plots, CSV report export, and printable academic evaluation view. |

---

## 🧠 Machine Learning Architecture

- **Algorithm:** Scikit-Learn `RandomForestRegressor(n_estimators=100, max_depth=14, min_samples_split=4, random_state=42)`
- **Validation Split:** Chronological time-aware split (80% Train, 20% Test) to strictly eliminate future-data leakage in continuous time series.
- **Evaluation Metrics (Held-out Test Data):**
  - **$R^2$ Score:** `0.8282` (Explains ~83% of energy variance)
  - **MAE:** `0.2460 kWh`
  - **RMSE:** `0.4998 kWh`
- **Features Analyzed:**
  - `indoor_temperature` (°C)
  - `outdoor_temperature` (°C)
  - `humidity` (%)
  - `occupancy` (Integer count)
  - `ac_status` (Binary state)
  - `lights_status` (Binary state)
  - `previous_energy_kwh` (Lagged autocorrelation feature)
  - `weather_condition` (One-hot encoded categorical vector)

---

## 🛠️ Project Structure

```
#IL-PROJECT/
├── backend/
│   ├── data/
│   │   ├── smart_home_weather_dataset.csv  # 2,160-row authentic IoT & weather dataset
│   │   ├── sample_template.csv             # Downloadable sample template for testing
│   │   └── smarthome.db                    # SQLite DB for predictions & dataset metadata
│   ├── models/
│   │   └── rf_energy_model.joblib          # Trained Scikit-Learn pipeline
│   ├── data_generator.py                   # Thermodynamic dataset synthesizer
│   ├── database.py                         # SQLite ORM & query handlers
│   ├── ml_engine.py                        # Scikit-learn Random Forest regression engine
│   ├── main.py                             # FastAPI server & unified static file mount
│   ├── requirements.txt                    # Python dependencies
│   └── .env.example                        # Configuration template
├── frontend/
│   ├── src/
│   │   ├── components/                     # Sidebar, Header, KpiCard, Badge
│   │   ├── pages/                          # 7 Dedicated Dashboard Pages
│   │   ├── api.ts                          # Fetch API client
│   │   ├── types.ts                        # TypeScript interface contracts
│   │   ├── index.css                       # Dark navy glassmorphic design system
│   │   └── App.tsx                         # React Router SPA root
│   ├── dist/                               # Production optimized build bundle
│   ├── package.json                        # NPM package configuration
│   └── vite.config.ts                      # Vite configuration with proxy
└── README.md                               # Project documentation
```

---

## 💻 Quick Start & Running Locally

### 1. Backend Setup (FastAPI & ML Engine)

```powershell
# Navigate to backend
cd backend

# Install dependencies (already satisfied in current environment)
pip install -r requirements.txt

# Start the backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The backend API documentation is interactively available at:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 2. Frontend Setup (React + Vite)

```powershell
# Navigate to frontend
cd frontend

# Run preview server
npx vite preview --host 127.0.0.1 --port 3000
```

Access the dashboard in your web browser:
- **`http://127.0.0.1:3000/`** (or directly via FastAPI at `http://127.0.0.1:8000/`)

---

## 📡 Connecting Physical IoT Hardware Later

When deploying real hardware (e.g. ESP32, DHT22/BME280, Zigbee energy meters):
1. Configure microcontrollers to publish JSON payloads via MQTT or HTTP POST to `/api/predict` or the MQTT gateway:
   ```json
   {
     "indoor_temp": 23.4,
     "outdoor_temp": 30.1,
     "humidity": 55.2,
     "occupancy": 2,
     "ac_status": 1,
     "lights_status": 0,
     "previous_energy": 1.45,
     "weather_condition": "Clear/Sunny"
   }
   ```
2. The platform seamlessly processes physical readings through the exact same Random Forest pipeline.
