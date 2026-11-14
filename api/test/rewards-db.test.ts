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
  let sessions: typeof import('../src/trivia-sessions.js');
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
    sessions = await import('../src/trivia-sessions.js');
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
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => trivia.answerTrivia(uid, q.id, q.answer)),
    );
    assert.equal(
      responses.reduce((n, r) => n + r.xpGained, 0),
      50,
    );
    assert.equal(await progress.totalXp(uid), 50);
    assert.equal(responses.filter((response) => !response.alreadyAnswered).length, 1);
    const saved = (await trivia.triviaForUser(uid, q.teamId)).find((row) => row['id'] === q.id)!;
    assert.equal(saved['chosen'], q.answer);
    assert.equal(saved['correct'], true);
  });

  it('conserva una respuesta incorrecta, sin permitir cambiarla ni revelar preguntas de otra cuenta', async () => {
    const uid = await user(),
      other = await user(),
      q = TRIVIA.find((q) => q.teamId === 'nyy')!;
    const wrong = (q.answer + 1) % q.options.length;
    const before = await trivia.triviaForUser(uid, 'nyy');
    assert.equal(before.length, 7);
    assert.ok(before.every((row) => row['answer'] === null && row['chosen'] === null));
    await trivia.answerTrivia(uid, q.id, wrong);
    const retry = await trivia.answerTrivia(uid, q.id, q.answer);
    assert.equal(retry.alreadyAnswered, true);
    assert.equal(retry.chosen, wrong);
    assert.equal(retry.correct, false);
    assert.equal(await progress.totalXp(uid), 0);
    const own = (await trivia.triviaForUser(uid, 'nyy')).find((row) => row['id'] === q.id)!;
    assert.equal(own['answer'], q.answer);
    assert.equal(own['chosen'], wrong);
    assert.ok((await trivia.triviaForUser(other, 'nyy')).every((row) => row['answer'] === null));
    const [[row]] = await db.pool.query<any[]>(
      'SELECT COUNT(*) AS n FROM trivia_answers WHERE uid = ?',
      [uid],
    );
    assert.equal(Number(row.n), 1);
  });

  it('conserva un intento parcial al recargar, valida su propietario y bloquea cambios de respuesta', async () => {
    const uid = await user(),
      other = await user();
    const opened = await Promise.all([
      sessions.triviaSession(uid, 'nyy'),
      sessions.triviaSession(uid, 'nyy'),
    ]);
    assert.equal(opened[0].id, opened[1].id);
    assert.equal(opened[0].questions.length, 7);
    assert.ok(opened[0].questions.every((q) => q.answer === null));
    const q = TRIVIA.find((q) => q.id === opened[0].questions[0].id)!;
    const wrong = (q.answer + 1) % q.options.length;
    await sessions.answerTriviaSession(uid, opened[0].id, q.id, wrong);
    const duplicate = await sessions.answerTriviaSession(uid, opened[0].id, q.id, q.answer);
    assert.equal(duplicate.chosen, wrong);
    assert.equal(duplicate.correct, false);
    assert.equal(duplicate.xpGained, 0);
    const restored = await sessions.triviaSession(uid, 'nyy');
    assert.equal(restored.questions[0].chosen, wrong);
    assert.equal(restored.completedAt, null);
    assert.equal(restored.questions[1].answer, null);
    await assert.rejects(
      sessions.retryTrivia(uid, 'nyy', restored.id),
      (e: any) => e.status === 429,
    );
    await assert.rejects(
      sessions.answerTriviaSession(other, restored.id, q.id, q.answer),
      (e: any) => e.status === 404,
    );
    await assert.rejects(
      sessions.retryTrivia(other, 'nyy', restored.id),
      (e: any) => e.status === 404,
    );
    const bos = await sessions.triviaSession(uid, 'bos');
    assert.ok(bos.questions.every((q) => q.chosen === null));
  });

  it('exige 5 minutos desde el final, crea un solo reintento y no repite XP ya ganada', async () => {
    const uid = await user();
    const first = await sessions.triviaSession(uid, 'nyy');
    for (const [index, row] of first.questions.entries()) {
      const q = TRIVIA.find((q) => q.id === row.id)!;
      await sessions.answerTriviaSession(
        uid,
        first.id,
        q.id,
        index === 0 ? (q.answer + 1) % q.options.length : q.answer,
      );
    }
    const done = await sessions.triviaSession(uid, 'nyy');
    assert.ok(done.completedAt && done.retryAt);
    assert.equal(Date.parse(done.retryAt!) - Date.parse(done.completedAt!), 300_000);
    await assert.rejects(sessions.retryTrivia(uid, 'nyy', done.id), (e: any) => e.status === 429);
    await db.pool.query(
      'UPDATE trivia_runs SET completed_at = UTC_TIMESTAMP(3) - INTERVAL 299 SECOND WHERE id = ?',
      [done.id],
    );
    await assert.rejects(sessions.retryTrivia(uid, 'nyy', done.id), (e: any) => e.status === 429);
    await db.pool.query(
      'UPDATE trivia_runs SET completed_at = UTC_TIMESTAMP(3) - INTERVAL 300 SECOND WHERE id = ?',
      [done.id],
    );
    const retries = await Promise.all(
      Array.from({ length: 4 }, () => sessions.retryTrivia(uid, 'nyy', done.id)),
    );
    assert.equal(new Set(retries.map((r) => r.id)).size, 1);
    assert.notEqual(retries[0].id, done.id);
    assert.ok(retries[0].questions.every((q) => q.chosen === null && q.answer === null));
    await assert.rejects(
      sessions.answerTriviaSession(uid, first.id, first.questions[0].id, 0),
      (e: any) => e.status === 409,
    );
    let gained = 0;
    for (const row of retries[0].questions) {
      const q = TRIVIA.find((q) => q.id === row.id)!;
      gained += (await sessions.answerTriviaSession(uid, retries[0].id, q.id, q.answer)).xpGained;
    }
    assert.equal(gained, 50, 'Solo otorga XP por la pregunta acertada por primera vez');
    const [[runs]] = await db.pool.query<any[]>(
      'SELECT COUNT(*) AS n FROM trivia_runs WHERE uid = ? AND team_id = ?',
      [uid, 'nyy'],
    );
    assert.equal(Number(runs.n), 2);
    const independent = await sessions.triviaSession(uid, 'bos');
    assert.ok(independent.questions.every((q) => q.chosen === null));
  });

  it('importa el intento anterior a la actualización y conserva su fecha de finalización', async () => {
    const uid = await user();
    for (const q of TRIVIA.filter((q) => q.teamId === 'nyy' || q.teamId === null))
      await trivia.answerTrivia(uid, q.id, q.answer);
    const imported = await sessions.triviaSession(uid, 'nyy');
    assert.ok(imported.completedAt && imported.retryAt);
    assert.ok(imported.questions.every((q) => q.chosen !== null));
    assert.equal((await sessions.triviaSession(uid, 'nyy')).id, imported.id);
    const [[count]] = await db.pool.query<any[]>(
      'SELECT COUNT(*) AS n FROM trivia_answers WHERE uid = ?',
      [uid],
    );
    assert.equal(Number(count.n), 7, 'No copia ni elimina las respuestas históricas');
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
