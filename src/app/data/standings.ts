export interface StandingRow {
  teamId: string;
  wins: number;
  losses: number;
  gamesBack: string;
  streak: string;
}

/** Tabla de posiciones simulada para el prototipo (no son datos reales). */
export const STANDINGS: StandingRow[] = [
  { teamId: 'nyy', wins: 84, losses: 55, gamesBack: '-', streak: 'W3' },
  { teamId: 'tor', wins: 80, losses: 59, gamesBack: '4.0', streak: 'W1' },
  { teamId: 'bos', wins: 76, losses: 63, gamesBack: '8.0', streak: 'L2' },
  { teamId: 'bal', wins: 68, losses: 71, gamesBack: '16.0', streak: 'L1' },
  { teamId: 'hou', wins: 79, losses: 60, gamesBack: '-', streak: 'W5' },
  { teamId: 'tex', wins: 72, losses: 67, gamesBack: '7.0', streak: 'W2' },
];

// La trivia vive en la API (api/src/catalog.ts) para que las respuestas se validen en el servidor.
