import type { PoolConnection } from 'mysql2/promise';
import { pool } from './db.js';

/** Serializa las acciones que dan puntos por usuario y hace atómica la entrega de recompensas. */
export async function withUserTransaction<T>(
  uid: string,
  work: (db: PoolConnection) => Promise<T>,
): Promise<T> {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    await db.query('SELECT uid FROM users WHERE uid = ? FOR UPDATE', [uid]);
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}
