import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import { UserProvider } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'

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
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-duo-bg transition-colors relative overflow-hidden">
            <div className="relative z-10">
              <AnimatePresence mode="wait" initial={false}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                </Routes>
              </AnimatePresence>
            </div>
          </div>
        </Router>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
