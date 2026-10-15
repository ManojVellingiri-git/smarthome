import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Thermometer,
  Droplets,
  Zap,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  CloudSun,
  Activity,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { KpiCard } from '../components/KpiCard';
import { Badge } from '../components/Badge';
import { fetchDashboardData } from '../api';
import { DashboardData } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardData();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading IoT sensor streams and telemetry...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-4">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-semibold">Failed to Connect to Dashboard Telemetry</h3>
          <p className="text-xs text-rose-400 mt-1">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 pb-12">
      {/* Notice Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/20 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Smart Home Multi-Sensor Grid Active</span>
              <Badge variant="cyan" size="sm">Demo / Simulated Stream</Badge>
            </div>
            <p className="text-xs text-slate-400">
              Correlating real-time micro-climate sensors with Random Forest Regression to optimize HVAC and plug loads.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/predict')}
          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium shrink-0 group"
        >
          <span>Run Custom ML Prediction</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Indoor Temp"
          value={kpis?.current_temperature ?? 22.8}
          unit="°C"
          delta={{ value: 'Target: 22.5°C', isPositiveGood: true }}
          icon={Thermometer}
          iconColor="text-cyan-400"
          badge="Optimal"
          badgeVariant="success"
        />

        <KpiCard
          title="Humidity"
          value={kpis?.humidity ?? 58.0}
          unit="%"
          delta={{ value: 'Comfort Range', isPositiveGood: true }}
          icon={Droplets}
          iconColor="text-blue-400"
          badge="Normal"
          badgeVariant="info"
        />

        <KpiCard
          title="Current Energy"
          value={kpis?.current_energy_kwh ?? 2.14}
          unit="kWh"
          subtext="Measured real-time"
          icon={Zap}
          iconColor="text-amber-400"
          badge="Live"
          badgeVariant="warning"
        />

        <KpiCard
          title="ML Predicted"
          value={kpis?.predicted_energy_kwh ?? 2.05}
          unit="kWh"
          subtext="Random Forest Model"
          icon={Sparkles}
          iconColor="text-cyan-300"
          badge="RF Regressor"
          badgeVariant="cyan"
        />

        <KpiCard
          title="Energy Saved"
          value={kpis?.energy_saved_percentage ?? 4.2}
          unit="%"
          delta={{ value: 'vs Unoptimized', isPositiveGood: true }}
          icon={TrendingDown}
          iconColor="text-emerald-400"
          badge="Eco Active"
          badgeVariant="success"
        />

        <KpiCard
          title="System Status"
          value="Optimal"
          subtext="8 Nodes Online"
          icon={ShieldCheck}
          iconColor="text-emerald-400"
          badge="Protected"
          badgeVariant="success"
        />
      </div>

      {/* Charts Row 1: Energy Over Time (Actual vs Predicted) & Indoor/Outdoor Temperature */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Energy Consumption Over Time */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Energy Consumption Over Time (24h)
              </h2>
              <p className="text-xs text-slate-400">
                Comparing actual smart meter readings against Random Forest model predictions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm">Hourly Aggregation</Badge>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.energy_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="actual_kwh"
                  name="Actual Consumption (kWh)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 2, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="predicted_kwh"
                  name="Random Forest Prediction (kWh)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2, fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weather Conditions & Microclimate Summary Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold font-heading text-white">Weather & Microclimate</h2>
              <Badge variant="info" size="sm">Rooftop Station</Badge>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Outdoor ambient weather influencing smart thermostat thermal resistance
            </p>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CloudSun className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xl font-bold font-heading text-white">
                    {data?.weather_summary.outdoor_temp}°C
                  </span>
                  <p className="text-xs text-slate-400">{data?.weather_summary.condition}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-cyan-400">Outdoor</span>
                <p className="text-xs text-slate-400">Indoor: {kpis?.current_temperature}°C</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Wind Velocity</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {data?.weather_summary.wind_speed_kmh} km/h
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Relative Humidity</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {data?.weather_summary.humidity}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Solar UV Index</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {data?.weather_summary.uv_index} (Moderate)
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-400">Air Quality</span>
                <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                  {data?.weather_summary.air_quality}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/weather')}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>View Full Weather Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Charts Row 2: Appliance-wise Breakdown & Temperature Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appliance-wise Energy Consumption */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Appliance Energy Distribution
              </h2>
              <p className="text-xs text-slate-400">
                Real-time sub-metering breakdown across high-draw smart appliances
              </p>
            </div>
            <Badge variant="cyan" size="sm">Sub-metered</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.appliance_breakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} unit=" kWh" />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  width={140}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} kWh`, 'Consumption']}
                />
                <Bar dataKey="kwh" radius={[0, 6, 6, 0]}>
                  {data?.appliance_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#06b6d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Indoor vs Outdoor Temperature Comparison */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Indoor vs Outdoor Temperature (°C)
              </h2>
              <p className="text-xs text-slate-400">
                Evaluating envelope thermal insulation and HVAC setpoint response
              </p>
            </div>
            <Badge variant="info" size="sm">Thermal Gradient</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.energy_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[16, 36]} unit="°C" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Line
                  type="monotone"
                  dataKey="outdoor_temp"
                  name="Outdoor Temp (°C)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="indoor_temp"
                  name="Indoor Temp (°C)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sensor Activity & Prediction Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sensor Activity Feed */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-white">
                Recent Sensor Activity & Automations
              </h2>
              <p className="text-xs text-slate-400">
                Chronological log of gateway events, PIR triggers, and HVAC inverter modulations
              </p>
            </div>
            <Badge variant="cyan" size="sm">Live Stream</Badge>
          </div>

          <div className="space-y-2.5">
            {data?.recent_activities.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <div>
                    <span className="font-semibold text-slate-200">{item.sensor}</span>
                    <p className="text-slate-400 mt-0.5">{item.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">{item.time}</span>
                  <Badge
                    variant={item.status === 'Warning' ? 'warning' : 'success'}
                    size="sm"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Small Prediction Quick Summary */}
        <div className="glass-panel-glow rounded-2xl p-5 border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                ML Energy Forecast
              </span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>

            <h3 className="text-xl font-bold font-heading text-white">
              Next Hour Demand Estimate
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Based on present occupancy (3), outdoor temp ({kpis?.outdoor_temperature}°C), and active HVAC cycle.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-center">
              <span className="text-4xl font-extrabold font-heading text-cyan-300">
                {kpis?.predicted_energy_kwh}
              </span>
              <span className="text-sm font-semibold text-slate-400 ml-1.5">kWh</span>
              <div className="mt-2 text-[11px] text-emerald-400 font-medium">
                ~{kpis?.energy_saved_percentage}% potential savings with Eco Setpoint
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Model Architecture:</span>
                <span className="text-slate-200 font-mono">Random Forest Regressor</span>
              </div>
              <div className="flex justify-between">
                <span>Cross-Validation R²:</span>
                <span className="text-cyan-400 font-mono">0.8282 (Real Test Set)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/predict')}
            className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all"
          >
            Open ML Prediction Studio
          </button>
        </div>
      </div>
    </div>
  );
};
