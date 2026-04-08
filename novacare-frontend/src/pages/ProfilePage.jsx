import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useEquipment } from '../context/EquipmentContext'
import LoadingScreen from '../components/LoadingScreen'

const PET_OPTIONS = [
  { id: "cat",    label: "Whiskers", emoji: "🐱", description: "Calm & cozy companion" },
  { id: "dog",    label: "Sushi",  emoji: "🐶", description: "Loyal & energetic friend" },
  { id: "sheep",  label: "Cookie",    emoji: "🐑", description: "Gentle & curious pal" },
  { id: "chicken",   label: "McNuggets",    emoji: "🐥", description: "Cheerful & chatty buddy" },
]

const FONT_SIZES = [
  { id: "small",  label: "Small",       cls: "text-sm"   },
  { id: "medium", label: "Medium",      cls: "text-base" },
  { id: "large",  label: "Large",       cls: "text-lg"   },
  { id: "xl",     label: "Extra Large", cls: "text-xl"   },
]

const FAQ_ITEMS = [
  { q: "How do I earn points?",               a: "Complete daily missions, take your medication on time, chat with your companion, and groom or feed your pet. Each activity rewards you with gems!" },
  { q: "What happens when my pet levels up?", a: "Your pet unlocks new accessories, decorations, and expressions. Higher-level pets also give better mission rewards." },
  { q: "How does medication tracking work?",  a: "Your caregiver or you can add your medication schedule. NovaCare will remind you and mark it as done when you confirm." },
  { q: "Can my caregiver see my activity?",   a: "Yes — caregivers linked to your account receive weekly summaries and alerts if your activity drops significantly." },
  { q: "What is HealthHub Connect?",          a: "HealthHub is Singapore's national health data platform. Connecting lets NovaCare access your appointment reminders and health records securely." },
  { q: "How do I change my pet's name?",      a: "You may rename your pet once every 90 days. The rename option will show when it becomes available again." },
]

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, paddingLeft: 4 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.2 }}>{title}</span>
      </div>
      <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, onClick, rightEl }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid #F5F5F5', cursor: 'pointer', fontFamily: 'Inter', textAlign: 'left' }}
    >
      <span style={{ fontSize: 15, color: '#1a1a1a' }}>{label}</span>
      {rightEl ?? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {value && <span style={{ fontSize: 13, color: '#bbb' }}>{value}</span>}
          <span style={{ fontSize: 16, color: '#ccc' }}>›</span>
        </div>
      )}
    </button>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', width: '100%', maxWidth: 430, borderRadius: '24px 24px 0 0', padding: '24px 24px 40px', animation: 'slideUp 0.26s cubic-bezier(0.32,0.72,0,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a1a', fontFamily: 'Inter' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 16, border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: 18, color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function PrimaryBtn({ onClick, children, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', height: 48, background: disabled ? '#ccc' : '#20A090', border: 'none', borderRadius: 24, color: 'white', fontSize: 15, fontWeight: 600, fontFamily: 'Inter', cursor: disabled ? 'default' : 'pointer' }}>
      {children}
    </button>
  )
}

function TextInput({ value, onChange, placeholder, maxLength }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} maxLength={maxLength || 50} placeholder={placeholder}
      style={{ width: '100%', height: 48, borderRadius: 24, border: '1.5px solid #E0E0E0', padding: '0 18px', fontSize: 15, fontFamily: 'Inter', boxSizing: 'border-box', outline: 'none', marginBottom: 14 }} />
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { refreshCompanion } = useEquipment()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [warn,    setWarn]    = useState(null)
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const [newName,      setNewName]      = useState('')
  const [newPetName,   setNewPetName]   = useState('')
  const [newCaregiver, setNewCaregiver] = useState('')

  const fileRef = useRef()

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const [profileRes, companionRes] = await Promise.allSettled([
        api.get('/profile/'),
        api.get('/companion/'),
      ])
      
      const profileData = profileRes.status === 'fulfilled' ? profileRes.value.data : {}
      const companionData = companionRes.status === 'fulfilled' ? companionRes.value.data : {}
      
      setProfile({
        preferred_name: '',
        full_name: '',
        email: '',
        avatar_url: null,
        // Use companion data for pet info
        pet_type: companionData.species || 'dog',
        pet_name: companionData.name || 'Sushi',
        pet_level: companionData.level || 1,
        pet_renamed_at: null,
        caregiver_name: '',
        font_size: 'medium',
        healthhub_connected: false,
        companion_id: companionData.id,
        ...profileData,
        // Override with companion data (takes priority)
        pet_type: companionData.species || 'dog',
        pet_name: companionData.name || 'Sushi',
        pet_level: companionData.level || 1,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const patchProfile = async (patch) => {
    setSaving(true)
    setProfile(prev => ({ ...prev, ...patch }))
    try {
      await api.patch('/profile/', patch)
    } catch (err) {
      console.error(err)
      showToast('Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setProfile(prev => ({ ...prev, avatar_url: res.data.avatar_url }))
      showToast('Profile picture updated! ✨')
      setModal(null)
    } catch (err) {
      console.error(err)
      showToast('Upload failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveName = async () => {
    if (!newName.trim()) return
    await patchProfile({ preferred_name: newName.trim() })
    showToast('Name updated!')
    setModal(null)
  }

  const confirmPetChange = async (petId) => {
    const pet = PET_OPTIONS.find(p => p.id === petId)
    setSaving(true)
    try {
      // Update companion species
      await api.post('/companion/', {
        name: pet.label,
        species: petId,
        personality: 'cheerful'
      })
      setProfile(prev => ({
        ...prev,
        pet_type: petId,
        pet_name: pet.label,
        pet_level: 1
      }))
      await refreshCompanion()
      showToast(`${pet.emoji} ${pet.label} is your new companion!`)
    } catch (err) {
      console.error(err)
      showToast('Failed to change pet', 'error')
    } finally {
      setSaving(false)
      setWarn(null)
      setModal(null)
    }
  }

  const canRename = () => {
    if (!profile?.pet_renamed_at) return true
    return (Date.now() - new Date(profile.pet_renamed_at)) / 86_400_000 >= 90
  }
  const daysLeft = () => {
    if (!profile?.pet_renamed_at) return 0
    return Math.ceil(90 - (Date.now() - new Date(profile.pet_renamed_at)) / 86_400_000)
  }

  const handleSavePetName = async () => {
    if (!newPetName.trim() || !canRename()) return
    setSaving(true)
    try {
      await api.patch('/companion/name', { name: newPetName.trim() })
      setProfile(prev => ({ ...prev, pet_name: newPetName.trim(), pet_renamed_at: new Date().toISOString() }))
      showToast('Pet renamed! 🐾')
      setModal(null)
    } catch (err) {
      console.error(err)
      showToast('Failed to rename', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCaregiver = async () => {
    await patchProfile({ caregiver_name: newCaregiver.trim() })
    showToast('Caregiver saved!')
    setModal(null)
  }

  const handleFontSize = async (id) => {
    await patchProfile({ font_size: id })
    showToast('Font size updated!')
    setModal(null)
  }

  if (loading) return <LoadingScreen />

  if (!profile) return (
    <div style={{ width: 390, height: 844, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }}>
      <p style={{ color: '#aaa' }}>Could not load profile.</p>
    </div>
  )

  const displayName = profile.preferred_name || profile.full_name || 'Nova User'
  const currentPet  = PET_OPTIONS.find(p => p.id === profile.pet_type) ?? PET_OPTIONS[0]
  const currentFont = FONT_SIZES.find(f => f.id === profile.font_size)?.label ?? 'Medium'

  return (
    <div style={{ width: 390, height: 844, margin: '0 auto', background: '#F8F9FA', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: toast.type === 'error' ? '#E53E3E' : '#20A090', color: 'white', padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 600, fontFamily: 'Inter', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '44px 24px 0', background: '#F8F9FA', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 16 }}>
          <div onClick={() => navigate('/dashboard')} style={{ position: 'absolute', left: 0, cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
          </div>
        </div>
      </div>

      {/* Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>

        {/* Avatar + name hero */}
        <div style={{ background: 'linear-gradient(135deg, #20A090, #17877A)', borderRadius: 24, padding: '28px 20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }} onClick={() => setModal('avatar')}>
            <div style={{ width: 80, height: 80, borderRadius: 40, border: '3px solid rgba(255,255,255,0.6)', overflow: 'hidden', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : currentPet.emoji}
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</div>
          </div>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '12px 0 2px' }}>{displayName}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>{profile.email}</p>
        </div>

        {/* Pet card */}
        <div style={{ background: 'white', borderRadius: 20, padding: '14px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: 44 }}>{currentPet.emoji}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 11, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Your Pet</p>
            <p style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>{profile.pet_name}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#aaa' }}>{currentPet.description} · Lv.{profile.pet_level ?? 1}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => { setNewPetName(profile.pet_name); setModal('petname') }}
              style={{ background: 'rgba(32,160,144,0.1)', border: 'none', borderRadius: 14, color: '#20A090', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Inter' }}>
              Rename
            </button>
            <button onClick={() => setModal('pet')}
              style={{ background: '#f5f5f5', border: 'none', borderRadius: 14, color: '#666', fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer', fontFamily: 'Inter' }}>
              Change
            </button>
          </div>
        </div>

        <Section title="Account" icon="👤">
          <Row label="Display Name"   value={displayName}                         onClick={() => { setNewName(profile.preferred_name || ''); setModal('username') }} />
          <Row label="Profile Picture"                                             onClick={() => setModal('avatar')} />
          <Row label="Caregiver Name" value={profile.caregiver_name || 'Not set'} onClick={() => { setNewCaregiver(profile.caregiver_name || ''); setModal('caregiver') }} />
        </Section>

        <Section title="Health" icon="🏥">
          <Row label="Connect to HealthHub" onClick={() => showToast('HealthHub integration coming soon!')}
            rightEl={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: profile.healthhub_connected ? '#E6F9F7' : '#f5f5f5', color: profile.healthhub_connected ? '#20A090' : '#aaa' }}>
                  {profile.healthhub_connected ? 'Connected' : 'Not connected'}
                </span>
                <span style={{ fontSize: 16, color: '#ccc' }}>›</span>
              </div>
            }
          />
        </Section>

        <Section title="Settings" icon="⚙️">
          <Row label="Font Size" value={currentFont} onClick={() => setModal('font')} />
        </Section>

        <Section title="Help" icon="💬">
          <Row label="How to Use NovaCare"        onClick={() => setModal('howto')} />
          <Row label="Frequently Asked Questions" onClick={() => setModal('faq')}   />
        </Section>

      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {modal === 'avatar' && (
        <Modal title="Profile Picture" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', background: '#f0f0f0', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : currentPet.emoji}
            </div>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Square images work best</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFile} />
          <PrimaryBtn onClick={() => fileRef.current?.click()} disabled={saving}>
            {saving ? 'Uploading…' : '📷  Choose Photo'}
          </PrimaryBtn>
          {profile.avatar_url && (
            <button onClick={async () => { await patchProfile({ avatar_url: null }); showToast('Photo removed'); setModal(null) }}
              style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent', border: 'none', color: '#E53E3E', fontSize: 13, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer' }}>
              Remove Photo
            </button>
          )}
        </Modal>
      )}

      {modal === 'username' && (
        <Modal title="Change Display Name" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>This is the name shown in the app and to your caregiver.</p>
          <TextInput value={newName} onChange={setNewName} placeholder="Your name" maxLength={30} />
          <PrimaryBtn onClick={handleSaveName} disabled={saving || !newName.trim()}>Save Name</PrimaryBtn>
        </Modal>
      )}

      {modal === 'pet' && !warn && (
        <Modal title="Choose Your Pet" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>
            Switching pets will <span style={{ color: '#E53E3E', fontWeight: 600 }}>reset your pet's level</span> back to 1.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {PET_OPTIONS.map(pet => (
              <button key={pet.id}
                onClick={() => profile.pet_type !== pet.id && setWarn({ petId: pet.id })}
                style={{ borderRadius: 18, border: `2px solid ${profile.pet_type === pet.id ? '#20A090' : '#eee'}`, background: profile.pet_type === pet.id ? 'rgba(32,160,144,0.06)' : 'white', padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: profile.pet_type === pet.id ? 'default' : 'pointer', fontFamily: 'Inter' }}>
                <span style={{ fontSize: 36 }}>{pet.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{pet.label}</span>
                <span style={{ fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.3 }}>{pet.description}</span>
                {profile.pet_type === pet.id && <span style={{ fontSize: 10, background: 'rgba(32,160,144,0.1)', color: '#20A090', fontWeight: 700, padding: '2px 8px', borderRadius: 8 }}>Current</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {warn && (
        <Modal title="Are you sure?" onClose={() => setWarn(null)}>
          <div style={{ background: '#FFF8E6', border: '1px solid #FFD980', borderRadius: 16, padding: 16, marginBottom: 18, textAlign: 'center' }}>
            <p style={{ fontSize: 28, margin: '0 0 6px' }}>⚠️</p>
            <p style={{ fontWeight: 700, color: '#B7791F', margin: '0 0 4px', fontSize: 15 }}>Your pet will lose all progress!</p>
            <p style={{ fontSize: 13, color: '#975A16', margin: 0, lineHeight: 1.5 }}>Changing your pet resets its level back to 1.<br />Your accessories and gems will be kept.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setWarn(null)}
              style={{ flex: 1, height: 48, borderRadius: 24, border: '1.5px solid #E0E0E0', background: 'white', color: '#666', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>
              Keep My Pet
            </button>
            <button onClick={() => confirmPetChange(warn.petId)}
              style={{ flex: 1, height: 48, borderRadius: 24, border: 'none', background: '#F6AD55', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter' }}>
              Switch Anyway
            </button>
          </div>
        </Modal>
      )}

      {modal === 'petname' && (
        <Modal title="Rename Your Pet" onClose={() => setModal(null)}>
          {canRename() ? (
            <>
              <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>You can rename your pet once every 90 days.</p>
              <TextInput value={newPetName} onChange={setNewPetName} placeholder="New pet name" maxLength={20} />
              <PrimaryBtn onClick={handleSavePetName} disabled={saving || !newPetName.trim()}>Save Name</PrimaryBtn>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 36, margin: '0 0 10px' }}>⏳</p>
              <p style={{ fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' }}>Not available yet</p>
              <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
                You can rename again in <span style={{ color: '#20A090', fontWeight: 700 }}>{daysLeft()} days</span>.
              </p>
            </div>
          )}
        </Modal>
      )}

      {modal === 'caregiver' && (
        <Modal title="Caregiver Name" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>Your caregiver will receive weekly activity summaries and risk alerts.</p>
          <TextInput value={newCaregiver} onChange={setNewCaregiver} placeholder="e.g. Mum, Son, Dr. Tan" maxLength={50} />
          <PrimaryBtn onClick={handleSaveCaregiver} disabled={saving}>Save Caregiver</PrimaryBtn>
        </Modal>
      )}

      {modal === 'font' && (
        <Modal title="Font Size" onClose={() => setModal(null)}>
          <p style={{ fontSize: 13, color: '#aaa', margin: '0 0 14px' }}>Adjust the text size throughout the app.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FONT_SIZES.map(f => (
              <button key={f.id} onClick={() => handleFontSize(f.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, border: `2px solid ${profile.font_size === f.id ? '#20A090' : '#eee'}`, background: profile.font_size === f.id ? 'rgba(32,160,144,0.05)' : 'white', cursor: 'pointer', fontFamily: 'Inter' }}>
                <span style={{ fontWeight: 500, color: '#1a1a1a', fontSize: f.id === 'small' ? 13 : f.id === 'large' ? 17 : f.id === 'xl' ? 20 : 15 }}>{f.label}</span>
                <span style={{ color: '#aaa', fontSize: f.id === 'small' ? 13 : f.id === 'large' ? 17 : f.id === 'xl' ? 20 : 15 }}>Aa</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'howto' && (
        <Modal title="How to Use NovaCare" onClose={() => setModal(null)}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            {[
              { e: '💬', t: 'Chat with Nova',      b: 'Tap the Companion tab to start a conversation. Nova is here to listen, remind you of things, and keep you company every day.' },
              { e: '🎯', t: 'Complete Missions',    b: 'Visit the Missions tab daily. Complete tasks like chatting, taking medication, or going for a walk to earn gems.' },
              { e: '🐾', t: 'Care for Your Pet',    b: 'Feed, groom, and dress up your virtual pet. The more you interact, the higher your pet level grows!' },
              { e: '💊', t: 'Medication Reminders', b: 'Add your medication schedule and NovaCare will send you a reminder. Mark it done with one tap.' },
              { e: '🏆', t: 'Earn Ranks',           b: 'Collect gems to climb the leaderboard. Show your rank to family and friends!' },
              { e: '🔒', t: 'Your Privacy',         b: 'All your data is stored securely. Only linked caregivers can see your activity summaries.' },
            ].map(({ e, t, b }) => (
              <div key={t} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(32,160,144,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{e}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{t}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#888', lineHeight: 1.5 }}>{b}</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {modal === 'faq' && (
        <Modal title="Frequently Asked Questions" onClose={() => setModal(null)}>
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'white', border: 'none', cursor: 'pointer', fontFamily: 'Inter', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', lineHeight: 1.4, paddingRight: 12 }}>{item.q}</span>
                  <span style={{ color: '#20A090', fontSize: 20, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#888', lineHeight: 1.6, background: '#FAFAFA', borderTop: '1px solid #f0f0f0' }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}