import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, RefreshCw, Radio, Clock } from 'lucide-react';
import { Badge } from './Badge';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarCollapsed,
  onRefresh,
  isRefreshing = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const routeTitles: Record<string, { title: string; subtitle: string }> = {
    '/': {
      title: 'Overview Dashboard',
      subtitle: 'Real-time telemetry, energy KPIs, and thermal gradient intelligence',
    },
    '/sensors': {
      title: 'Live Sensor Monitoring',
      subtitle: 'Simulated IoT multi-zone sensor array with status telemetry',
    },
    '/weather': {
      title: 'Weather & Climate Analytics',
      subtitle: 'Outdoor meteorological metrics, solar irradiance, and diurnal profiles',
    },
    '/analytics': {
      title: 'Energy Analytics & Patterns',
      subtitle: 'Hourly demand distributions, appliance loads, and weather correlations',
    },
    '/predict': {
      title: 'Machine Learning Energy Predictor',
      subtitle: 'Random Forest Regression model forecasting electricity consumption in kWh',
    },
    '/dataset': {
      title: 'Dataset & Model Management',
      subtitle: 'Upload CSV, inspect column distributions, map features, and train the model',
    },
    '/reports': {
      title: 'Reports & Prediction History',
      subtitle: 'Historical prediction logs, baseline audits, and exportable analytics',
    },
  };

  const currentMeta = routeTitles[location.pathname] || {
    title: 'SmartHome IQ',
    subtitle: 'IoT Energy Intelligence Dashboard',
  };

  return (
    <header
      className={`fixed top-0 right-0 h-18 z-20 backdrop-blur-xl bg-[#070b14]/80 border-b border-slate-800/80 px-6 flex items-center justify-between transition-all duration-300 ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-lg font-bold font-heading text-white tracking-tight flex items-center gap-2">
          {currentMeta.title}
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">{currentMeta.subtitle}</p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || '12:00:00'}</span>
        </div>

        {/* Backend Online Badge */}
        <Badge variant="cyan" dot size="sm">
          <Radio className="w-3 h-3 text-cyan-400 inline mr-1" />
          <span className="hidden sm:inline">Backend API:</span> Online
        </Badge>

        {/* Refresh trigger */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        {/* Quick Predict CTA */}
        {location.pathname !== '/predict' && (
          <button
            onClick={() => navigate('/predict')}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run Prediction</span>
          </button>
        )}
      </div>
    </header>
  );
};
