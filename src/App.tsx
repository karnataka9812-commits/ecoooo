import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { EcoSonicProvider } from './context/EcoSonicContext';
import { LandingPage } from './pages/LandingPage';
import { ObservatoryPage } from './pages/ObservatoryPage';
import { DetectionsPage } from './pages/DetectionsPage';
import { SoundscapePage } from './pages/SoundscapePage';
import { DisturbancesPage } from './pages/DisturbancesPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <EcoSonicProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<Navigate to="/app/observatory" replace />} />
          <Route path="/app/observatory" element={<ObservatoryPage />} />
          <Route path="/app/detections" element={<DetectionsPage />} />
          <Route path="/app/soundscape" element={<SoundscapePage />} />
          <Route path="/app/disturbances" element={<DisturbancesPage />} />
          <Route path="/app/sessions" element={<SessionsPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EcoSonicProvider>
  );
}
