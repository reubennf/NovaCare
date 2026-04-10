import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState, useEffect } from 'react'
import { EquipmentProvider } from './context/EquipmentContext'
import api from './lib/api'

import WelcomePage from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import MedicationsPage from './pages/MedicationsPage'
import GroomPage from './pages/GroomPage'
import FeedPage from './pages/FeedPage'
import CompanionPage from './pages/CompanionPage'
import MissionsPage from './pages/MissionsPage'
import RewardPage from './pages/RewardPage'
import RanksPage from './pages/RanksPage'
import CaregiverPage from './pages/CaregiverPage'
import SocialPage from './pages/SocialPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'
import DressUpPage from './pages/DressUpPage'
import DecoratePage from './pages/DecoratePage'
import FriendChatPage from './pages/FriendChatPage'
import MedicationReminder from './components/MedicationReminder'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user) {
      import('./lib/supabase').then(({ supabase }) => {
        supabase
          .from('profiles')
          .select('onboarding_status')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (data?.onboarding_status) {
              setOnboardingStatus(data.onboarding_status)
            } else {
              setOnboardingStatus('not_started')
            }
          })
          .finally(() => setChecking(false))
      })
    } else {
      setChecking(false)
    }
  }, [user])

  if (loading || checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter' }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )

  if (!user) return <Navigate to="/welcome" replace />

  const currentPath = window.location.pathname

  if (onboardingStatus !== 'completed' && currentPath !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  if (onboardingStatus === 'completed' && currentPath === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (user) return <Navigate to="/dashboard" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const [fontSize, setFontSize] = useState('medium')

  useEffect(() => {
    if (!user) return
    const loadFontSize = async () => {
      const { supabase } = await import('./lib/supabase')
      const { data } = await supabase
        .from('profiles')
        .select('font_size')
        .eq('id', user.id)
        .single()
      if (data?.font_size) setFontSize(data.font_size)
    }
    loadFontSize()
  }, [user])

  const fontSizeMap = {
    small: '13px',
    medium: '15px',
    large: '17px',
    xl: '20px'
  }

  return (
    <div style={{ fontSize: fontSizeMap[fontSize] || '15px' }}>
      {user && <MedicationReminder />}
      <Routes>
        {/* Public */}
        <Route path="/welcome" element={<PublicRoute><WelcomePage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Standalone pages - no sidebar */}
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/companion" element={<ProtectedRoute><CompanionPage /></ProtectedRoute>} />
        <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
        <Route path="/reward" element={<ProtectedRoute><RewardPage /></ProtectedRoute>} />
        <Route path="/ranks" element={<ProtectedRoute><RanksPage /></ProtectedRoute>} />
        <Route path="/groom" element={<ProtectedRoute><GroomPage /></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
        <Route path="/dressup" element={<ProtectedRoute><DressUpPage /></ProtectedRoute>} />
        <Route path="/decorate" element={<ProtectedRoute><DecoratePage /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
        <Route path="/chat/:friendId" element={<ProtectedRoute><FriendChatPage /></ProtectedRoute>} />
        <Route path="/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/welcome" />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <EquipmentProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </EquipmentProvider>
    </AuthProvider>
  )
}