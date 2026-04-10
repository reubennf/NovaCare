import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import PetWithAccessories from '../components/PetWithAccessories'
import LoadingScreen from '../components/LoadingScreen'
import { useEquipment } from '../context/EquipmentContext'


const BUBBLE_CONFIG = {
  feed: {
    emoji: '🍗',
    label: 'Feed',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.15)',
    size: 90,
    route: '/feed'
  },
  groom: {
    emoji: '🧴',
    label: 'Groom',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.15)',
    size: 72,
    route: '/groom'
  },
  play: {
    emoji: '🎮',
    label: 'Play',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.15)',
    size: 78,
    route: '/play'
  },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [companion, setCompanion] = useState(null)
  const [moodSummary, setMoodSummary] = useState(null)
  const [careStatus, setCareStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [caring, setCaring] = useState(null)

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
 const { companion: contextCompanion } = useEquipment()

 const getMoodLabel = (mood) => {
  switch (mood) {
    case 'happy': return 'is happy 😊'
    case 'hungry': return 'is hungry 🍗'
    case 'dirty': return 'needs a bath 🧴'
    case 'sad': return 'is feeling sad 😢'
    case 'tired': return 'is a little tired 😴'
    case 'lonely': return 'is feeling lonely 🥺'
    case 'concerned': return 'seems worried 😟'
    default: return 'is happy 😊'
  }
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
        const [profileRes, companionRes, careRes] = await Promise.allSettled([
        api.get('/profile/'),
        api.get('/companion/'),
        api.get('/companion/care/status'),
        ])
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
        if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
        if (careRes.status === 'fulfilled') {
            console.log('Care status:', careRes.value.data)
            setCareStatus(careRes.value.data)
        }
    } catch (err) {
        console.error(err)
    } finally {
        setLoading(false)
    }
    }

  const handleCare = async (careType) => {
    setCaring(careType)
    try {
      await api.post(`/companion/care/${careType}`)
      // Refresh data
      const [companionRes, careRes] = await Promise.all([
        api.get('/companion/'),
        api.get('/companion/care/status'),
      ])
      setCompanion(companionRes.data)
      setCareStatus(careRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setCaring(null)
    }
  }

  const userName = profile?.preferred_name || profile?.full_name || 'there'
  const companionName = companion?.name || 'Sushi'
  const mood = getMoodLabel(companion?.mood_state)

  // Which bubbles to show
    const activeBubbles = Object.entries(BUBBLE_CONFIG).filter(
    ([type]) => careStatus?.needs_care?.[type]
    )
//   const activeBubbles = Object.entries(BUBBLE_CONFIG)

  if (loading) return <LoadingScreen message="Getting things ready..." />

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
      <div style={{ position: 'absolute', left: 0, right: 0, top: 34, textAlign: 'center' }}>
        <span style={{ color: 'black', fontSize: 20, fontWeight: 700 }}>Nova</span>
        <span style={{ color: '#20A090', fontSize: 20, fontWeight: 700 }}>Care</span>
      </div>
      {/* Profile avatar - top right */}
        <div
        onClick={() => navigate('/profile')}
        style={{
            position: 'absolute',
            right: 20,
            top: 34,
            width: 36,
            height: 36,
            borderRadius: 18,
            overflow: 'hidden',
            cursor: 'pointer',
            border: '2px solid rgba(32,160,144,0.3)',
            background: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
        }}
        >
        {profile?.avatar_url ? (
            <img
            src={profile.avatar_url}
            alt="profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
        ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" fill="#bbb"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#bbb"/>
            </svg>
        )}
        </div>
      {/* Greeting */}
      <div style={{ left: 24, top: 80, position: 'absolute', right: 24, textAlign: 'center' }}>
        <div>
          <span style={{ color: 'black', fontSize: 28, fontWeight: 400 }}>{getGreeting()}, </span>
          <span style={{ color: 'black', fontSize: 28, fontWeight: 700 }}>{userName}</span>
        </div>
        <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, marginTop: 2 }}>
          {getTime()} | Sunny
        </div>
      </div>

      {/* Pet care bubbles - floating around pet */}
      {activeBubbles.map(([type, config], index) => {
        const positions = [
          { left: 20, top: 200 },
          { right: 20, top: 180 },
          { left: 30, top: 320 },
          { right: 25, top: 310 },
        ]
        const pos = positions[index] || { left: 20, top: 200 }

        return (
          <div
            key={type}
            onClick={() => {
            if (type === 'groom') {
                navigate('/groom')
            } else if (type === 'feed') {
                navigate('/feed')
            } else if (type === 'play') {
                navigate('/play')
            } else {
                handleCare(type)
            }
            }}
            style={{
                position: 'absolute',
                ...pos,
                width: config.size,
                height: config.size,
                borderRadius: '50%',
                background: config.bg,
                border: `2px solid ${config.color}33`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 5,
                boxShadow: `0 4px 20px ${config.color}33`,
                animation: 'float 3s ease-in-out infinite',
                animationDelay: `${index * 0.5}s`,
                opacity: caring === type ? 0.6 : 1,
                transition: 'opacity 0.2s'
            }}
            >
            <span style={{ fontSize: config.size * 0.35 }}>{config.emoji}</span>
            <span style={{
                fontSize: 10,
                color: config.color,
                fontWeight: 600,
                marginTop: 2
            }}>
                {caring === type ? '...' : config.label}
            </span>
            </div>
        )
      })}

      {/* Pet shadow */}
      <div style={{
        width: 200,
        height: 30,
        left: 95,
        top: 375,
        position: 'absolute',
        background: 'rgba(0,0,0,0.10)',
        borderRadius: 9999,
        filter: 'blur(12px)'
        }} />
      {/* Pet image */}
        <PetWithAccessories
            species={contextCompanion?.species || companion?.species}
            size={600}
            style={{right: 100}}
        />

      {/* Pet mood */}
        <div style={{ left: 0, right: 0, top: 448, position: 'absolute', textAlign: 'center' }}>
        <span style={{ color: 'rgba(0,0,0,0.67)', fontSize: 14, fontWeight: 700 }}>{companionName} </span>
        <span style={{ color: 'rgba(0,0,0,0.67)', fontSize: 14, fontWeight: 400 }}>{mood}</span>
        </div>

        {/* Nudge message when pet needs care */}
        {['hungry', 'dirty', 'sad', 'tired', 'lonely'].includes(companion?.mood_state) && (
        <div onClick={() => {
            if (companion?.mood_state === 'hungry' || companion?.mood_state === 'tired') navigate('/feed')
            else if (companion?.mood_state === 'dirty') navigate('/groom')
            else if (companion?.mood_state === 'lonely') navigate('/companion')
            else navigate('/medications')
        }}
        style={{
            position: 'absolute', left: 24, right: 24, top: 470,
            background: companion?.mood_state === 'lonely' 
            ? 'rgba(147,112,219,0.08)'
            : companion?.mood_state === 'hungry' || companion?.mood_state === 'tired'
            ? 'rgba(255,107,107,0.08)'
            : companion?.mood_state === 'dirty'
            ? 'rgba(52,211,153,0.08)'
            : 'rgba(32,160,144,0.08)',
            borderRadius: 12, padding: '8px 14px',
            textAlign: 'center', cursor: 'pointer', zIndex: 10
        }}>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.5)', lineHeight: 1.5 }}>
            {companion?.mood_state === 'hungry' && `${companionName} is hungry! Tap to feed 🍗`}
            {companion?.mood_state === 'tired' && `${companionName} could use some food soon 🍗`}
            {companion?.mood_state === 'dirty' && `${companionName} needs grooming! Tap to groom 🧴`}
            {companion?.mood_state === 'sad' && `${companionName} missed some medicine today 💊`}
            {companion?.mood_state === 'lonely' && `${companionName} misses you! Tap to chat 💬`}
            </p>
        </div>
        )}

      {/* Mood summary */}
      {moodSummary?.summary && (
        <div
          onClick={() => navigate('/companion')}
          style={{
            position: 'absolute',
            left: 24,
            right: 24,
            top: 478,
            background: 'rgba(32,160,144,0.08)',
            borderRadius: 14,
            padding: '10px 14px',
            cursor: 'pointer'
          }}
        >
          <p style={{
            fontSize: 12,
            color: 'rgba(0,0,0,0.6)',
            margin: 0,
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            {moodSummary.summary}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        position: 'absolute',
        left: 24,
        right: 24,
        top: moodSummary?.summary ? 560 : 510,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>

        {/* Chat */}
        <div
          onClick={() => navigate('/companion')}
          style={{
            height: 52,
            background: 'white',
            boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
            borderRadius: 30,
            border: '1px solid rgba(0,0,0,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            gap: 8
          }}
        >
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ color: 'black', fontSize: 16, fontWeight: 400 }}>Chat</span>
        </div>

        {/* Two column row */}
        <div style={{ display: 'flex', gap: 12 }}>

          {/* Missions */}
          <div
            onClick={() => navigate('/missions')}
            style={{
              flex: 1,
              height: 52,
              background: 'white',
              boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
              borderRadius: 30,
              border: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6
            }}
          >
            <span style={{ fontSize: 16 }}>⭐</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Missions</span>
          </div>

          {/* Reminders */}
          <div
            onClick={() => navigate('/medications')}
            style={{
              flex: 1,
              height: 52,
              background: 'white',
              boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
              borderRadius: 30,
              border: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6
            }}
          >
            <span style={{ fontSize: 16 }}>💊</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Reminders</span>
          </div>
        </div>

        {/* Two column row */}
        <div style={{ display: 'flex', gap: 12 }}>

          {/* Friends */}
          <div
            onClick={() => navigate('/social')}
            style={{
              flex: 1,
              height: 52,
              background: 'white',
              boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
              borderRadius: 30,
              border: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6
            }}
          >
            <span style={{ fontSize: 16 }}>👥</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Friends</span>
          </div>

          {/* Events */}
          <div
            onClick={() => navigate('/social')}
            style={{
              flex: 1,
              height: 52,
              background: 'white',
              boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
              borderRadius: 30,
              border: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 6
            }}
          >
            <span style={{ fontSize: 16 }}>📅</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Events</span>
          </div>
        </div>

        {/* Third row - Dress up + Decorate */}
        <div style={{ display: 'flex', gap: 12 }}>
        <div
            onClick={() => navigate('/dressup')}
            style={{
            flex: 1, height: 52, background: 'white',
            boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
            borderRadius: 30, border: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 6
            }}
        >
            <span style={{ fontSize: 16 }}>👗</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Dress up</span>
        </div>

        <div
            onClick={() => navigate('/decorate')}
            style={{
            flex: 1, height: 52, background: 'white',
            boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
            borderRadius: 30, border: '1px solid rgba(0,0,0,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', gap: 6
            }}
        >
            <span style={{ fontSize: 16 }}>🏡</span>
            <span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>Decorate</span>
        </div>
        </div>
        {profile?.is_caregiver && (
        <div
            onClick={() => navigate('/caregiver')}
            style={{
            height: 52, background: 'linear-gradient(135deg, #20A090, #17877A)',
            boxShadow: '0px 4px 9px rgba(32,160,144,0.3)',
            borderRadius: 30, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', gap: 8
            }}
        >
            <span style={{ fontSize: 18 }}>👨‍⚕️</span>
            <span style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>Caregiver Dashboard</span>
        </div>
        )}
      </div>

      {/* Floating animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

    </div>
  )
}