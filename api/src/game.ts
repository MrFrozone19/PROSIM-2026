import express from 'express';
import { randomInt, randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db.js';
import { FLIGHT, replayFlight } from './game-physics.js';
import { levelOf, reward, totalXp, weeklyBreakdown, type ProgressDb } from './progress.js';
import { withUserTransaction } from './transactions.js';

export const game = express.Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

class GameError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function gameStats(uid: string, db: ProgressDb = pool) {
  const [[stats]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS runs, COALESCE(SUM(won), 0) AS wins, COALESCE(MAX(score), 0) AS bestScore,
       COALESCE(SUM(score), 0) AS gates,
       COALESCE(SUM(CASE WHEN finished_at >= UTC_TIMESTAMP() - INTERVAL 1 DAY THEN xp_granted ELSE 0 END), 0) AS xp24h
     FROM game_runs WHERE uid = ? AND status = 'finished'`,
    [uid],
  );
  return {
    runs: Number(stats['runs']),
    wins: Number(stats['wins']),
    bestScore: Number(stats['bestScore']),
    gates: Number(stats['gates']),
    xp24h: Number(stats['xp24h']),
    xpRemaining: Math.max(0, FLIGHT.xpLimit24h - Number(stats['xp24h'])),
  };
}

game.get('/', async (req, res) => {
  const uid = req.user!.uid;
  const [stats, weekly] = await Promise.all([gameStats(uid), weeklyBreakdown(uid)]);
  res.json({ rules: FLIGHT, stats, weekly });
});

game.post('/start', async (req, res) => {
  const uid = req.user!.uid;
  const id = randomUUID(),
    seed = randomInt(1, 0x7fffffff);
  await withUserTransaction(uid, async (db) => {
    await db.query(
      `UPDATE game_runs SET status = 'abandoned' WHERE uid = ? AND status = 'pending'`,
      [uid],
    );
    await db.query('INSERT INTO game_runs (id, uid, seed, rules_version) VALUES (?, ?, ?, ?)', [
      id,
      uid,
      seed,
      FLIGHT.version,
    ]);
  });
  res.status(201).json({ id, seed, rulesVersion: FLIGHT.version });
});

/** Liquidación atómica: validar el replay, guardar resultado y entregar recompensas una sola vez. */
export async function finishGame(uid: string, id: string, flaps: unknown) {
  if (!UUID.test(id)) throw new GameError(400, 'Partida inválida');
  return withUserTransaction(uid, async (db) => {
    const [[run]] = await db.query<RowDataPacket[]>(
      `SELECT *, TIMESTAMPDIFF(MICROSECOND, started_at, UTC_TIMESTAMP(3)) / 1000 AS elapsed_ms
       FROM game_runs WHERE id = ? AND uid = ? FOR UPDATE`,
      [id, uid],
    );
    if (!run) throw new GameError(404, 'Partida no encontrada');
    const summary = () => ({
      score: Number(run['score']),
      won: Boolean(run['won']),
      xpEarned: Number(run['xp_granted']),
    });
    if (run['status'] === 'finished') {
      const xp = await totalXp(uid, db);
      return {
        duplicate: true,
        run: summary(),
        stats: await gameStats(uid, db),
        xp,
        xpGained: 0,
        level: levelOf(xp).level,
        leveledUp: false,
        card: null,
        trophies: [],
        badges: [],
      };
    }
    if (run['status'] !== 'pending')
      throw new GameError(409, 'Esta partida fue reemplazada. Inicia una nueva.');
    if (
      Number(run['rules_version']) !== FLIGHT.version ||
      Number(run['elapsed_ms']) > 10 * 60_000
    ) {
      throw new GameError(409, 'La partida expiró. Inicia una nueva.');
    }
    let replay;
    try {
      replay = replayFlight(Number(run['seed']), flaps);
    } catch {
      throw new GameError(400, 'No se pudo validar la partida. Inicia una nueva.');
    }
    if ((replay.frames * 1000) / FLIGHT.fps > Number(run['elapsed_ms']) + 1500) {
      throw new GameError(400, 'La duración de la partida no es válida');
    }
    const stats = await gameStats(uid, db);
    const earned = replay.score * FLIGHT.xpPerGate + (replay.won ? FLIGHT.winXp : 0);
    const xp = Math.min(earned, stats.xpRemaining);
    await db.query(
      `UPDATE game_runs SET status = 'finished', score = ?, won = ?, frames = ?, xp_granted = ?,
       finished_at = UTC_TIMESTAMP(3) WHERE id = ?`,
      [replay.score, replay.won, replay.frames, xp, id],
    );
    const rewards = await reward(uid, xp, 'game:flight', null, db);
    return {
      ...rewards,
      duplicate: false,
      run: { score: replay.score, won: replay.won, xpEarned: xp },
      stats: await gameStats(uid, db),
    };
  });
}

game.post('/:id/finish', async (req, res) => {
  try {
    res.json(await finishGame(req.user!.uid, String(req.params['id']), req.body?.flaps));
  } catch (error) {
    if (error instanceof GameError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    throw error;
  }
});
