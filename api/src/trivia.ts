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
      answer: Number(q['answer']),
      ...(await reward(uid, xp, `trivia:${id}`, null, db)),
    };
  });
}
