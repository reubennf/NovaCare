export const ACCESSORIES = [
  { id: 'sunglasses', emoji: '🕶️', name: 'Sunglasses', slot: 'accessory', cost: 30, rarity: 'common' },
  { id: 'bowtie', emoji: '🎀', name: 'Bow Tie', slot: 'accessory', cost: 25, rarity: 'common' },
  { id: 'beret', emoji: '🎩', name: 'Beret', slot: 'hat', cost: 40, rarity: 'rare' },
  { id: 'beanie', emoji: '🧢', name: 'Beanie', slot: 'hat', cost: 35, rarity: 'common' },
  { id: 'flower', emoji: '🌸', name: 'Flower', slot: 'accessory', cost: 20, rarity: 'common' },
  { id: 'fedora', emoji: '🎩', name: 'Fedora', slot: 'hat', cost: 50, rarity: 'rare' },
  { id: 'socks', emoji: '🧦', name: 'Socks', slot: 'outfit', cost: 20, rarity: 'common' },
  { id: 'scarf', emoji: '🧣', name: 'Scarf', slot: 'accessory', cost: 30, rarity: 'common' },
  { id: 'crown', emoji: '👑', name: 'Crown', slot: 'hat', cost: 100, rarity: 'epic' },
  { id: 'ribbon', emoji: '🎗️', name: 'Ribbon', slot: 'accessory', cost: 25, rarity: 'common' },
  { id: 'cape', emoji: '🦸', name: 'Cape', slot: 'outfit', cost: 60, rarity: 'rare' },
  { id: 'glasses', emoji: '👓', name: 'Glasses', slot: 'accessory', cost: 25, rarity: 'common' },
]

export const getAccessoryById = (id) => ACCESSORIES.find(a => a.id === id)