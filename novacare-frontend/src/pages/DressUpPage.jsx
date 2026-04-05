import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEquipment } from '../context/EquipmentContext'
import { ACCESSORIES } from '../lib/accessories'
import PetWithAccessories from '../components/PetWithAccessories'
import api from '../lib/api'

const WARDROBE_EMOJI = '🗄️'

export default function DressUpPage() {
  const navigate = useNavigate()
  const { equipment, updateEquipment } = useEquipment()
  const [companion, setCompanion] = useState(null)
  const [points, setPoints] = useState(0)
  const [owned, setOwned] = useState([])
  const [activeTab, setActiveTab] = useState('inventory')
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [equipping, setEquipping] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [companionRes, pointsRes, inventoryRes] = await Promise.allSettled([
        api.get('/companion/'),
        api.get('/missions/points'),
        api.get('/missions/inventory'),
      ])
      if (companionRes.status === 'fulfilled') setCompanion(companionRes.value.data)
      if (pointsRes.status === 'fulfilled') setPoints(pointsRes.value.data.total_points)
      if (inventoryRes.status === 'fulfilled') {
        // Get owned accessory IDs from inventory
        const items = inventoryRes.value.data || []
        const ownedIds = items
          .filter(i => i.item_catalog?.item_type === 'dress')
          .map(i => i.item_catalog?.name?.toLowerCase().replace(' ', ''))
        setOwned(ownedIds)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEquip = async (accessory) => {
    setEquipping(accessory.id)
    const slot = accessory.slot
    const currentlyEquipped = equipment[`${slot}_item_id`]
    
    // Toggle off if already equipped
    const newId = currentlyEquipped === accessory.id ? null : accessory.id
    await updateEquipment(slot, newId)
    setEquipping(null)
  }

  const handleBuy = async (accessory) => {
    if (points < accessory.cost || buying) return
    setBuying(accessory.id)
    try {
      await api.post('/missions/award-bonus', { points: -accessory.cost })
      setOwned(prev => [...prev, accessory.id])
      const pointsRes = await api.get('/missions/points')
      setPoints(pointsRes.data.total_points)
    } catch (err) {
      console.error(err)
    } finally {
      setBuying(null)
    }
  }

  const isEquipped = (accessory) => {
    return equipment[`${accessory.slot}_item_id`] === accessory.id
  }

  const isOwned = (accessory) => owned.includes(accessory.id)

  const rarityColor = {
    common: '#888',
    rare: '#4A90E2',
    epic: '#9B59B6'
  }

  if (loading) return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter'
    }}>
      <p style={{ color: '#aaa' }}>Loading...</p>
    </div>
  )

  return (
    <div style={{
      width: 390,
      height: 844,
      margin: '0 auto',
      background: 'white',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      <style>{`
        @keyframes pet-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes equip-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '44px 24px 0',
        textAlign: 'center',
        position: 'relative',
        flexShrink: 0
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

        {/* Points */}
        <div style={{
          position: 'absolute',
          right: 24,
          top: 48,
          background: 'rgba(32,160,144,0.1)',
          borderRadius: 20,
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#20A090' }}>{points} pts</span>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'black' }}>Nova</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#20A090' }}>Care</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 400, margin: '0 0 4px', color: 'black' }}>
          Dress up <strong>{companion?.name || 'Sushi'}</strong>
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
          Let's dress with confidence
        </p>
      </div>

      <div style={{
        position: 'relative',
        height: 260,
        marginTop: 10
        }}>
        {/* Wardrobe */}
        <img
            src="/wardrobe.png"
            style={{
            position: 'absolute',
            right: 0,
            top: 20,
            width: 220,
            zIndex: 1
            }}
        />

        {/* Pet */}
        <div style={{
            position: 'absolute',
            left: -100,
            bottom: -150,
            zIndex: 2
        }}>
            <PetWithAccessories size={500} />
        </div>
        </div>

      {/* Currently equipped badges */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 24px',
        flexShrink: 0
      }}>
        {['hat', 'accessory', 'outfit'].map(slot => {
          const itemId = equipment[`${slot}_item_id`]
          const item = itemId ? ACCESSORIES.find(a => a.id === itemId) : null
          return item ? (
            <div
              key={slot}
              onClick={() => updateEquipment(slot, null)}
              style={{
                background: 'rgba(32,160,144,0.1)',
                borderRadius: 20,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              <span>{item.emoji}</span>
              <span style={{ color: '#20A090', fontWeight: 600 }}>{item.name}</span>
              <span style={{ color: '#aaa' }}>✕</span>
            </div>
          ) : null
        })}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #F0F0F0',
        flexShrink: 0,
        background: '#FAFAFA'
      }}>
        {['inventory', 'shop'].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px 0',
              zIndex: 3,
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 14,
              color: activeTab === tab ? '#20A090' : 'rgba(0,0,0,0.35)',
              borderBottom: activeTab === tab ? '2px solid #20A090' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'inventory' ? 'Inventory' : 'Rewards Shop'}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        <div style={{
          display: 'grid',
          zIndex: 3,
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 10
        }}>
          {(activeTab === 'inventory'
            ? ACCESSORIES.filter(a => isOwned(a))
            : ACCESSORIES
          ).map(accessory => {
            const equipped = isEquipped(accessory)
            const owned = isOwned(accessory)
            const canAfford = points >= accessory.cost
            const isEquipping = equipping === accessory.id
            const isBuying = buying === accessory.id

            return (
              <div
                key={accessory.id}
                onClick={() => {
                  if (activeTab === 'inventory' && owned) {
                    handleEquip(accessory)
                  } else if (activeTab === 'shop' && !owned) {
                    handleBuy(accessory)
                  } else if (activeTab === 'shop' && owned) {
                    handleEquip(accessory)
                  }
                }}
                style={{
                  background: equipped
                    ? 'rgba(32,160,144,0.12)'
                    : 'white',
                  borderRadius: 16,
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  boxShadow: '0px 2px 8px rgba(0,0,0,0.07)',
                  border: equipped
                    ? '1.5px solid #20A090'
                    : '1.5px solid transparent',
                  opacity: (activeTab === 'shop' && !owned && !canAfford) ? 0.4 : 1,
                  animation: isEquipping ? 'equip-pop 0.3s ease' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 32 }}>{accessory.emoji}</span>
                <span style={{
                  fontSize: 9,
                  color: 'rgba(0,0,0,0.5)',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  {accessory.name}
                </span>

                {/* Status badge */}
                {equipped ? (
                  <div style={{
                    background: '#20A090',
                    borderRadius: 8,
                    padding: '2px 6px',
                    fontSize: 9,
                    color: 'white',
                    fontWeight: 700
                  }}>
                    ON
                  </div>
                ) : activeTab === 'shop' && !owned ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    background: canAfford ? 'rgba(32,160,144,0.1)' : '#F5F5F5',
                    borderRadius: 8,
                    padding: '2px 6px'
                  }}>
                    <span style={{ fontSize: 9 }}>⭐</span>
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: canAfford ? '#20A090' : '#aaa'
                    }}>
                      {isBuying ? '...' : accessory.cost}
                    </span>
                  </div>
                ) : owned && !equipped ? (
                  <div style={{
                    fontSize: 9,
                    color: '#20A090',
                    fontWeight: 600
                  }}>
                    Tap to wear
                  </div>
                ) : null}

                {/* Rarity dot */}
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: rarityColor[accessory.rarity] || '#888'
                }} />
              </div>
            )
          })}

          {/* Empty inventory */}
          {activeTab === 'inventory' && ACCESSORIES.filter(a => isOwned(a)).length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 0',
              color: '#aaa',
              fontSize: 13
            }}>
              No items yet!<br/>
              <span style={{ color: '#20A090', fontWeight: 600 }}>
                Buy from the shop tab
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}