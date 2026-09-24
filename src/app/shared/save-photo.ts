/**
 * Guarda una imagen en el dispositivo. Una página web no puede escribir directamente en la galería, así que:
 * - Móvil (iOS y Android): hoja de compartir del sistema con el archivo; ahí aparece "Guardar imagen" / Fotos / Galería.
 * - Sin soporte para compartir archivos (escritorio): descarga normal del JPG.
 * Debe llamarse dentro del gesto del usuario (el clic), o Safari rechaza la hoja de compartir.
 */
export type SaveResult = 'shared' | 'downloaded' | 'cancelled';

export async function savePhoto(blob: Blob, name: string, title: string): Promise<SaveResult> {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled';
      // Otro error: se cae a la descarga.
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
