import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { DataModeProvider } from './context/DataModeContext';
import { ThemeProvider } from './context/ThemeContext';
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
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text)] flex antialiased">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Topbar
          title={title}
          setMobileOpen={setMobileOpen}
          onOpenVoice={() => setIsVoiceOpen(true)}
        />
        <main className="flex-1 px-3 pb-6 pt-4 sm:px-4 lg:px-6">{children}</main>
      </div>
      <Toast />
      <VoiceAssistantModal isOpen={isVoiceOpen} onClose={() => setIsVoiceOpen(false)} />
    </div>
  );
}

function AppContent() {
  const { t } = useLanguage();

  return (
    <DataModeProvider>
          <BrowserRouter>
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <Layout title={t('regionalOverview')}>
                  <Dashboard />
                </Layout>
              }
            />

            <Route
              path="/risk-map"
              element={
                <Layout title={t('gisSurveillance')}>
                  <RiskMap />
                </Layout>
              }
            />

            <Route
              path="/alerts"
              element={
                <Layout title={t('earlyWarningCenter')}>
                  <Alerts />
                </Layout>
              }
            />

            <Route
              path="/roads"
              element={
                <Layout title={t('highwayMonitoring')}>
                  <Roads />
                </Layout>
              }
            />

            <Route
              path="/reports"
              element={
                <Layout title={t('citizenReports')}>
                  <Reports />
                </Layout>
              }
            />

            <Route
              path="/analytics"
              element={
                <Layout title={t('predictiveAnalytics')}>
                  <Analytics />
                </Layout>
              }
            />

            <Route
              path="/settings"
              element={
                <Layout title={t('systemSettings')}>
                  <Settings />
                </Layout>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
    </DataModeProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}