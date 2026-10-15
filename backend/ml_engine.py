import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from database import save_model_metrics, get_latest_model_metrics

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "rf_energy_model.joblib")

NUM_FEATURES = [
    "indoor_temperature",
    "outdoor_temperature",
    "humidity",
    "occupancy",
    "ac_status",
    "lights_status",
    "previous_energy_kwh"
]
CAT_FEATURES = ["weather_condition"]
ALL_FEATURES = NUM_FEATURES + CAT_FEATURES
TARGET_FEATURE = "energy_consumption_kwh"

class SmartHomeMLEngine:
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.pipeline: Pipeline | None = None
        self.metrics: dict | None = None
        self.feature_importance: dict = {}
        self.load_or_init_model()

    def load_or_init_model(self):
        """Loads saved model pipeline from disk if available, otherwise sets up placeholder."""
        if os.path.exists(MODEL_PATH):
            try:
                loaded = joblib.load(MODEL_PATH)
                self.pipeline = loaded.get("pipeline")
                self.metrics = loaded.get("metrics")
                self.feature_importance = loaded.get("feature_importance", {})
                print(f"[MLEngine] Loaded trained Random Forest model. R²: {self.metrics.get('r2'):.4f}")
                return
            except Exception as e:
                print(f"[MLEngine] Error loading saved model: {e}")
        
        # Check database for last metrics
        db_metrics = get_latest_model_metrics()
        if db_metrics:
            self.metrics = db_metrics
            self.feature_importance = db_metrics.get("feature_importance", {})

    def train_model(self, csv_path: str, column_mapping: dict = None) -> dict:
        """
        Trains a Random Forest Regressor on the provided dataset with chronological train/test split.
        Never fakes metrics — uses actual test set evaluation.
        """
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset file not found at {csv_path}")

        df = pd.read_csv(csv_path)

        # Apply column mapping if provided
        if column_mapping:
            rename_map = {v: k for k, v in column_mapping.items() if v in df.columns}
            df = df.rename(columns=rename_map)

        # Validate required columns
        for col in ALL_FEATURES + [TARGET_FEATURE]:
            if col not in df.columns:
                raise ValueError(f"Missing required feature column: '{col}' in dataset.")

        # Clean nulls
        df = df.dropna(subset=ALL_FEATURES + [TARGET_FEATURE]).copy()
        
        # Convert types
        for col in NUM_FEATURES + [TARGET_FEATURE]:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.dropna(subset=ALL_FEATURES + [TARGET_FEATURE])

        if len(df) < 50:
            raise ValueError(f"Dataset too small ({len(df)} rows). Need at least 50 valid rows for training.")

        # Chronological Time-Aware Split (80% Train, 20% Test) to prevent future data leakage
        test_size = int(len(df) * 0.20)
        train_df = df.iloc[:-test_size]
        test_df = df.iloc[-test_size:]

        X_train = train_df[ALL_FEATURES]
        y_train = train_df[TARGET_FEATURE]
        X_test = test_df[ALL_FEATURES]
        y_test = test_df[TARGET_FEATURE]

        # Pipeline with Preprocessing
        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUM_FEATURES),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT_FEATURES),
            ]
        )

        rf_regressor = RandomForestRegressor(
            n_estimators=100,
            max_depth=14,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )

        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", rf_regressor)
        ])

        pipeline.fit(X_train, y_train)

        # Evaluate on Test Set
        y_pred = pipeline.predict(X_test)
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        r2 = float(r2_score(y_test, y_pred))

        # Extract Feature Importances
        cat_encoder = pipeline.named_steps["preprocessor"].named_transformers_["cat"]
        encoded_cat_names = list(cat_encoder.get_feature_names_out(CAT_FEATURES))
        all_feature_names = NUM_FEATURES + encoded_cat_names
        raw_importances = pipeline.named_steps["regressor"].feature_importances_

        # Group one-hot encoded categories back or keep clean
        importance_dict = {}
        for name, val in zip(all_feature_names, raw_importances):
            clean_name = name.replace("weather_condition_", "Weather: ")
            importance_dict[clean_name] = round(float(val) * 100, 2)

        # Sort descending
        sorted_importance = dict(sorted(importance_dict.items(), key=lambda item: item[1], reverse=True))

        metrics = {
            "trained_at": datetime.now().isoformat(),
            "model_name": "Random Forest Regressor (100 Trees, Max Depth 14)",
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
            "samples_count": int(len(train_df)),
            "test_samples_count": int(len(test_df)),
            "feature_importance": sorted_importance,
            "test_actual_vs_pred": [
                {
                    "index": i + 1,
                    "actual": round(float(a), 3),
                    "predicted": round(float(p), 3)
                }
                for i, (a, p) in enumerate(zip(y_test.iloc[:25], y_pred[:25]))
            ]
        }

        # Save to disk
        joblib.dump({
            "pipeline": pipeline,
            "metrics": metrics,
            "feature_importance": sorted_importance
        }, MODEL_PATH)

        self.pipeline = pipeline
        self.metrics = metrics
        self.feature_importance = sorted_importance

        # Save to SQLite
        save_model_metrics(metrics)

        return metrics

    def predict(self, input_data: dict) -> dict:
        """
        Runs prediction through the Scikit-learn Random Forest model.
        Returns prediction (kWh), baseline, percentage deviation, and actionable recommendations.
        """
        # Validate inputs
        try:
            row_dict = {
                "indoor_temperature": float(input_data["indoor_temp"]),
                "outdoor_temperature": float(input_data["outdoor_temp"]),
                "humidity": float(input_data["humidity"]),
                "occupancy": int(input_data["occupancy"]),
                "ac_status": int(input_data["ac_status"]),
                "lights_status": int(input_data["lights_status"]),
                "previous_energy_kwh": float(input_data.get("previous_energy", 1.2)),
                "weather_condition": str(input_data.get("weather_condition", "Clear/Sunny"))
            }
        except (KeyError, ValueError) as err:
            raise ValueError(f"Invalid input parameters: {err}")

        is_demo = 0
        if self.pipeline is None:
            # Fallback estimation if model has not been trained yet
            is_demo = 1
            # Realistic thermodynamic heuristic estimation
            base = 0.38
            ac_load = 1.35 * row_dict["ac_status"] * (1.0 + max(0.0, row_dict["outdoor_temperature"] - row_dict["indoor_temperature"]) * 0.08)
            light_load = 0.25 * row_dict["lights_status"]
            occ_load = 0.12 * row_dict["occupancy"]
            predicted_kwh = round(base + ac_load + light_load + occ_load, 3)
        else:
            input_df = pd.DataFrame([row_dict])
            pred_arr = self.pipeline.predict(input_df)
            predicted_kwh = round(float(pred_arr[0]), 3)

        # Baseline comparison: typical household baseline with moderate AC/lighting
        baseline_kwh = round(0.40 + (0.55 if row_dict["occupancy"] > 0 else 0.0) + (0.75 if row_dict["outdoor_temperature"] > 27 else 0.2), 3)
        
        diff_pct = round(((predicted_kwh - baseline_kwh) / baseline_kwh) * 100, 1)

        # Generate physics-grounded energy saving suggestions
        recommendations = []
        if row_dict["ac_status"] == 1:
            if row_dict["indoor_temperature"] < 23.0:
                recommendations.append({
                    "title": "Adjust AC Setpoint Temperature",
                    "detail": f"Indoor AC is cooling to {row_dict['indoor_temperature']}°C. Raising thermostat by 1°C to 24°C reduces continuous compressor load by ~7-10% without sacrificing comfort.",
                    "priority": "High",
                    "potential_savings_kwh": 0.22
                })
            if row_dict["outdoor_temperature"] < 24.0:
                recommendations.append({
                    "title": "Utilize Natural Ventilation",
                    "detail": f"Outdoor temperature is a pleasant {row_dict['outdoor_temperature']}°C. Consider opening windows instead of running active air conditioning.",
                    "priority": "Medium",
                    "potential_savings_kwh": 0.85
                })
        
        if row_dict["lights_status"] == 1 and row_dict["occupancy"] == 0:
            recommendations.append({
                "title": "Disable Lighting in Unoccupied Home",
                "detail": "Lighting system is energized while occupancy count is 0. Activate automated PIR sensor shutdown.",
                "priority": "High",
                "potential_savings_kwh": 0.25
            })

        if row_dict["humidity"] > 70.0 and row_dict["ac_status"] == 1:
            recommendations.append({
                "title": "Switch AC to Dehumidification (Dry) Mode",
                "detail": f"Ambient humidity is high ({row_dict['humidity']}%). Dry mode optimizes fan speed and evaporator temperature, reducing sensible cooling power while eliminating clamminess.",
                "priority": "Medium",
                "potential_savings_kwh": 0.18
            })

        if not recommendations:
            recommendations.append({
                "title": "Optimal Energy Operation",
                "detail": "Current smart home sensor parameters are running efficiently within eco-friendly thermal boundaries.",
                "priority": "Low",
                "potential_savings_kwh": 0.05
            })

        explanation = (
            f"The Random Forest model predicted {predicted_kwh} kWh based on "
            f"indoor temp {row_dict['indoor_temperature']}°C, outdoor temp {row_dict['outdoor_temperature']}°C, "
            f"and active AC ({'ON' if row_dict['ac_status'] else 'OFF'}). "
            f"Consumption is {abs(diff_pct)}% {'higher' if diff_pct > 0 else 'lower'} than typical average baseline ({baseline_kwh} kWh)."
        )

        return {
            "predicted_kwh": predicted_kwh,
            "baseline_kwh": baseline_kwh,
            "difference_percentage": diff_pct,
            "period": "1-Hour Interval",
            "is_demo": is_demo,
            "explanation": explanation,
            "recommendations": recommendations,
            "feature_inputs": row_dict
        }

# Global singleton engine
ml_engine = SmartHomeMLEngine()
