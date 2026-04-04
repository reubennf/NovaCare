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
    return new Date().toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getMoodLabel = (mood) => {
    switch (mood) {
      case 'happy': return 'happy'
      case 'concerned': return 'a little concerned'
      case 'sleepy': return 'sleepy'
      default: return 'happy'
    }
  }

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      case 'chick': return '/sushi.png'
      default: return '/sushi.png'
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

      {/* NovaCare logo */}
      <div style={{ left: 155, top: 34, position: 'absolute' }}>
        <span style={{ color: 'black', fontSize: 20, fontWeight: 700 }}>Nova</span>
        <span style={{ color: '#20A090', fontSize: 20, fontWeight: 700 }}>Care</span>
      </div>

      {/* Greeting */}
      <div style={{ left: 54, top: 109, position: 'absolute' }}>
        <span style={{ color: 'black', fontSize: 30, fontWeight: 400 }}>
          {getGreeting()},{' '}
        </span>
        <span style={{ color: 'black', fontSize: 30, fontWeight: 700 }}>
          {userName}
        </span>
      </div>

      {/* Time */}
      <div style={{
        left: 150,
        top: 155,
        position: 'absolute',
        color: 'rgba(0,0,0,0.67)',
        fontSize: 16,
        fontWeight: 400
      }}>
        {getTime()} | Sunny
      </div>

      {/* Pet shadow */}
      <div style={{
        width: 200,
        height: 30,
        left: 95,
        top: 445,
        position: 'absolute',
        background: 'rgba(0,0,0,0.10)',
        borderRadius: 9999,
        filter: 'blur(12px)'
        }} />
      {/* Pet image */}
        <img
        src={getPetImage(companion?.species)}
        alt="pet"
        style={{
            width: 600,
            height: 600,
            left: 5,
            top: 80,
            position: 'absolute',
            objectFit: 'contain'
        }}
        />

      {/* Pet mood */}
      <div style={{ left: 145, top: 510, position: 'absolute' }}>
        <span style={{
          color: 'rgba(0,0,0,0.67)',
          fontSize: 16,
          fontWeight: 700
        }}>
          {companionName}
        </span>
        <span style={{
          color: 'rgba(0,0,0,0.67)',
          fontSize: 16,
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
        <span style={{ color: 'black', fontSize: 20, fontWeight: 400 }}>Chat</span>
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
        <span style={{ color: 'black', fontSize: 20, fontWeight: 400 }}>Today's Missions</span>
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
        <span style={{ color: 'black', fontSize: 20, fontWeight: 400 }}>Reminders</span>
      </div>

    </div>
  )
}