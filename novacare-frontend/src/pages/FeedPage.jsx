import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const FOOD_ITEMS = [
  { id: 'bone', emoji: '🦴', name: 'Bone', cost: 10, energy: 10 },
  { id: 'fish', emoji: '🐟', name: 'Fish', cost: 15, energy: 15 },
  { id: 'bread', emoji: '🍞', name: 'Bread', cost: 8, energy: 8 },
  { id: 'milk', emoji: '🥛', name: 'Milk', cost: 12, energy: 12 },
  { id: 'dumpling', emoji: '🥟', name: 'Dumpling', cost: 20, energy: 20 },
  { id: 'berries', emoji: '🫐', name: 'Berries', cost: 15, energy: 15 },
  { id: 'orange', emoji: '🍊', name: 'Orange', cost: 10, energy: 10 },
  { id: 'egg', emoji: '🍳', name: 'Egg', cost: 12, energy: 12 },
  { id: 'avocado', emoji: '🥑', name: 'Avocado', cost: 18, energy: 18 },
  { id: 'broccoli', emoji: '🥦', name: 'Broccoli', cost: 10, energy: 10 },
  { id: 'cheese', emoji: '🧀', name: 'Cheese', cost: 14, energy: 14 },
  { id: 'salmon', emoji: '🍣', name: 'Salmon', cost: 25, energy: 25 },
]

const SPEECH_BUBBLES = [
  "I'm full! 😊",
  "Yummy! 🤤",
  "Thank you! 🥰",
  "So delicious! 😋",
  "More please! 🐾",
  "Wah, so good lah! 😄",
]

export default function FeedPage() {
  const navigate = useNavigate()
  const [companion, setCompanion] = useState(null)
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [sparkles, setSparkles] = useState([])
  const [speechBubble, setSpeechBubble] = useState(null)
  const [feedAnimation, setFeedAnimation] = useState(false)
  const [notEnoughPoints, setNotEnoughPoints] = useState(null)
  const sparkleId = useRef(0)
  const petRef = useRef(null)

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
      const [companionRes, pointsRes] = await Promise.allSettled([
        api.get('/companion/'),
        api.get('/missions/points'),
      ])
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value.data.total_points)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addSparkles = (x, y) => {
    const emojis = ['✨', '⭐', '💫', '🌟']
    const newSparkles = Array.from({ length: 4 }, (_, i) => ({
      id: sparkleId.current++,
      emoji: emojis[i % emojis.length],
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 80,
    }))
    setSparkles(prev => [...prev, ...newSparkles])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(n => n.id === s.id)))
    }, 1200)
  }

  const handleBuyAndFeed = async (food) => {
    if (buying) return

    if (points < food.cost) {
      setNotEnoughPoints(food.id)
      setTimeout(() => setNotEnoughPoints(null), 2000)
      return
    }

    setBuying(food.id)
    try {
      // Deduct points
      await api.post('/missions/award-bonus', { points: -food.cost })
      // Feed pet
      await api.post('/companion/care/feed')

      // Trigger animations
      setFeedAnimation(true)
      if (petRef.current) {
        const rect = petRef.current.getBoundingClientRect()
        const containerRect = petRef.current.closest('[data-container]')?.getBoundingClientRect()
        addSparkles(
          rect.left + rect.width / 2 - (containerRect?.left || 0),
          rect.top + rect.height / 2 - (containerRect?.top || 0)
        )
      }

      // Show speech bubble
      const bubble = SPEECH_BUBBLES[Math.floor(Math.random() * SPEECH_BUBBLES.length)]
      setSpeechBubble(bubble)
      setTimeout(() => setSpeechBubble(null), 2500)
      setTimeout(() => setFeedAnimation(false), 1000)

      // Refresh data
      const [companionRes, pointsRes] = await Promise.all([
        api.get('/companion/'),
        api.get('/missions/points'),
      ])
      setCompanion(companionRes.data)
      setPoints(pointsRes.data.total_points)

    } catch (err) {
      console.error(err)
    } finally {
      setBuying(null)
    }
  }

  const companionName = companion?.name || 'Sushi'

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
    <div
      data-container
      style={{
        width: 390,
        height: 844,
        margin: '0 auto',
        background: 'white',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <style>{`
        @keyframes pet-bounce {
          0%, 100% { transform: translateY(0px); }
          30% { transform: translateY(-16px); }
          60% { transform: translateY(-8px); }
        }
        @keyframes pet-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle-pop {
          0% { opacity: 1; transform: scale(0.5) translateY(0); }
          60% { opacity: 1; transform: scale(1.2) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-40px); }
        }
        @keyframes bubble-in {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes food-fly {
          0% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.3) translateY(-120px); opacity: 0; }
        }
        @keyframes shake-no {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '44px 24px 0',
        textAlign: 'center',
        position: 'relative',
        flexShrink: 0
      }}>
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

        {/* Points balance */}
        <div style={{
          position: 'absolute',
          right: 24,
          top: 48,
          background: 'rgba(32,160,144,0.1)',
          borderRadius: 20,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#20A090'
          }}>
            {points} pts
          </span>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
        </div>

        <h1 style={{
          fontSize: 26,
          fontWeight: 400,
          margin: '0 0 4px',
          color: 'black'
        }}>
          Feed <strong>{companionName}</strong>
        </h1>
        <p style={{
          fontSize: 13,
          color: 'rgba(0,0,0,0.45)',
          margin: 0
        }}>
          Healthy food gives us both energy
        </p>
      </div>

      {/* Pet section */}
      <div style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: 220,
        flexShrink: 0
      }}>

        {/* Speech bubble */}
        {speechBubble && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-30%)',
            background: '#20A090',
            color: 'white',
            borderRadius: '16px 16px 16px 4px',
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            zIndex: 10,
            animation: 'bubble-in 0.3s ease',
            boxShadow: '0 4px 12px rgba(32,160,144,0.3)'
          }}>
            {speechBubble}
          </div>
        )}

        {/* Pet */}
        <img
          ref={petRef}
          src={getPetImage(companion?.species)}
          alt="pet"
          style={{
            width: 900,
            height: 900,
            objectFit: 'contain',
            animation: feedAnimation
              ? 'pet-bounce 0.8s ease'
              : 'pet-float 3s ease-in-out infinite',
            filter: feedAnimation
              ? 'drop-shadow(0 0 12px rgba(32,160,144,0.5))'
              : 'none',
            transition: 'filter 0.3s'
          }}
        />

        {/* Sparkles */}
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            style={{
              position: 'absolute',
              left: sparkle.x,
              top: sparkle.y,
              fontSize: 16,
              pointerEvents: 'none',
              zIndex: 8,
              animation: 'sparkle-pop 1.2s ease forwards'
            }}
          >
            {sparkle.emoji}
          </div>
        ))}

        {/* Energy bar */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 11,
            color: 'rgba(0,0,0,0.4)',
            marginBottom: 4
          }}>
            Energy {companion?.energy || 0}%
          </div>
          <div style={{
            width: '100%',
            height: 6,
            background: '#F0F0F0',
            borderRadius: 3,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${companion?.energy || 0}%`,
              height: '100%',
              background: '#20A090',
              borderRadius: 3,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Divider with tab label */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
        marginBottom: 12
      }}>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '12px 0',
          fontWeight: 700,
          fontSize: 14,
          color: '#20A090',
          borderBottom: '2px solid #20A090'
        }}>
          Food Shop
        </div>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '12px 0',
          fontSize: 14,
          color: 'rgba(0,0,0,0.35)'
        }}>
          Buy to feed instantly
        </div>
      </div>

      {/* Food grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 16px 24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10
        }}>
          {FOOD_ITEMS.map(food => {
            const canAfford = points >= food.cost
            const isBuying = buying === food.id
            const isNotEnough = notEnoughPoints === food.id

            return (
              <div
                key={food.id}
                onClick={() => handleBuyAndFeed(food)}
                style={{
                  background: isNotEnough
                    ? 'rgba(255,100,100,0.08)'
                    : canAfford
                    ? 'white'
                    : 'rgba(0,0,0,0.03)',
                  borderRadius: 16,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  boxShadow: canAfford
                    ? '0px 2px 8px rgba(0,0,0,0.08)'
                    : 'none',
                  border: isNotEnough
                    ? '1px solid rgba(255,100,100,0.3)'
                    : '1px solid transparent',
                  animation: isNotEnough ? 'shake-no 0.4s ease' : isBuying ? 'food-fly 0.5s ease' : 'none',
                  opacity: isBuying ? 0.5 : canAfford ? 1 : 0.4,
                  transition: 'opacity 0.2s, transform 0.2s'
                }}
              >
                <span style={{ fontSize: 32 }}>{food.emoji}</span>
                <span style={{
                  fontSize: 10,
                  color: 'rgba(0,0,0,0.5)',
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  {food.name}
                </span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: canAfford ? 'rgba(32,160,144,0.1)' : '#F5F5F5',
                  borderRadius: 10,
                  padding: '2px 6px'
                }}>
                  <span style={{ fontSize: 10 }}>⭐</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: canAfford ? '#20A090' : '#aaa'
                  }}>
                    {food.cost}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Not enough points hint */}
        {notEnoughPoints && (
          <p style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#FF6B6B',
            marginTop: 12
          }}>
            Not enough points! Complete missions to earn more ⭐
          </p>
        )}
      </div>

    </div>
  )
}