#!/usr/bin/env bash
# Exit immediately on error
set -e

echo "=== 1. Installing Python Backend Dependencies ==="
pip install -r requirements.txt

echo "=== 2. Generating Academic Dataset & Initial ML Model Training ==="
python data_generator.py
python -c "from database import init_db; init_db(); from ml_engine import ml_engine; print('Model Status:', ml_engine.train_model('data/smart_home_weather_dataset.csv'))"

echo "=== 3. Building React TypeScript Frontend ==="
cd ../frontend
npm install
npm run build
cd ../backend

echo "=== Render Deployment Build Completed Successfully ==="
