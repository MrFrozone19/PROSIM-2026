import type { NextFunction, Request, Response } from 'express';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { pool } from './db.js';

// Los tokens de Firebase Auth se validan con las llaves públicas de Google (basta el projectId). Storage usa las
// credenciales del entorno: la cuenta de servicio en Cloud Run, o `gcloud auth application-default login` en local.
const projectId = process.env['FIREBASE_PROJECT_ID'] ?? 'basedex-fan';
initializeApp({ projectId, storageBucket: process.env['STORAGE_BUCKET'] ?? `${projectId}.firebasestorage.app` });

const ADMIN_EMAILS = new Set(
  (process.env['ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export interface AuthedUser {
  uid: string;
  role: 'fan' | 'admin';
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthedUser;
  }
}

/**
 * Exige `Authorization: Bearer <ID token de Firebase>`. La primera vez crea la fila del usuario;
 * después solo actualiza la última visita. El rol admin sale de ADMIN_EMAILS y requiere correo verificado.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Falta iniciar sesión' });
    return;
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return;
  }

  const email = decoded.email?.toLowerCase() ?? null;
  const role = email && decoded.email_verified && ADMIN_EMAILS.has(email) ? 'admin' : 'fan';
  const name = (decoded['name'] as string | undefined) || email?.split('@')[0] || 'Fan';

  await pool.query(
    `INSERT INTO users (uid, email, display_name, photo_url, role) VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email), photo_url = VALUES(photo_url), role = VALUES(role),
       last_seen_at = CURRENT_TIMESTAMP`,
    [decoded.uid, email, name.slice(0, 60), decoded.picture ?? null, role],
  );

  req.user = { uid: decoded.uid, role };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Solo administradores' });
    return;
  }
  next();
}
