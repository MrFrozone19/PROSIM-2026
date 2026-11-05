import express, { type NextFunction, type Request, type Response } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { requireAdmin, requireUser } from './auth.js';
import { migrate, pool } from './db.js';
import { deleteUserFiles, gallery } from './gallery.js';
import { XP, levelOf, reward, totalXp, weeklyStanding } from './progress.js';

const FILTERS = new Set(['pixelate', 'thermal', 'pastel', 'blur', 'color']);
/** Escanear el mismo logo otra vez solo da XP si pasó este tiempo desde el último escaneo de ese equipo. */
const RESCAN_COOLDOWN_MIN = 60;

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '16kb' }));

const api = express.Router();
app.use('/api', api);

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Todo lo que sigue requiere sesión.
api.use(requireUser);

const uidOf = (req: Request) => req.user!.uid;

async function teamExists(id: unknown): Promise<boolean> {
  if (typeof id !== 'string') return false;
  const [rows] = await pool.query<RowDataPacket[]>('SELECT 1 FROM teams WHERE id = ?', [id]);
  return rows.length > 0;
}

function bad(res: Response, error: string): void {
  res.status(400).json({ error });
}

// ---------- Perfil ----------

api.get('/me', async (req, res) => {
  const uid = uidOf(req);
  const [[u], [counts], xp, weekly] = await Promise.all([
    pool.query<RowDataPacket[]>('SELECT * FROM users WHERE uid = ?', [uid]).then(([r]) => r),
    pool
      .query<RowDataPacket[]>(
        `SELECT
           (SELECT COUNT(*) FROM user_cards WHERE uid = ?) AS cards,
           (SELECT COUNT(*) FROM cards) AS cardsTotal,
           (SELECT COUNT(*) FROM user_trophies WHERE uid = ?) AS trophies,
           (SELECT COUNT(*) FROM user_badges WHERE uid = ?) AS badges,
           (SELECT COUNT(*) FROM scans WHERE uid = ?) AS scans,
           (SELECT COUNT(DISTINCT team_id) FROM scans WHERE uid = ?) AS teamsScanned`,
        [uid, uid, uid, uid, uid],
      )
      .then(([r]) => r),
    totalXp(uid),
    weeklyStanding(uid),
  ]);
  res.json({
    uid,
    email: u['email'],
    displayName: u['display_name'],
    photoUrl: u['photo_url'],
    favoriteTeam: u['favorite_team'],
    role: u['role'],
    createdAt: u['created_at'],
    xp,
    ...levelOf(xp),
    weekly,
    counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Number(v)])),
  });
});

api.patch('/me', async (req, res) => {
  const { displayName, favoriteTeam } = req.body ?? {};
  const sets: string[] = [];
  const params: unknown[] = [];
  if (displayName !== undefined) {
    const name = typeof displayName === 'string' ? displayName.trim() : '';
    if (name.length < 2 || name.length > 40) return bad(res, 'El nombre debe tener de 2 a 40 caracteres');
    sets.push('display_name = ?');
    params.push(name);
  }
  if (favoriteTeam !== undefined) {
    if (favoriteTeam !== null && !(await teamExists(favoriteTeam))) return bad(res, 'Equipo inválido');
    sets.push('favorite_team = ?');
    params.push(favoriteTeam);
  }
  if (!sets.length) return bad(res, 'Nada que actualizar');
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE uid = ?`, [...params, uidOf(req)]);
  res.json({ ok: true });
});

/**
 * Borra todos los datos del usuario: archivos de la galería y filas (las tablas de progreso caen en cascada).
 * La cuenta de Firebase la borra el front.
 */
api.delete('/me', async (req, res) => {
  await deleteUserFiles(uidOf(req));
  await pool.query('DELETE FROM users WHERE uid = ?', [uidOf(req)]);
  res.json({ ok: true });
});

api.use('/gallery', gallery);

// ---------- Colección (Vault) ----------

api.get('/collection', async (req, res) => {
  const uid = uidOf(req);
  const [[cards], [trophies], [badges]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT c.id, c.name, c.team_id AS teamId, c.rarity, c.serial, c.power, c.speed, c.charisma, c.art,
         uc.obtained_at AS obtainedAt
       FROM cards c LEFT JOIN user_cards uc ON uc.card_id = c.id AND uc.uid = ?
       ORDER BY (uc.obtained_at IS NULL), c.sort`,
      [uid],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT t.id, t.code, t.title, t.description, t.rarity, ut.unlocked_at AS unlockedAt
       FROM trophies t LEFT JOIN user_trophies ut ON ut.trophy_id = t.id AND ut.uid = ?
       ORDER BY (ut.unlocked_at IS NULL), ut.unlocked_at DESC, t.sort`,
      [uid],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT b.id, b.label, b.description, ub.earned_at AS earnedAt
       FROM badges b LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.uid = ?
       ORDER BY b.sort`,
      [uid],
    ),
  ]);
  res.json({ cards, trophies, badges });
});

// ---------- Acciones que dan XP ----------

api.post('/scans', async (req, res) => {
  const uid = uidOf(req);
  const { teamId, durationMs } = req.body ?? {};
  if (!(await teamExists(teamId))) return bad(res, 'Equipo inválido');
  const ms = Number.isFinite(durationMs) ? Math.max(0, Math.min(600_000, Math.round(durationMs))) : null;

  const [[prev]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total,
       SUM(created_at >= UTC_TIMESTAMP() - INTERVAL ? MINUTE) AS recent
     FROM scans WHERE uid = ? AND team_id = ?`,
    [RESCAN_COOLDOWN_MIN, uid, teamId],
  );
  await pool.query('INSERT INTO scans (uid, team_id, duration_ms) VALUES (?, ?, ?)', [uid, teamId, ms]);

  const first = Number(prev['total']) === 0;
  let card = null;
  if (first) {
    const [cards] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, rarity FROM cards WHERE team_id = ? ORDER BY sort LIMIT 1',
      [teamId],
    );
    if (cards[0]) {
      const [r] = await pool.query<ResultSetHeader>(
        'INSERT IGNORE INTO user_cards (uid, card_id) VALUES (?, ?)',
        [uid, cards[0]['id']],
      );
      if (r.affectedRows) card = cards[0] as { id: string; name: string; rarity: string };
    }
  }
  const xp = first ? XP.firstScanOfTeam : Number(prev['recent'] ?? 0) > 0 ? 0 : XP.repeatScan;
  res.json({ firstScanOfTeam: first, ...(await reward(uid, xp, `scan:${teamId}`, card)) });
});

api.get('/trivia', async (req, res) => {
  const teamId = typeof req.query['teamId'] === 'string' ? req.query['teamId'] : null;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, team_id AS teamId, question, options FROM trivia_questions
     WHERE active AND (? IS NULL OR team_id = ? OR team_id IS NULL)
     ORDER BY (team_id <=> ?) DESC, (team_id IS NULL) DESC, id`,
    [teamId, teamId, teamId],
  );
  res.json(rows);
});

api.post('/trivia/:id/answer', async (req, res) => {
  const uid = uidOf(req);
  const id = Number(req.params['id']);
  const option = Number(req.body?.option);
  const [[q]] = await pool.query<RowDataPacket[]>(
    'SELECT answer, JSON_LENGTH(options) AS n FROM trivia_questions WHERE id = ? AND active',
    [id],
  );
  if (!q) return void res.status(404).json({ error: 'Pregunta no encontrada' });
  if (!Number.isInteger(option) || option < 0 || option >= Number(q['n'])) return bad(res, 'Opción inválida');

  const correct = option === Number(q['answer']);
  const [[before]] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM trivia_answers WHERE uid = ? AND question_id = ? AND correct',
    [uid, id],
  );
  await pool.query(
    'INSERT INTO trivia_answers (uid, question_id, chosen, correct) VALUES (?, ?, ?, ?)',
    [uid, id, option, correct],
  );
  // Solo la primera respuesta correcta de cada pregunta da XP, para que no se pueda farmear.
  const xp = correct && Number(before['n']) === 0 ? XP.triviaFirstCorrect : 0;
  res.json({ correct, answer: Number(q['answer']), ...(await reward(uid, xp, `trivia:${id}`)) });
});

api.post('/events', async (req, res) => {
  const uid = uidOf(req);
  const { type, value } = req.body ?? {};
  if (type === 'filter' && !FILTERS.has(value)) return bad(res, 'Filtro inválido');
  if (type !== 'effect' && type !== 'filter') return bad(res, 'Evento inválido');

  const [[prev]] = await pool.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM activity WHERE uid = ? AND type = ?',
    [uid, type],
  );
  await pool.query('INSERT INTO activity (uid, type, value) VALUES (?, ?, ?)', [
    uid,
    type,
    type === 'filter' ? value : null,
  ]);
  const xp = type === 'effect' && Number(prev['n']) === 0 ? XP.firstEffect : 0;
  res.json(await reward(uid, xp, `event:${type}`));
});

// ---------- Leaderboard ----------

api.get('/leaderboard', async (req, res) => {
  const uid = uidOf(req);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.uid, u.display_name AS name, u.photo_url AS photoUrl, SUM(x.amount) AS points
     FROM xp_events x JOIN users u ON u.uid = x.uid
     WHERE x.created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY
     GROUP BY u.uid ORDER BY points DESC, MIN(x.created_at) LIMIT 10`,
  );
  res.json({
    entries: rows.map((r, i) => ({
      rank: i + 1,
      name: r['name'],
      photoUrl: r['photoUrl'],
      points: Number(r['points']),
      me: r['uid'] === uid,
    })),
    me: await weeklyStanding(uid),
  });
});

// ---------- Administración ----------

const admin = express.Router();
api.use('/admin', requireAdmin, admin);

admin.get('/users', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.uid, u.email, u.display_name AS displayName, u.role, u.created_at AS createdAt,
       u.last_seen_at AS lastSeenAt, COALESCE(SUM(x.amount), 0) AS xp
     FROM users u LEFT JOIN xp_events x ON x.uid = u.uid
     GROUP BY u.uid ORDER BY u.last_seen_at DESC`,
  );
  res.json(rows);
});

function parseQuestion(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const options = Array.isArray(b['options']) ? b['options'].map(String) : [];
  const answer = Number(b['answer']);
  const question = typeof b['question'] === 'string' ? b['question'].trim() : '';
  if (!question || question.length > 255) return null;
  if (options.length < 2 || options.length > 6) return null;
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
  return { question, options, answer, teamId: (b['teamId'] as string | null | undefined) ?? null };
}

admin.post('/trivia', async (req, res) => {
  const q = parseQuestion(req.body);
  if (!q) return bad(res, 'Pregunta inválida');
  if (q.teamId !== null && !(await teamExists(q.teamId))) return bad(res, 'Equipo inválido');
  const [r] = await pool.query<ResultSetHeader>(
    'INSERT INTO trivia_questions (team_id, question, options, answer) VALUES (?, ?, ?, ?)',
    [q.teamId, q.question, JSON.stringify(q.options), q.answer],
  );
  res.status(201).json({ id: r.insertId });
});

admin.put('/trivia/:id', async (req, res) => {
  const q = parseQuestion(req.body);
  if (!q) return bad(res, 'Pregunta inválida');
  if (q.teamId !== null && !(await teamExists(q.teamId))) return bad(res, 'Equipo inválido');
  const [r] = await pool.query<ResultSetHeader>(
    'UPDATE trivia_questions SET team_id = ?, question = ?, options = ?, answer = ? WHERE id = ?',
    [q.teamId, q.question, JSON.stringify(q.options), q.answer, Number(req.params['id'])],
  );
  if (!r.affectedRows) return void res.status(404).json({ error: 'Pregunta no encontrada' });
  res.json({ ok: true });
});

/** Se desactiva en lugar de borrar, para no perder las respuestas ya registradas. */
admin.delete('/trivia/:id', async (req, res) => {
  await pool.query('UPDATE trivia_questions SET active = FALSE WHERE id = ?', [Number(req.params['id'])]);
  res.json({ ok: true });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno' });
});

/** Cloud SQL puede tardar unos segundos en aceptar conexiones en un arranque en frío. */
async function migrateWithRetry(attempts = 10): Promise<void> {
  for (let i = 1; ; i++) {
    try {
      await migrate();
      return;
    } catch (e) {
      if (i >= attempts) throw e;
      console.warn(`MySQL no disponible (intento ${i}/${attempts}), reintentando…`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

await migrateWithRetry();
const port = Number(process.env['PORT'] ?? 8080);
app.listen(port, () => console.log(`basedex-api escuchando en :${port}`));
