import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Home', emoji: '🏠' },
  { path: '/companion', label: 'Sushi', emoji: '🐾' },
  { path: '/medications', label: 'Medications', emoji: '💊' },
  { path: '/missions', label: 'Missions', emoji: '⭐' },
  { path: '/events', label: 'Events', emoji: '📅' },
  { path: '/caregiver', label: 'Caregiver', emoji: '👨‍👩‍👧' },
  { path: '/profile', label: 'Profile', emoji: '👤' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col py-6 px-3">
        <div className="mb-8 px-3">
            <h1 className="text-xl font-bold" style={{ color: '#20A090' }}>
                <span className="text-gray-900">Nova</span>Care
            </h1>
            <p className="text-xs text-gray-400 mt-1">Your care companion</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-base">{item.emoji}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="mx-3 mt-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors text-left"
        >
          Sign out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}