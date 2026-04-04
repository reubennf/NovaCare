import { useEquipment } from '../context/EquipmentContext'
import { getAccessoryById } from '../lib/accessories'

export default function PetWithAccessories({ species, size = 200, style = {} }) {
  const { equipment } = useEquipment()

  const getPetImage = (species) => {
    switch (species) {
      case 'dog': return '/sushi.png'
      case 'cat': return '/CatWelcome.png'
      default: return '/sushi.png'
    }
  }

  const hat = equipment?.hat_item_id ? getAccessoryById(equipment.hat_item_id) : null
  const accessory = equipment?.accessory_item_id ? getAccessoryById(equipment.accessory_item_id) : null

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-block',
      ...style
    }}>
      {/* Hat - above pet */}
      {hat && (
        <div style={{
          position: 'absolute',
          top: -size * 0.12,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: size * 0.25,
          zIndex: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          {hat.emoji}
        </div>
      )}

      {/* Pet image */}
      <img
        src={getPetImage(species)}
        alt="pet"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          left: -100,
          zIndex: 2
        }}
        onError={e => { e.target.style.display = 'none' }}
      />

      {/* Accessory - bottom left */}
      {accessory && (
        <div style={{
          position: 'absolute',
          bottom: size * 0.05,
          right: size * 0.05,
          fontSize: size * 0.2,
          zIndex: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          {accessory.emoji}
        </div>
      )}
    </div>
  )
}