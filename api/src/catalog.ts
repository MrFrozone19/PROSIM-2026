/**
 * Catálogo del juego. Se sincroniza a MySQL al arrancar (ver migrate en db.ts).
 * Los equipos repiten src/app/data/teams.ts del front: si cambias uno, cambia el otro.
 */

export type Rarity = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
export type Division = 'AL East' | 'AL Central' | 'AL West';

export const TEAMS = [
  { id: 'nyy', abbr: 'NYY', city: 'New York', name: 'Yankees', mascot: 'Pinstripe', division: 'AL East', color: '#1c2f6b', founded: 1901, titles: 27, stadium: 'Yankee Stadium' },
  { id: 'bos', abbr: 'BOS', city: 'Boston', name: 'Red Sox', mascot: 'Wally the Green Monster', division: 'AL East', color: '#bd3039', founded: 1901, titles: 9, stadium: 'Fenway Park' },
  { id: 'hou', abbr: 'HOU', city: 'Houston', name: 'Astros', mascot: 'Orbit', division: 'AL West', color: '#eb6e1f', founded: 1962, titles: 2, stadium: 'Daikin Park' },
  { id: 'tor', abbr: 'TOR', city: 'Toronto', name: 'Blue Jays', mascot: 'Ace the Blue Jay', division: 'AL East', color: '#134a8e', founded: 1977, titles: 2, stadium: 'Rogers Centre' },
  { id: 'bal', abbr: 'BAL', city: 'Baltimore', name: 'Orioles', mascot: 'The Oriole Bird', division: 'AL East', color: '#df4601', founded: 1901, titles: 3, stadium: 'Camden Yards' },
  { id: 'tex', abbr: 'TEX', city: 'Texas', name: 'Rangers', mascot: 'Rangers Captain', division: 'AL West', color: '#003278', founded: 1961, titles: 1, stadium: 'Globe Life Field' },
  { id: 'det', abbr: 'DET', city: 'Detroit', name: 'Tigers', mascot: 'Paws', division: 'AL Central', color: '#0c2340', founded: 1901, titles: 4, stadium: 'Comerica Park' },
  { id: 'cle', abbr: 'CLE', city: 'Cleveland', name: 'Guardians', mascot: 'Slider', division: 'AL Central', color: '#e50022', founded: 1901, titles: 2, stadium: 'Progressive Field' },
] satisfies { id: string; abbr: string; city: string; name: string; mascot: string; division: Division; color: string; founded: number; titles: number; stadium: string }[];

/** Una carta por equipo: se desbloquea la primera vez que el usuario escanea el logo de ese equipo. */
export const CARDS: { id: string; name: string; teamId: string; rarity: Rarity; serial: string; power: number; speed: number; charisma: number; art?: string }[] = [
  { id: 'c1', name: 'Astros Orbit', teamId: 'hou', rarity: 'mythic', serial: '#001/100', power: 92, speed: 78, charisma: 99, art: 'assets/figma/card-hou.webp' },
  { id: 'c2', name: 'Yankees Pinstripe', teamId: 'nyy', rarity: 'legendary', serial: '#017/250', power: 88, speed: 71, charisma: 90, art: 'assets/figma/card-nyy.webp' },
  { id: 'c3', name: 'Sox Green Monster', teamId: 'bos', rarity: 'epic', serial: '#104/500', power: 95, speed: 40, charisma: 85, art: 'assets/figma/card-bos.webp' },
  { id: 'c4', name: 'Blue Jay Ace', teamId: 'tor', rarity: 'rare', serial: '#233/1000', power: 74, speed: 93, charisma: 80, art: 'assets/figma/card-tor.webp' },
  { id: 'c5', name: 'Oriole Bird', teamId: 'bal', rarity: 'uncommon', serial: '#612/2000', power: 66, speed: 88, charisma: 77, art: 'assets/figma/card-bal.webp' },
  { id: 'c6', name: 'Texas Ranger', teamId: 'tex', rarity: 'common', serial: '#1402/5000', power: 70, speed: 65, charisma: 60, art: 'assets/figma/card-tex.webp' },
  { id: 'c7', name: 'Paws Prowl', teamId: 'det', rarity: 'rare', serial: '#318/1000', power: 81, speed: 76, charisma: 72 },
  { id: 'c8', name: 'Slider Spin', teamId: 'cle', rarity: 'epic', serial: '#077/500', power: 69, speed: 84, charisma: 94 },
];

/** Las reglas de cada trofeo e insignia viven en progress.ts, por id. */
export const TROPHIES: { id: string; code: string; title: string; description: string; rarity: Rarity }[] = [
  { id: 't1', code: 'AE', title: 'AL East Champs', description: 'Escanea a todos los equipos del Este', rarity: 'mythic' },
  { id: 't2', code: 'PS', title: 'Perfect Scan', description: 'Reconoce un logo en menos de un segundo', rarity: 'legendary' },
  { id: 't3', code: 'FH', title: 'First Homerun', description: 'Activa tu primer efecto de celebración', rarity: 'epic' },
  { id: 't4', code: 'TR', title: 'Trivia Rookie', description: 'Responde 10 trivias correctamente', rarity: 'rare' },
  { id: 't5', code: 'FF', title: 'Filter Freak', description: 'Aplica los cinco filtros a un video', rarity: 'rare' },
  { id: 't6', code: 'PC', title: 'Pennant Chase', description: 'Colecciona una carta de cada división', rarity: 'legendary' },
];

export const BADGES: { id: string; label: string; description: string }[] = [
  { id: 'b1', label: 'Rookie', description: 'Primera sesión AR' },
  { id: 'b2', label: 'Collector', description: '5 cartas desbloqueadas' },
  { id: 'b3', label: 'Scout', description: '3 equipos escaneados' },
  { id: 'b4', label: 'Editor', description: '10 clips con filtro' },
  { id: 'b5', label: 'MVP', description: 'Top 3 semanal' },
  { id: 'b6', label: 'Historian', description: 'Trivia perfecta' },
];

/** teamId null = pregunta general de la liga; con equipo, aparece primero al escanear ese logo. */
export const TRIVIA: { id: number; teamId: string | null; question: string; options: string[]; answer: number }[] = [
  { id: 1, teamId: null, question: '¿En qué año se fundó la Liga Americana?', options: ['1876', '1901', '1920', '1947'], answer: 1 },
  { id: 2, teamId: null, question: '¿Qué equipo tiene más Series Mundiales ganadas?', options: ['Red Sox', 'Astros', 'Yankees', 'Tigers'], answer: 2 },
  { id: 3, teamId: 'bos', question: '¿Cómo se llama el muro verde del Fenway Park?', options: ['Green Wall', 'Green Monster', 'Emerald Fence', 'Big Green'], answer: 1 },
  { id: 4, teamId: 'nyy', question: '¿Cómo se llamaban los Yankees antes de 1913?', options: ['Bombers', 'Highlanders', 'Pilgrims', 'Knickerbockers'], answer: 1 },
  { id: 5, teamId: 'tor', question: '¿En qué años ganaron los Blue Jays la Serie Mundial?', options: ['1985 y 1986', '1992 y 1993', '2001 y 2002', '2015 y 2016'], answer: 1 },
  { id: 6, teamId: 'hou', question: '¿En qué año pasaron los Astros de la Liga Nacional a la Americana?', options: ['1998', '2005', '2013', '2017'], answer: 2 },
  { id: 7, teamId: 'tex', question: '¿En qué año ganaron los Rangers su primera Serie Mundial?', options: ['2010', '2011', '2019', '2023'], answer: 3 },
  { id: 8, teamId: 'bal', question: '¿En qué año abrió Oriole Park at Camden Yards?', options: ['1984', '1992', '2000', '2008'], answer: 1 },
  { id: 9, teamId: 'bos', question: '¿En qué año rompieron los Red Sox la "maldición del Bambino"?', options: ['1986', '1999', '2004', '2013'], answer: 2 },
];
