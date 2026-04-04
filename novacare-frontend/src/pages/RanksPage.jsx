import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const LEAGUES = [
  { name: 'Bronze', color: '#CD7F32', gem: '🟤' },
  { name: 'Silver', color: '#C0C0C0', gem: '⚪' },
  { name: 'Gold', color: '#FFD700', gem: '🟡' },
  { name: 'Ruby', color: '#E0115F', gem: '🔴' },
  { name: 'Diamond', color: '#B9F2FF', gem: '🔵' },
]

const LEAGUE_GEMS = ['🩷', '💚', '🟠', '❤️', '🩵']

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

const getAvatarColor = (index) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3']
  return colors[index % colors.length]
}

export default function RanksPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/missions/leaderboard')
      setData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentLeagueIndex = LEAGUES.findIndex(l => l.name === data?.league) ?? 0

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
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{
        padding: '44px 24px 0',
        textAlign: 'center',
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Back button */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            position: 'absolute',
            left: 24,
            top: 44,
            cursor: 'pointer',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Pet</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'black',
          margin: '0 0 20px'
        }}>
          Today is a new day!
        </h1>

        {/* League gems */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 12
        }}>
          {LEAGUE_GEMS.map((gem, i) => (
            <div
              key={i}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                transform: i === currentLeagueIndex ? 'scale(1.2)' : 'scale(1)',
                filter: i === currentLeagueIndex ? 'none' : 'grayscale(0.3) opacity(0.7)',
                transition: 'all 0.3s'
              }}
            >
              {gem}
            </div>
          ))}
        </div>

        {/* League label */}
        <p style={{
          fontSize: 14,
          color: 'rgba(0,0,0,0.5)',
          margin: '0 0 16px'
        }}>
          You are now in the{' '}
          <span style={{ fontWeight: 700, color: 'black' }}>
            {data?.league || 'Bronze'} League
          </span>.
        </p>
      </div>

      {/* Leaderboard */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px'
      }}>
        {data?.leaderboard?.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#aaa',
            fontSize: 14,
            padding: '40px 0'
          }}>
            No rankings yet — complete missions to earn points!
          </div>
        ) : (
          data?.leaderboard?.map((entry, index) => {
            const isCurrentUser = entry.user_id === data?.leaderboard?.find(
              e => e.points === data?.user_points
            )?.user_id
            return (
              <div
                key={entry.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  gap: 16
                }}
              >
                {/* Rank number */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: entry.rank <= 3 ? '#20A090' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: entry.rank <= 3 ? 'white' : 'black'
                  }}>
                    {entry.rank}
                  </span>
                </div>

                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: getAvatarColor(index),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 700
                    }}>
                      {getInitials(entry.name)}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 15,
                    fontWeight: entry.rank <= 3 ? 600 : 400,
                    color: 'black',
                    fontStyle: 'italic'
                  }}>
                    {entry.name}
                  </span>
                </div>

                {/* Points */}
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'rgba(0,0,0,0.5)'
                }}>
                  {entry.points} pts
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom button */}
      <div style={{ padding: '16px 24px 32px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/missions')}
          style={{
            width: '100%',
            height: 55,
            background: 'white',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 30,
            boxShadow: '0px 4px 9px rgba(0,0,0,0.12)',
            fontSize: 18,
            fontWeight: 500,
            fontFamily: 'Inter',
            cursor: 'pointer',
            color: 'black'
          }}
        >
          Today's Missions
        </button>
      </div>

    </div>
  )
}