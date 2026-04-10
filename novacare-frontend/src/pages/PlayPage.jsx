import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useEquipment } from '../context/EquipmentContext'

const EMOJIS = ['🐶', '🐱', '🌸', '⭐', '🍎', '🎈', '🌙', '🦋']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateCards() {
  const pairs = [...EMOJIS, ...EMOJIS]
  return shuffle(pairs).map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false
  }))
}

export default function PlayPage() {
  const navigate = useNavigate()
  const { companion: contextCompanion } = useEquipment()
  const [cards, setCards] = useState(generateCards)
  const [flipped, setFlipped] = useState([])
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const companionName = contextCompanion?.name || 'Sushi'
  const totalPairs = EMOJIS.length

  const handleCardClick = (card) => {
    if (disabled || card.flipped || card.matched || flipped.length === 2) return

    const newCards = cards.map(c =>
      c.id === card.id ? { ...c, flipped: true } : c
    )
    setCards(newCards)

    const newFlipped = [...flipped, card]

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setDisabled(true)

      if (newFlipped[0].emoji === newFlipped[1].emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.emoji === newFlipped[0].emoji ? { ...c, matched: true } : c
          ))
          const newMatched = matched + 1
          setMatched(newMatched)
          setFlipped([])
          setDisabled(false)

          if (newMatched === totalPairs) {
            setTimeout(() => setDone(true), 500)
          }
        }, 600)
      } else {
        // No match — flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === newFlipped[0].id || c.id === newFlipped[1].id
              ? { ...c, flipped: false }
              : c
          ))
          setFlipped([])
          setDisabled(false)
        }, 900)
      }
    } else {
      setFlipped(newFlipped)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/companion/care/play')
      await api.post('/missions/award-bonus', { points: 10 })
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
      navigate('/dashboard')
    }
  }

  const handleReset = () => {
    setCards(generateCards())
    setFlipped([])
    setMoves(0)
    setMatched(0)
    setDone(false)
    setDisabled(false)
  }

  return (
    <div style={{
      width: 390, height: 844, margin: '0 auto',
      background: 'linear-gradient(180deg, #FFF9F0 0%, #FFF3E0 100%)',
      fontFamily: 'Inter, sans-serif', position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      <style>{`
        @keyframes card-flip {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes card-match {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes done-pop {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '44px 24px 0', position: 'relative', textAlign: 'center', flexShrink: 0 }}>
        <div onClick={() => navigate('/dashboard')} style={{ position: 'absolute', left: 24, top: 44, cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', padding: '16px 24px 8px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: 'black' }}>
          Play with <span style={{ color: '#20A090' }}>{companionName}</span>! 🎉
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Match all the pairs to make {companionName} happy
        </p>
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '8px 24px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#20A090' }}>{matched}/{totalPairs}</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Pairs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#F59E0B' }}>{moves}</div>
          <div style={{ fontSize: 11, color: '#aaa' }}>Moves</div>
        </div>
      </div>

      {/* Card grid */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10, padding: '8px 20px 20px',
        alignContent: 'center'
      }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            style={{
              aspectRatio: '1',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              cursor: card.matched || card.flipped ? 'default' : 'pointer',
              background: card.matched
                ? 'rgba(32,160,144,0.15)'
                : card.flipped
                ? 'white'
                : 'rgba(245,158,11,0.2)',
              border: card.matched
                ? '2px solid rgba(32,160,144,0.4)'
                : card.flipped
                ? '2px solid rgba(245,158,11,0.4)'
                : '2px solid rgba(245,158,11,0.2)',
              boxShadow: card.flipped || card.matched
                ? '0 4px 12px rgba(0,0,0,0.1)'
                : '0 2px 6px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
              animation: card.matched ? 'card-match 0.4s ease' : 'none',
              userSelect: 'none'
            }}
          >
            {card.flipped || card.matched ? card.emoji : '❓'}
          </div>
        ))}
      </div>

      {/* Done overlay */}
      {done && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.95)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'done-pop 0.5s ease',
          padding: '0 32px'
        }}>
          <div style={{ fontSize: 72, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: 'black', margin: '0 0 8px', textAlign: 'center' }}>
            {companionName} loved it!
          </h2>
          <p style={{ fontSize: 14, color: '#888', margin: '0 0 8px', textAlign: 'center' }}>
            You finished in {moves} moves!
          </p>
          <p style={{ fontSize: 13, color: '#20A090', fontWeight: 600, margin: '0 0 32px' }}>
            +10 points earned 🌟
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', height: 52, background: '#20A090',
              border: 'none', borderRadius: 26, color: 'white',
              fontSize: 16, fontWeight: 600, fontFamily: 'Inter',
              cursor: 'pointer', marginBottom: 12, opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Finish & Go Back 🐾'}
          </button>

          <button
            onClick={handleReset}
            style={{
              width: '100%', height: 52, background: 'transparent',
              border: '2px solid #20A090', borderRadius: 26, color: '#20A090',
              fontSize: 16, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer'
            }}
          >
            Play Again 🔄
          </button>
        </div>
      )}
    </div>
  )
}