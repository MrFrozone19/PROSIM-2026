/** Archivo compilado por `npm run targets` a partir de design/targets/targets.json. */
export const TARGETS_SRC = 'assets/targets/targets.mind';

export interface ArTarget {
  /** Posición dentro de targets.mind; mismo orden que design/targets/targets.json. */
  index: number;
  teamId: string;
  /** Modelo glTF/GLB que aparece anclado al marcador. */
  model: string;
}

/** Un equipo puede tener varias imágenes detonadoras (ej. el mismo logo en claro y en oscuro). */
export const AR_TARGETS: ArTarget[] = [
  { index: 0, teamId: 'nyy', model: 'assets/models/cap.glb' },
  { index: 1, teamId: 'nyy', model: 'assets/models/cap.glb' },
];
