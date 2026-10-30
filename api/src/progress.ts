import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { pool } from './db.js';

/** XP por nivel: el nivel 1 va de 0 a 499, el 2 de 500 a 999, etc. */
export const XP_PER_LEVEL = 500;

export const XP = {
  firstScanOfTeam: 100,
  repeatScan: 10,
  triviaFirstCorrect: 50,
  firstEffect: 25,
  trophy: 50,
} as const;

export function levelOf(xp: number) {
  return { level: Math.floor(xp / XP_PER_LEVEL) + 1, levelXp: xp % XP_PER_LEVEL, levelXpMax: XP_PER_LEVEL };
}

export interface Unlocks {
  trophies: { id: string; code: string; title: string; rarity: string }[];
  badges: { id: string; label: string }[];
}

/** Lo que el front muestra después de una acción: XP ganada, subida de nivel, carta y logros nuevos. */
export interface Reward extends Unlocks {
  xpGained: number;
  xp: number;
  level: number;
  leveledUp: boolean;
  card: { id: string; name: string; rarity: string } | null;
}

export async function totalXp(uid: string): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE uid = ?',
    [uid],
  );
  return Number(rows[0]['xp']);
}

export async function addXp(uid: string, amount: number, reason: string): Promise<void> {
  if (amount <= 0) return;
  await pool.query('INSERT INTO xp_events (uid, amount, reason) VALUES (?, ?, ?)', [uid, amount, reason]);
}

/** Puntos de los últimos 7 días y lugar en el leaderboard semanal (1 = primero; null sin puntos). */
export async function weeklyStanding(uid: string): Promise<{ points: number; rank: number | null }> {
  const [mine] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) AS points FROM xp_events
     WHERE uid = ? AND created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
    [uid],
  );
  const points = Number(mine[0]['points']);
  if (points <= 0) return { points, rank: null };
  const [ahead] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM (
       SELECT uid, SUM(amount) AS s FROM xp_events
       WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY GROUP BY uid HAVING s > ?
     ) t`,
    [points],
  );
  return { points, rank: Number(ahead[0]['n']) + 1 };
}

interface Stats {
  scans: number;
  teamsScanned: Set<string>;
  fastScan: boolean;
  effects: number;
  filtersDistinct: number;
  correctAnswers: number;
  questionsMastered: number;
  activeQuestions: number;
  cardsOwned: number;
  divisionsOwned: number;
  eastTeams: string[];
  weeklyRank: number | null;
  weeklyPlayers: number;
  filteredVideos: number;
}

async function statsOf(uid: string): Promise<Stats> {
  const one = async (sql: string, params: unknown[] = [uid]) => {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows;
  };
  const [scans, teams, act, trivia, active, cards, east, players, videos, weekly] = await Promise.all([
    one('SELECT COUNT(*) AS n, COALESCE(MIN(duration_ms) < 1000, 0) AS fast FROM scans WHERE uid = ?'),
    one('SELECT DISTINCT team_id FROM scans WHERE uid = ?'),
    one(
      `SELECT SUM(type = 'effect') AS effects,
         COUNT(DISTINCT CASE WHEN type = 'filter' THEN value END) AS distinctFilters
       FROM activity WHERE uid = ?`,
    ),
    one(
      `SELECT SUM(correct) AS correct, COUNT(DISTINCT CASE WHEN correct THEN question_id END) AS mastered
       FROM trivia_answers WHERE uid = ?`,
    ),
    one('SELECT COUNT(*) AS n FROM trivia_questions WHERE active', []),
    one(
      `SELECT COUNT(*) AS n, COUNT(DISTINCT t.division) AS divisions
       FROM user_cards uc JOIN cards c ON c.id = uc.card_id JOIN teams t ON t.id = c.team_id
       WHERE uc.uid = ?`,
    ),
    one(`SELECT id FROM teams WHERE division = 'AL East'`, []),
    one(
      `SELECT COUNT(DISTINCT uid) AS n FROM xp_events WHERE created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
      [],
    ),
    one(`SELECT COUNT(*) AS n FROM gallery_items WHERE uid = ? AND kind = 'video' AND filter IS NOT NULL`),
    weeklyStanding(uid),
  ]);
  return {
    scans: Number(scans[0]['n']),
    teamsScanned: new Set(teams.map((r) => r['team_id'] as string)),
    fastScan: Number(scans[0]['fast']) === 1,
    effects: Number(act[0]['effects'] ?? 0),
    filtersDistinct: Number(act[0]['distinctFilters'] ?? 0),
    correctAnswers: Number(trivia[0]['correct'] ?? 0),
    questionsMastered: Number(trivia[0]['mastered'] ?? 0),
    activeQuestions: Number(active[0]['n']),
    cardsOwned: Number(cards[0]['n']),
    divisionsOwned: Number(cards[0]['divisions']),
    eastTeams: east.map((r) => r['id'] as string),
    weeklyRank: weekly.rank,
    weeklyPlayers: Number(players[0]['n']),
    filteredVideos: Number(videos[0]['n']),
  };
}

/** Regla de cada trofeo e insignia del catálogo (por id). */
const TROPHY_RULES: Record<string, (s: Stats) => boolean> = {
  t1: (s) => s.eastTeams.length > 0 && s.eastTeams.every((t) => s.teamsScanned.has(t)),
  t2: (s) => s.fastScan,
  t3: (s) => s.effects >= 1,
  t4: (s) => s.correctAnswers >= 10,
  t5: (s) => s.filtersDistinct >= 5,
  t6: (s) => s.divisionsOwned >= 3,
};

const BADGE_RULES: Record<string, (s: Stats) => boolean> = {
  b1: (s) => s.scans >= 1,
  b2: (s) => s.cardsOwned >= 5,
  b3: (s) => s.teamsScanned.size >= 3,
  b4: (s) => s.filteredVideos >= 3,
  // Con menos de 3 jugadores en la semana cualquiera sería "top 3": no cuenta.
  b5: (s) => s.weeklyPlayers >= 3 && s.weeklyRank !== null && s.weeklyRank <= 3,
  b6: (s) => s.activeQuestions > 0 && s.questionsMastered >= s.activeQuestions,
};

/** Revisa todas las reglas y guarda los logros que se acaban de cumplir. Cada trofeo nuevo suma XP. */
export async function evaluate(uid: string): Promise<Unlocks> {
  const s = await statsOf(uid);
  const out: Unlocks = { trophies: [], badges: [] };

  for (const [id, rule] of Object.entries(TROPHY_RULES)) {
    if (!rule(s)) continue;
    const [r] = await pool.query<ResultSetHeader>(
      'INSERT IGNORE INTO user_trophies (uid, trophy_id) VALUES (?, ?)',
      [uid, id],
    );
    if (r.affectedRows === 0) continue;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, code, title, rarity FROM trophies WHERE id = ?',
      [id],
    );
    out.trophies.push(rows[0] as Unlocks['trophies'][number]);
    await addXp(uid, XP.trophy, `trophy:${id}`);
  }
  for (const [id, rule] of Object.entries(BADGE_RULES)) {
    if (!rule(s)) continue;
    const [r] = await pool.query<ResultSetHeader>(
      'INSERT IGNORE INTO user_badges (uid, badge_id) VALUES (?, ?)',
      [uid, id],
    );
    if (r.affectedRows === 0) continue;
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id, label FROM badges WHERE id = ?', [id]);
    out.badges.push(rows[0] as Unlocks['badges'][number]);
  }
  return out;
}

/** Suma la XP de una acción, revisa logros y arma la respuesta para el front. */
export async function reward(
  uid: string,
  xpGained: number,
  reason: string,
  card: Reward['card'] = null,
): Promise<Reward> {
  const before = await totalXp(uid);
  await addXp(uid, xpGained, reason);
  const unlocks = await evaluate(uid);
  const xp = await totalXp(uid);
  const { level } = levelOf(xp);
  return {
    ...unlocks,
    xpGained: xp - before,
    xp,
    level,
    leveledUp: level > levelOf(before).level,
    card,
  };
}
