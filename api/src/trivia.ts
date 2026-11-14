import type { RowDataPacket } from 'mysql2/promise';
import { pool } from './db.js';
import { reward, XP, type ProgressDb } from './progress.js';
import { withUserTransaction } from './transactions.js';

export class TriviaError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Conteo del catálogo activo en MySQL, incluyendo preguntas añadidas o desactivadas por el administrador. */
export async function triviaSummary(db: ProgressDb = pool) {
  const [teams] = await db.query<RowDataPacket[]>(
    `SELECT t.id AS teamId, t.abbr, TRIM(CONCAT(t.city, ' ', t.name)) AS name, COUNT(q.id) AS count
     FROM teams t LEFT JOIN trivia_questions q ON q.team_id = t.id AND q.active
     GROUP BY t.id, t.abbr, t.city, t.name ORDER BY t.division, t.name`,
  );
  const [[all]] = await db.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total, COALESCE(SUM(team_id IS NULL), 0) AS general FROM trivia_questions WHERE active`,
  );
  return {
    total: Number(all['total']),
    general: Number(all['general']),
    teams: teams.map((t) => ({
      teamId: t['teamId'] as string,
      abbr: t['abbr'] as string,
      name: t['name'] as string,
      count: Number(t['count']),
    })),
  };
}

/** El bloqueo por usuario evita acreditar dos veces la misma pregunta con peticiones simultáneas. */
export async function answerTrivia(uid: string, id: number, option: number) {
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(option))
    throw new TriviaError(400, 'Respuesta inválida');
  return withUserTransaction(uid, async (db) => {
    const [[q]] = await db.query<RowDataPacket[]>(
      'SELECT answer, JSON_LENGTH(options) AS n FROM trivia_questions WHERE id = ? AND active',
      [id],
    );
    if (!q) throw new TriviaError(404, 'Pregunta no encontrada');
    if (option < 0 || option >= Number(q['n'])) throw new TriviaError(400, 'Opción inválida');
    const [[previous]] = await db.query<RowDataPacket[]>(
      'SELECT chosen, correct FROM trivia_answers WHERE uid = ? AND question_id = ? ORDER BY id DESC LIMIT 1',
      [uid, id],
    );
    if (previous)
      return {
        correct: Boolean(previous['correct']),
        answer: Number(q['answer']),
        chosen: Number(previous['chosen']),
        alreadyAnswered: true,
        ...(await reward(uid, 0, `trivia:${id}`, null, db)),
      };
    const correct = option === Number(q['answer']);
    const [[before]] = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS n FROM trivia_answers WHERE uid = ? AND question_id = ? AND correct',
      [uid, id],
    );
    await db.query(
      'INSERT INTO trivia_answers (uid, question_id, chosen, correct) VALUES (?, ?, ?, ?)',
      [uid, id, option, correct],
    );
    const xp = correct && Number(before['n']) === 0 ? XP.triviaFirstCorrect : 0;
    return {
      correct,
      chosen: option,
      alreadyAnswered: false,
      answer: Number(q['answer']),
      ...(await reward(uid, xp, `trivia:${id}`, null, db)),
    };
  });
}

/** Recupera el avance por cuenta; solo revela la solución de preguntas ya contestadas. */
export async function triviaForUser(uid: string, teamId: string | null, db: ProgressDb = pool) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT q.id, q.team_id AS teamId, q.question, q.options, a.chosen,
       CASE WHEN a.id IS NOT NULL THEN q.answer ELSE NULL END AS answer,
       a.correct, a.created_at AS answeredAt
     FROM trivia_questions q LEFT JOIN trivia_answers a ON a.id = (
       SELECT MAX(last_answer.id) FROM trivia_answers last_answer WHERE last_answer.uid = ? AND last_answer.question_id = q.id
     )
     WHERE q.active AND (? IS NULL OR q.team_id = ? OR q.team_id IS NULL)
     ORDER BY (q.team_id <=> ?) DESC, (q.team_id IS NULL) DESC, q.id`,
    [uid, teamId, teamId, teamId],
  );
  return rows.map((row) => ({
    ...row,
    chosen: row['chosen'] === null ? null : Number(row['chosen']),
    answer: row['answer'] === null ? null : Number(row['answer']),
    correct: row['correct'] === null ? null : Boolean(row['correct']),
  }));
}
