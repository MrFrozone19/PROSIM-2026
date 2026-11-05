import type { RowDataPacket, ResultSetHeader, Pool, PoolConnection } from 'mysql2/promise';
import { pool } from './db.js';

export type ProgressDb = Pool | PoolConnection;

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
  return {
    level: Math.floor(xp / XP_PER_LEVEL) + 1,
    levelXp: xp % XP_PER_LEVEL,
    levelXpMax: XP_PER_LEVEL,
  };
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

export async function totalXp(uid: string, db: ProgressDb = pool): Promise<number> {
  const [rows] = await db.query<RowDataPacket[]>(
    'SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE uid = ?',
    [uid],
  );
  return Number(rows[0]['xp']);
}

export async function addXp(
  uid: string,
  amount: number,
  reason: string,
  db: ProgressDb = pool,
): Promise<void> {
  if (amount <= 0) return;
  await db.query('INSERT INTO xp_events (uid, amount, reason) VALUES (?, ?, ?)', [
    uid,
    amount,
    reason,
  ]);
}

/** Puntos de los últimos 7 días y lugar en el leaderboard semanal (1 = primero; null sin puntos). */
export async function weeklyStanding(
  uid: string,
  db: ProgressDb = pool,
): Promise<{ points: number; rank: number | null }> {
  const [mine] = await db.query<RowDataPacket[]>(
    `SELECT COALESCE(SUM(amount), 0) AS points FROM xp_events
     WHERE uid = ? AND created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
    [uid],
  );
  const points = Number(mine[0]['points']);
  if (points <= 0) return { points, rank: null };
  const [ahead] = await db.query<RowDataPacket[]>(
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
  gameWins: number;
  gameGates: number;
}

async function statsOf(uid: string, db: ProgressDb): Promise<Stats> {
  const one = async (sql: string, params: unknown[] = [uid]) => {
    const [rows] = await db.query<RowDataPacket[]>(sql, params);
    return rows;
  };
  const [scans, teams, act, trivia, active, cards, east, players, videos, weekly, games] =
    await Promise.all([
      one(
        'SELECT COUNT(*) AS n, COALESCE(MIN(duration_ms) < 1000, 0) AS fast FROM scans WHERE uid = ?',
      ),
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
      one(
        `SELECT COUNT(*) AS n FROM gallery_items WHERE uid = ? AND kind = 'video' AND filter IS NOT NULL`,
      ),
      weeklyStanding(uid, db),
      one(`SELECT COALESCE(SUM(won), 0) AS wins, COALESCE(SUM(score), 0) AS gates
         FROM game_runs WHERE uid = ? AND status = 'finished'`),
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
    gameWins: Number(games[0]['wins']),
    gameGates: Number(games[0]['gates']),
  };
}

/** Regla de cada trofeo e insignia del catálogo (por id). */
const TROPHY_RULES: Record<string, (s: Stats) => boolean> = {
  t1: (s) => s.eastTeams.length > 0 && s.eastTeams.every((t) => s.teamsScanned.has(t)),
  t2: (s) => s.fastScan,
  t3: (s) => s.effects >= 1,
  t4: (s) => s.questionsMastered >= 10,
  t5: (s) => s.filtersDistinct >= 5,
  t6: (s) => s.divisionsOwned >= 3,
  t7: (s) => s.gameWins >= 1,
  t8: (s) => s.gameWins >= 5,
};

const BADGE_RULES: Record<string, (s: Stats) => boolean> = {
  b1: (s) => s.scans >= 1,
  b2: (s) => s.cardsOwned >= 5,
  b3: (s) => s.teamsScanned.size >= 3,
  b4: (s) => s.filteredVideos >= 3,
  // Con menos de 3 jugadores en la semana cualquiera sería "top 3": no cuenta.
  b5: (s) => s.weeklyPlayers >= 3 && s.weeklyRank !== null && s.weeklyRank <= 3,
  b6: (s) => s.activeQuestions > 0 && s.questionsMastered >= s.activeQuestions,
  b7: (s) => s.gameGates >= 50,
  b8: (s) => s.gameWins >= 1 && s.questionsMastered >= 5,
};

/** Revisa todas las reglas y guarda los logros que se acaban de cumplir. Cada trofeo nuevo suma XP. */
export async function evaluate(uid: string, db: ProgressDb = pool): Promise<Unlocks> {
  const s = await statsOf(uid, db);
  const out: Unlocks = { trophies: [], badges: [] };

  for (const [id, rule] of Object.entries(TROPHY_RULES)) {
    if (!rule(s)) continue;
    const [r] = await db.query<ResultSetHeader>(
      'INSERT IGNORE INTO user_trophies (uid, trophy_id) VALUES (?, ?)',
      [uid, id],
    );
    if (r.affectedRows === 0) continue;
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT id, code, title, rarity FROM trophies WHERE id = ?',
      [id],
    );
    out.trophies.push(rows[0] as Unlocks['trophies'][number]);
    await addXp(uid, XP.trophy, `trophy:${id}`, db);
  }
  for (const [id, rule] of Object.entries(BADGE_RULES)) {
    if (!rule(s)) continue;
    const [r] = await db.query<ResultSetHeader>(
      'INSERT IGNORE INTO user_badges (uid, badge_id) VALUES (?, ?)',
      [uid, id],
    );
    if (r.affectedRows === 0) continue;
    const [rows] = await db.query<RowDataPacket[]>('SELECT id, label FROM badges WHERE id = ?', [
      id,
    ]);
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
  db: ProgressDb = pool,
): Promise<Reward> {
  const before = await totalXp(uid, db);
  await addXp(uid, xpGained, reason, db);
  const unlocks = await evaluate(uid, db);
  const xp = await totalXp(uid, db);
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

/** El mismo libro de XP alimenta perfil, trivia, juego y clasificación semanal. */
export async function weeklyBreakdown(uid: string, db: ProgressDb = pool) {
  const [[row]] = await db.query<RowDataPacket[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN reason LIKE 'trivia:%' THEN amount ELSE 0 END), 0) AS trivia,
       COALESCE(SUM(CASE WHEN reason LIKE 'game:%' THEN amount ELSE 0 END), 0) AS game,
       COALESCE(SUM(CASE WHEN reason LIKE 'trophy:%' THEN amount ELSE 0 END), 0) AS achievements,
       COALESCE(SUM(CASE WHEN reason NOT LIKE 'trivia:%' AND reason NOT LIKE 'game:%'
         AND reason NOT LIKE 'trophy:%' THEN amount ELSE 0 END), 0) AS exploration,
       COALESCE(SUM(amount), 0) AS total
     FROM xp_events WHERE uid = ? AND created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY`,
    [uid],
  );
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)]));
}

export async function weeklyLeaderboard(uid: string, db: ProgressDb = pool) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT u.uid, u.display_name AS name, u.photo_url AS photoUrl, SUM(x.amount) AS points
     FROM xp_events x JOIN users u ON u.uid = x.uid
     WHERE x.created_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY
     GROUP BY u.uid ORDER BY points DESC, MIN(x.created_at), u.uid LIMIT 10`,
  );
  return {
    entries: rows.map((r) => ({
      rank: rows.findIndex((other) => Number(other['points']) === Number(r['points'])) + 1,
      name: r['name'],
      photoUrl: r['photoUrl'],
      points: Number(r['points']),
      me: r['uid'] === uid,
    })),
    me: await weeklyStanding(uid, db),
  };
}
