import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'http://localhost:5173/dashboard'
        }
        })
    }

    const handleFacebookLogin = async () => {
        await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: 'http://localhost:5173/dashboard'
        }
        })
    }

    const handleEmailLogin = async () => {
        await supabase.auth.signInWithOAuth({
        provider: 'google', // replace with your email provider
        options: {
            redirectTo: 'http://localhost:5173/dashboard'
        }
        })
    }

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

      {/* Back arrow */}
      <div
        onClick={() => navigate('/welcome')}
        style={{
          width: 44,
          height: 44,
          left: 24,
          top: 44,
          position: 'absolute',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: '#191D30'
        }}
      >
        ‹
      </div>

      {/* Headline */}
      <div style={{ width: 358, left: 24, top: 88, position: 'absolute' }}>
        <span style={{ color: 'black', fontSize: 33, fontFamily: 'Inter', fontWeight: 400 }}>A healthier life with </span>
        <span style={{ color: 'black', fontSize: 33, fontFamily: 'Inter', fontWeight: 700 }}>Nova</span>
        <span style={{ color: '#20A090', fontSize: 33, fontFamily: 'Inter', fontWeight: 700 }}>Care</span>
        <span style={{ color: 'black', fontSize: 33, fontFamily: 'Inter', fontWeight: 400 }}> awaits you</span>
      </div>

      {/* Main illustration */}
      <img
        src="/LoginIllustration.png"
        alt="Elderly person with pet"
        style={{
          width: 340,
          height: 320,
          left: 21,
          top: 250,
          zIndex: 10,
          position: 'absolute',
          objectFit: 'contain'
        }}
        onError={e => {
          e.target.style.display = 'none'
        }}
      />

      {/* Plant illustration */}
      <img
        src="/plant.png"
        alt="plant"
        style={{
          width: 220,
          height: 180,
          left: 0,
          top: 360,
          zIndex: 5,
          position: 'absolute',
          objectFit: 'contain'
        }}
        onError={e => {
          e.target.style.display = 'none'
        }}
      />

      {/* Tulip illustration */}
      <img
        src="/tulip.png"
        alt="tulip"
        style={{
          width: 220,
          height: 180,
          right: 0,
          top: 360,
          zIndex: 5,
          position: 'absolute',
          objectFit: 'contain'
        }}
        onError={e => {
          e.target.style.display = 'none'
        }}
      />

      {/* Tray illustration */}
      <img
        src="/tray.png"
        alt="tray"
        style={{
          width: 800,
          height: 400,
          left: 0,
          top: 190,
          position: 'absolute',
          objectFit: 'contain'
        }}
        onError={e => {
          e.target.style.display = 'none'
        }}
      />

      {/* Butterfly decoration */}
      <img
        src="/Butterfly.png"
        alt="butterfly"
        style={{
          width: 100,
          height: 100,
          left: 67.5,
          top: 233,
          position: 'absolute',
          objectFit: 'contain',
          transform: 'rotate(8deg)',
          transformOrigin: 'top left'
        }}
      />

      {/* Log in with Singpass button */}
      <div
        onClick={() => setShowEmailForm(!showEmailForm)}
        style={{
          width: 336,
          height: 51,
          left: 33,
          top: 580,
          position: 'absolute',
          background: 'white',
          borderRadius: 6,
          border: '1px solid #C8C9CC',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6
        }}
      >
        <span style={{
          color: 'black',
          fontSize: 16,
          fontFamily: 'Poppins',
          fontWeight: 700
        }}>
          Login with
        </span>
        <img 
            src="/singpass.png" 
            alt="singpass" 
            style={{ width: 100, height: 19, display: 'block' }} 
        />
      </div>

      {/* OR divider */}
      <div style={{
        width: 190,
        left: 98,
        top: 655,
        position: 'absolute',
        borderTop: '1px solid #C8C9CC'
      }} />
      <div style={{
        left: 178,
        top: 645,
        position: 'absolute',
        background: 'white',
        padding: '0 8px',
        color: 'black',
        fontSize: 14,
        fontFamily: 'Inter'
      }}>
        or
      </div>

     {/* Social login icons */}
    <div style={{
    position: 'absolute',
    top: 675,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: 15,
    alignItems: 'center'
    }}>
    {/* Email icon */}
    <div style={{
        width: 70,
        height: 70,
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
    }}>
        <img src="/icons/email.svg" alt="email" style={{ width: 70, height: 70, display: 'block' }} />
    </div>

    {/* Google icon */}
    <div 
    onClick={handleGoogleLogin}
    style={{
        width: 70,
        height: 70,
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    }}>
        <img src="/icons/google-icon.svg" alt="google" style={{ width: 55, height: 55, paddingBottom:10, display: 'block' }} />
    </div>

    {/* Facebook icon */}
    <div style={{
        width: 70,
        height: 70,
        borderRadius: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
    }}>
        <img src="/icons/facebook.svg" alt="facebook" style={{ width: 70, height: 70, display: 'block' }} />
    </div>
    </div>
      {/* Sign up link */}
      <div style={{
        position: 'absolute',
        bottom: 45,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 14,
        color: '#888'
      }}>
        No account?{' '}
        <Link to="/signup" style={{ color: '#20A090', fontWeight: 600 }}>
          Sign up
        </Link>
      </div>

    </div>
  )
}