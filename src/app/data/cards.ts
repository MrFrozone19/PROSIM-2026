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

// Las cartas, trofeos e insignias (y el progreso de cada usuario) viven en la API: ver api/src/catalog.ts.
