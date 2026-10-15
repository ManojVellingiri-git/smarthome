import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Thermometer,
  Droplets,
  Users,
  Lightbulb,
  Fan,
  Clock,
  CloudSun,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { Badge } from '../components/Badge';
import { predictEnergyConsumption } from '../api';
import { PredictionResult } from '../types';

export const PredictionPage: React.FC = () => {
  // Form State
  const [indoorTemp, setIndoorTemp] = useState<number>(22.5);
  const [outdoorTemp, setOutdoorTemp] = useState<number>(31.0);
  const [humidity, setHumidity] = useState<number>(62.0);
  const [occupancy, setOccupancy] = useState<number>(3);
  const [acStatus, setAcStatus] = useState<number>(1);
  const [lightsStatus, setLightsStatus] = useState<number>(1);
  const [previousEnergy, setPreviousEnergy] = useState<number>(1.85);
  const [weatherCondition, setWeatherCondition] = useState<string>('Hot/Humid');

  // Execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // Load Preset / Current Live Sensor Readings
  const handleLoadCurrentSensors = () => {
    setIndoorTemp(22.8);
    setOutdoorTemp(29.4);
    setHumidity(58.0);
    setOccupancy(3);
    setAcStatus(1);
    setLightsStatus(1);
    setPreviousEnergy(2.14);
    setWeatherCondition('Partly Cloudy');
    setError(null);
  };

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (indoorTemp < 10 || indoorTemp > 45) {
      setError('Indoor temperature must be between 10°C and 45°C.');
      return;
    }
    if (outdoorTemp < -10 || outdoorTemp > 55) {
      setError('Outdoor temperature must be between -10°C and 55°C.');
      return;
    }
    if (humidity < 5 || humidity > 100) {
      setError('Humidity must be between 5% and 100%.');
      return;
    }
    if (occupancy < 0 || occupancy > 15) {
      setError('Occupancy count must be between 0 and 15 persons.');
      return;
    }
    if (previousEnergy < 0 || previousEnergy > 30) {
      setError('Previous energy consumption must be between 0 and 30 kWh.');
      return;
    }

    try {
      setLoading(true);
      const res = await predictEnergyConsumption({
        indoor_temp: indoorTemp,
        outdoor_temp: outdoorTemp,
        humidity: humidity,
        occupancy: occupancy,
        ac_status: acStatus,
        lights_status: lightsStatus,
        previous_energy: previousEnergy,
        weather_condition: weatherCondition,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate model prediction');
    } finally {
      setLoading(false);
    }
  };

  const comparisonData = result
    ? [
        { name: 'Baseline Benchmark', kwh: result.baseline_kwh, color: '#64748b' },
        { name: 'RF Model Predicted', kwh: result.predicted_kwh, color: '#06b6d4' },
      ]
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Academic Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900 border border-cyan-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Random Forest Regression Inference Engine
              </span>
              <Badge variant="cyan" size="sm">
                Scikit-Learn (n_estimators=100)
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Trained on chronological multi-sensor IoT smart home data with time-aware cross validation (R² = 0.83).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLoadCurrentSensors}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Load Live Sensor Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form Column (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold font-heading text-white">Input Parameters</h2>
              <p className="text-xs text-slate-400">Specify environmental and appliance states</p>
            </div>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Temperatures Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                  <span>Indoor Temp</span>
                  <span className="text-cyan-400 font-mono">{indoorTemp}°C</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="45"
                    value={indoorTemp}
                    onChange={(e) => setIndoorTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <Thermometer className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                  <span>Outdoor Temp</span>
                  <span className="text-amber-400 font-mono">{outdoorTemp}°C</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="-10"
                    max="55"
                    value={outdoorTemp}
                    onChange={(e) => setOutdoorTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <CloudSun className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Humidity & Occupancy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                  <span>Relative Humidity</span>
                  <span className="text-blue-400 font-mono">{humidity}%</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="100"
                    value={humidity}
                    onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <Droplets className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                  <span>Occupancy Count</span>
                  <span className="text-emerald-400 font-mono">{occupancy}</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="15"
                    value={occupancy}
                    onChange={(e) => setOccupancy(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <Users className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Appliance Toggles: AC & Lighting */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fan className={`w-4 h-4 ${acStatus ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium text-slate-300">Air Conditioner</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAcStatus(acStatus ? 0 : 1)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    acStatus ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      acStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className={`w-4 h-4 ${lightsStatus ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium text-slate-300">Lighting</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLightsStatus(lightsStatus ? 0 : 1)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    lightsStatus ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      lightsStatus ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Previous Energy & Weather Condition */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between mb-1">
                  <span>Previous Consumption</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="30"
                    value={previousEnergy}
                    onChange={(e) => setPreviousEnergy(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="kWh"
                    required
                  />
                  <span className="text-[10px] text-slate-400 absolute right-3 top-2.5 font-mono">kWh</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Weather State
                </label>
                <select
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Clear/Sunny">Clear / Sunny</option>
                  <option value="Partly Cloudy">Partly Cloudy</option>
                  <option value="Hot/Humid">Hot / Humid</option>
                  <option value="Rainy">Rainy</option>
                  <option value="Overcast">Overcast</option>
                  <option value="Thunderstorm">Thunderstorm</option>
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Calculating Random Forest Tree Ensemble...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Energy Consumption</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* Main Prediction Display Card */}
              <div className="glass-panel-glow rounded-2xl p-6 border border-cyan-500/30 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                        Prediction Result
                      </span>
                      <Badge variant={result.is_demo ? 'warning' : 'success'} size="sm">
                        {result.is_demo ? 'Demo Estimate' : 'Trained ML Model'}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-white mt-1">
                      Expected Electricity Demand
                    </h3>
                    <p className="text-xs text-slate-400">Forecasting for the upcoming {result.period}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-4xl font-extrabold font-heading text-cyan-300">
                      {result.predicted_kwh}
                    </span>
                    <span className="text-sm font-semibold text-slate-400 ml-1.5">kWh</span>
                  </div>
                </div>

                {/* Baseline Comparison Delta Bar */}
                <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-400">Benchmark Baseline for Condition:</span>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      {result.baseline_kwh} kWh
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {result.difference_percentage > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{result.difference_percentage}% vs Baseline
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {result.difference_percentage}% vs Baseline
                      </span>
                    )}
                  </div>
                </div>

                {/* Mini Comparison Bar Chart */}
                <div className="mt-5">
                  <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} unit=" kWh" />
                        <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={130} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0d1527',
                            borderColor: '#1e293b',
                            borderRadius: '0.75rem',
                            color: '#f8fafc',
                          }}
                          formatter={(v: any) => [`${v} kWh`, 'Demand']}
                        />
                        <Bar dataKey="kwh" radius={[0, 6, 6, 0]}>
                          {comparisonData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Model Explanation */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  <span className="text-cyan-400 font-semibold block mb-1">Inference Rationale:</span>
                  {result.explanation}
                </div>
              </div>

              {/* Energy Saving Recommendations */}
              <div className="glass-panel rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold font-heading text-white flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    Physics-Grounded Energy-Saving Suggestions
                  </h3>
                  <Badge variant="success" size="sm">Actionable</Badge>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Optimizations derived from input gradients and occupancy schedules:
                </p>

                <div className="space-y-3">
                  {result.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{rec.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            Save ~{rec.potential_savings_kwh} kWh
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                              rec.priority === 'High'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : rec.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rec.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="glass-panel rounded-2xl p-12 border border-slate-800 flex flex-col items-center justify-center text-center h-full min-h-[420px]">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold font-heading text-white">
                Awaiting Prediction Parameters
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                Configure your indoor setpoint, outdoor climate conditions, occupancy count, and appliance states on the left panel, then click <strong>“Predict Energy Consumption”</strong> to query the Random Forest model.
              </p>
              <button
                type="button"
                onClick={handleLoadCurrentSensors}
                className="mt-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
              >
                Populate Sample Telemetry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
