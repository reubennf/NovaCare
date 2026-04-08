import { useState, useEffect } from 'react'
export default function LoadingScreen({ message = 'Loading...' }) {
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
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          30% { transform: translateY(-30px) rotate(-5deg); }
          50% { transform: translateY(-40px) rotate(5deg); }
          70% { transform: translateY(-20px) rotate(-3deg); }
        }
        @keyframes shadow-pulse {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.15; }
          50% { transform: translateX(-50%) scaleX(0.5); opacity: 0.05; }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes ring-pulse {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
      `}</style>

      {/* NovaPet logo */}
      <div style={{
        position: 'absolute',
        top: 48,
        left: 0,
        right: 0,
        textAlign: 'center',
        animation: 'fade-in 0.5s ease'
      }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'black' }}>Nova</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#20A090' }}>Pet</span>
      </div>

      {/* Sparkles */}
      {[
        { top: '28%', left: '18%', delay: '0s',    size: 18 },
        { top: '22%', left: '75%', delay: '0.4s',  size: 14 },
        { top: '55%', left: '12%', delay: '0.8s',  size: 16 },
        { top: '50%', left: '80%', delay: '0.2s',  size: 12 },
        { top: '38%', left: '85%', delay: '1.0s',  size: 10 },
        { top: '42%', left: '10%', delay: '0.6s',  size: 20 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: s.top,
          left: s.left,
          fontSize: s.size,
          animation: `sparkle 2s ease-in-out ${s.delay} infinite`,
          pointerEvents: 'none'
        }}>
          ✨
        </div>
      ))}

      {/* Pet container */}
      <div style={{ position: 'relative', marginBottom: 32 }}>

        {/* Pulse ring */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: '2px solid rgba(32,160,144,0.3)',
          animation: 'ring-pulse 1.5s ease-out infinite',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          border: '2px solid rgba(32,160,144,0.2)',
          animation: 'ring-pulse 1.5s ease-out 0.5s infinite',
          pointerEvents: 'none'
        }} />

        {/* Bouncing pet */}
        <img
          src="/sushi.png"
          alt="loading"
          style={{
            width: 120,
            height: 120,
            objectFit: 'contain',
            animation: 'bounce 1.2s ease-in-out infinite',
            display: 'block',
            position: 'relative',
            zIndex: 2
          }}
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        {/* Emoji fallback */}
        <div style={{ display: 'none', fontSize: 80, animation: 'bounce 1.2s ease-in-out infinite' }}>
          🐾
        </div>

        {/* Shadow under pet */}
        <div style={{
          position: 'absolute',
          bottom: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 70,
          height: 14,
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '50%',
          filter: 'blur(4px)',
          animation: 'shadow-pulse 1.2s ease-in-out infinite'
        }} />
      </div>

      {/* Loading message */}
      <p style={{
        fontSize: 16,
        color: 'rgba(0,0,0,0.5)',
        margin: '0 0 16px',
        animation: 'fade-in 0.5s ease 0.3s both'
      }}>
        {message}
      </p>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: '#20A090',
            animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>

      {/* Fun rotating tips */}
      <RotatingTip />

    </div>
  )
}

const TIPS = [
  '💊 Tip: Take medications at the same time each day!',
  '🐾 Did you know? Petting animals reduces stress!',
  '⭐ Complete missions to level up your pet!',
  '👥 BUMP a friend to earn bonus points!',
  '🧴 Regular grooming keeps your pet happy!',
  '💬 Chat with Sushi anytime you feel lonely!',
  '🏆 Climb the leaderboard to reach Ruby League!',
  '🌿 Small steps today help you feel better tomorrow!',
]

function RotatingTip() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % TIPS.length)
        setVisible(true)
      }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'absolute',
      bottom: 60,
      left: 32,
      right: 32,
      textAlign: 'center',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)'
    }}>
      <p style={{
        fontSize: 13,
        color: 'rgba(0,0,0,0.35)',
        margin: 0,
        lineHeight: 1.5
      }}>
        {TIPS[index]}
      </p>
    </div>
  )
}