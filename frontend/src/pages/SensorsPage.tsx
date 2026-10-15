import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Thermometer,
  Droplets,
  Users,
  Lightbulb,
  Fan,
  PlugZap,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  BatteryCharging,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { fetchSensors } from '../api';
import { SensorItem, SensorDataResponse } from '../types';

export const SensorsPage: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(5);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadSensors = async () => {
    try {
      const res = await fetchSensors();
      setSensorData(res);
      setRefreshCountdown(5);
    } catch (err) {
      console.error('Error fetching sensor telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadSensors();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return Thermometer;
      case 'humidity':
        return Droplets;
      case 'occupancy':
        return Users;
      case 'lighting':
        return Lightbulb;
      case 'ac':
        return Fan;
      case 'plug':
        return PlugZap;
      default:
        return Cpu;
    }
  };

  const filteredSensors = (sensorData?.sensors || []).filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Simulation Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Academic IoT Hardware Simulation Mode</span>
              <Badge variant="warning" size="sm">Demo / Simulated Data</Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              These readings simulate physical Zigbee / MQTT sensor telemetry with micro-fluctuations. When physical ESP32/Raspberry Pi microcontrollers are deployed, point your MQTT broker to <code className="text-cyan-300 font-mono">mqtt://localhost:1883/smarthome/sensors</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>Auto-Refresh: {autoRefresh ? `${refreshCountdown}s` : 'Paused'}</span>
          </button>
          <button
            onClick={loadSensors}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Poll Now
          </button>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400 font-medium">Filter Nodes:</span>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Sensor Types</option>
            <option value="temperature">Temperature</option>
            <option value="humidity">Humidity</option>
            <option value="occupancy">Occupancy</option>
            <option value="lighting">Smart Lighting</option>
            <option value="ac">HVAC / AC</option>
            <option value="plug">Smart Plugs</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Statuses</option>
            <option value="Normal">Normal</option>
            <option value="Warning">Warning</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Normal: {sensorData?.sensors.filter((s) => s.status === 'Normal').length || 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Warning: {sensorData?.sensors.filter((s) => s.status === 'Warning').length || 0}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Offline: 0
          </span>
        </div>
      </div>

      {/* Sensor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSensors.map((sensor) => {
          const Icon = getSensorIcon(sensor.type);
          const isWarning = sensor.status === 'Warning';
          const isOffline = sensor.status === 'Offline';

          return (
            <div
              key={sensor.id}
              className={`glass-panel rounded-2xl p-5 border transition-all duration-300 relative group ${
                isWarning
                  ? 'border-amber-500/40 hover:border-amber-500'
                  : isOffline
                  ? 'border-rose-500/40 opacity-75'
                  : 'border-slate-800 hover:border-cyan-500/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isWarning
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {sensor.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">{sensor.location}</p>
                  </div>
                </div>

                <Badge
                  variant={isWarning ? 'warning' : isOffline ? 'danger' : 'success'}
                  size="sm"
                  dot
                >
                  {sensor.status}
                </Badge>
              </div>

              {/* Reading Display */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold font-heading text-white">{sensor.value}</span>
                  <span className="text-xs font-semibold text-slate-400 ml-1">{sensor.unit}</span>
                </div>
                {sensor.power_draw_w !== undefined && (
                  <span className="text-xs font-mono text-cyan-400">
                    {sensor.power_draw_w} W
                  </span>
                )}
              </div>

              {/* Status Reason / Warning Alert */}
              {sensor.status_reason && (
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{sensor.status_reason}</span>
                </div>
              )}

              {/* Telemetry Metadata Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1" title="Signal Strength">
                  <Wifi className="w-3 h-3 text-cyan-400" />
                  {sensor.signal_rssi} dBm
                </span>

                {sensor.battery_pct !== undefined && (
                  <span className="flex items-center gap-1" title="Battery Level">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    {sensor.battery_pct}%
                  </span>
                )}

                <span className="text-slate-400">
                  {sensor.last_updated}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
