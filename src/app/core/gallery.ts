import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { FirebaseError } from 'firebase/app';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { Api, Reward } from './api';
import { AuthService } from './auth';
import { firebaseApp } from './firebase';

/** Mensaje para el usuario según la causa real (antes todo se reportaba como problema de conexión). */
export function saveErrorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'storage/unauthenticated':
      case 'storage/unauthorized':
        return 'Sin permiso para guardar. Cierra sesión, vuelve a entrar e intenta de nuevo.';
      case 'storage/quota-exceeded':
        return 'Se llenó el espacio de la Galería. Borra algunos elementos e intenta de nuevo.';
      case 'storage/retry-limit-exceeded':
        return 'La subida tardó demasiado. Revisa tu conexión e intenta de nuevo.';
      case 'storage/canceled':
        return 'Subida cancelada.';
      default:
        return `No se pudo guardar (${e.code}). Intenta de nuevo.`;
    }
  }
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.';
    const msg = (e.error as { error?: string } | null)?.error;
    return msg ? `No se pudo guardar: ${msg}` : `No se pudo guardar (error ${e.status}). Intenta de nuevo.`;
  }
  return 'No se pudo guardar. Intenta de nuevo.';
}

export interface SaveOptions {
  filter?: string | null;
  teamId?: string | null;
  durationMs?: number | null;
  /** Avance de la subida, de 0 a 1. */
  onProgress?: (fraction: number) => void;
}

/**
 * Galería dentro de la app: el archivo se sube a Firebase Storage (gallery/{uid}/{id}.{ext}, protegido por
 * storage.rules) y después se registra en la API, que lo guarda en MySQL.
 */
@Injectable({ providedIn: 'root' })
export class Gallery {
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);
  private readonly storage = getStorage(firebaseApp);

  async save(kind: 'photo' | 'video', blob: Blob, opts: SaveOptions = {}): Promise<Reward> {
    const uid = this.auth.user()?.uid;
    if (!uid) throw new Error('Sin sesión');
    // MediaRecorder reporta "video/mp4;codecs=…": Storage y la API solo necesitan el tipo base.
    const mime = blob.type.split(';')[0] || (kind === 'photo' ? 'image/jpeg' : 'video/mp4');
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'video/webm' ? 'webm' : 'mp4';
    const id = crypto.randomUUID();

    const task = uploadBytesResumable(ref(this.storage, `gallery/${uid}/${id}.${ext}`), blob, {
      contentType: mime,
      cacheControl: 'private, max-age=31536000',
    });
    task.on('state_changed', (s) => opts.onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0));
    await task;
    const url = await getDownloadURL(task.snapshot.ref);

    return this.api.addGalleryItem({
      id,
      kind,
      mime,
      url,
      filter: opts.filter ?? null,
      teamId: opts.teamId ?? null,
      durationMs: opts.durationMs ?? null,
    });
  }
}
