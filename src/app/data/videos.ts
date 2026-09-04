export interface VideoClip {
  id: string;
  title: string;
  duration: string;
  teamId: string;
  favorite: boolean;
  /** Clip MP4 generado en el proyecto (sin derechos de terceros). */
  src: string;
  poster: string;
}

export type FilterId = 'pixelate' | 'thermal' | 'pastel' | 'blur' | 'color';

export interface VideoFilter {
  id: FilterId;
  label: string;
  description: string;
}

/**
 * Filtros permitidos por la rúbrica.
 * PROHIBIDOS (no implementar): blanco y negro, escala de grises, sepia, exposición, colores invertidos.
 */
export const VIDEO_FILTERS: VideoFilter[] = [
  { id: 'pixelate', label: 'Pixelate', description: 'Bloques de píxeles' },
  { id: 'thermal', label: 'Thermal', description: 'Cámara térmica' },
  { id: 'pastel', label: 'Pastel', description: 'Suavizado y tonos pastel' },
  { id: 'blur', label: 'Blur', description: 'Desenfoque' },
  { id: 'color', label: 'Color Adjust', description: 'Brillo, contraste y saturación' },
];

const clip = (n: 1 | 2 | 3 | 4) => ({ src: `assets/video/clip-${n}.mp4`, poster: `assets/figma/clip-${n}.webp` });

export const VIDEO_CLIPS: VideoClip[] = [
  { id: 'v1', title: 'Mascot Fly-by', duration: '0:15', teamId: 'tor', favorite: true, ...clip(1) },
  { id: 'v2', title: 'Neon Homerun', duration: '0:24', teamId: 'nyy', favorite: true, ...clip(2) },
  { id: 'v3', title: 'Retro Stadium', duration: '0:45', teamId: 'bos', favorite: true, ...clip(3) },
  { id: 'v4', title: 'Mascot Dance', duration: '0:30', teamId: 'hou', favorite: true, ...clip(4) },
  { id: 'v5', title: 'Walk-off Walk', duration: '0:15', teamId: 'bal', favorite: false, ...clip(2) },
  { id: 'v6', title: 'Bullpen Warmup', duration: '0:24', teamId: 'tex', favorite: false, ...clip(3) },
  { id: 'v7', title: 'Seventh Inning Stretch', duration: '0:38', teamId: 'det', favorite: false, ...clip(1) },
  { id: 'v8', title: 'Grand Slam Replay', duration: '0:21', teamId: 'cle', favorite: false, ...clip(4) },
];
