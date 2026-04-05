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
import EventsPage from './pages/EventsPage'
import ProfilePage from './pages/ProfilePage'
import Layout from './components/Layout'
import DressUpPage from './pages/DressUpPage'
import DecoratePage from './pages/DecoratePage'
import FriendChatPage from './pages/FriendChatPage'


function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (user) {
      api.get('/onboarding/status')
        .then(res => setOnboardingStatus(res.data.onboarding_status))
        .catch(() => setOnboardingStatus('not_started'))
        .finally(() => setChecking(false))
    } else {
      setChecking(false)
    }
  }, [user])

  if (loading || checking) return (
    <div className="flex items-center justify-center h-screen">Loading...</div>
  )
  if (!user) return <Navigate to="/welcome" />

  // Skip onboarding check if already on onboarding page
  if (onboardingStatus !== 'completed' && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />
  }
  if (onboardingStatus === 'completed' && window.location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" />
  }

  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (user) return <Navigate to="/dashboard" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <EquipmentProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/welcome" element={<PublicRoute><WelcomePage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/companion" element={<ProtectedRoute><CompanionPage /></ProtectedRoute>} />
            <Route path="/missions" element={<ProtectedRoute><MissionsPage /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
            <Route path="/reward" element={<ProtectedRoute><RewardPage /></ProtectedRoute>} />
            <Route path="/ranks" element={<ProtectedRoute><RanksPage /></ProtectedRoute>} />
            <Route path="/groom" element={<ProtectedRoute><GroomPage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/dressup" element={<ProtectedRoute><DressUpPage /></ProtectedRoute>} />
            <Route path="/decorate" element={<ProtectedRoute><DecoratePage /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><SocialPage /></ProtectedRoute>} />
            <Route path="/chat/:friendId" element={<ProtectedRoute><FriendChatPage /></ProtectedRoute>} />
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="caregiver" element={<CaregiverPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/welcome" />} />
          </Routes>
        </BrowserRouter>
      </EquipmentProvider>
    </AuthProvider>
  )
}