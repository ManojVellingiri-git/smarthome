import sqlite3
import os
import json
from datetime import datetime

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "smarthome.db")

def get_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    # Predictions history
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        indoor_temp REAL NOT NULL,
        outdoor_temp REAL NOT NULL,
        humidity REAL NOT NULL,
        occupancy INTEGER NOT NULL,
        ac_status INTEGER NOT NULL,
        lights_status INTEGER NOT NULL,
        previous_energy REAL NOT NULL,
        weather_condition TEXT NOT NULL,
        predicted_kwh REAL NOT NULL,
        baseline_kwh REAL NOT NULL,
        savings_potential REAL NOT NULL,
        recommendations TEXT NOT NULL,
        is_demo INTEGER DEFAULT 0
    )
    """)

    # Datasets metadata
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dataset_meta (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        upload_time TEXT NOT NULL,
        rows INTEGER NOT NULL,
        columns INTEGER NOT NULL,
        column_names TEXT NOT NULL,
        missing_count INTEGER NOT NULL,
        status TEXT NOT NULL
    )
    """)

    # Model training history & metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trained_at TEXT NOT NULL,
        model_name TEXT NOT NULL,
        mae REAL NOT NULL,
        rmse REAL NOT NULL,
        r2 REAL NOT NULL,
        samples_count INTEGER NOT NULL,
        test_samples_count INTEGER NOT NULL,
        feature_importance TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

def save_prediction(record: dict) -> int:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO predictions (
            timestamp, indoor_temp, outdoor_temp, humidity, occupancy,
            ac_status, lights_status, previous_energy, weather_condition,
            predicted_kwh, baseline_kwh, savings_potential, recommendations, is_demo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record.get("timestamp", datetime.now().isoformat()),
        record["indoor_temp"],
        record["outdoor_temp"],
        record["humidity"],
        record["occupancy"],
        record["ac_status"],
        record["lights_status"],
        record["previous_energy"],
        record["weather_condition"],
        record["predicted_kwh"],
        record["baseline_kwh"],
        record["savings_potential"],
        json.dumps(record.get("recommendations", [])),
        record.get("is_demo", 0)
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return new_id

def get_prediction_history(limit: int = 50):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM predictions ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    result = []
    for r in rows:
        item = dict(r)
        try:
            item["recommendations"] = json.loads(item["recommendations"])
        except Exception:
            item["recommendations"] = []
        result.append(item)
    conn.close()
    return result

def save_model_metrics(metrics: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO model_metrics (
            trained_at, model_name, mae, rmse, r2,
            samples_count, test_samples_count, feature_importance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        metrics["trained_at"],
        metrics.get("model_name", "RandomForestRegressor"),
        metrics["mae"],
        metrics["rmse"],
        metrics["r2"],
        metrics["samples_count"],
        metrics["test_samples_count"],
        json.dumps(metrics.get("feature_importance", {}))
    ))
    conn.commit()
    conn.close()

def get_latest_model_metrics():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM model_metrics ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        try:
            data["feature_importance"] = json.loads(data["feature_importance"])
        except Exception:
            data["feature_importance"] = {}
        return data
    return None

def save_dataset_meta(meta: dict):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO dataset_meta (
            filename, upload_time, rows, columns, column_names, missing_count, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        meta["filename"],
        meta.get("upload_time", datetime.now().isoformat()),
        meta["rows"],
        meta["columns"],
        json.dumps(meta.get("column_names", [])),
        meta["missing_count"],
        meta.get("status", "Active")
    ))
    conn.commit()
    conn.close()

def get_dataset_metas():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dataset_meta ORDER BY id DESC")
    rows = cursor.fetchall()
    res = []
    for r in rows:
        d = dict(r)
        try:
            d["column_names"] = json.loads(d["column_names"])
        except Exception:
            d["column_names"] = []
        res.append(d)
    conn.close()
    return res
