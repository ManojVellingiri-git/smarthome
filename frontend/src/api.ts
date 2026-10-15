import {
  DashboardData,
  SensorDataResponse,
  WeatherDataResponse,
  PredictionResult,
  PredictionRecord,
  ModelMetrics,
  UploadDatasetResponse
} from './types';

const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Failed to reach backend');
  return res.json();
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await fetch(`${BASE_URL}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchSensors(): Promise<SensorDataResponse> {
  const res = await fetch(`${BASE_URL}/sensors`);
  if (!res.ok) throw new Error('Failed to fetch sensors');
  return res.json();
}

export async function fetchWeather(): Promise<WeatherDataResponse> {
  const res = await fetch(`${BASE_URL}/weather`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

export async function fetchAnalytics(rangeType: string = 'weekly') {
  const res = await fetch(`${BASE_URL}/analytics?range_type=${rangeType}`);
  if (!res.ok) throw new Error('Failed to fetch energy analytics');
  return res.json();
}

export async function predictEnergyConsumption(payload: {
  indoor_temp: number;
  outdoor_temp: number;
  humidity: number;
  occupancy: number;
  ac_status: number;
  lights_status: number;
  previous_energy: number;
  weather_condition: string;
}): Promise<PredictionResult> {
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Prediction request failed' }));
    throw new Error(err.detail || 'Failed to generate prediction');
  }
  return res.json();
}

export async function fetchPredictionHistory(limit: number = 50): Promise<PredictionRecord[]> {
  const res = await fetch(`${BASE_URL}/predictions/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch prediction history');
  return res.json();
}

export async function uploadDatasetFile(file: File): Promise<UploadDatasetResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/dataset/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to upload dataset');
  }
  return res.json();
}

export async function trainModel(datasetFilename?: string, columnMapping?: Record<string, string>) {
  const res = await fetch(`${BASE_URL}/model/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_filename: datasetFilename,
      column_mapping: columnMapping,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Training failed' }));
    throw new Error(err.detail || 'Model training failed');
  }
  return res.json();
}

export async function fetchModelMetrics(): Promise<{ is_trained: boolean; metrics: ModelMetrics; feature_importance: Record<string, number> }> {
  const res = await fetch(`${BASE_URL}/model/metrics`);
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}

export function getExportUrl(format: 'csv' | 'json' = 'csv'): string {
  return `${BASE_URL}/reports/export?format=${format}`;
}

export function getTemplateUrl(): string {
  return `${BASE_URL}/dataset/template`;
}
