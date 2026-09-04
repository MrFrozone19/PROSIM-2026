import { Rarity } from './cards';

export interface Trophy {
  id: string;
  /** Iniciales que van en la medalla (p. ej. "AE"). */
  code: string;
  title: string;
  description: string;
  rarity: Rarity;
  unlocked: boolean;
  date?: string;
}

/** Los tres primeros aparecen en "Recent trophies" del perfil (colores del diseño). */
export const TROPHIES: Trophy[] = [
  { id: 't1', code: 'AE', title: 'AL East Champs', description: 'Escanea a los cinco equipos del Este', rarity: 'mythic', unlocked: true, date: '2026-08-30' },
  { id: 't2', code: 'PS', title: 'Perfect Scan', description: 'Reconoce un logo en menos de un segundo', rarity: 'legendary', unlocked: true, date: '2026-08-27' },
  { id: 't3', code: 'FH', title: 'First Homerun', description: 'Activa tu primer efecto de celebración', rarity: 'epic', unlocked: true, date: '2026-08-21' },
  { id: 't4', code: 'TR', title: 'Trivia Rookie', description: 'Responde 10 trivias correctamente', rarity: 'rare', unlocked: true, date: '2026-08-25' },
  { id: 't5', code: 'FF', title: 'Filter Freak', description: 'Aplica los cinco filtros a un video', rarity: 'rare', unlocked: false },
  { id: 't6', code: 'PC', title: 'Pennant Chase', description: 'Colecciona una carta de cada división', rarity: 'legendary', unlocked: false },
];

export interface Badge {
  id: string;
  label: string;
  description: string;
  earned: boolean;
}

export const BADGES: Badge[] = [
  { id: 'b1', label: 'Rookie', description: 'Primera sesión AR', earned: true },
  { id: 'b2', label: 'Collector', description: '5 cartas desbloqueadas', earned: true },
  { id: 'b3', label: 'Scout', description: '3 estadios escaneados', earned: true },
  { id: 'b4', label: 'Editor', description: '10 clips con filtro', earned: false },
  { id: 'b5', label: 'MVP', description: 'Top 3 semanal', earned: false },
  { id: 'b6', label: 'Historian', description: 'Trivia perfecta', earned: false },
];
