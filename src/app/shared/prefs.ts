/** Preferencias locales del dispositivo (no viajan a la API). */

export type ArQuality = 'high' | 'fast';

const AR_QUALITY_KEY = 'bd.arQuality';

/** Alta = recorte de detección de 512 px (más alcance); Rápida = 256 px (menos trabajo por cuadro). */
export function getArQuality(): ArQuality {
  try {
    return localStorage.getItem(AR_QUALITY_KEY) === 'fast' ? 'fast' : 'high';
  } catch {
    return 'high';
  }
}

export function setArQuality(q: ArQuality): void {
  try {
    localStorage.setItem(AR_QUALITY_KEY, q);
  } catch {
    /* almacenamiento bloqueado: se queda el valor por defecto */
  }
}

/** Iniciales para avatares sin foto ("Ana Ruiz" → "AR"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2);
  return letters.toUpperCase();
}
