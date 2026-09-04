export interface GameHud {
  score: number;
  streak: number;
  best: number;
}

export const GAME_HUD: GameHud = { score: 0, streak: 4, best: 12400 };

export interface LeaderboardEntry {
  rank: number;
  initials: string;
  name: string;
  points: number;
  /** Fila del usuario actual (resaltada en el diseño). */
  me: boolean;
}

export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, initials: 'KM', name: 'Kenji Morales', points: 18920, me: false },
  { rank: 2, initials: 'SM', name: 'Tú', points: 12400, me: true },
  { rank: 3, initials: 'AR', name: 'Ana Ruiz', points: 11150, me: false },
];
