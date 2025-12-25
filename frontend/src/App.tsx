import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { LessonPage } from './pages/LessonPage';
import { LearnPage } from './pages/LearnPage';
import { ProfilePage } from './pages/ProfilePage';
import { ShopPage } from './pages/ShopPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SettingsPage } from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

// Backend warm-up: Ping health endpoint on app load to wake up Render free tier
const warmUpBackend = () => {
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '')
  
  // Only warm up in production (when API_BASE_URL is not localhost)
  if (!API_BASE_URL.includes('localhost') && !API_BASE_URL.includes('127.0.0.1')) {
    // Ping health endpoint silently (don't wait for response)
    fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      credentials: 'include',
      // Don't wait - fire and forget
    }).catch(() => {
      // Silently ignore errors - this is just a warm-up
    })
    
    console.log('✅ Backend warm-up ping sent (Render free tier cold start)')
  }
}

function App() {
  // Warm up backend on app load (helps with Render free tier cold starts)
  useEffect(() => {
    warmUpBackend()
  }, [])

  return (
    <ThemeProvider>
      <UserProvider>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Lesson routes (no shell) */}
            <Route path="/lesson/:lessonId" element={<LessonPage />} />

            {/* Main app routes (with shell) */}
            <Route element={<AppShell />}>
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/practice" element={<div>Practice Page</div>} />
              <Route path="/invest" element={<div>Invest Page</div>} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/learn" replace />} />
          </Routes>
        </HashRouter>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
