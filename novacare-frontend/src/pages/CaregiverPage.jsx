import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import LoadingScreen from '../components/LoadingScreen'

const MOOD_COLORS = {
  happy: '#58D68D',
  tired: '#F7DC6F',
  sad: '#E74C3C',
  concerned: '#E74C3C',
  lonely: '#F0A500',
  hungry: '#F7DC6F',
  dirty: '#F7DC6F',
}

export default function CaregiverPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [companion, setCompanion] = useState(null)
  const [medications, setMedications] = useState([])
  const [conditions, setConditions] = useState([])
  const [summary, setSummary] = useState(null)
  const [moodHistory, setMoodHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [showProgress, setShowProgress] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showUploadSheet, setShowUploadSheet] = useState(false)
  const [reports, setReports] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const fileRef = useRef()

  const REPORT_TYPES = [
    { id: 'lab_report', label: 'Lab Report', emoji: '🔬' },
    { id: 'immunization', label: 'Immunization', emoji: '💉' },
    { id: 'drug_allergy', label: 'Drug Allergy', emoji: '⚠️' },
    { id: 'genetic_report', label: 'Genetic Report', emoji: '🧬' },
    { id: 'histology', label: 'Histology', emoji: '🔭' },
    { id: 'radiology', label: 'Radiology', emoji: '🩻' },
    { id: 'health_screening', label: 'Health Screening', emoji: '🏥' },
  ]

  useEffect(() => {
    fetchData()
    // Hardcoded sample mood history — 7 days
    setMoodHistory([
      { mood: 'happy', date: '2026-04-05' },
      { mood: 'tired', date: '2026-04-06' },
      { mood: 'happy', date: '2026-04-07' },
      { mood: 'lonely', date: '2026-04-08' },
      { mood: 'happy', date: '2026-04-09' },
      { mood: 'sad', date: '2026-04-10' },
      { mood: 'happy', date: '2026-04-11' },
    ])

    // Hardcoded sample stats
    setStats({
      missions_completed: 12,
      meds_taken: 18,
      points_earned: 340,
      coins_spent: 80,
      bumps_count: 3,
      pet_cares: 9,
    })

    // Hardcoded sample summary
    setSummary({
      summary: 'Tan Ying Ying has had an active week! She completed 12 missions and took her medications consistently. Her mood has been mostly positive with occasional tiredness. Social engagement was good with 3 BUMP interactions recorded. Continue encouraging daily walks and medication adherence.',
      risk_level: 'low'
    })
  }, [])

  // const fetchData = async () => {
  //   try {
  //     const [profileRes, companionRes, medsRes] = await Promise.allSettled([
  //       api.get('/profile/'),
  //       api.get('/companion/'),
  //       api.get('/medications/'),
  //     ])
  //     if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
  //     if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
  //     if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data || [])

  //     try {
  //       const summaryRes = await api.get('/caregiver/summary')
  //       setSummary(summaryRes.data)
  //     } catch {}

  //     try {
  //       const moodRes = await api.get('/caregiver/mood-history')
  //       setMoodHistory(moodRes.data || [])
  //     } catch {}

  //     try {
  //       const statsRes = await api.get('/caregiver/stats')
  //       setStats(statsRes.data)
  //     } catch {}

  //     try {
  //       const reportsRes = await api.get('/caregiver/reports')
  //       setReports(reportsRes.data || [])
  //     } catch {}

  //   } catch (err) {
  //     console.error(err)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const fetchData = async () => {
    try {
      const [profileRes, companionRes, medsRes] = await Promise.allSettled([
        api.get('/profile/'),
        api.get('/companion/'),
        api.get('/medications/'),
      ])
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (medsRes.status === 'fulfilled') setMedications(medsRes.value.data || [])

      try {
        const reportsRes = await api.get('/caregiver/reports')
        setReports(reportsRes.data || [])
      } catch {}

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file, reportType) => {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('report_type', reportType)
      await api.post('/caregiver/reports/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      await fetchData()
      setShowUploadSheet(false)
      setSelectedType(null)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const displayName = profile?.preferred_name || profile?.full_name || 'User'
  const age = profile?.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth)) / 31557600000)
    : '—'

  if (loading) return <LoadingScreen message="Loading patient profile..." />

  return (
    <div style={{
      width: 390, height: 844, margin: '0 auto',
      background: '#F5F5F5', fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ background: 'white', padding: '44px 24px 24px', textAlign: 'center', position: 'relative' }}>
          <div onClick={() => navigate('/dashboard')} style={{ position: 'absolute', left: 24, top: 44, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
          </div>

          {/* Avatar */}
          <div style={{
            width: 90, height: 90, borderRadius: 45,
            border: '3px solid #20A090',
            background: '#f0f0f0',
            margin: '0 auto 12px',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative'
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 40 }}>👤</span>
            )}
            {/* Pet overlay */}
            <img
              src={companion?.species === 'cat' ? '/CatWelcome.png' : '/sushi.png'}
              style={{ position: 'absolute', bottom: -4, right: -8, width: 44, height: 44, objectFit: 'contain' }}
              onError={e => { e.target.style.display = 'none' }}
            />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: 'black' }}>{displayName}</h2>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>Patient</p>
        </div>

        {/* Info card */}
        <div style={{ margin: '16px 16px 0', background: '#20A090', borderRadius: 16, padding: '14px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Gender', value: profile?.gender || '—' },
              { label: 'Age', value: age },
              { label: 'Patient-ID', value: `ID-${String(profile?.id || '').slice(-3).toUpperCase()}` },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{label}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'white' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Details */}
        <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: '16px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px', color: 'black' }}>Medical Details</h3>

          {/* Upload button */}
          <div
            onClick={() => setShowUploadSheet(true)}
            style={{
              background: '#20A090', borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', marginBottom: 14
            }}
          >
            <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>Upload Latest Records</span>
            <span style={{ fontSize: 20 }}>⬆️</span>
          </div>

          {/* Medical info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Chronic Conditions */}
            <div style={{ background: '#F8FFFE', borderRadius: 12, padding: '12px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: '#20A090' }}>Chronic Conditions</p>
              <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                {conditions.length > 0 ? conditions.join(', ') : 'None recorded'}
              </p>
            </div>

            {/* Current Medications */}
            <div style={{ background: '#F8FFFE', borderRadius: 12, padding: '12px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: '#20A090' }}>Current Medications</p>
              <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                {medications.length > 0
                  ? medications.slice(0, 2).map(m => m.name).join(', ')
                  : 'None recorded'}
              </p>
            </div>

            {/* Allergies */}
            <div style={{ background: '#F8FFFE', borderRadius: 12, padding: '12px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: '#20A090' }}>Allergies</p>
              <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                {profile?.allergies || 'None recorded'}
              </p>
            </div>

            {/* Primary Care Doctor */}
            <div style={{ background: '#F8FFFE', borderRadius: 12, padding: '12px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12, color: '#20A090' }}>Primary Care Doctor</p>
              <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                {profile?.assigned_doctor || 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Uploaded reports */}
        {reports.length > 0 && (
          <div style={{ margin: '16px 16px 0', background: 'white', borderRadius: 20, padding: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'black' }}>
              Uploaded Documents ({reports.length})
            </p>
            {reports.map(report => {
              const type = REPORT_TYPES.find(t => t.id === report.report_type)
              return (
                <div key={report.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid #F5F5F5'
                }}>
                  <span style={{ fontSize: 20 }}>{type?.emoji || '📄'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{report.file_name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>
                      {type?.label} · {new Date(report.uploaded_at).toLocaleDateString('en-SG')}
                    </p>
                  </div>
                  <a href={report.file_url} target="_blank" rel="noreferrer" style={{
                    fontSize: 11, color: '#20A090', fontWeight: 600,
                    textDecoration: 'none', padding: '4px 10px',
                    background: 'rgba(32,160,144,0.1)', borderRadius: 10
                  }}>
                    View
                  </a>
                </div>
              )
            })}
          </div>
        )}

        {/* View progress button */}
        <div style={{ padding: '16px' }}>
          <div
            onClick={() => setShowProgress(!showProgress)}
            style={{
              background: '#1A3A35', borderRadius: 30, padding: '16px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', gap: 8
            }}
          >
            <span style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>
              View {displayName.split(' ')[0]}'s activity and progress
            </span>
          </div>
        </div>

        {/* Progress section */}
        {showProgress && (
          <div style={{ padding: '0 16px 32px' }}>

            {/* Mood tracker */}
            <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 12px' }}>😊 Mood This Week</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 9, color: '#aaa', fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const dayMood = moodHistory[i]
                  const color = dayMood ? (MOOD_COLORS[dayMood.mood] || '#E0E0E0') : '#F0F0F0'
                  const emoji = dayMood ? { happy: '😊', tired: '😴', sad: '😢', concerned: '😟', lonely: '🥺', hungry: '🍗', dirty: '🧴' }[dayMood.mood] || '😊' : ''
                  return (
                    <div key={i} style={{ aspectRatio: '1', borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: dayMood ? 1 : 0.4 }}>
                      {emoji}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {[{ color: '#58D68D', label: 'Happy' }, { color: '#F7DC6F', label: 'Tired/Hungry' }, { color: '#E74C3C', label: 'Sad/Concerned' }, { color: '#F0F0F0', label: 'No data' }].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                    <span style={{ fontSize: 10, color: '#888' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div style={{ background: 'white', borderRadius: 20, padding: 16, marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 10px' }}>🤖 AI Weekly Summary</p>
              {summary?.summary ? (
                <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.7 }}>{summary.summary}</p>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>
                  Summary will appear after the first week of activity.
                </p>
              )}
              {summary?.risk_level && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: summary.risk_level === 'low' ? '#F0FFF4' : '#FFF5F5', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{summary.risk_level === 'low' ? '✅' : '🚨'}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: summary.risk_level === 'low' ? '#276749' : '#742a2a' }}>
                    Risk: {summary.risk_level?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div style={{ background: 'white', borderRadius: 20, padding: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, margin: '0 0 12px' }}>📊 Weekly Stats</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Missions Done', value: stats?.missions_completed ?? '—', emoji: '⭐', color: '#FFF9E6' },
                  { label: 'Meds Taken', value: stats?.meds_taken ?? '—', emoji: '💊', color: '#F0FFF4' },
                  { label: 'Points Earned', value: stats?.points_earned ?? '—', emoji: '💎', color: '#EBF8FF' },
                  { label: 'Bumps', value: stats?.bumps_count ?? '—', emoji: '👊', color: '#FFF0F0' },
                  { label: 'Coins Spent', value: stats?.coins_spent ?? '—', emoji: '🪙', color: '#F5F0FF' },
                  { label: 'Pet Cares', value: stats?.pet_cares ?? '—', emoji: '🐾', color: '#F0FFF8' },
                ].map(({ label, value, emoji, color }) => (
                  <div key={label} style={{ background: color, borderRadius: 14, padding: '12px 14px' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'black' }}>{value}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload sheet */}
      {showUploadSheet && (
        <>
          <div onClick={() => setShowUploadSheet(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
          <div style={{
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            width: 390, background: 'white', borderRadius: '24px 24px 0 0',
            padding: '24px 24px 40px', zIndex: 50,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ width: 40, height: 4, background: '#E0E0E0', borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'black' }}>Upload Medical Record</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 20px' }}>Select document type to upload</p>

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file && selectedType) handleUpload(file, selectedType)
                e.target.value = ''
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {REPORT_TYPES.map(type => (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id)
                    fileRef.current?.click()
                  }}
                  style={{
                    background: '#F8FFFE', border: '1.5px solid #E0F5F2',
                    borderRadius: 14, padding: '14px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer',
                    opacity: uploading && selectedType === type.id ? 0.5 : 1
                  }}
                >
                  <span style={{ fontSize: 24 }}>{type.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'black', lineHeight: 1.3 }}>
                    {uploading && selectedType === type.id ? 'Uploading...' : type.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}