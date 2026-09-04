export interface Team {
  id: string;
  abbr: string;
  city: string;
  name: string;
  mascot: string;
  division: 'AL East' | 'AL Central' | 'AL West';
  color: string;
  founded: number;
  titles: number;
  stadium: string;
  /** Ruta del logo (solo los equipos con arte en el diseño). */
  logo?: string;
}

/** Equipos de la Liga Americana usados como canales y marcadores AR (datos de relleno). */
export const TEAMS: Team[] = [
  { id: 'nyy', abbr: 'NYY', city: 'New York', name: 'Yankees', mascot: 'Pinstripe', division: 'AL East', color: '#1c2f6b', founded: 1901, titles: 27, stadium: 'Yankee Stadium', logo: 'assets/figma/logo-nyy.webp' },
  { id: 'bos', abbr: 'BOS', city: 'Boston', name: 'Red Sox', mascot: 'Wally the Green Monster', division: 'AL East', color: '#bd3039', founded: 1901, titles: 9, stadium: 'Fenway Park', logo: 'assets/figma/logo-bos.webp' },
  { id: 'hou', abbr: 'HOU', city: 'Houston', name: 'Astros', mascot: 'Orbit', division: 'AL West', color: '#eb6e1f', founded: 1962, titles: 2, stadium: 'Daikin Park', logo: 'assets/figma/logo-hou.webp' },
  { id: 'tor', abbr: 'TOR', city: 'Toronto', name: 'Blue Jays', mascot: 'Ace the Blue Jay', division: 'AL East', color: '#134a8e', founded: 1977, titles: 2, stadium: 'Rogers Centre', logo: 'assets/figma/logo-tor.webp' },
  { id: 'bal', abbr: 'BAL', city: 'Baltimore', name: 'Orioles', mascot: 'The Oriole Bird', division: 'AL East', color: '#df4601', founded: 1901, titles: 3, stadium: 'Camden Yards', logo: 'assets/figma/logo-bal.webp' },
  { id: 'tex', abbr: 'TEX', city: 'Texas', name: 'Rangers', mascot: 'Rangers Captain', division: 'AL West', color: '#003278', founded: 1961, titles: 1, stadium: 'Globe Life Field' },
  { id: 'det', abbr: 'DET', city: 'Detroit', name: 'Tigers', mascot: 'Paws', division: 'AL Central', color: '#0c2340', founded: 1901, titles: 4, stadium: 'Comerica Park' },
  { id: 'cle', abbr: 'CLE', city: 'Cleveland', name: 'Guardians', mascot: 'Slider', division: 'AL Central', color: '#e50022', founded: 1901, titles: 2, stadium: 'Progressive Field' },
];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((t) => [t.id, t]));
