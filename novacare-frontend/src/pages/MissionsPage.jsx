import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const categoryEmoji = {
  walk: '🚶',
  hydration: '💧',
  medication: '💊',
  social: '📞',
  sleep: '😴',
}

export default function MissionsPage() {
  const navigate = useNavigate()
  const [missions, setMissions] = useState([])
  const [points, setPoints] = useState(0)
  const [companion, setCompanion] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(null)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      default: return '/sushi.png'
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [missionsRes, pointsRes, companionRes, profileRes] = await Promise.allSettled([
        api.get('/missions/today'),
        api.get('/missions/points'),
        api.get('/companion/'),
        api.get('/profiles/me'),
      ])
      if (missionsRes.status === 'fulfilled') setMissions(missionsRes.value.data)
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value.data.total_points)
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (missionId) => {
    setCompleting(missionId)
    try {
      await api.post(`/missions/${missionId}/complete`)
      const res = await api.get('/missions/today')
      setMissions(res.data)
      const points = await api.get('/missions/points')
      setPoints(points.data.total_points)

      // Check if ALL missions now completed
      const allDone = res.data.every(m => m.status === 'completed')
      if (allDone && res.data.length > 0) {
        setTimeout(() => navigate('/reward'), 800)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCompleting(null)
    }
  }

  const completedCount = missions.filter(m => m.status === 'completed').length
  const totalCount = missions.length
  const xpToNextLevel = companion ? (companion.level * 100) - companion.xp : 0
  const userName = profile?.preferred_name || profile?.full_name || 'there'

  if (loading) return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter'
    }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: '#F8F9FA',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '44px 24px 0',
        background: '#F8F9FA',
        flexShrink: 0
      }}>
        {/* Back + Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          marginBottom: 20
        }}>
          <div
            onClick={() => navigate('/dashboard')}
            style={{ position: 'absolute', left: 0, cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
          </div>
        
          {/* Ranks button */}
          <div
            onClick={() => navigate('/ranks')}
            style={{
              position: 'absolute',
              right: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#20A090',
              fontSize: 13,
              fontWeight: 600
            }}
          >
            🏆 Ranks
          </div>
        </div>
        {/* Greeting */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'black',
          margin: '0 0 4px',
          textAlign: 'center'
        }}>
          {getGreeting()}, <span style={{ color: '#20A090' }}>{userName}!</span>
        </h1>
        <p style={{
          fontSize: 13,
          color: 'rgba(0,0,0,0.5)',
          textAlign: 'center',
          margin: '0 0 20px'
        }}>
          Small steps today help you feel better tomorrow
        </p>
      </div>

      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px 24px'
      }}>

        {/* Today's Missions card */}
        <div style={{
          background: '#20A090',
          borderRadius: 20,
          padding: '20px 20px 20px 24px',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: 13,
              margin: '0 0 6px',
              fontWeight: 500
            }}>
              Today's Missions
            </p>
            <h2 style={{
              color: 'white',
              fontSize: 32,
              fontWeight: 700,
              margin: 0
            }}>
              {completedCount}/{totalCount} Tasks
            </h2>
          </div>
          {/* Paw decoration */}
          <div style={{ fontSize: 85, opacity: 0.3 }}>🐾</div>
        </div>

       {/* Progress card */}
        <div style={{
          background: 'rgba(32,160,144,0.12)',
          borderRadius: 20,
          padding: '16px 20px 16px 24px',
          marginBottom: 20,
          position: 'relative',
          overflow: 'hidden',
          height: 110
        }}>
          <div>
            <p style={{
              color: 'rgba(0,0,0,0.5)',
              fontSize: 13,
              margin: '0 0 4px',
              fontWeight: 500
            }}>
              Your Progress
            </p>
            <h3 style={{
              color: '#20A090',
              fontSize: 20,
              fontWeight: 700,
              margin: 0
            }}>
              {points} points · Level {companion?.level || 1}
            </h3>
            <p style={{
              color: 'rgba(0,0,0,0.4)',
              fontSize: 12,
              margin: '4px 0 0'
            }}>
              {xpToNextLevel} XP to level {(companion?.level || 1) + 1}
            </p>
          </div>

          {/* Pet image - absolutely positioned to right, can overflow bottom */}
          <img
            src={getPetImage(companion?.species)}
            alt="pet"
            style={{
              position: 'absolute',
              right: -10,
              bottom: -30,
              width: 160,
              height: 180,
              objectFit: 'contain'
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        {/* Mission list - max 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {missions.slice(0, 3).map(mission => {
            const done = mission.status === 'completed'
            const inProgress = completing === mission.id
            return (
              <div
                key={mission.id}
                onClick={() => !done && handleComplete(mission.id)}
                style={{
                  background: done ? 'rgba(32,160,144,0.06)' : 'white',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: done ? 'default' : 'pointer',
                  boxShadow: done ? 'none' : '0px 2px 8px rgba(0,0,0,0.06)',
                  border: done ? '1px solid rgba(32,160,144,0.15)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>
                    {categoryEmoji[mission.category] || '⭐'}
                  </span>
                  <span style={{
                    fontSize: 15,
                    color: done ? 'rgba(0,0,0,0.4)' : 'black',
                    fontWeight: 500,
                    textDecoration: done ? 'line-through' : 'none'
                  }}>
                    {mission.generated_reason || mission.title || 'Daily mission'}
                  </span>
                </div>

                {done ? (
                  <span style={{
                    color: '#20A090',
                    fontSize: 14,
                    fontWeight: 600
                  }}>Done</span>
                ) : (
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: inProgress ? '#20A090' : '#20A090',
                    opacity: inProgress ? 0.5 : 1
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Empty state */}
        {missions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 0',
            color: '#aaa',
            fontSize: 14
          }}>
            No missions yet today
          </div>
        )}

      </div>

    </div>
  )
}