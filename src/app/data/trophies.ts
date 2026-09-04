export interface Trophy {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  date?: string;
}

export const TROPHIES: Trophy[] = [
  { id: 't1', title: 'AL East Champions', description: 'Escanea a los cinco equipos del Este', unlocked: true, date: '2026-08-30' },
  { id: 't2', title: 'First Scan', description: 'Activa tu primera experiencia AR', unlocked: true, date: '2026-08-21' },
  { id: 't3', title: 'Trivia Rookie', description: 'Responde 10 trivias correctamente', unlocked: true, date: '2026-08-27' },
  { id: 't4', title: 'Filter Freak', description: 'Aplica los cinco filtros a un video', unlocked: false },
  { id: 't5', title: 'Pennant Chase', description: 'Colecciona una carta de cada división', unlocked: false },
];

export interface Badge {
  id: string;
  label: string;
  earned: boolean;
}

export const BADGES: Badge[] = [
  { id: 'b1', label: 'Rookie', earned: true },
  { id: 'b2', label: 'Collector', earned: true },
  { id: 'b3', label: 'Scout', earned: false },
  { id: 'b4', label: 'MVP', earned: false },
];
