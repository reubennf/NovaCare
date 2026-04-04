import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const TOOLS = [
  {
    id: 'brush',
    emoji: '🪮',
    label: 'Brush',
    color: '#FFD93D',
    bg: 'rgba(255,217,61,0.2)',
    border: 'rgba(255,217,61,0.5)',
    sparkleColor: '#FFD93D',
    sparkles: ['✨', '⭐', '✨'],
    position: { top: 140, left: 20 }
  },
  {
    id: 'clean',
    emoji: '🧴',
    label: 'Clean',
    color: '#6BCB77',
    bg: 'rgba(107,203,119,0.2)',
    border: 'rgba(107,203,119,0.5)',
    sparkleColor: '#6BCB77',
    sparkles: ['💧', '🫧', '💧'],
    position: { top: 140, right: 20 }
  },
  {
    id: 'teeth',
    emoji: '🦷',
    label: 'Brush teeth',
    color: '#74B9FF',
    bg: 'rgba(116,185,255,0.2)',
    border: 'rgba(116,185,255,0.5)',
    sparkleColor: '#74B9FF',
    sparkles: ['✨', '💫', '⭐'],
    position: { bottom: 160, left: 20 }
  },
]

export default function GroomPage() {
  const navigate = useNavigate()
  const [companion, setCompanion] = useState(null)
  const [activeTool, setActiveTool] = useState(null)
  const [sparkles, setSparkles] = useState([])
  const [groomedTools, setGroomedTools] = useState([])
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const petRef = useRef(null)
  const containerRef = useRef(null)
  const sparkleId = useRef(0)

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      default: return '/sushi.png'
    }
  }

  useEffect(() => {
    api.get('/companion/').then(res => setCompanion(res.data)).catch(() => {})
  }, [])

  const addSparkles = (x, y, tool) => {
    const newSparkles = tool.sparkles.map((emoji, i) => ({
      id: sparkleId.current++,
      emoji,
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 80,
    }))
    setSparkles(prev => [...prev, ...newSparkles])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(n => n.id === s.id)))
    }, 1000)
  }

  const handleToolMouseDown = (tool, e) => {
    e.preventDefault()
    setActiveTool(tool)
    setDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragPos({ x: clientX - rect.left, y: clientY - rect.top })
  }

  const handleMouseMove = (e) => {
    if (!dragging || !activeTool) return
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = clientX - rect.left
    const y = clientY - rect.top
    setDragPos({ x, y })

    // Check if over pet
    if (petRef.current) {
      const petRect = petRef.current.getBoundingClientRect()
      const overPet = (
        clientX >= petRect.left &&
        clientX <= petRect.right &&
        clientY >= petRect.top &&
        clientY <= petRect.bottom
      )
      if (overPet) {
        addSparkles(x, y, activeTool)
      }
    }
  }

  const handleMouseUp = () => {
    if (!activeTool) return

    // Check if dropped on pet
    if (petRef.current && dragPos) {
      const petRect = petRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      const petCenterX = petRect.left + petRect.width / 2 - containerRect.left
      const petCenterY = petRect.top + petRect.height / 2 - containerRect.top
      const dist = Math.sqrt(
        Math.pow(dragPos.x - petCenterX, 2) +
        Math.pow(dragPos.y - petCenterY, 2)
      )

      if (dist < 100) {
        // Successfully groomed!
        if (!groomedTools.includes(activeTool.id)) {
          setGroomedTools(prev => [...prev, activeTool.id])
          // Big sparkle burst
          for (let i = 0; i < 3; i++) {
            setTimeout(() => addSparkles(petCenterX, petCenterY, activeTool), i * 200)
          }
          // Check if all done
          if (groomedTools.length + 1 >= TOOLS.length) {
            setTimeout(() => setDone(true), 800)
          }
        }
      }
    }

    setDragging(false)
    setActiveTool(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/companion/care/groom')
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      console.error(err)
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const companionName = companion?.name || 'Sushi'

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      style={{
        width: 390,
        height: 844,
        margin: '0 auto',
        background: 'linear-gradient(180deg, #EAF6FF 0%, #white 60%)',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        background: '#F0F8FF'
      }}
    >

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle-pop {
          0% { opacity: 1; transform: scale(0.5) translateY(0); }
          50% { opacity: 1; transform: scale(1.2) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-40px); }
        }
        @keyframes tool-float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-6px) rotate(5deg); }
        }
        @keyframes done-pop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes bubble {
          0% { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '44px 24px 0',
        textAlign: 'center',
        position: 'relative'
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

        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Pet</span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'black' }}>
          Groom <strong>{companionName}</strong>
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Self-care is important and comforting
        </p>
      </div>

      {/* Tool bubbles */}
      {TOOLS.map(tool => {
        const isGroomed = groomedTools.includes(tool.id)
        const isDraggingThis = dragging && activeTool?.id === tool.id
        return (
          <div
            key={tool.id}
            onMouseDown={(e) => !isGroomed && handleToolMouseDown(tool, e)}
            onTouchStart={(e) => !isGroomed && handleToolMouseDown(tool, e)}
            style={{
              position: 'absolute',
              ...tool.position,
              width: 80,
              height: 80,
              borderRadius: 40,
              background: isGroomed ? 'rgba(32,160,144,0.15)' : tool.bg,
              border: `2px solid ${isGroomed ? '#20A090' : tool.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isGroomed ? 'default' : 'grab',
              animation: isGroomed || isDraggingThis ? 'none' : 'tool-float 3s ease-in-out infinite',
              opacity: isDraggingThis ? 0.3 : isGroomed ? 0.5 : 1,
              boxShadow: `0 4px 16px ${tool.color}44`,
              zIndex: 3,
              transition: 'opacity 0.3s'
            }}
          >
            <span style={{ fontSize: 32 }}>{isGroomed ? '✓' : tool.emoji}</span>
            <span style={{
              fontSize: 9,
              color: isGroomed ? '#20A090' : tool.color,
              fontWeight: 600,
              marginTop: 2
            }}>
              {isGroomed ? 'Done!' : tool.label}
            </span>
          </div>
        )
      })}

      {/* Pet image */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: 180,
        transform: 'translateX(-50%)',
        zIndex: 2,
        animation: done ? 'done-pop 0.5s ease' : 'float 3s ease-in-out infinite'
      }}>
        <img
          ref={petRef}
          src={getPetImage(companion?.species)}
          alt="pet"
          style={{
            width: 200,
            height: 200,
            objectFit: 'contain',
            filter: done ? 'drop-shadow(0 0 20px rgba(32,160,144,0.6))' : 'none',
            transition: 'filter 0.5s'
          }}
        />
      </div>

      {/* Dragging tool follows cursor */}
      {dragging && activeTool && (
        <div style={{
          position: 'absolute',
          left: dragPos.x - 30,
          top: dragPos.y - 30,
          width: 60,
          height: 60,
          borderRadius: 30,
          background: activeTool.bg,
          border: `2px solid ${activeTool.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: `0 8px 24px ${activeTool.color}66`,
          transform: 'rotate(15deg) scale(1.1)'
        }}>
          {activeTool.emoji}
        </div>
      )}

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          style={{
            position: 'absolute',
            left: sparkle.x,
            top: sparkle.y,
            fontSize: 20,
            pointerEvents: 'none',
            zIndex: 8,
            animation: 'sparkle-pop 1s ease forwards'
          }}
        >
          {sparkle.emoji}
        </div>
      ))}

      {/* Progress dots */}
      <div style={{
        position: 'absolute',
        bottom: 160,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 8
      }}>
        {TOOLS.map(tool => (
          <div key={tool.id} style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: groomedTools.includes(tool.id) ? '#20A090' : '#E0E0E0',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      {/* Instruction or done state */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        left: 24,
        right: 24,
        textAlign: 'center'
      }}>
        {!done ? (
          <p style={{
            fontSize: 13,
            color: 'rgba(0,0,0,0.4)',
            margin: 0
          }}>
            Drag each tool onto {companionName} 🐾
          </p>
        ) : (
          <div style={{ animation: 'done-pop 0.5s ease' }}>
            <p style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#20A090',
              margin: '0 0 16px'
            }}>
              {companionName} looks amazing! ✨
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                height: 52,
                background: '#20A090',
                border: 'none',
                borderRadius: 26,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Inter',
                cursor: 'pointer',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? 'Saving...' : 'Done grooming! 🎉'}
            </button>
          </div>
        )}
      </div>

    </div>
  )
}