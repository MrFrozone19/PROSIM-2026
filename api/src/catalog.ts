/**
 * Catálogo del juego. Se sincroniza a MySQL al arrancar (ver migrate en db.ts).
 * Los equipos repiten src/app/data/teams.ts del front: si cambias uno, cambia el otro.
 */

export type Rarity = 'mythic' | 'legendary' | 'epic' | 'rare' | 'uncommon' | 'common';
export type Division = 'AL East' | 'AL Central' | 'AL West';

export const TEAMS = [
  { id: 'nyy', abbr: 'NYY', city: 'New York', name: 'Yankees', mascot: 'Pinstripe', division: 'AL East', color: '#1c2f6b', founded: 1903, titles: 27, stadium: 'Yankee Stadium' },
  { id: 'bos', abbr: 'BOS', city: 'Boston', name: 'Red Sox', mascot: 'Wally the Green Monster', division: 'AL East', color: '#bd3039', founded: 1901, titles: 9, stadium: 'Fenway Park' },
  { id: 'hou', abbr: 'HOU', city: 'Houston', name: 'Astros', mascot: 'Orbit', division: 'AL West', color: '#eb6e1f', founded: 1962, titles: 2, stadium: 'Daikin Park' },
  { id: 'tor', abbr: 'TOR', city: 'Toronto', name: 'Blue Jays', mascot: 'Ace the Blue Jay', division: 'AL East', color: '#134a8e', founded: 1977, titles: 2, stadium: 'Rogers Centre' },
  { id: 'bal', abbr: 'BAL', city: 'Baltimore', name: 'Orioles', mascot: 'The Oriole Bird', division: 'AL East', color: '#df4601', founded: 1901, titles: 3, stadium: 'Oriole Park at Camden Yards' },
  { id: 'tex', abbr: 'TEX', city: 'Texas', name: 'Rangers', mascot: 'Rangers Captain', division: 'AL West', color: '#003278', founded: 1961, titles: 1, stadium: 'Globe Life Field' },
  { id: 'det', abbr: 'DET', city: 'Detroit', name: 'Tigers', mascot: 'Paws', division: 'AL Central', color: '#0c2340', founded: 1901, titles: 4, stadium: 'Comerica Park' },
  { id: 'cle', abbr: 'CLE', city: 'Cleveland', name: 'Guardians', mascot: 'Slider', division: 'AL Central', color: '#e50022', founded: 1901, titles: 2, stadium: 'Progressive Field' },
  { id: 'tb', abbr: 'TB', city: 'Tampa Bay', name: 'Rays', mascot: 'Raymond', division: 'AL East', color: '#092c5c', founded: 1998, titles: 0, stadium: 'Tropicana Field' },
  { id: 'cws', abbr: 'CWS', city: 'Chicago', name: 'White Sox', mascot: 'Southpaw', division: 'AL Central', color: '#27251f', founded: 1901, titles: 3, stadium: 'Rate Field' },
  { id: 'kc', abbr: 'KC', city: 'Kansas City', name: 'Royals', mascot: 'Sluggerrr', division: 'AL Central', color: '#004687', founded: 1969, titles: 2, stadium: 'Kauffman Stadium' },
  { id: 'min', abbr: 'MIN', city: 'Minnesota', name: 'Twins', mascot: 'T.C. Bear', division: 'AL Central', color: '#002b5c', founded: 1901, titles: 3, stadium: 'Target Field' },
  { id: 'ath', abbr: 'ATH', city: '', name: 'Athletics', mascot: 'Stomper', division: 'AL West', color: '#003831', founded: 1901, titles: 9, stadium: 'Sutter Health Park' },
  { id: 'laa', abbr: 'LAA', city: 'Los Angeles', name: 'Angels', mascot: 'Rally Monkey', division: 'AL West', color: '#ba0021', founded: 1961, titles: 1, stadium: 'Angel Stadium' },
  { id: 'sea', abbr: 'SEA', city: 'Seattle', name: 'Mariners', mascot: 'Mariner Moose', division: 'AL West', color: '#005c5c', founded: 1977, titles: 0, stadium: 'T-Mobile Park' },
] satisfies { id: string; abbr: string; city: string; name: string; mascot: string; division: Division; color: string; founded: number; titles: number; stadium: string }[];

/** Una carta por equipo: se desbloquea la primera vez que el usuario escanea el logo de ese equipo. */
export const CARDS: { id: string; name: string; teamId: string; rarity: Rarity; serial: string; power: number; speed: number; charisma: number; art?: string }[] = [
  { id: 'c1', name: 'Astros Orbit', teamId: 'hou', rarity: 'mythic', serial: '#001/100', power: 92, speed: 78, charisma: 99, art: 'assets/figma/card-hou.webp' },
  { id: 'c2', name: 'Yankees Pinstripe', teamId: 'nyy', rarity: 'legendary', serial: '#017/250', power: 88, speed: 71, charisma: 90, art: 'assets/figma/card-nyy.webp' },
  { id: 'c3', name: 'Sox Green Monster', teamId: 'bos', rarity: 'epic', serial: '#104/500', power: 95, speed: 40, charisma: 85, art: 'assets/figma/card-bos.webp' },
  { id: 'c4', name: 'Blue Jay Ace', teamId: 'tor', rarity: 'rare', serial: '#233/1000', power: 74, speed: 93, charisma: 80, art: 'assets/figma/card-tor.webp' },
  { id: 'c5', name: 'Oriole Bird', teamId: 'bal', rarity: 'uncommon', serial: '#612/2000', power: 66, speed: 88, charisma: 77, art: 'assets/figma/card-bal.webp' },
  { id: 'c6', name: 'Texas Ranger', teamId: 'tex', rarity: 'common', serial: '#1402/5000', power: 70, speed: 65, charisma: 60, art: 'assets/figma/card-tex.webp' },
  { id: 'c7', name: 'Paws Prowl', teamId: 'det', rarity: 'rare', serial: '#318/1000', power: 81, speed: 76, charisma: 72, art: 'assets/logos/det.png' },
  { id: 'c8', name: 'Slider Spin', teamId: 'cle', rarity: 'epic', serial: '#077/500', power: 69, speed: 84, charisma: 94, art: 'assets/logos/cle.png' },
  { id: 'c9', name: 'Rays Raymond', teamId: 'tb', rarity: 'rare', serial: '#139/1000', power: 73, speed: 86, charisma: 82, art: 'assets/logos/tb.png' },
  { id: 'c10', name: 'White Sox Southpaw', teamId: 'cws', rarity: 'uncommon', serial: '#145/2000', power: 78, speed: 67, charisma: 85, art: 'assets/logos/cws.png' },
  { id: 'c11', name: 'Royals Sluggerrr', teamId: 'kc', rarity: 'rare', serial: '#118/1000', power: 84, speed: 72, charisma: 91, art: 'assets/logos/kc.png' },
  { id: 'c12', name: 'Twins T.C. Bear', teamId: 'min', rarity: 'epic', serial: '#142/500', power: 86, speed: 64, charisma: 89, art: 'assets/logos/min.png' },
  { id: 'c13', name: 'Athletics Stomper', teamId: 'ath', rarity: 'legendary', serial: '#133/250', power: 91, speed: 58, charisma: 88, art: 'assets/logos/ath.png' },
  { id: 'c14', name: 'Angels Rally Monkey', teamId: 'laa', rarity: 'uncommon', serial: '#108/2000', power: 65, speed: 94, charisma: 90, art: 'assets/logos/laa.png' },
  { id: 'c15', name: 'Mariners Moose', teamId: 'sea', rarity: 'rare', serial: '#136/1000', power: 82, speed: 75, charisma: 87, art: 'assets/logos/sea.png' },
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
  { id: 'b4', label: 'Editor', description: 'Guarda 3 videos grabados con filtro' },
  { id: 'b5', label: 'MVP', description: 'Top 3 semanal' },
  { id: 'b6', label: 'Historian', description: 'Trivia perfecta' },
];

interface TriviaSeed { id: number; teamId: string | null; question: string; options: string[]; answer: number }

/** Se conservan los IDs originales: las respuestas y ediciones del administrador siguen siendo válidas. */
const ORIGINAL_TRIVIA: TriviaSeed[] = [
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

/** IDs estables en un rango separado de las preguntas iniciales y las primeras altas del administrador. */
const TRIVIA_BASE: Record<string, number> = {
  nyy: 101470, bos: 101110, hou: 101170, tor: 101410, bal: 101100,
  tex: 101400, det: 101160, cle: 101140, tb: 101390, cws: 101450,
  kc: 101180, min: 101420, ath: 101330, laa: 101080, sea: 101360,
};

const HISTORY_TRIVIA: TriviaSeed[] = [
  { id: TRIVIA_BASE['det'] + 2, teamId: 'det', question: '¿Qué letra aparece en el logo clásico de los Detroit Tigers?', options: ['T', 'D', 'M', 'C'], answer: 1 },
  { id: TRIVIA_BASE['cle'] + 2, teamId: 'cle', question: '¿Qué nombre adoptó Cleveland para la temporada de 2022?', options: ['Guardians', 'Rangers', 'Royals', 'Twins'], answer: 0 },
  { id: TRIVIA_BASE['tb'] + 2, teamId: 'tb', question: '¿Con qué nombre debutó Tampa Bay en las Grandes Ligas en 1998?', options: ['Sun Rays', 'Devil Rays', 'Stingrays', 'Marlins'], answer: 1 },
  { id: TRIVIA_BASE['cws'] + 2, teamId: 'cws', question: '¿En qué año ganaron los White Sox la Serie Mundial después de 88 años?', options: ['1995', '2016', '2005', '1985'], answer: 2 },
  { id: TRIVIA_BASE['kc'] + 2, teamId: 'kc', question: '¿En qué año disputaron los Royals su primera temporada de MLB?', options: ['1961', '1977', '1901', '1969'], answer: 3 },
  { id: TRIVIA_BASE['min'] + 2, teamId: 'min', question: '¿Qué dos ciudades representa el nombre de los Minnesota Twins?', options: ['Minneapolis y Saint Paul', 'Detroit y Cleveland', 'Dallas y Fort Worth', 'Seattle y Tacoma'], answer: 0 },
  { id: TRIVIA_BASE['ath'] + 2, teamId: 'ath', question: '¿En qué ciudad comenzó la franquicia de los Athletics en 1901?', options: ['Oakland', 'Kansas City', 'Philadelphia', 'Sacramento'], answer: 2 },
  { id: TRIVIA_BASE['laa'] + 2, teamId: 'laa', question: '¿En qué año ganaron los Angels su primera Serie Mundial?', options: ['1986', '2002', '2014', '1961'], answer: 1 },
  { id: TRIVIA_BASE['sea'] + 2, teamId: 'sea', question: '¿En qué año debutaron los Seattle Mariners en MLB?', options: ['1969', '1995', '1977', '2001'], answer: 2 },
];

/** Cada equipo tiene preguntas propias; la respuesta correcta nunca se envía antes de contestar. */
export const TRIVIA: TriviaSeed[] = [
  ...ORIGINAL_TRIVIA,
  ...HISTORY_TRIVIA,
  ...TEAMS.flatMap((team, index): TriviaSeed[] => {
    const title = `${team.city} ${team.name}`.trim();
    const divisions = ['AL East', 'AL Central', 'AL West'];
    // Distractores de estadios del catálogo, sin repetir el correcto.
    const stadiums = [team.stadium, ...TEAMS.filter((t) => t.id !== team.id).slice(0, 3).map((t) => t.stadium)];
    const rotate = index % stadiums.length;
    const options = [...stadiums.slice(rotate), ...stadiums.slice(0, rotate)];
    return [
      { id: TRIVIA_BASE[team.id], teamId: team.id, question: `¿Cuál es el estadio de ${title}?`, options, answer: options.indexOf(team.stadium) },
      { id: TRIVIA_BASE[team.id] + 1, teamId: team.id, question: `¿En qué división de la Liga Americana juega ${title}?`, options: divisions, answer: divisions.indexOf(team.division) },
    ];
  }),
];
