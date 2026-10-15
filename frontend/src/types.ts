export interface DashboardKPIs {
  current_temperature: number;
  outdoor_temperature: number;
  humidity: number;
  current_energy_kwh: number;
  predicted_energy_kwh: number;
  energy_saved_percentage: number;
  smart_home_status: string;
  model_status: string;
}

export interface EnergyTrendPoint {
  time: string;
  actual_kwh: number;
  predicted_kwh: number;
  indoor_temp: number;
  outdoor_temp: number;
  humidity: number;
}

export interface ApplianceBreakdown {
  name: string;
  kwh: number;
  percentage: number;
  color: string;
}

export interface RecentActivity {
  id: number;
  sensor: string;
  action: string;
  time: string;
  status: string;
  type: string;
}

export interface WeatherSummary {
  condition: string;
  outdoor_temp: number;
  humidity: number;
  wind_speed_kmh: number;
  uv_index: number;
  air_quality: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  energy_trends: EnergyTrendPoint[];
  appliance_breakdown: ApplianceBreakdown[];
  recent_activities: RecentActivity[];
  weather_summary: WeatherSummary;
}

export interface SensorItem {
  id: string;
  name: string;
  location: string;
  value: number | string;
  unit: string;
  status: 'Normal' | 'Warning' | 'Offline';
  status_reason?: string;
  last_updated: string;
  signal_rssi: number;
  battery_pct?: number;
  power_draw_w?: number;
  solar_radiation_wm2?: number;
  type: string;
}

export interface SensorDataResponse {
  data_source: string;
  system_status: string;
  refresh_interval_sec: number;
  sensors: SensorItem[];
}

export interface DailyWeatherTrend {
  day: string;
  date: string;
  outdoor_high: number;
  outdoor_low: number;
  indoor_avg: number;
  humidity: number;
  wind_speed: number;
  condition: string;
}

export interface WeatherDataResponse {
  current: {
    outdoor_temperature: number;
    indoor_temperature: number;
    humidity: number;
    weather_condition: string;
    wind_speed_kmh: number;
    pressure_hpa: number;
    visibility_km: number;
    sunrise: string;
    sunset: string;
    data_source: string;
  };
  daily_trends: DailyWeatherTrend[];
}

export interface Recommendation {
  title: string;
  detail: string;
  priority: 'High' | 'Medium' | 'Low';
  potential_savings_kwh: number;
}

export interface PredictionResult {
  prediction_id?: number;
  predicted_kwh: number;
  baseline_kwh: number;
  difference_percentage: number;
  period: string;
  is_demo: number;
  explanation: string;
  recommendations: Recommendation[];
  feature_inputs: {
    indoor_temperature: number;
    outdoor_temperature: number;
    humidity: number;
    occupancy: number;
    ac_status: number;
    lights_status: number;
    previous_energy_kwh: number;
    weather_condition: string;
  };
}

export interface PredictionRecord {
  id: number;
  timestamp: string;
  indoor_temp: number;
  outdoor_temp: number;
  humidity: number;
  occupancy: number;
  ac_status: number;
  lights_status: number;
  previous_energy: number;
  weather_condition: string;
  predicted_kwh: number;
  baseline_kwh: number;
  savings_potential: number;
  recommendations: Recommendation[];
  is_demo: number;
}

export interface ModelMetrics {
  trained_at: string;
  model_name: string;
  mae: number;
  rmse: number;
  r2: number;
  samples_count: number;
  test_samples_count: number;
  feature_importance: Record<string, number>;
  test_actual_vs_pred?: Array<{ index: number; actual: number; predicted: number }>;
}

export interface UploadDatasetResponse {
  filename: string;
  total_rows: number;
  total_columns: number;
  column_names: string[];
  missing_values: Record<string, number>;
  total_missing: number;
  preview_data: Array<Record<string, any>>;
  auto_mapping: Record<string, string>;
  expected_features: string[];
  dataset_path: string;
}
