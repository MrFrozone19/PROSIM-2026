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

export interface TriviaQuestion {
  question: string;
  options: string[];
  answer: number;
}

export const TRIVIA: TriviaQuestion[] = [
  { question: '¿En qué año se fundó la Liga Americana?', options: ['1876', '1901', '1920', '1947'], answer: 1 },
  { question: '¿Qué equipo tiene más Series Mundiales ganadas?', options: ['Red Sox', 'Astros', 'Yankees', 'Tigers'], answer: 2 },
  { question: '¿Cómo se llama el muro verde del Fenway Park?', options: ['Green Wall', 'Green Monster', 'Emerald Fence', 'Big Green'], answer: 1 },
];
