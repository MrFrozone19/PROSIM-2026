import { randomUUID } from 'node:crypto';
import type { PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { withUserTransaction } from './transactions.js';
import { reward, XP } from './progress.js';
import { TriviaError } from './trivia.js';

export const TRIVIA_COOLDOWN_SECONDS = 300;
interface Question {
  id: number;
  teamId: string | null;
  question: string;
  options: string[];
  answer: number;
}
interface Run extends RowDataPacket {
  id: string;
  team_id: string;
  questions: Question[];
  completed_at: Date | null;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function latestRun(
  db: PoolConnection,
  uid: string,
  teamId: string,
): Promise<Run | undefined> {
  const [[run]] = await db.query<Run[]>(
    'SELECT * FROM trivia_runs WHERE uid = ? AND team_id = ? ORDER BY seq DESC LIMIT 1',
    [uid, teamId],
  );
  return run;
}

async function result(db: PoolConnection, run: Run) {
  const [answers] = await db.query<RowDataPacket[]>(
    `SELECT a.question_id, a.chosen, a.correct, a.created_at FROM trivia_run_answers ra
     JOIN trivia_answers a ON a.id = ra.answer_id WHERE ra.run_id = ?`,
    [run.id],
  );
  const [[clock]] = await db.query<RowDataPacket[]>('SELECT UTC_TIMESTAMP(3) AS now');
  const completedAt = run.completed_at?.toISOString() ?? null;
  return {
    id: run.id,
    teamId: run.team_id,
    serverNow: (clock['now'] as Date).toISOString(),
    completedAt,
    retryAt: run.completed_at
      ? new Date(run.completed_at.getTime() + TRIVIA_COOLDOWN_SECONDS * 1000).toISOString()
      : null,
    cooldownSeconds: TRIVIA_COOLDOWN_SECONDS,
    questions: run.questions.map((q) => {
      const saved = answers.find((a) => Number(a['question_id']) === q.id);
      return {
        id: q.id,
        teamId: q.teamId,
        question: q.question,
        options: q.options,
        chosen: saved ? Number(saved['chosen']) : null,
        answer: saved ? q.answer : null,
        correct: saved ? Boolean(saved['correct']) : null,
        answeredAt: saved?.['created_at'] ?? null,
      };
    }),
  };
}

async function createRun(
  db: PoolConnection,
  uid: string,
  teamId: string,
  importLegacy: boolean,
): Promise<Run> {
  const [[team]] = await db.query<RowDataPacket[]>('SELECT id FROM teams WHERE id = ?', [teamId]);
  if (!team) throw new TriviaError(400, 'Equipo inválido');
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, team_id AS teamId, question, options, answer FROM trivia_questions
     WHERE active AND (team_id = ? OR team_id IS NULL) ORDER BY (team_id <=> ?) DESC, id`,
    [teamId, teamId],
  );
  if (!rows.length) throw new TriviaError(404, 'No hay preguntas disponibles');
  const questions = rows as unknown as Question[];
  const id = randomUUID();
  await db.query('INSERT INTO trivia_runs (id, uid, team_id, questions) VALUES (?, ?, ?, ?)', [
    id,
    uid,
    teamId,
    JSON.stringify(questions),
  ]);
  // Migra el avance previo sin copiar respuestas de nuevos intentos de otros equipos.
  if (importLegacy)
    for (const q of questions) {
      const [[saved]] = await db.query<RowDataPacket[]>(
        `SELECT a.id FROM trivia_answers a WHERE a.uid = ? AND a.question_id = ?
       AND NOT EXISTS (SELECT 1 FROM trivia_run_answers ra WHERE ra.answer_id = a.id)
       AND NOT EXISTS (SELECT 1 FROM trivia_answers newer WHERE newer.uid = a.uid AND newer.question_id = a.question_id AND newer.id > a.id)
       ORDER BY a.id DESC LIMIT 1`,
        [uid, q.id],
      );
      if (saved)
        await db.query(
          'INSERT INTO trivia_run_answers (run_id, question_id, answer_id) VALUES (?, ?, ?)',
          [id, q.id, saved['id']],
        );
    }
  await completeIfReady(db, id, questions.length);
  const [[run]] = await db.query<Run[]>('SELECT * FROM trivia_runs WHERE id = ?', [id]);
  return run;
}

async function completeIfReady(db: PoolConnection, id: string, count: number): Promise<void> {
  await db.query(
    `UPDATE trivia_runs r SET completed_at = (
       SELECT MAX(a.created_at) FROM trivia_run_answers ra JOIN trivia_answers a ON a.id = ra.answer_id WHERE ra.run_id = r.id
     ) WHERE r.id = ? AND r.completed_at IS NULL AND (SELECT COUNT(*) FROM trivia_run_answers ra WHERE ra.run_id = r.id) = ?`,
    [id, count],
  );
}

export async function triviaSession(uid: string, teamId: string) {
  return withUserTransaction(uid, async (db) =>
    result(db, (await latestRun(db, uid, teamId)) ?? (await createRun(db, uid, teamId, true))),
  );
}

export async function retryTrivia(uid: string, teamId: string, previousId: string) {
  if (!uuid.test(previousId)) throw new TriviaError(400, 'Intento inválido');
  return withUserTransaction(uid, async (db) => {
    const [[previous]] = await db.query<Run[]>(
      'SELECT * FROM trivia_runs WHERE id = ? AND uid = ? AND team_id = ?',
      [previousId, uid, teamId],
    );
    if (!previous) throw new TriviaError(404, 'Intento no encontrado');
    const current = (await latestRun(db, uid, teamId))!;
    if (current.id !== previous.id) return result(db, current); // Reintento de la misma petición: no crea otra ronda.
    const [[clock]] = await db.query<RowDataPacket[]>(
      'SELECT completed_at IS NOT NULL AND completed_at <= UTC_TIMESTAMP(3) - INTERVAL 5 MINUTE AS ready FROM trivia_runs WHERE id = ?',
      [current.id],
    );
    if (!clock['ready'])
      throw new TriviaError(
        429,
        'Espera 5 minutos después de completar esta trivia para volver a intentarlo.',
      );
    return result(db, await createRun(db, uid, teamId, false));
  });
}

export async function answerTriviaSession(uid: string, runId: string, id: number, option: number) {
  if (!uuid.test(runId) || !Number.isInteger(id) || !Number.isInteger(option))
    throw new TriviaError(400, 'Respuesta inválida');
  return withUserTransaction(uid, async (db) => {
    const [[run]] = await db.query<Run[]>('SELECT * FROM trivia_runs WHERE id = ? AND uid = ?', [
      runId,
      uid,
    ]);
    if (!run) throw new TriviaError(404, 'Intento no encontrado');
    const current = await latestRun(db, uid, run.team_id);
    if (current?.id !== run.id)
      throw new TriviaError(409, 'Este intento ya terminó. Abre la trivia de nuevo.');
    const q = run.questions.find((question) => question.id === id);
    if (!q || option < 0 || option >= q.options.length)
      throw new TriviaError(400, 'Pregunta u opción inválida');
    const [[saved]] = await db.query<RowDataPacket[]>(
      `SELECT a.chosen, a.correct FROM trivia_run_answers ra JOIN trivia_answers a ON a.id = ra.answer_id
       WHERE ra.run_id = ? AND ra.question_id = ?`,
      [runId, id],
    );
    let xp = 0;
    if (!saved) {
      const [[before]] = await db.query<RowDataPacket[]>(
        'SELECT COUNT(*) AS n FROM trivia_answers WHERE uid = ? AND question_id = ? AND correct',
        [uid, id],
      );
      const correct = option === q.answer;
      const [insert] = await db.query<ResultSetHeader>(
        'INSERT INTO trivia_answers (uid, question_id, chosen, correct) VALUES (?, ?, ?, ?)',
        [uid, id, option, correct],
      );
      await db.query(
        'INSERT INTO trivia_run_answers (run_id, question_id, answer_id) VALUES (?, ?, ?)',
        [runId, id, insert.insertId],
      );
      xp = correct && Number(before['n']) === 0 ? XP.triviaFirstCorrect : 0;
      await completeIfReady(db, runId, run.questions.length);
    }
    const [[updated]] = await db.query<Run[]>('SELECT * FROM trivia_runs WHERE id = ?', [runId]);
    return {
      correct: saved ? Boolean(saved['correct']) : option === q.answer,
      chosen: saved ? Number(saved['chosen']) : option,
      answer: q.answer,
      alreadyAnswered: Boolean(saved),
      session: await result(db, updated),
      ...(await reward(uid, xp, `trivia:${id}`, null, db)),
    };
  });
}
