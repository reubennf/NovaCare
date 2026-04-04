import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [companion, setCompanion] = useState(null)
  const [missions, setMissions] = useState([])
  const [logs, setLogs] = useState([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [profileRes, companionRes, missionsRes, logsRes, pointsRes] = await Promise.allSettled([
        api.get('/profiles/me'),
        api.get('/companion/'),
        api.get('/missions/today'),
        api.get('/medications/logs/today'),
        api.get('/missions/points'),
      ])

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (missionsRes.status === 'fulfilled') setMissions(missionsRes.value.data)
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data)
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value.data.total_points)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const completedMissions = missions.filter(m => m.status === 'completed').length
  const takenMeds = logs.filter(l => l.status === 'taken').length
  const pendingMeds = logs.filter(l => l.status === 'pending').length

  const petEmoji = companion?.species === 'cat' ? '🐱' : companion?.species === 'chick' ? '🐣' : '🐶'
  const moodColor = companion?.mood_state === 'happy' ? 'text-green-500' : companion?.mood_state === 'concerned' ? 'text-amber-500' : 'text-blue-400'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {profile?.preferred_name || 'there'} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-SG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Points</p>
          <p className="text-2xl font-bold text-purple-600">{points}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Missions today</p>
          <p className="text-2xl font-bold text-gray-800">{completedMissions}/{missions.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Meds taken</p>
          <p className="text-2xl font-bold text-gray-800">{takenMeds}/{takenMeds + pendingMeds}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Pet companion card */}
        {companion ? (
          <div
            className="bg-white rounded-2xl p-6 border border-gray-100 cursor-pointer hover:border-purple-200 transition-colors"
            onClick={() => navigate('/companion')}
          >
            <div className="text-center">
              <div className="text-6xl mb-3">{petEmoji}</div>
              <h2 className="font-bold text-gray-800 text-lg">{companion.name}</h2>
              <p className={`text-sm ${moodColor} font-medium capitalize`}>{companion.mood_state}</p>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Energy</span><span>{companion.energy}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${companion.energy}%` }}/>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Affection</span><span>{companion.affection}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 bg-pink-400 rounded-full" style={{ width: `${companion.affection}%` }}/>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Level {companion.level} · {companion.xp} XP</p>
            </div>
          </div>
        ) : (
          <div
            className="bg-purple-50 rounded-2xl p-6 border border-purple-100 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => navigate('/companion')}
          >
            <div className="text-4xl mb-2">🐾</div>
            <p className="text-purple-600 font-medium text-sm">Create your companion</p>
          </div>
        )}

        {/* Today's missions */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3">Today's missions</h2>
          {missions.length === 0 ? (
            <p className="text-gray-400 text-sm">No missions yet</p>
          ) : (
            <div className="space-y-2">
              {missions.slice(0, 4).map(mission => (
                <div key={mission.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${mission.status === 'completed' ? 'bg-green-400' : 'bg-gray-100'}`}/>
                  <span className={`text-sm ${mission.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {mission.generated_reason || 'Daily mission'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/missions')}
            className="mt-4 text-xs text-purple-500 hover:text-purple-700"
          >
            View all missions →
          </button>
        </div>
      </div>

      {/* Medication reminders */}
      {pendingMeds > 0 && (
        <div
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/medications')}
        >
          <span className="text-2xl">💊</span>
          <div>
            <p className="font-medium text-amber-800 text-sm">You have {pendingMeds} medication{pendingMeds > 1 ? 's' : ''} pending today</p>
            <p className="text-amber-600 text-xs mt-0.5">Tap to view and mark as taken</p>
          </div>
        </div>
      )}
    </div>
  )
}