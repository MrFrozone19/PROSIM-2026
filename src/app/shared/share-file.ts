/**
 * Saca un archivo de la Galería al dispositivo:
 * - Móvil (iOS y Android): hoja de compartir del sistema con el archivo (Guardar imagen / video, WhatsApp, etc.).
 * - Sin soporte para compartir archivos (escritorio): descarga normal.
 * Debe llamarse directo desde el toque del usuario (sin esperas antes), o Safari rechaza la hoja de compartir:
 * por eso el blob se descarga antes, al abrir el visor.
 */
export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareFile(blob: Blob, name: string, title: string): Promise<ShareResult> {
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
