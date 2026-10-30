import mysql from 'mysql2/promise';
import { BADGES, CARDS, TEAMS, TRIVIA, TROPHIES } from './catalog.js';

/**
 * Pool de conexiones. En Cloud Run se conecta por el socket que monta Cloud SQL (DB_SOCKET_PATH);
 * en local, por TCP al MySQL de compose.yaml.
 */
export const pool = mysql.createPool({
  socketPath: process.env['DB_SOCKET_PATH'] || undefined,
  host: process.env['DB_SOCKET_PATH'] ? undefined : (process.env['DB_HOST'] ?? '127.0.0.1'),
  port: Number(process.env['DB_PORT'] ?? 3306),
  user: process.env['DB_USER'] ?? 'basedex',
  password: process.env['DB_PASSWORD'] ?? '',
  database: process.env['DB_NAME'] ?? 'basedex',
  connectionLimit: 5,
  timezone: 'Z',
  dateStrings: false,
});

/** Tablas: catálogo (equipos, cartas, trofeos, insignias, trivia) y progreso por usuario. Idempotente. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS teams (
    id VARCHAR(8) PRIMARY KEY,
    abbr VARCHAR(4) NOT NULL,
    city VARCHAR(40) NOT NULL,
    name VARCHAR(40) NOT NULL,
    mascot VARCHAR(60) NOT NULL,
    division ENUM('AL East','AL Central','AL West') NOT NULL,
    color CHAR(7) NOT NULL,
    founded SMALLINT NOT NULL,
    titles TINYINT NOT NULL,
    stadium VARCHAR(60) NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(16) PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    team_id VARCHAR(8) NOT NULL,
    rarity ENUM('mythic','legendary','epic','rare','uncommon','common') NOT NULL,
    serial VARCHAR(16) NOT NULL,
    power TINYINT NOT NULL,
    speed TINYINT NOT NULL,
    charisma TINYINT NOT NULL,
    art VARCHAR(120) NULL,
    sort SMALLINT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )`,
  `CREATE TABLE IF NOT EXISTS trophies (
    id VARCHAR(16) PRIMARY KEY,
    code CHAR(2) NOT NULL,
    title VARCHAR(60) NOT NULL,
    description VARCHAR(160) NOT NULL,
    rarity ENUM('mythic','legendary','epic','rare','uncommon','common') NOT NULL,
    sort SMALLINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(16) PRIMARY KEY,
    label VARCHAR(40) NOT NULL,
    description VARCHAR(160) NOT NULL,
    sort SMALLINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS trivia_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id VARCHAR(8) NULL,
    question VARCHAR(255) NOT NULL,
    options JSON NOT NULL,
    answer TINYINT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(255) NULL,
    display_name VARCHAR(60) NOT NULL,
    photo_url VARCHAR(500) NULL,
    favorite_team VARCHAR(8) NULL,
    role ENUM('fan','admin') NOT NULL DEFAULT 'fan',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (favorite_team) REFERENCES teams(id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_cards (
    uid VARCHAR(128) NOT NULL,
    card_id VARCHAR(16) NOT NULL,
    obtained_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (uid, card_id),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_trophies (
    uid VARCHAR(128) NOT NULL,
    trophy_id VARCHAR(16) NOT NULL,
    unlocked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (uid, trophy_id),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (trophy_id) REFERENCES trophies(id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_badges (
    uid VARCHAR(128) NOT NULL,
    badge_id VARCHAR(16) NOT NULL,
    earned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (uid, badge_id),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id)
  )`,
  `CREATE TABLE IF NOT EXISTS scans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) NOT NULL,
    team_id VARCHAR(8) NOT NULL,
    duration_ms INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (uid, team_id),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id)
  )`,
  `CREATE TABLE IF NOT EXISTS trivia_answers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) NOT NULL,
    question_id INT NOT NULL,
    chosen TINYINT NOT NULL,
    correct BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (uid, question_id),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES trivia_questions(id) ON DELETE CASCADE
  )`,
  /** Acciones que cuentan para logros (efectos, filtros de video). */
  `CREATE TABLE IF NOT EXISTS activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) NOT NULL,
    type VARCHAR(16) NOT NULL,
    value VARCHAR(32) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (uid, type),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
  )`,
  /** Libro de puntos: el total da el nivel y la suma de los últimos 7 días, el leaderboard semanal. */
  `CREATE TABLE IF NOT EXISTS xp_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(128) NOT NULL,
    amount INT NOT NULL,
    reason VARCHAR(32) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (uid, created_at),
    INDEX (created_at),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
  )`,
];

/** Crea las tablas que falten y sincroniza el catálogo definido en catalog.ts. */
export async function migrate(): Promise<void> {
  for (const sql of SCHEMA) await pool.query(sql);

  for (const t of TEAMS) {
    await pool.query(
      `INSERT INTO teams (id, abbr, city, name, mascot, division, color, founded, titles, stadium)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE abbr = VALUES(abbr), city = VALUES(city), name = VALUES(name),
         mascot = VALUES(mascot), division = VALUES(division), color = VALUES(color),
         founded = VALUES(founded), titles = VALUES(titles), stadium = VALUES(stadium)`,
      [t.id, t.abbr, t.city, t.name, t.mascot, t.division, t.color, t.founded, t.titles, t.stadium],
    );
  }
  for (const [i, c] of CARDS.entries()) {
    await pool.query(
      `INSERT INTO cards (id, name, team_id, rarity, serial, power, speed, charisma, art, sort)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), team_id = VALUES(team_id), rarity = VALUES(rarity),
         serial = VALUES(serial), power = VALUES(power), speed = VALUES(speed),
         charisma = VALUES(charisma), art = VALUES(art), sort = VALUES(sort)`,
      [c.id, c.name, c.teamId, c.rarity, c.serial, c.power, c.speed, c.charisma, c.art ?? null, i],
    );
  }
  for (const [i, t] of TROPHIES.entries()) {
    await pool.query(
      `INSERT INTO trophies (id, code, title, description, rarity, sort) VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), title = VALUES(title),
         description = VALUES(description), rarity = VALUES(rarity), sort = VALUES(sort)`,
      [t.id, t.code, t.title, t.description, t.rarity, i],
    );
  }
  for (const [i, b] of BADGES.entries()) {
    await pool.query(
      `INSERT INTO badges (id, label, description, sort) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE label = VALUES(label), description = VALUES(description), sort = VALUES(sort)`,
      [b.id, b.label, b.description, i],
    );
  }
  // La trivia solo se siembra si falta: las ediciones del admin no se pisan al reiniciar.
  for (const q of TRIVIA) {
    await pool.query(
      `INSERT IGNORE INTO trivia_questions (id, team_id, question, options, answer) VALUES (?, ?, ?, ?, ?)`,
      [q.id, q.teamId, q.question, JSON.stringify(q.options), q.answer],
    );
  }
}
