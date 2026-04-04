import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const POSSIBLE_REWARDS = [
  { type: 'points', amount: 20, label: '+20 points', message: "You're taking great care of yourself" },
  { type: 'points', amount: 50, label: '+50 points', message: 'Amazing effort today!' },
  { type: 'points', amount: 10, label: '+10 points', message: 'Keep it up!' },
  { type: 'item', emoji: '🐾', label: 'Paw accessory', message: "A little gift for your companion!" },
  { type: 'item', emoji: '🏅', label: 'Gold collar', message: 'Sushi looks great in this!' },
  { type: 'item', emoji: '🪭', label: 'Fan accessory', message: 'So stylish!' },
  { type: 'item', emoji: '🎀', label: 'Ribbon bow', message: 'Adorable!' },
  { type: 'item', emoji: '⭐', label: 'Star badge', message: 'You earned this!' },
]

export default function RewardPage() {
  const navigate = useNavigate()
  const [opened, setOpened] = useState(false)
  const [reward, setReward] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const handleOpen = async () => {
    if (opened || animating) return
    setAnimating(true)

    // Pick random reward
    const picked = POSSIBLE_REWARDS[Math.floor(Math.random() * POSSIBLE_REWARDS.length)]
    setReward(picked)

    setTimeout(() => {
      setOpened(true)
      setAnimating(false)
    }, 600)
  }

  const handleClaim = async () => {
    if (!reward || claiming) return
    setClaiming(true)
    try {
      if (reward.type === 'points') {
        // Award points via missions endpoint
        await api.post('/missions/award-bonus', { points: reward.amount })
      }
      setClaimed(true)
      setTimeout(() => navigate('/missions'), 1500)
    } catch (err) {
      console.error(err)
      setClaimed(true)
      setTimeout(() => navigate('/missions'), 1500)
    } finally {
      setClaiming(false)
    }
  }

  return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* Header */}
        <div style={{
        padding: '44px 24px 0',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative'
        }}>
        {/* Close button */}
        <div
            onClick={() => navigate('/missions')}
            style={{
            position: 'absolute',
            right: 24,
            top: 44,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: '#F5F5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
            }}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            <path d="M6 6L18 18" stroke="#666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
        </div>

        <div style={{ marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Pet</span>
        </div>

        <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: 'black',
            margin: '0 0 8px'
        }}>
            Unbox your reward!
        </h1>
        <p style={{
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            margin: 0
        }}>
            Great job showing up today
        </p>
        </div>

      {/* Gift box */}
      <div
        onClick={handleOpen}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: opened ? 'default' : 'pointer',
          position: 'relative'
        }}
      >
        {/* Shake animation on closed gift */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            20% { transform: rotate(-5deg); }
            40% { transform: rotate(5deg); }
            60% { transform: rotate(-3deg); }
            80% { transform: rotate(3deg); }
          }
          @keyframes pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0); }
            50% { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Sparkles when opened */}
        {opened && (
          <>
            {['✨', '⭐', '💫', '✨', '🌟'].map((s, i) => (
              <div key={i} style={{
                position: 'absolute',
                fontSize: 20,
                animation: `sparkle 0.8s ease ${i * 0.1}s forwards`,
                top: `${20 + Math.random() * 60}%`,
                left: `${10 + Math.random() * 80}%`,
              }}>
                {s}
              </div>
            ))}
          </>
        )}

        <img
          src={opened ? '/gift-opened.png' : '/gift-closed.png'}
          alt="gift"
          style={{
            width: 240,
            height: 240,
            objectFit: 'contain',
            animation: animating
              ? 'shake 0.6s ease'
              : !opened
              ? 'pop 2s ease-in-out infinite'
              : 'fadeInUp 0.4s ease',
            transition: 'all 0.3s'
          }}
          onError={e => {
            // Fallback emoji if image missing
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
        {/* Emoji fallback */}
        <div style={{
          display: 'none',
          fontSize: 120,
          animation: animating ? 'shake 0.6s ease' : 'pop 2s ease-in-out infinite'
        }}>
          {opened ? '📦' : '🎁'}
        </div>

        {/* Tap hint */}
        {!opened && !animating && (
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(0,0,0,0.3)',
            fontSize: 13,
            animation: 'pop 2s ease-in-out infinite'
          }}>
            Tap to open!
          </div>
        )}
      </div>

      {/* Reward revealed */}
      {opened && reward && (
        <div style={{
          padding: '0 24px 48px',
          width: '100%',
          boxSizing: 'border-box',
          animation: 'fadeInUp 0.5s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.10)',
            padding: '20px 24px',
            textAlign: 'center'
          }}>
            {/* Reward label */}
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#20A090',
              margin: '0 0 4px'
            }}>
              {reward.label}
            </h2>
            <p style={{
              fontSize: 13,
              color: 'rgba(0,0,0,0.5)',
              margin: '0 0 16px'
            }}>
              {reward.message}
            </p>

            {/* Item previews */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 20
            }}>
              {reward.type === 'points' ? (
                ['🐾', '🏅', '🪭'].map((emoji, i) => (
                  <div key={i} style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    background: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                  }}>
                    {emoji}
                  </div>
                ))
              ) : (
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  background: 'rgba(32,160,144,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36
                }}>
                  {reward.emoji}
                </div>
              )}
            </div>

            {/* Claim button */}
            <button
              onClick={handleClaim}
              disabled={claiming || claimed}
              style={{
                width: '100%',
                height: 52,
                background: claimed ? '#aaa' : '#20A090',
                border: 'none',
                borderRadius: 26,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Inter',
                cursor: claimed ? 'default' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {claimed ? 'Claimed! 🎉' : claiming ? 'Claiming...' : 'Claim reward'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}