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

  const renderAccessory = (item) => {
    if (!item?.position) return null

    return (
      <div style={{
        position: 'absolute',
        top: `${item.position.top * 100}%`,
        left: `${item.position.left * 100}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: size * item.position.scale,
        zIndex: 3,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
      }}>
        {item.emoji}
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'inline-block',
      ...style
    }}>
      {/* Pet */}
      <img
        src={getPetImage(species)}
        alt="pet"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 2
        }}
      />

      {/* Accessories */}
      {hat && renderAccessory(hat)}
      {accessory && renderAccessory(accessory)}
    </div>
  )
}