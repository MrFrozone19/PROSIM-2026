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
  { teamId: 'tb', wins: 73, losses: 66, gamesBack: '11.0', streak: 'W2' },
  { teamId: 'bal', wins: 68, losses: 71, gamesBack: '16.0', streak: 'L1' },
  { teamId: 'cle', wins: 82, losses: 57, gamesBack: '-', streak: 'W4' },
  { teamId: 'det', wins: 78, losses: 61, gamesBack: '4.0', streak: 'W1' },
  { teamId: 'min', wins: 74, losses: 65, gamesBack: '8.0', streak: 'L2' },
  { teamId: 'kc', wins: 71, losses: 68, gamesBack: '11.0', streak: 'W2' },
  { teamId: 'cws', wins: 50, losses: 89, gamesBack: '32.0', streak: 'L3' },
  { teamId: 'hou', wins: 79, losses: 60, gamesBack: '-', streak: 'W5' },
  { teamId: 'sea', wins: 77, losses: 62, gamesBack: '2.0', streak: 'W3' },
  { teamId: 'tex', wins: 72, losses: 67, gamesBack: '7.0', streak: 'W2' },
  { teamId: 'ath', wins: 64, losses: 75, gamesBack: '15.0', streak: 'L1' },
  { teamId: 'laa', wins: 60, losses: 79, gamesBack: '19.0', streak: 'L2' },
];

// La trivia vive en la API (api/src/catalog.ts) para que las respuestas se validen en el servidor.
