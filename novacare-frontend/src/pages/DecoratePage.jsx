import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

const ROOM_ITEMS = [
  { id: 'waterfall', emoji: '🌊', name: 'Waterfall', cost: 30, category: 'nature' },
  { id: 'bonsai', emoji: '🌳', name: 'Bonsai tree', cost: 40, category: 'nature' },
  { id: 'doghouse', emoji: '🏠', name: 'Dog house', cost: 50, category: 'furniture' },
  { id: 'flowers', emoji: '🌸', name: 'Flowers', cost: 20, category: 'nature' },
  { id: 'bone', emoji: '🦴', name: 'Bone', cost: 15, category: 'toys' },
  { id: 'ball', emoji: '⚽', name: 'Ball', cost: 15, category: 'toys' },
  { id: 'cushion', emoji: '🛋️', name: 'Cushion', cost: 25, category: 'furniture' },
  { id: 'lamp', emoji: '🪔', name: 'Lamp', cost: 35, category: 'furniture' },
  { id: 'plant', emoji: '🪴', name: 'Potted plant', cost: 20, category: 'nature' },
  { id: 'hedgehog', emoji: '🦔', name: 'Hedgehog pal', cost: 60, category: 'friends' },
  { id: 'butterfly', emoji: '🦋', name: 'Butterfly', cost: 25, category: 'nature' },
  { id: 'rainbow', emoji: '🌈', name: 'Rainbow', cost: 45, category: 'nature' },
]

const BG_THEMES = [
  { id: 'garden', label: 'Garden', bg: 'linear-gradient(180deg, #87CEEB 0%, #90EE90 60%)', emoji: '🌿' },
  { id: 'beach', label: 'Beach', bg: 'linear-gradient(180deg, #87CEEB 0%, #F4E4C1 60%)', emoji: '🏖️' },
  { id: 'night', label: 'Night', bg: 'linear-gradient(180deg, #1a1a3e 0%, #2d5a27 60%)', emoji: '🌙' },
  { id: 'snow', label: 'Snow', bg: 'linear-gradient(180deg, #E8F4FD 0%, #FFFFFF 60%)', emoji: '❄️' },
]

export default function DecoratePage() {
  const navigate = useNavigate()
  const [companion, setCompanion] = useState(null)
  const [points, setPoints] = useState(0)
  const [owned, setOwned] = useState([])
  const [activeTab, setActiveTab] = useState('inventory')
  const [selectedTheme, setSelectedTheme] = useState('garden')
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      default: return '/sushi.png'
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [companionRes, pointsRes, roomRes] = await Promise.allSettled([
        api.get('/companion/'),
        api.get('/missions/points'),
        api.get('/companion/room'),
      ])
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value.data.total_points)
      if (roomRes.status === 'fulfilled') {
        setOwned(roomRes.value.data.map(i => i.item_id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (item) => {
    if (points < item.cost || buying) return
    setBuying(item.id)
    try {
      await api.post('/companion/room/buy', { item_id: item.id, cost: item.cost })
      setOwned(prev => [...prev, item.id])
      setPoints(prev => prev - item.cost)
    } catch (err) {
      console.error(err)
    } finally {
      setBuying(null)
    }
  }

  const theme = BG_THEMES.find(t => t.id === selectedTheme) || BG_THEMES[0]
  const ownedItems = ROOM_ITEMS.filter(i => owned.includes(i.id))
  const companionName = companion?.name || 'Sushi'

  if (loading) return (
    <div style={{ width: 390, height: 844, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter' }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{ width: 390, height: 844, margin: '0 auto', background: 'white', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes item-pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      {/* Header */}
      <div style={{ padding: '44px 24px 12px', textAlign: 'center', position: 'relative', flexShrink: 0 }}>
        <div onClick={() => navigate('/dashboard')} style={{ position: 'absolute', left: 24, top: 44, cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="#191D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Points */}
        <div style={{ position: 'absolute', right: 24, top: 48, background: 'rgba(32,160,144,0.1)', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#20A090' }}>{points} pts</span>
        </div>

        <div style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Pet</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 400, margin: '0 0 2px', color: 'black' }}>
          Decorate <strong>{companionName}'s</strong> space
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Let's make it feel like home
        </p>
      </div>

      {/* Room preview */}
      <div style={{
        margin: '0 16px',
        height: 240,
        borderRadius: 24,
        background: theme.bg,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        {/* Ground */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'rgba(255,255,255,0.15)', borderRadius: '50% 50% 0 0 / 20px 20px 0 0' }} />

        {/* Theme selector dots */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
          {BG_THEMES.map(t => (
            <div key={t.id} onClick={() => setSelectedTheme(t.id)} style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, border: selectedTheme === t.id ? '2px solid white' : '2px solid transparent', boxShadow: selectedTheme === t.id ? '0 0 0 2px #20A090' : 'none' }}>
              {t.emoji}
            </div>
          ))}
        </div>

        {/* Placed items - left side */}
        <div style={{ position: 'absolute', left: 12, bottom: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          {ownedItems.slice(0, 2).map(item => (
            <div key={item.id} style={{ fontSize: 36, animation: 'item-pop 0.3s ease' }}>{item.emoji}</div>
          ))}
        </div>

        {/* Placed items - right side */}
        <div style={{ position: 'absolute', right: 12, bottom: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {ownedItems.slice(2, 4).map(item => (
            <div key={item.id} style={{ fontSize: 32, animation: 'item-pop 0.3s ease' }}>{item.emoji}</div>
          ))}
        </div>

        {/* Pet - centered */}
        <div style={{ position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%)', animation: 'float 3s ease-in-out infinite', zIndex: 2 }}>
          <img src={getPetImage(companion?.species)} alt="pet" style={{ width: 140, height: 140, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none' }} />
        </div>

        {/* Extra placed items scattered */}
        {ownedItems.slice(4, 8).map((item, i) => (
          <div key={item.id} style={{ position: 'absolute', fontSize: 28, bottom: 55 + (i % 2) * 30, left: 30 + (i * 70) % 280, animation: 'item-pop 0.3s ease', zIndex: i % 2 === 0 ? 1 : 3 }}>
            {item.emoji}
          </div>
        ))}

        {/* Empty state hint */}
        {ownedItems.length === 0 && (
          <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0 }}>Buy items to decorate!</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '12px 16px 0', background: '#F5F5F5', borderRadius: 12, padding: 4, flexShrink: 0 }}>
        {['inventory', 'shop'].map(tab => (
          <div key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 10, background: activeTab === tab ? 'white' : 'transparent', fontSize: 13, fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? 'black' : '#888', cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', textTransform: 'capitalize' }}>
            {tab === 'inventory' ? 'Inventory' : 'Rewards Shop'}
          </div>
        ))}
      </div>

      {/* Item grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(activeTab === 'inventory' ? ownedItems : ROOM_ITEMS).map(item => {
            const isOwned = owned.includes(item.id)
            const canAfford = points >= item.cost
            const isBuying = buying === item.id

            return (
              <div
                key={item.id}
                onClick={() => activeTab === 'shop' && !isOwned && handleBuy(item)}
                style={{
                  background: isOwned ? 'rgba(32,160,144,0.08)' : 'white',
                  borderRadius: 16,
                  padding: '16px 8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: activeTab === 'shop' && !isOwned && canAfford ? 'pointer' : 'default',
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
                  border: isOwned ? '1.5px solid rgba(32,160,144,0.3)' : '1.5px solid transparent',
                  opacity: activeTab === 'shop' && !isOwned && !canAfford ? 0.4 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 36 }}>{item.emoji}</span>
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', textAlign: 'center', fontWeight: 500 }}>{item.name}</span>

                {isOwned ? (
                  <div style={{ fontSize: 10, color: '#20A090', fontWeight: 700 }}>Owned ✓</div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: canAfford ? 'rgba(32,160,144,0.1)' : '#F5F5F5', borderRadius: 10, padding: '3px 8px' }}>
                    <span style={{ fontSize: 10 }}>⭐</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: canAfford ? '#20A090' : '#aaa' }}>
                      {isBuying ? '...' : item.cost}
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {activeTab === 'inventory' && ownedItems.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 13 }}>
              No items yet!<br/>
              <span style={{ color: '#20A090', fontWeight: 600, cursor: 'pointer' }} onClick={() => setActiveTab('shop')}>
                Browse the shop →
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}