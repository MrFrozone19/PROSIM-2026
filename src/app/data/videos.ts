export interface VideoClip {
  id: string;
  title: string;
  duration: string;
  teamId: string;
  favorite: boolean;
}

export type FilterId = 'pixelate' | 'thermal' | 'pastel' | 'blur' | 'color';

export interface VideoFilter {
  id: FilterId;
  label: string;
  description: string;
}

/** Filtros permitidos por la rúbrica. Prohibidos: B/N, escala de grises, sepia, exposición, invertidos. */
export const VIDEO_FILTERS: VideoFilter[] = [
  { id: 'pixelate', label: 'Pixelate', description: 'Bloques de píxeles' },
  { id: 'thermal', label: 'Thermal', description: 'Mapa de calor' },
  { id: 'pastel', label: 'Pastel', description: 'Suavizado y tonos pastel' },
  { id: 'blur', label: 'Blur', description: 'Desenfoque' },
  { id: 'color', label: 'Color Adjust', description: 'Brillo, contraste y saturación' },
];

export const VIDEO_CLIPS: VideoClip[] = [
  { id: 'v1', title: 'Mascot Fly-by', duration: '0:15', teamId: 'tor', favorite: true },
  { id: 'v2', title: 'Neon Homerun', duration: '0:24', teamId: 'nyy', favorite: true },
  { id: 'v3', title: 'Retro Stadium', duration: '0:45', teamId: 'bos', favorite: true },
  { id: 'v4', title: 'Mascot Dance', duration: '0:30', teamId: 'hou', favorite: true },
  { id: 'v5', title: 'Walk-off Walk', duration: '0:15', teamId: 'bal', favorite: false },
  { id: 'v6', title: 'Bullpen Warmup', duration: '0:24', teamId: 'tex', favorite: false },
  { id: 'v7', title: 'Seventh Inning Stretch', duration: '0:38', teamId: 'det', favorite: false },
  { id: 'v8', title: 'Grand Slam Replay', duration: '0:21', teamId: 'cle', favorite: false },
];
