export type Rarity = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';

export interface RarityStyle {
  label: string;
  color: string;
  glow: boolean;
}

export const RARITY: Record<Rarity, RarityStyle> = {
  mythic: { label: 'Mythic', color: '#f72585', glow: true },
  legendary: { label: 'Legendary', color: '#f5c518', glow: true },
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
}

export const CARDS: Card[] = [
  { id: 'c1', name: 'Astros Orbit', teamId: 'hou', rarity: 'mythic', serial: '#001/100', owned: true, power: 92, speed: 78, charisma: 99 },
  { id: 'c2', name: 'Yankees Pinstripe', teamId: 'nyy', rarity: 'legendary', serial: '#017/250', owned: true, power: 88, speed: 71, charisma: 90 },
  { id: 'c3', name: 'Sox Green Monster', teamId: 'bos', rarity: 'epic', serial: '#104/500', owned: true, power: 95, speed: 40, charisma: 85 },
  { id: 'c4', name: 'Blue Jay Ace', teamId: 'tor', rarity: 'rare', serial: '#233/1000', owned: true, power: 74, speed: 93, charisma: 80 },
  { id: 'c5', name: 'Oriole Bird', teamId: 'bal', rarity: 'uncommon', serial: '#612/2000', owned: true, power: 66, speed: 88, charisma: 77 },
  { id: 'c6', name: 'Texas Ranger', teamId: 'tex', rarity: 'common', serial: '#1402/5000', owned: true, power: 70, speed: 65, charisma: 60 },
  { id: 'c7', name: 'Paws Prowl', teamId: 'det', rarity: 'rare', serial: '???', owned: false, power: 0, speed: 0, charisma: 0 },
  { id: 'c8', name: 'Slider Spin', teamId: 'cle', rarity: 'epic', serial: '???', owned: false, power: 0, speed: 0, charisma: 0 },
];
