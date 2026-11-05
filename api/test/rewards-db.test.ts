import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { TRIVIA } from '../src/catalog.ts';
import { winningFlaps } from './flight-helper.ts';

const enabled = process.env['RUN_DB_TESTS'] === '1';

describe('Partidas, trivia y recompensas con MySQL real', { skip: !enabled }, () => {
  let db: typeof import('../src/db.js');
  let progress: typeof import('../src/progress.js');
  let trivia: typeof import('../src/trivia.js');
  let game: typeof import('../src/game.js');
  let server: Server;
  let base: string;
  const users: string[] = [];

  before(async () => {
    // Estas pruebas jamás pueden ejecutarse contra Cloud SQL ni la base normal del proyecto.
    assert.equal(process.env['DB_HOST'], '127.0.0.1');
    assert.equal(process.env['DB_PORT'], '3308');
    assert.equal(process.env['DB_NAME'], 'basedex_test');
    assert.ok(!process.env['DB_SOCKET_PATH']);
    db = await import('../src/db.js');
    progress = await import('../src/progress.js');
    trivia = await import('../src/trivia.js');
    game = await import('../src/game.js');
    await db.migrate();
    const app = express();
    app.use(express.json({ limit: '16kb' }));
    app.use((req, res, next) => {
      const uid = String(req.headers['x-test-user']);
      if (!users.includes(uid)) {
        res.sendStatus(401);
        return;
      }
      req.user = { uid, role: 'fan' };
      next();
    });
    app.use('/api/game', game.game);
    server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/game';
  });

  after(async () => {
    for (const uid of users) await db.pool.query('DELETE FROM users WHERE uid = ?', [uid]);
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
    if (db) await db.pool.end();
  });

  const user = async () => {
    const uid = 'flight-check-' + randomUUID();
    users.push(uid);
    await db.pool.query('INSERT INTO users (uid, display_name) VALUES (?, ?)', [uid, uid]);
    return uid;
  };
  const post = async (uid: string, path: string, body: unknown = {}) => {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-test-user': uid },
      body: JSON.stringify(body),
    });
    return { status: response.status, data: (await response.json()) as any };
  };
  const start = async (uid: string, old = true) => {
    const { status, data } = await post(uid, '/start');
    assert.equal(status, 201);
    if (old)
      await db.pool.query(
        'UPDATE game_runs SET started_at = UTC_TIMESTAMP(3) - INTERVAL 30 SECOND WHERE id = ?',
        [data.id],
      );
    return data as { id: string; seed: number; rulesVersion: number };
  };

  it('migra de forma idempotente y cuenta 5 preguntas activas por equipo', async () => {
    await db.migrate();
    const summary = await trivia.triviaSummary();
    assert.equal(summary.total, 77);
    assert.equal(summary.general, 2);
    assert.equal(summary.teams.length, 15);
    for (const t of summary.teams) assert.equal(t.count, 5, t.teamId);
  });

  it('acredita una trivia solo una vez incluso al responder simultáneamente', async () => {
    const uid = await user(),
      q = TRIVIA[0];
    const wrong = (q.answer + 1) % q.options.length;
    assert.equal((await trivia.answerTrivia(uid, q.id, wrong)).xpGained, 0);
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => trivia.answerTrivia(uid, q.id, q.answer)),
    );
    assert.equal(
      responses.reduce((n, r) => n + r.xpGained, 0),
      50,
    );
    assert.equal(await progress.totalXp(uid), 50);
  });

  it('reconstruye el score y no acepta un score inventado por el cliente', async () => {
    const uid = await user(),
      run = await start(uid);
    const result = await post(uid, '/' + run.id + '/finish', {
      flaps: [],
      score: 999999,
      won: true,
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.run.score, 0);
    assert.equal(result.data.run.won, false);
    assert.equal(result.data.run.xpEarned, 0);
  });

  it('no liquida una partida ajena, expirada, reemplazada o completada demasiado pronto', async () => {
    const uid = await user(),
      other = await user();
    const run = await start(uid, false);
    assert.equal((await post(other, '/' + run.id + '/finish', { flaps: [] })).status, 404);
    assert.equal(
      (await post(uid, '/' + run.id + '/finish', { flaps: winningFlaps(run.seed) })).status,
      400,
    );
    await db.pool.query(
      'UPDATE game_runs SET started_at = UTC_TIMESTAMP(3) - INTERVAL 11 MINUTE WHERE id = ?',
      [run.id],
    );
    assert.equal((await post(uid, '/' + run.id + '/finish', { flaps: [] })).status, 409);
    const first = await start(uid);
    await start(uid);
    assert.equal((await post(uid, '/' + first.id + '/finish', { flaps: [] })).status, 409);
  });

  it('guarda una victoria y sus recompensas una sola vez al reintentar concurrentemente', async () => {
    const uid = await user(),
      run = await start(uid),
      flaps = winningFlaps(run.seed);
    const responses = await Promise.all(
      Array.from({ length: 3 }, () => post(uid, '/' + run.id + '/finish', { flaps })),
    );
    assert.ok(responses.every((r) => r.status === 200));
    assert.equal(responses.filter((r) => !r.data.duplicate).length, 1);
    assert.equal(
      responses.reduce((n, r) => n + r.data.xpGained, 0),
      200,
    );
    assert.equal(await progress.totalXp(uid), 200);
    assert.equal((await game.gameStats(uid)).wins, 1);
  });

  it('une la XP de trivia y juego, la clasificación y la insignia combinada', async () => {
    const uid = await user();
    for (const q of TRIVIA.filter((q) => q.teamId === 'nyy'))
      await trivia.answerTrivia(uid, q.id, q.answer);
    const run = await start(uid);
    const response = await post(uid, '/' + run.id + '/finish', { flaps: winningFlaps(run.seed) });
    assert.equal(response.status, 200);
    assert.ok(response.data.badges.some((b: any) => b.id === 'b8'));
    const breakdown = await progress.weeklyBreakdown(uid);
    assert.deepEqual(breakdown, {
      trivia: 250,
      game: 150,
      achievements: 50,
      exploration: 0,
      total: 450,
    });
    const board = await progress.weeklyLeaderboard(uid);
    assert.equal(board.me.points, 450);
    assert.equal(board.entries.find((entry) => entry.me)?.points, 450);
    assert.equal((await progress.weeklyStanding(uid)).points, 450);
  });

  it('limita la XP de partidas y conserva victorias y logros al seguir jugando', async () => {
    const uid = await user();
    for (let i = 0; i < 5; i++) {
      const run = await start(uid);
      const result = await post(uid, '/' + run.id + '/finish', { flaps: winningFlaps(run.seed) });
      assert.equal(result.status, 200);
      assert.equal(result.data.run.xpEarned, i < 2 ? 150 : 0);
      if (i === 4) {
        assert.ok(result.data.trophies.some((t: any) => t.id === 't8'));
        assert.ok(result.data.badges.some((b: any) => b.id === 'b7'));
      }
    }
    assert.equal(await progress.totalXp(uid), 400);
    const stats = await game.gameStats(uid);
    assert.equal(stats.wins, 5);
    assert.equal(stats.bestScore, 10);
    assert.equal(stats.gates, 50);
    assert.equal(stats.xpRemaining, 0);
  });

  it('una transacción fallida no deja puntos parciales', async () => {
    const uid = await user();
    const { withUserTransaction } = await import('../src/transactions.js');
    await assert.rejects(
      withUserTransaction(uid, async (connection) => {
        await progress.addXp(uid, 99, 'game:flight', connection);
        throw new Error('fallo simulado');
      }),
    );
    assert.equal(await progress.totalXp(uid), 0);
  });
});
