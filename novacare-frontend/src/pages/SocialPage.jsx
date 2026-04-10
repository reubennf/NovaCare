import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import LoadingScreen from '../components/LoadingScreen'

const TABS = ['Map', 'Friends', 'Events', 'Chat', 'Album']

export default function SocialPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Map')
  const [friends, setFriends] = useState([])
  const [friendLocations, setFriendLocations] = useState([])
  const [events, setEvents] = useState([])
  const [myEvents, setMyEvents] = useState([])
  const [bumps, setBumps] = useState([])
  const [profile, setProfile] = useState(null)
  const [myLocation, setMyLocation] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [bumping, setBumping] = useState(null)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '', description: '', category: 'social',
    starts_at: '', venue_name: '', address: ''
  })
  const [loading, setLoading] = useState(true)
  const watchRef = useRef(null)
  const [bumpPhotos, setBumpPhotos] = useState({})
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const [bumpSuccess, setBumpSuccess] = useState(null) // stores bump result

  const getSpeciesEmoji = (species) => {
    switch (species) {
        case 'dog': return '🐶'
        case 'cat': return '🐱'
        case 'sheep': return '🐑'
        case 'chicken': return '🐔'
        default: return '🐾'
    }
    }
  useEffect(() => {
    fetchData()
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }, [])

  const fetchData = async () => {
    try {
      const [friendsRes, eventsRes, myEventsRes, profileRes, bumpsRes] = await Promise.allSettled([
        api.get('/social/friends'),
        api.get('/social/events'),
        api.get('/social/my-events'),
        api.get('/profile/'),
        api.get('/social/bumps'),
      ])
      if (friendsRes.status === 'fulfilled') setFriends(friendsRes.value.data)
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data)
      if (myEventsRes.status === 'fulfilled') setMyEvents(myEventsRes.value.data)
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (bumpsRes.status === 'fulfilled') setBumps(bumpsRes.value.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startLocationSharing = () => {
    if (!navigator.geolocation) return
    setSharing(true)
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setMyLocation({ latitude, longitude })
        try {
          await api.post('/social/location', { latitude, longitude, visible: true })
          const locRes = await api.get('/social/friends/locations')
          setFriendLocations(locRes.data)
        } catch (e) {}
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
  }

  const stopLocationSharing = async () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    setSharing(false)
    setMyLocation(null)
    try { await api.post('/social/location/hide') } catch (e) {}
  }

  const handleBump = async (friendId) => {
    if (!myLocation) {
        alert('Please enable location sharing first to BUMP!')
        return
    }
    setBumping(friendId)
    try {
        const res = await api.post('/social/bump', {
        friend_id: friendId,
        latitude: myLocation.latitude,
        longitude: myLocation.longitude
        })
        setBumpSuccess({ message: res.data.message, distance: res.data.distance_metres })
        fetchData()
    } catch (err) {
        alert(err.response?.data?.detail || 'BUMP failed — make sure you are close to your friend!')
    } finally {
        setBumping(null)
    }
    }

  const handleCreateEvent = async () => {
    try {
      await api.post('/social/events/create', {
        ...eventForm,
        starts_at: new Date(eventForm.starts_at).toISOString()
      })
      setShowCreateEvent(false)
      setEventForm({ title: '', description: '', category: 'social', starts_at: '', venue_name: '', address: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }
  // Add this helper function
    const getRotation = (id) => {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    return hash % 2 === 0 ? 2 : -2
    }

  const handleRSVP = async (eventId) => {
    try {
      await api.post(`/social/events/${eventId}/rsvp`, { status: 'joined' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const inputStyle = {
    width: '100%', height: 44, borderRadius: 22,
    border: '1px solid #E0E0E0', padding: '0 16px',
    fontSize: 14, fontFamily: 'Inter', boxSizing: 'border-box',
    outline: 'none', marginBottom: 10
  }
  const fetchBumpAlbum = async () => {
    setLoadingPhotos(true)
    try {
        const res = await api.get('/social/bumps')
        setBumps(res.data || [])
        // Fetch photo data for each bump
        const photos = {}
        for (const bump of (res.data || []).slice(0, 10)) {
        try {
            const photoRes = await api.get(`/social/bumps/photo/${bump.id}`)
            photos[bump.id] = photoRes.data
        } catch {
            photos[bump.id] = null
        }
        }
        setBumpPhotos(photos)
    } catch (err) {
        console.error(err)
    } finally {
        setLoadingPhotos(false)
    }
    }

    useEffect(() => {
    if (activeTab === 'Album') fetchBumpAlbum()
    }, [activeTab])
  const btnStyle = (color = '#20A090') => ({
    background: color, border: 'none', borderRadius: 22,
    color: 'white', fontSize: 13, fontWeight: 600,
    fontFamily: 'Inter', cursor: 'pointer', padding: '8px 16px'
  })

  if (loading) return <LoadingScreen />

  return (
    <div style={{ width: 390, height: 844, margin: '0 auto', background: 'white', fontFamily: 'Inter', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '44px 24px 0', flexShrink: 0 }}>
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
          {activeTab === 'Events' && (
            <button onClick={() => setShowCreateEvent(!showCreateEvent)} style={{ ...btnStyle(), position: 'absolute', right: 0, fontSize: 12, padding: '6px 12px' }}>
              + Create
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: activeTab === tab ? '#20A090' : '#F5F5F5',
              color: activeTab === tab ? 'white' : '#555',
              border: 'none', borderRadius: 20, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, fontFamily: 'Inter',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>

        {/* MAP TAB */}
        {activeTab === 'Map' && (
          <div>
            {/* Location toggle */}
            <div style={{ background: sharing ? 'rgba(32,160,144,0.08)' : '#F9F9F9', borderRadius: 16, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: sharing ? '#20A090' : 'black' }}>
                  {sharing ? 'Sharing location' : 'Location sharing off'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                  {sharing ? 'Friends can see you on the map' : 'Turn on to see friends nearby'}
                </p>
              </div>
              <button onClick={sharing ? stopLocationSharing : startLocationSharing} style={btnStyle(sharing ? '#E53E3E' : '#20A090')}>
                {sharing ? 'Stop' : 'Share'}
              </button>
            </div>

            {/* Map placeholder with friend dots */}
            <div style={{ background: '#EAF6F4', borderRadius: 20, height: 280, position: 'relative', overflow: 'hidden', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#20A090' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🗺️</div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Live map</p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                  {sharing ? `${friendLocations.length} friends visible` : 'Enable sharing to see friends'}
                </p>
              </div>

              {/* Friend location dots */}
              {friendLocations.map((loc, i) => {
                const x = 60 + (i * 80) % 260
                const y = 60 + (i * 60) % 160
                return (
                  <div key={loc.user_id} style={{ position: 'absolute', left: x, top: y }}>
                    {/* Bump circle - larger = more bumps */}
                    <div style={{
                      width: 60 + (bumps.filter(b => b.user_id_1 === loc.user_id || b.user_id_2 === loc.user_id).length * 10),
                      height: 60 + (bumps.filter(b => b.user_id_1 === loc.user_id || b.user_id_2 === loc.user_id).length * 10),
                      borderRadius: '50%',
                      background: 'rgba(32,160,144,0.15)',
                      border: '2px solid rgba(32,160,144,0.3)',
                      position: 'absolute',
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)'
                    }} />
                    {/* Friend dot */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 18,
                      background: '#20A090', border: '2px solid white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {loc.name?.[0] || '?'}
                    </div>
                    <div style={{ fontSize: 10, color: '#20A090', textAlign: 'center', marginTop: 2, fontWeight: 600 }}>
                      {loc.name}
                    </div>
                  </div>
                )
              })}

              {/* My dot */}
              {myLocation && (
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 22, background: '#FF6B6B', border: '3px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                    Me
                  </div>
                </div>
              )}
            </div>

            {/* Bump history */}
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: 'black' }}>
                Recent BUMPs 👊
              </p>
              {bumps.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa' }}>No bumps yet — meet a friend in person!</p>
              ) : (
                bumps.slice(0, 3).map(bump => (
                  <div key={bump.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F5F5F5' }}>
                    <span style={{ fontSize: 13, color: '#555' }}>
                      BUMP at {new Date(bump.bumped_at).toLocaleDateString('en-SG')}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#20A090' }}>+{bump.points_awarded} pts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* FRIENDS TAB */}
        {activeTab === 'Friends' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'black' }}>
              {friends.length} friends
            </p>
            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 14 }}>
                No friends yet!<br/>Find people at events to add
              </div>
            ) : (
              friends.map((friendship, i) => {
                const friendId = friendship.user_id_1 === profile?.id
                  ? friendship.user_id_2
                  : friendship.user_id_1
                const bumpCount = bumps.filter(b =>
                  (b.user_id_1 === friendId || b.user_id_2 === friendId)
                ).length
                const isNearby = friendLocations.some(l => l.user_id === friendId)

                return (
                  <div key={friendship.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F5F5F5' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 22, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, position: 'relative' }}>
                      👤
                      {isNearby && (
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, background: '#20A090', border: '2px solid white' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'black' }}>Friend {i + 1}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                        {bumpCount} bump{bumpCount !== 1 ? 's' : ''} · {isNearby ? '📍 Nearby now' : 'Location hidden'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleBump(friendId)}
                        disabled={bumping === friendId || !myLocation}
                        style={{
                          ...btnStyle(isNearby ? '#20A090' : '#aaa'),
                          fontSize: 12, padding: '6px 10px',
                          opacity: !myLocation ? 0.5 : 1
                        }}
                      >
                        {bumping === friendId ? '...' : '👊 BUMP'}
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${friendId}`)}
                        style={{ ...btnStyle('#6B7280'), fontSize: 12, padding: '6px 10px' }}
                      >
                        💬
                      </button>
                    </div>
                  </div>
                )
              })
            )}

            {!sharing && (
              <div style={{ marginTop: 16, padding: 16, background: '#FFF9E6', borderRadius: 12, fontSize: 13, color: '#888' }}>
                Tip: Enable location sharing on the Map tab so friends can BUMP you when you meet!
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'Events' && (
          <div>
            {/* Create event form */}
            {showCreateEvent && (
              <div style={{ background: '#F9F9F9', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14 }}>Create an event</p>
                <input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="Event title" style={inputStyle} />
                <input value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} placeholder="Description (optional)" style={inputStyle} />
                <input value={eventForm.venue_name} onChange={e => setEventForm({...eventForm, venue_name: e.target.value})} placeholder="Venue name" style={inputStyle} />
                <input value={eventForm.address} onChange={e => setEventForm({...eventForm, address: e.target.value})} placeholder="Address" style={inputStyle} />
                <input type="datetime-local" value={eventForm.starts_at} onChange={e => setEventForm({...eventForm, starts_at: e.target.value})} style={inputStyle} />
                <select value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} style={inputStyle}>
                  <option value="social">Social</option>
                  <option value="walking">Walking</option>
                  <option value="yoga">Yoga</option>
                  <option value="health_talk">Health talk</option>
                  <option value="knitting">Knitting</option>
                </select>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={handleCreateEvent} disabled={!eventForm.title || !eventForm.starts_at} style={{ ...btnStyle(), flex: 1, height: 40 }}>
                    Create event
                  </button>
                  <button onClick={() => setShowCreateEvent(false)} style={{ ...btnStyle('#888'), flex: 1, height: 40 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Events list */}
            {events.map(event => {
              const joined = myEvents.some(r => r.event_id === event.id && r.status === 'joined')
              return (
                <div key={event.id} style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'black' }}>{event.title}</p>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#888' }}>{event.venue_name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: '#20A090', fontWeight: 600 }}>
                        {new Date(event.starts_at).toLocaleDateString('en-SG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button
                      onClick={() => !joined && handleRSVP(event.id)}
                      style={{
                        ...btnStyle(joined ? '#888' : '#20A090'),
                        fontSize: 12, padding: '6px 12px', flexShrink: 0
                      }}
                    >
                      {joined ? 'Joined ✓' : 'Join'}
                    </button>
                  </div>
                  {event.description && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>{event.description}</p>
                  )}
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: '#aaa' }}>By {event.organizer_name}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === 'Chat' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', color: 'black' }}>
              Friend chats
            </p>
            {friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 14 }}>
                Add friends first to start chatting!
              </div>
            ) : (
              friends.map((friendship, i) => {
                const friendId = friendship.user_id_1 === profile?.id
                  ? friendship.user_id_2
                  : friendship.user_id_1
                return (
                  <div
                    key={friendship.id}
                    onClick={() => navigate(`/chat/${friendId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 24, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      👤
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'black' }}>Friend {i + 1}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>Tap to chat</p>
                    </div>
                    <span style={{ fontSize: 20, color: '#888' }}>›</span>
                  </div>
                )
              })
            )}
          </div>
        )}
        {activeTab === 'Album' && (
        <div style={{ padding: '0 16px 24px' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '16px 0 4px' }}>
            📸 Bump Album
            </h2>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
            Memories from when your pets met!
            </p>

            {loadingPhotos ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                <p style={{ fontSize: 13 }}>Developing your photos...</p>
            </div>
            ) : bumps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p style={{ fontSize: 14, margin: '0 0 4px', fontWeight: 600, color: '#555' }}>No photos yet!</p>
                <p style={{ fontSize: 13 }}>BUMP with a friend to create your first memory</p>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bumps.map(bump => {
                const photo = bumpPhotos[bump.id]
                return (
                    <div key={bump.id} style={{
                    background: 'white',
                    borderRadius: 20,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(0,0,0,0.06)'
                    }}>
                    {/* Photo illustration */}
                    <div style={{
                        background: 'linear-gradient(135deg, #E8F8F5 0%, #D1F2EB 100%)',
                        padding: '24px 16px',
                        textAlign: 'center',
                        position: 'relative',
                        minHeight: 160,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Polaroid style frame */}
                        <div style={{
                        background: 'white',
                        padding: '12px 12px 8px',
                        borderRadius: 4,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        transform: `rotate(${getRotation(bump.id)}deg)`,
                        display: 'inline-block'
                        }}>
                        {/* Pet emojis based on species */}
                        <div style={{ fontSize: 48, marginBottom: 4, display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <span>{getSpeciesEmoji(photo?.pet1?.species)}</span>
                            <span style={{ fontSize: 24, alignSelf: 'center' }}>🤝</span>
                            <span>{getSpeciesEmoji(photo?.pet2?.species)}</span>
                        </div>
                        <div style={{
                            fontSize: 10,
                            color: '#555',
                            textAlign: 'center',
                            maxWidth: 140,
                            fontStyle: 'italic'
                        }}>
                            {photo?.scene || 'Playing together'}
                        </div>
                        </div>

                        {/* Camera flash decoration */}
                        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 20 }}>📸</div>
                    </div>

                    {/* Caption & info */}
                    <div style={{ padding: '12px 16px' }}>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14, color: 'black' }}>
                        {photo?.caption || 'Best friends! 🐾'}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: '#888' }}>
                        {photo?.pet1?.name} & {photo?.pet2?.name} · {
                            bump.bumped_at
                            ? new Date(bump.bumped_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Recently'
                        }
                        </p>
                    </div>
                    </div>
                )
                })}
            </div>
            )}
        </div>
        )}
      </div>
      {/* BUMP success popup */}
            {bumpSuccess && (
                <div style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 24px'
                }}>
                <div style={{
                    background: 'white', borderRadius: 24,
                    padding: '32px 24px', textAlign: 'center',
                    width: '100%', maxWidth: 340,
                }}>
                    <div style={{ fontSize: 64, marginBottom: 8 }}>👊</div>
                    <h3 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px', color: 'black' }}>BUMP!</h3>
                    <p style={{ fontSize: 14, color: '#888', margin: '0 0 4px' }}>
                    You and your friend met!
                    </p>
                    <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px' }}>
                    {bumpSuccess.distance}m apart
                    </p>
                    <p style={{ fontSize: 15, color: '#20A090', fontWeight: 700, margin: '0 0 8px' }}>
                    +20 points each 🌟
                    </p>
                    <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 24px' }}>
                    📸 A photo was added to your Album!
                    </p>
                    <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => {
                        setBumpSuccess(null)
                        setActiveTab('Album')
                        }}
                        style={{
                        flex: 1, height: 48, background: '#20A090',
                        border: 'none', borderRadius: 24, color: 'white',
                        fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer'
                        }}
                    >
                        See Album 📸
                    </button>
                    <button
                        onClick={() => setBumpSuccess(null)}
                        style={{
                        flex: 1, height: 48, background: '#F5F5F5',
                        border: 'none', borderRadius: 24, color: '#888',
                        fontSize: 14, fontWeight: 600, fontFamily: 'Inter', cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                    </div>
                </div>
            </div>
      )}
    </div>
  )
}