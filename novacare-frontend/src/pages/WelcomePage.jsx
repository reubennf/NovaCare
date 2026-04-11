import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function WelcomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const autoLogin = async () => {
      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return // already logged in, ProtectedRoute handles redirect

      // Auto login with demo account
      const { error } = await supabase.auth.signInWithPassword({
        email: 'demo@novacare.sg',
        password: 'novacare123'
      })
      if (error) console.log('Auto login failed:', error.message)
      // If success, AuthContext will update and ProtectedRoute redirects to dashboard
    }
    autoLogin()
  }, [])

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
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Decorative element top right */}
    <div style={{
    position: 'absolute',
    top: 100,
    right: 87,
    width: 150,
    height: 150,
    zIndex: 10,
    transform: 'rotate(8deg)',
    transformOrigin: 'top left',
    }}>
    <img
        src="/Butterfly.png"
        alt="butterfly"
        style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'
        }}
    />
    </div>

      {/* Logo */}
      <div style={{ position: 'absolute', top: 165, left: 55 }}>
        <span style={{
          fontSize: 60,
          fontWeight: 700,
          color: 'black',
          fontFamily: 'Inter'
        }}>Nova</span>
        <span style={{
          fontSize: 60,
          fontWeight: 700,
          color: '#20A090',
          fontFamily: 'Inter'
        }}>Care</span>
      </div>

      {/* Cat image */}
      <img
        src="/CatWelcome.png"
        alt="Pet companion"
        style={{
          position: 'absolute',
          width: 416,
          height: 500,
          left: 5,
          top: 150,
          objectFit: 'contain',
        }}
      />

      {/* Welcome text */}
      <div style={{
        position: 'absolute',
        top: 600,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 20,
        color: 'black',
        fontWeight: 400
      }}>
        Welcome! I'm your companion
      </div>

      {/* Get Started button */}
      <button
        onClick={() => navigate('/login')}
        style={{
          position: 'absolute',
          width: 273,
          height: 55,
          left: 64,
          top: 640,
          background: '#20A090',
          borderRadius: 25,
          border: 'none',
          color: 'white',
          fontSize: 20,
          fontWeight: 600,
          fontFamily: 'Inter',
          cursor: 'pointer',
          boxShadow: '0px 4px 9px rgba(0, 0, 0, 0.16)'
        }}
      >
        Get Started
      </button>

      {/* Sign in */}
      <div style={{
        position: 'absolute',
        top: 715,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 14,
        color: '#888'
      }}>
        Already have an account?{' '}
        <span
          onClick={() => navigate('/login')}
          style={{ color: '#20A090', fontWeight: 600, cursor: 'pointer' }}
        >
          Sign in
        </span>
      </div>

    </div>
  )
}