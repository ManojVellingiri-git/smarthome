import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart,
  ScatterChart,
  Line,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  CloudSun,
  Filter,
  Download,
  Zap,
  Info
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { fetchAnalytics } from '../api';

export const AnalyticsPage: React.FC = () => {
  const [rangeType, setRangeType] = useState<string>('weekly');
  const [selectedAppliance, setSelectedAppliance] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (range: string) => {
    try {
      setLoading(true);
      const res = await fetchAnalytics(range);
      setAnalyticsData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(rangeType);
  }, [rangeType]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-heading text-white">Interactive Analytics Engine</h2>
            <p className="text-xs text-slate-400">Filter time-horizons, sub-meters, and thermodynamic correlations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 p-1 text-xs">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setRangeType(t)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                  rangeType === t
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Appliance Filter */}
          <select
            value={selectedAppliance}
            onChange={(e) => setSelectedAppliance(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Sub-systems Combined</option>
            <option value="cooling">Air Conditioning Only</option>
            <option value="lighting">Lighting Only</option>
            <option value="appliances">Plug Loads & Electronics</option>
          </select>
        </div>
      </div>

      {/* Row 1: Hourly Energy Profile & Weekly Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Energy Consumption Curve */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Hourly Energy Demand Distribution (24-Hour Day)
              </h3>
              <p className="text-xs text-slate-400">
                Peak hours emerge between 18:00 and 22:00 driven by family occupancy and AC cooling
              </p>
            </div>
            <Badge variant="cyan" size="sm">Diurnal Load</Badge>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.hourly_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
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
                <Bar
                  dataKey="actual"
                  name="Hourly Energy (kWh)"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="baseline"
                  name="Baseload Standby (kWh)"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily and Weekly Energy Trends (Stacked Breakdown) */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Multi-Day Stacked Energy Trend (by Sub-system)
              </h3>
              <p className="text-xs text-slate-400">
                Cooling load dominates weekends when ambient heat and occupancy remain sustained
              </p>
            </div>
            <Badge variant="info" size="sm">Stacked kWh</Badge>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData?.days_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
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
                <Bar dataKey="cooling_kwh" name="HVAC Cooling" stackId="a" fill="#06b6d4" />
                <Bar dataKey="appliances_kwh" name="Appliances" stackId="a" fill="#3b82f6" />
                <Bar dataKey="lighting_kwh" name="Smart Lighting" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Weather Condition vs Electricity & Temperature Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Conditions vs Consumption */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Energy by Weather Condition
              </h3>
              <p className="text-xs text-slate-400">
                Average consumption per hour across microclimate states
              </p>
            </div>
            <Badge variant="cyan" size="sm">Weather Impact</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsData?.weather_impact}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} unit=" kWh" />
                <YAxis type="category" dataKey="condition" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} kWh / hr`, 'Avg Consumption']}
                />
                <Bar dataKey="avg_kwh" fill="#38bdf8" radius={[0, 4, 4, 0]}>
                  {analyticsData?.weather_impact?.map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 1 ? '#f59e0b' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temperature vs Electricity Consumption Correlation */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Outdoor Temp vs Energy (kWh)
              </h3>
              <p className="text-xs text-slate-400">
                Non-linear surge above 26°C when compressor duty cycle reaches 100%
              </p>
            </div>
            <Badge variant="warning" size="sm">Thermal Curve</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.temp_correlation} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="temp" stroke="#64748b" fontSize={11} tickLine={false} unit="°C" />
                <YAxis dataKey="energy" stroke="#64748b" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} kWh`, 'Energy']}
                  labelFormatter={(lbl) => `Outdoor Temp: ${lbl}°C`}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Humidity vs Electricity Consumption Correlation */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-white">
                Humidity vs Energy (kWh)
              </h3>
              <p className="text-xs text-slate-400">
                Latent heat removal causes moderate energy increases above 70% RH
              </p>
            </div>
            <Badge variant="info" size="sm">Latent Load</Badge>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.humidity_correlation} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="humidity" stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                <YAxis dataKey="energy" stroke="#64748b" fontSize={11} tickLine={false} unit=" kWh" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d1527',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} kWh`, 'Energy']}
                  labelFormatter={(lbl) => `Relative Humidity: ${lbl}%`}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
