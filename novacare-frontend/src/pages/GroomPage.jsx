import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import LoadingScreen from '../components/LoadingScreen'
import { useEquipment } from '../context/EquipmentContext'

const TOOLS = [
  {
    id: 'brush',
    emoji: '🪮',
    label: 'Brush',
    color: '#FFD93D',
    bg: 'rgba(255,217,61,0.2)',
    border: 'rgba(255,217,61,0.5)',
    sparkles: ['✨', '⭐', '✨'],
    position: { top: 180, left: 30 }
  },
  {
    id: 'clean',
    emoji: '🧴',
    label: 'Clean',
    color: '#6BCB77',
    bg: 'rgba(107,203,119,0.2)',
    border: 'rgba(107,203,119,0.5)',
    sparkles: ['💧', '🫧', '💧'],
    position: { top: 280, right: 30 }
  },
  {
    id: 'teeth',
    emoji: '🦷',
    label: 'Brush teeth',
    color: '#74B9FF',
    bg: 'rgba(116,185,255,0.2)',
    border: 'rgba(116,185,255,0.5)',
    sparkles: ['✨', '💫', '⭐'],
    position: { top: 460, left: 50 }
  },
]

export default function GroomPage() {
  const navigate = useNavigate()
  const { companion: contextCompanion } = useEquipment()

  // State
  const [companion, setCompanion] = useState(contextCompanion || null)
  const [activeTool, setActiveTool] = useState(null)
  const [sparkles, setSparkles] = useState([])
  const [groomedTools, setGroomedTools] = useState([])
  const [dragging, setDragging] = useState(false)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!contextCompanion)

  // Refs
  const petRef = useRef(null)
  const containerRef = useRef(null)
  const sparkleId = useRef(0)
  const isDraggingRef = useRef(false)
  const activeToolRef = useRef(null)
  const dragPosRef = useRef({ x: 0, y: 0 })

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      case 'sheep': return '/Cookie.png'
      case 'chicken': return '/McNuggets.png'
      default: return '/sushi.png'
    }
  }

  // Fetch companion
  useEffect(() => {
    if (contextCompanion) {
      setCompanion(contextCompanion)
      setLoading(false)
      return
    }
    api.get('/companion/')
      .then(res => setCompanion(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [contextCompanion])

  // Non-passive touch listeners for move/end
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const options = { passive: false }
    container.addEventListener('touchmove', handleMove, options)
    container.addEventListener('touchend', handleEnd, options)
    return () => {
      container.removeEventListener('touchmove', handleMove, options)
      container.removeEventListener('touchend', handleEnd, options)
    }
  }, [])

  const addSparkles = (x, y, tool) => {
    const sparkle = {
      id: sparkleId.current++,
      emoji: tool.sparkles[Math.floor(Math.random() * tool.sparkles.length)],
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
    }
    setSparkles(prev => [...prev, sparkle])
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => s.id !== sparkle.id))
    }, 700)
  }

  const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    }
    return { clientX: e.clientX, clientY: e.clientY }
  }

  const handleToolStart = (tool, e) => {
    isDraggingRef.current = true
    activeToolRef.current = tool
    setActiveTool(tool)
    setDragging(true)
    const rect = containerRef.current.getBoundingClientRect()
    const { clientX, clientY } = getClientPos(e)
    const pos = { x: clientX - rect.left, y: clientY - rect.top }
    dragPosRef.current = pos
    setDragPos(pos)
  }

  const handleMove = (e) => {
    if (!isDraggingRef.current || !activeToolRef.current) return
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const { clientX, clientY } = getClientPos(e)
    const x = clientX - rect.left
    const y = clientY - rect.top
    dragPosRef.current = { x, y }
    setDragPos({ x, y })

    if (petRef.current) {
      const petRect = petRef.current.getBoundingClientRect()
      const overPet = (
        clientX >= petRect.left - 20 &&
        clientX <= petRect.right + 20 &&
        clientY >= petRect.top - 20 &&
        clientY <= petRect.bottom + 20
      )
      if (overPet) {
        addSparkles(x, y, activeToolRef.current)
      }
    }
  }

  const handleEnd = (e) => {
    if (!isDraggingRef.current || !activeToolRef.current) return
    isDraggingRef.current = false

    if (petRef.current && containerRef.current) {
      const petRect = petRef.current.getBoundingClientRect()
      const containerRect = containerRef.current.getBoundingClientRect()
      const petCenterX = petRect.left + petRect.width / 2 - containerRect.left
      const petCenterY = petRect.top + petRect.height / 2 - containerRect.top
      const pos = dragPosRef.current
      const dist = Math.sqrt(
        Math.pow(pos.x - petCenterX, 2) +
        Math.pow(pos.y - petCenterY, 2)
      )

      if (dist < 120) {
        const toolId = activeToolRef.current.id
        const tool = activeToolRef.current
        setGroomedTools(prev => {
          if (prev.includes(toolId)) return prev
          const next = [...prev, toolId]
          for (let i = 0; i < 3; i++) {
            setTimeout(() => addSparkles(petCenterX, petCenterY, tool), i * 150)
          }
          if (next.length >= TOOLS.length) {
            setTimeout(() => setDone(true), 800)
          }
          return next
        })
      }
    }

    activeToolRef.current = null
    setDragging(false)
    setActiveTool(null)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.post('/companion/care/groom')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (err) {
      navigate('/dashboard')
    } finally {
      setSaving(false)
    }
  }

  const companionName = companion?.name || 'Sushi'

  if (loading) return <LoadingScreen message="Preparing some soap..." />

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      style={{
        width: 390,
        height: 844,
        margin: '0 auto',
        background: '#EAF8F5',
        fontFamily: 'Inter, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      <style>{`
        @keyframes tool-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle-pop {
          0% { opacity: 1; transform: scale(0.5) translateY(0); }
          60% { opacity: 1; transform: scale(1.3) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.8) translateY(-40px); }
        }
        @keyframes pet-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes done-pop {
          0% { opacity: 0; transform: scale(0.8); }
          60% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '44px 24px 0', textAlign: 'center', position: 'relative' }}>
        <div
          onClick={(e) => { e.stopPropagation(); navigate('/dashboard') }}
          style={{ position: 'absolute', left: 24, top: 44, cursor: 'pointer', width: 36, height: 36, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 400, margin: '0 0 4px', color: 'black' }}>
          Groom <strong>{companionName}</strong>
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Drag each tool onto {companionName}
        </p>
      </div>

      {/* Tool bubbles */}
      {TOOLS.map((tool, index) => {
        const isGroomed = groomedTools.includes(tool.id)
        const isDraggingThis = dragging && activeTool?.id === tool.id
        return (
          <div
            key={tool.id}
            onMouseDown={(e) => !isGroomed && handleToolStart(tool, e)}
            onTouchStart={(e) => !isGroomed && handleToolStart(tool, e)}
            style={{
              position: 'absolute',
              ...tool.position,
              width: 80,
              height: 80,
              borderRadius: 40,
              background: isGroomed ? 'rgba(32,160,144,0.15)' : tool.bg,
              border: `2px solid ${isGroomed ? '#20A090aa' : tool.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isGroomed ? 'default' : 'grab',
              animation: isGroomed || isDraggingThis
                ? 'none'
                : `tool-float ${2.5 + index * 0.3}s ease-in-out infinite`,
              opacity: isDraggingThis ? 0.25 : 1,
              boxShadow: isGroomed ? 'none' : `0 4px 16px ${tool.color}44`,
              zIndex: 3,
              transition: 'opacity 0.2s, background 0.3s'
            }}
          >
            <span style={{ fontSize: 30 }}>
              {isGroomed ? '✓' : tool.emoji}
            </span>
            <span style={{ fontSize: 9, color: isGroomed ? '#20A090' : tool.color, fontWeight: 600, marginTop: 2 }}>
              {isGroomed ? 'Done!' : tool.label}
            </span>
          </div>
        )
      })}

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
          transform: 'rotate(15deg) scale(1.1)'
        }}>
          {activeTool.emoji}
        </div>
      )}

      {/* Pet - centered */}
      <div style={{
        position: 'absolute',
        // left: '50%',
        bottom: -50,
        // transform: 'translateY(-5%)',
        zIndex: 2,
        animation: done ? 'none' : 'pet-float 3s ease-in-out infinite'
      }}>
        <img
          ref={petRef}
          src={getPetImage(companion?.species || contextCompanion?.species)}
          alt="pet"
          style={{
            width: 1000,
            height: 1000,
            objectFit: 'contain',
            filter: done ? 'drop-shadow(0 0 16px rgba(32,160,144,0.5))' : 'none',
            transition: 'filter 0.5s'
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Sparkles */}
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          style={{
            position: 'absolute',
            left: sparkle.x - 10,
            top: sparkle.y - 10,
            fontSize: 16,
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
        bottom: 180,
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
            background: groomedTools.includes(tool.id) ? '#20A090' : '#C0E8E0',
            transition: 'background 0.3s'
          }} />
        ))}
      </div>

      {/* Bottom area */}
      <div style={{
        position: 'absolute',
        bottom: 48,
        left: 24,
        right: 24,
        textAlign: 'center'
      }}>
        {!done ? (
          <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.35)', margin: 0 }}>
            {groomedTools.length}/{TOOLS.length} tools used
          </p>
        ) : (
          <div style={{ animation: 'done-pop 0.5s ease' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#20A090', margin: '0 0 16px' }}>
              {companionName} looks amazing! ✨
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave() }}
              disabled={saving}
              style={{
                width: '100%', height: 52, background: '#20A090',
                border: 'none', borderRadius: 26, color: 'white',
                fontSize: 16, fontWeight: 600, fontFamily: 'Inter',
                zIndex: 4, cursor: 'pointer', opacity: saving ? 0.7 : 1
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