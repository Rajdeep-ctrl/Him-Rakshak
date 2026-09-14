import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { DataModeProvider } from './context/DataModeContext';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Toast from './components/common/Toast';
import VoiceAssistantModal from './components/common/VoiceAssistantModal';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RiskMap from './pages/RiskMap';
import Alerts from './pages/Alerts';
import Roads from './pages/Roads';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function Layout({ children, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Topbar 
          title={title} 
          setMobileOpen={setMobileOpen} 
          onOpenVoice={() => setIsVoiceOpen(true)} 
        />
        <main className="flex-1">{children}</main>
      </div>
      <Toast />
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DataModeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <Layout title="Regional Risk Command Overview">
                  <Dashboard />
                </Layout>
              }
            />

            <Route
              path="/risk-map"
              element={
                <Layout title="GIS Landslide Surveillance Map">
                  <RiskMap />
                </Layout>
              }
            />

            <Route
              path="/alerts"
              element={
                <Layout title="Early Warning Incident Control Center">
                  <Alerts />
                </Layout>
              }
            />

            <Route
              path="/roads"
              element={
                <Layout title="Highway Corridor Vulnerability Monitoring">
                  <Roads />
                </Layout>
              }
            />

            <Route
              path="/reports"
              element={
                <Layout title="Field Hazard Reporting System">
                  <Reports />
                </Layout>
              }
            />

            <Route
              path="/analytics"
              element={
                <Layout title="Predictive Risk Analytics">
                  <Analytics />
                </Layout>
              }
            />

            <Route
              path="/settings"
              element={
                <Layout title="Command System Settings">
                  <Settings />
                </Layout>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DataModeProvider>
    </LanguageProvider>
  );
}