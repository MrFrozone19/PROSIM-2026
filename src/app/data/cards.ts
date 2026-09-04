export type Rarity = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

export interface RarityStyle {
  label: string;
  /** Color de borde/glow tomado del diseño (tcg-vault). */
  color: string;
  glow: boolean;
}

export const RARITY: Record<Rarity, RarityStyle> = {
  mythic: { label: 'Mythic', color: '#fe2c55', glow: true },
  legendary: { label: 'Legendary', color: '#ddad4e', glow: true },
  epic: { label: 'Epic', color: '#9d4edd', glow: true },
  rare: { label: 'Rare', color: '#4cc9f0', glow: false },
  uncommon: { label: 'Uncommon', color: '#80ed99', glow: false },
  common: { label: 'Common', color: '#9090a8', glow: false },
};

export interface Card {
  id: string;
  name: string;
  teamId: string;
  rarity: Rarity;
  serial: string;
  owned: boolean;
  power: number;
  speed: number;
  charisma: number;
  /** Arte de la carta (assets del diseño), solo para cartas desbloqueadas. */
  art?: string;
}

/** Orden igual al diseño: fila 1 raras con glow, fila 2 comunes. */
export const CARDS: Card[] = [
  { id: 'c1', name: 'Astros Orbit', teamId: 'hou', rarity: 'mythic', serial: '#001/100', owned: true, power: 92, speed: 78, charisma: 99, art: 'assets/figma/card-hou.webp' },
  { id: 'c2', name: 'Yankees Pinstripe', teamId: 'nyy', rarity: 'legendary', serial: '#017/250', owned: true, power: 88, speed: 71, charisma: 90, art: 'assets/figma/card-nyy.webp' },
  { id: 'c3', name: 'Sox Green Monster', teamId: 'bos', rarity: 'epic', serial: '#104/500', owned: true, power: 95, speed: 40, charisma: 85, art: 'assets/figma/card-bos.webp' },
  { id: 'c4', name: 'Blue Jay Ace', teamId: 'tor', rarity: 'rare', serial: '#233/1000', owned: true, power: 74, speed: 93, charisma: 80, art: 'assets/figma/card-tor.webp' },
  { id: 'c5', name: 'Oriole Bird', teamId: 'bal', rarity: 'uncommon', serial: '#612/2000', owned: true, power: 66, speed: 88, charisma: 77, art: 'assets/figma/card-bal.webp' },
  { id: 'c6', name: 'Texas Ranger', teamId: 'tex', rarity: 'common', serial: '#1402/5000', owned: true, power: 70, speed: 65, charisma: 60, art: 'assets/figma/card-tex.webp' },
  { id: 'c7', name: 'Paws Prowl', teamId: 'det', rarity: 'rare', serial: '???', owned: false, power: 0, speed: 0, charisma: 0 },
  { id: 'c8', name: 'Slider Spin', teamId: 'cle', rarity: 'epic', serial: '???', owned: false, power: 0, speed: 0, charisma: 0 },
];

export interface VaultProgress {
  unlockedClips: number;
  totalClips: number;
  tier: number;
  tierProgress: number;
}

export const VAULT_PROGRESS: VaultProgress = { unlockedClips: 24, totalClips: 60, tier: 4, tierProgress: 40 };
