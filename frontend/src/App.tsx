import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { SensorsPage } from './pages/SensorsPage';
import { WeatherPage } from './pages/WeatherPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PredictionPage } from './pages/PredictionPage';
import { DatasetPage } from './pages/DatasetPage';
import { ReportsPage } from './pages/ReportsPage';

export const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 400);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
        {/* Navigation Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Top Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onRefresh={handleGlobalRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 pt-22 px-6 pb-8 ${
            sidebarCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/weather" element={<WeatherPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/predict" element={<PredictionPage />} />
              <Route path="/dataset" element={<DatasetPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
