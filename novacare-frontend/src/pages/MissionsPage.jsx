import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import PetWithAccessories from '../components/PetWithAccessories'
import { useEquipment } from '../context/EquipmentContext'


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
  const { companion: contextCompanion } = useEquipment()


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
      case 'sheep': return '/Cookie.png'
      case 'chicken': return '/McNuggets.png'
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
          <PetWithAccessories
            species={contextCompanion?.species || companion?.species}
            size={180}
            style={{right: -20}}
          />
        </div>
        {/* Mission list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {missions.slice(0, 3).map(mission => {
            const done = mission.status === 'completed'
            const inProgress = completing === mission.id
            return (
              <div
                key={mission.id}
                onClick={() => !done && !inProgress && handleComplete(mission.id)}
                style={{
                  background: done ? 'rgba(32,160,144,0.06)' : 'white',
                  borderRadius: 16,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: done ? 'default' : 'pointer',
                  boxShadow: done ? 'none' : '0px 2px 8px rgba(0,0,0,0.06)',
                  border: done ? '1px solid rgba(32,160,144,0.20)' : '1px solid #F0F0F0',
                  transition: 'all 0.2s',
                  opacity: inProgress ? 0.6 : 1
                }}
              >
                {/* Left: emoji + text */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: done ? 'rgba(32,160,144,0.1)' : '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0
                  }}>
                    {done ? '✅' : (categoryEmoji[mission.category] || '⭐')}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 14,
                      color: done ? 'rgba(0,0,0,0.35)' : 'black',
                      fontWeight: 500,
                      textDecoration: done ? 'line-through' : 'none',
                      display: 'block',
                      lineHeight: 1.4
                    }}>
                      {mission.generated_reason || mission.title || 'Daily mission'}
                    </span>
                    {!done && (
                      <span style={{
                        fontSize: 11,
                        color: '#20A090',
                        fontWeight: 500
                      }}>
                        Tap to complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: status */}
                {done ? (
                  <span style={{ color: '#20A090', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    Done
                  </span>
                ) : inProgress ? (
                  <span style={{ color: '#aaa', fontSize: 13, flexShrink: 0 }}>...</span>
                ) : (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    border: '2px solid #20A090',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      background: 'transparent'
                    }} />
                  </div>
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