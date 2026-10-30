import express from 'express';
import { getStorage } from 'firebase-admin/storage';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db.js';
import { reward } from './progress.js';

/**
 * Galería del usuario. El front sube el archivo directo a Firebase Storage (gallery/{uid}/{id}.{ext}, protegido por
 * storage.rules) y luego lo registra aquí; la API comprueba que el archivo exista y toma su tamaño real de Storage.
 */
export const gallery = express.Router();

const FILTERS = new Set(['pixelate', 'thermal', 'pastel', 'blur', 'color']);
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'video/mp4': 'mp4', 'video/webm': 'webm' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const bucket = () => getStorage().bucket();

/** Borra todos los archivos de un usuario (al eliminar su cuenta). */
export async function deleteUserFiles(uid: string): Promise<void> {
  await bucket().deleteFiles({ prefix: `gallery/${uid}/` });
}

gallery.get('/', async (req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, kind, url, mime, filter, team_id AS teamId, duration_ms AS durationMs, size_bytes AS sizeBytes,
       created_at AS createdAt
     FROM gallery_items WHERE uid = ? ORDER BY created_at DESC`,
    [req.user!.uid],
  );
  res.json(rows);
});

gallery.post('/', async (req, res) => {
  const uid = req.user!.uid;
  const { id, kind, mime, url, filter, teamId, durationMs } = req.body ?? {};
  const ext = EXT[mime];
  const bad = (error: string) => void res.status(400).json({ error });

  if (typeof id !== 'string' || !UUID.test(id)) return bad('id inválido');
  if (kind !== 'photo' && kind !== 'video') return bad('Tipo inválido');
  if (!ext || (kind === 'photo') !== (mime === 'image/jpeg')) return bad('Formato inválido');
  if (filter != null && (kind !== 'video' || !FILTERS.has(filter))) return bad('Filtro inválido');
  if (teamId != null) {
    const [t] = await pool.query<RowDataPacket[]>('SELECT 1 FROM teams WHERE id = ?', [teamId]);
    if (!t.length) return bad('Equipo inválido');
  }
  const path = `gallery/${uid}/${id}.${ext}`;
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket().name}/o/${encodeURIComponent(path)}?`;
  if (typeof url !== 'string' || !url.startsWith(prefix)) return bad('URL inválida');

  const file = bucket().file(path);
  const [exists] = await file.exists();
  if (!exists) return bad('El archivo no está en Storage');
  const [meta] = await file.getMetadata();

  const ms = Number.isFinite(durationMs) ? Math.max(0, Math.min(600_000, Math.round(durationMs))) : null;
  await pool.query(
    `INSERT INTO gallery_items (id, uid, kind, storage_path, url, mime, filter, team_id, duration_ms, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, uid, kind, path, url, mime, filter ?? null, teamId ?? null, kind === 'video' ? ms : null, Number(meta.size ?? 0)],
  );
  // Guardar no da XP por sí mismo (se podría farmear), pero cuenta para la insignia Editor.
  res.status(201).json(await reward(uid, 0, 'gallery'));
});

gallery.delete('/:id', async (req, res) => {
  const uid = req.user!.uid;
  const [[item]] = await pool.query<RowDataPacket[]>(
    'SELECT storage_path FROM gallery_items WHERE id = ? AND uid = ?',
    [req.params['id'], uid],
  );
  if (!item) return void res.status(404).json({ error: 'No encontrado' });
  await bucket().file(item['storage_path']).delete({ ignoreNotFound: true });
  await pool.query('DELETE FROM gallery_items WHERE id = ? AND uid = ?', [req.params['id'], uid]);
  res.json({ ok: true });
});
