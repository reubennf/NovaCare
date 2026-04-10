import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SignupPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setSuccess('Account created! Please check your email to verify, then sign in.')
        setIsSignUp(false)
        setPassword('')
        setConfirmPassword('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 52, borderRadius: 26,
    border: '1.5px solid #E0E0E0', padding: '0 20px',
    fontSize: 15, fontFamily: 'Inter',
    boxSizing: 'border-box', outline: 'none',
    marginBottom: 12
  }

  return (
    <div style={{
      width: 390, height: 844, margin: '0 auto',
      background: 'white', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden'
    }}>

      {/* Header */}
      <div style={{ padding: '44px 24px 0', flexShrink: 0 }}>
        <div onClick={() => navigate('/login')} style={{ cursor: 'pointer', fontSize: 24, color: '#191D30', marginBottom: 24, display: 'inline-block' }}>
          ‹
        </div>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#20A090' }}>Care</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* Pet illustration */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/sushi.png" alt="pet" style={{ width: 100, height: 100, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 4px', color: 'black', textAlign: 'center' }}>
          {isSignUp ? 'Create account' : 'Welcome back'}
        </h1>
        <p style={{ fontSize: 14, color: '#888', margin: '0 0 28px', textAlign: 'center' }}>
          {isSignUp ? 'Sign up with your email' : 'Sign in to NovaCare'}
        </p>

        {/* Fields */}
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          style={inputStyle}
        />
        <input
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          onKeyDown={e => e.key === 'Enter' && !isSignUp && handleSubmit()}
          style={inputStyle}
        />
        {isSignUp && (
          <input
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            type="password"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#E53E3E' }}>{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background: '#F0FFF4', border: '1px solid #C6F6D5', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#276749' }}>{success}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', height: 52, background: '#20A090',
            border: 'none', borderRadius: 26, color: 'white',
            fontSize: 16, fontWeight: 600, fontFamily: 'Inter',
            cursor: 'pointer', opacity: loading ? 0.7 : 1,
            marginBottom: 16
          }}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        {/* Toggle sign in / sign up */}
        <p style={{ textAlign: 'center', fontSize: 14, color: '#888', margin: 0 }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); setPassword(''); setConfirmPassword('') }}
            style={{ color: '#20A090', fontWeight: 600, cursor: 'pointer' }}
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>

      {/* Dog mascot bottom right */}
      <div style={{ position: 'absolute', bottom: 24, right: 24, opacity: 0.15 }}>
        <img src="/OnboardingDog.png" style={{ width: 80, height: 80, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
      </div>

    </div>
  )
}