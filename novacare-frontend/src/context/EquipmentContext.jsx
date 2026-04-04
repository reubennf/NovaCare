import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'
import { useAuth } from './AuthContext'

const EquipmentContext = createContext({})

export function EquipmentProvider({ children }) {
  const { user } = useAuth()
  const [equipment, setEquipment] = useState({
    hat_item_id: null,
    accessory_item_id: null,
    outfit_item_id: null
  })

  useEffect(() => {
    if (user) fetchEquipment()
  }, [user])

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/companion/equipment')
      setEquipment(res.data)
    } catch (e) {}
  }

  const updateEquipment = async (slot, itemId) => {
    const newEquipment = { ...equipment, [`${slot}_item_id`]: itemId }
    setEquipment(newEquipment)
    try {
      await api.post('/companion/equipment', newEquipment)
    } catch (e) {}
  }

  return (
    <EquipmentContext.Provider value={{ equipment, updateEquipment, fetchEquipment }}>
      {children}
    </EquipmentContext.Provider>
  )
}

export const useEquipment = () => useContext(EquipmentContext)