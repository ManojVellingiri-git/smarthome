import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  History,
  TrendingDown,
  Sparkles,
  Zap,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { Badge } from '../components/Badge';
import { fetchPredictionHistory, getExportUrl } from '../api';
import { PredictionRecord } from '../types';

export const ReportsPage: React.FC = () => {
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [printDate] = useState<string>(new Date().toLocaleString());

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetchPredictionHistory(100);
      setHistory(res);
    } catch (err) {
      console.error('Error fetching prediction history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Compute aggregate stats
  const totalRuns = history.length;
  const avgPredicted =
    totalRuns > 0
      ? (history.reduce((sum, h) => sum + h.predicted_kwh, 0) / totalRuns).toFixed(2)
      : '0.00';
  const totalSavings =
    totalRuns > 0
      ? history.reduce((sum, h) => sum + (h.savings_potential || 0), 0).toFixed(2)
      : '0.00';

  // Format data for regression scatter
  const scatterData = history.map((item, idx) => ({
    run: idx + 1,
    baseline: item.baseline_kwh,
    predicted: item.predicted_kwh,
    temp: item.outdoor_temp,
  }));

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-4">
      {/* Top Action Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-heading text-white">
              Reports & Audit Intelligence
            </h2>
            <p className="text-xs text-slate-400">
              Audit trails, baseline comparisons, and exportable academic project logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV button */}
          <a
            href={getExportUrl('csv')}
            download="smart_home_predictions_report.csv"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          {/* Print / PDF button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Academic Header */}
      <div className="hidden print:block p-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-black font-heading">
          SmartHome IQ — IoT Energy Intelligence Project Report
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Generated: {printDate} | Department of Computer Science & IoT Engineering
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Prediction Inferences</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-heading text-white">
            {totalRuns}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Logged in local SQLite database</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average Predicted Load</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-heading text-white">
            {avgPredicted} <span className="text-xs font-normal text-slate-400">kWh / hr</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Hourly energy consumption profile</span>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cumulative Energy Savings</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-3xl font-extrabold font-heading text-emerald-400">
            {totalSavings} <span className="text-xs font-normal text-slate-400">kWh</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Identified by smart setpoint suggestions</span>
        </div>
      </div>

      {/* Actual vs Predicted Baseline Scatter / Line Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              Inference Sequence: Baseline vs Model Prediction (kWh)
            </h3>
            <p className="text-xs text-slate-400">
              Evaluating the variance between standard unoptimized baseline and Random Forest output
            </p>
          </div>
          <Badge variant="cyan" size="sm">Audit Trace</Badge>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={scatterData.slice(-20)} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="run" stroke="#64748b" fontSize={11} tickLine={false} label={{ value: 'Inference #', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit=" kWh" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0d1527',
                  borderColor: '#1e293b',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline Benchmark (kWh)"
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted Consumption (kWh)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#06b6d4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-white">
              Inference Log Records ({history.length} Queries)
            </h3>
            <p className="text-xs text-slate-400">
              Chronological log stored in SQLite database with full feature matrices
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">In/Out Temp</th>
                  <th className="px-3 py-2.5">Humidity</th>
                  <th className="px-3 py-2.5">Occ</th>
                  <th className="px-3 py-2.5">AC / Lights</th>
                  <th className="px-3 py-2.5">Weather</th>
                  <th className="px-3 py-2.5 font-bold text-cyan-400">Predicted</th>
                  <th className="px-3 py-2.5">Baseline</th>
                  <th className="px-3 py-2.5 text-emerald-400">Potential Savings</th>
                  <th className="px-3 py-2.5">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2 text-slate-400">#{rec.id}</td>
                    <td className="px-3 py-2 text-slate-300">{rec.timestamp}</td>
                    <td className="px-3 py-2">
                      {rec.indoor_temp}°C / {rec.outdoor_temp}°C
                    </td>
                    <td className="px-3 py-2">{rec.humidity}%</td>
                    <td className="px-3 py-2">{rec.occupancy}</td>
                    <td className="px-3 py-2">
                      <span className={rec.ac_status ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                        {rec.ac_status ? 'AC ON' : 'AC OFF'}
                      </span>{' '}
                      /{' '}
                      <span className={rec.lights_status ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {rec.lights_status ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-sans">{rec.weather_condition}</td>
                    <td className="px-3 py-2 font-bold text-cyan-300">
                      {rec.predicted_kwh.toFixed(3)} kWh
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {rec.baseline_kwh.toFixed(3)} kWh
                    </td>
                    <td className="px-3 py-2 text-emerald-400 font-bold">
                      {rec.savings_potential > 0 ? `-${rec.savings_potential.toFixed(3)} kWh` : '0.000'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={rec.is_demo ? 'warning' : 'success'} size="sm">
                        {rec.is_demo ? 'Demo' : 'ML Model'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No prediction runs logged yet. Head over to the{' '}
            <strong className="text-cyan-400">ML Predictions</strong> tab to execute your first forecast.
          </div>
        )}
      </div>
    </div>
  );
};
