export const ACCESSORIES = [
  {
    id: 'sunglasses',
    emoji: '🕶️',
    name: 'Sunglasses',
    slot: 'accessory',
    cost: 30,
    rarity: 'common',
    position: { top: 0.42, left: 0.5, scale: 0.22 }
  },
  {
    id: 'bowtie',
    emoji: '🎀',
    name: 'Bow Tie',
    slot: 'accessory',
    cost: 25,
    rarity: 'common',
    position: { top: 0.52, left: 0.5, scale: 0.1 }
  },
  {
    id: 'beret',
    emoji: '🎩',
    name: 'Beret',
    slot: 'hat',
    cost: 40,
    rarity: 'rare',
    position: { top: 0.08, left: 0.5, scale: 0.28 }
  },
  {
    id: 'beanie',
    emoji: '🧢',
    name: 'Beanie',
    slot: 'hat',
    cost: 35,
    rarity: 'common',
    position: { top: 0.1, left: 0.5, scale: 0.28 }
  },
  {
    id: 'flower',
    emoji: '🌸',
    name: 'Flower',
    slot: 'accessory',
    cost: 20,
    rarity: 'common',
    position: { top: 0.3, left: 0.7, scale: 0.18 }
  },
  {
    id: 'fedora',
    emoji: '🎩',
    name: 'Fedora',
    slot: 'hat',
    cost: 50,
    rarity: 'rare',
    position: { top: 0.06, left: 0.5, scale: 0.3 }
  },
  {
    id: 'socks',
    emoji: '🧦',
    name: 'Socks',
    slot: 'outfit',
    cost: 20,
    rarity: 'common',
    position: { top: 0.85, left: 0.5, scale: 0.18 }
  },
  {
    id: 'scarf',
    emoji: '🧣',
    name: 'Scarf',
    slot: 'accessory',
    cost: 30,
    rarity: 'common',
    position: { top: 0.6, left: 0.5, scale: 0.25 }
  },
  {
    id: 'crown',
    emoji: '👑',
    name: 'Crown',
    slot: 'hat',
    cost: 100,
    rarity: 'epic',
    position: { top: 0.02, left: 0.5, scale: 0.32 }
  },
  {
    id: 'ribbon',
    emoji: '🎗️',
    name: 'Ribbon',
    slot: 'accessory',
    cost: 25,
    rarity: 'common',
    position: { top: 0.35, left: 0.6, scale: 0.18 }
  },
  {
    id: 'cape',
    emoji: '🦸',
    name: 'Cape',
    slot: 'outfit',
    cost: 60,
    rarity: 'rare',
    position: { top: 0.55, left: 0.5, scale: 0.3 }
  },
  {
    id: 'glasses',
    emoji: '👓',
    name: 'Glasses',
    slot: 'accessory',
    cost: 25,
    rarity: 'common',
    position: { top: 0.42, left: 0.5, scale: 0.2 }
  }
]

export const getAccessoryById = (id) => ACCESSORIES.find(a => a.id === id)