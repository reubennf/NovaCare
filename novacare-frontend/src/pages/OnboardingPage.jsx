import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [companion, setCompanion] = useState(null)
  const [loading, setLoading] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getTime = () => {
    return new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  const getMoodLabel = (mood) => {
    switch (mood) {
      case 'happy': return 'happy'
      case 'concerned': return 'a little concerned'
      case 'sleepy': return 'sleepy'
      default: return 'happy'
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, companionRes] = await Promise.allSettled([
          api.get('/profiles/me'),
          api.get('/companion/'),
        ])
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
        if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const petEmoji = companion?.species === 'cat' ? '🐱' : companion?.species === 'chick' ? '🐣' : '🐶'
  const userName = profile?.preferred_name || profile?.full_name || 'there'
  const companionName = companion?.name || 'Sushi'
  const mood = getMoodLabel(companion?.mood_state)

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
      background: 'white',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* NovaPet logo */}
      <div style={{ left: 160, top: 34, position: 'absolute' }}>
        <span style={{ color: 'black', fontSize: 20, fontFamily: 'Inter', fontWeight: 700 }}>Nova</span>
        <span style={{ color: '#20A090', fontSize: 20, fontFamily: 'Inter', fontWeight: 700 }}>Pet</span>
      </div>

      {/* Greeting */}
      <div style={{ left: 54, top: 109, position: 'absolute' }}>
        <span style={{ color: 'black', fontSize: 30, fontFamily: 'Inter', fontWeight: 400 }}>
          {getGreeting()},{' '}
        </span>
        <span style={{ color: 'black', fontSize: 30, fontFamily: 'Inter', fontWeight: 700 }}>
          {userName}
        </span>
      </div>

      {/* Time and weather */}
      <div style={{
        left: 150,
        top: 155,
        position: 'absolute',
        color: 'rgba(0,0,0,0.67)',
        fontSize: 16,
        fontFamily: 'Inter',
        fontWeight: 400
      }}>
        {getTime()} | Sunny
      </div>

      {/* Pet image */}
      <img
        src="/CatWelcome.png"
        alt="pet"
        style={{
          width: 240,
          height: 262,
          left: 82,
          top: 216,
          position: 'absolute',
          objectFit: 'contain'
        }}
        onError={e => {
          e.target.style.display = 'none'
        }}
      />

      {/* Pet shadow */}
      <div style={{
        width: 198,
        height: 41,
        left: 103,
        top: 437,
        position: 'absolute',
        background: 'rgba(0,0,0,0.10)',
        borderRadius: 9999,
        filter: 'blur(12px)'
      }} />

      {/* Pet mood */}
      <div style={{ left: 145, top: 510, position: 'absolute' }}>
        <span style={{
          color: 'rgba(0,0,0,0.67)',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: 700
        }}>
          {companionName}
        </span>
        <span style={{
          color: 'rgba(0,0,0,0.67)',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: 400
        }}>
          {' '}is {mood}
        </span>
      </div>

      {/* Chat button */}
      <div
        onClick={() => navigate('/companion')}
        style={{
          width: 273,
          height: 55,
          left: 65,
          top: 572,
          position: 'absolute',
          background: 'white',
          boxShadow: '0px 4px 9px rgba(0,0,0,0.16)',
          borderRadius: 30,
          border: '1px solid rgba(0,0,0,0.09)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: 'black', fontSize: 20, fontFamily: 'Inter', fontWeight: 400 }}>
          Chat
        </span>
      </div>

      {/* Today's Missions button */}
      <div
        onClick={() => navigate('/missions')}
        style={{
          width: 273,
          height: 55,
          left: 64,
          top: 645,
          position: 'absolute',
          background: 'white',
          boxShadow: '0px 4px 9px rgba(0,0,0,0.16)',
          borderRadius: 30,
          border: '1px solid rgba(0,0,0,0.09)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: 'black', fontSize: 20, fontFamily: 'Inter', fontWeight: 400 }}>
          Today's Missions
        </span>
      </div>

      {/* Reminders button */}
      <div
        onClick={() => navigate('/medications')}
        style={{
          width: 273,
          height: 55,
          left: 64,
          top: 718,
          position: 'absolute',
          background: 'white',
          boxShadow: '0px 4px 9px rgba(0,0,0,0.16)',
          borderRadius: 30,
          border: '1px solid rgba(0,0,0,0.09)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <span style={{ color: 'black', fontSize: 20, fontFamily: 'Inter', fontWeight: 400 }}>
          Reminders
        </span>
      </div>

    </div>
  )
}