// Verifica el catálogo completo, referencias cruzadas y preguntas sin conectarse a producción.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { TEAMS as front } from '../src/app/data/teams.ts';
import { TEAMS as back, CARDS, TRIVIA } from '../api/src/catalog.ts';
import { STANDINGS } from '../src/app/data/standings.ts';
import { AR_TARGETS } from '../src/app/data/targets.ts';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'design/targets/targets.json'), 'utf8'));
const expected = [
  'nyy',
  'bos',
  'hou',
  'tor',
  'bal',
  'tex',
  'det',
  'cle',
  'tb',
  'cws',
  'kc',
  'min',
  'ath',
  'laa',
  'sea',
];
const ids = front.map((t) => t.id);
assert.deepEqual([...ids].sort(), [...expected].sort());
assert.equal(new Set(ids).size, 15);
assert.deepEqual(
  front.map(({ mlbId, logo, ...team }) => team),
  back,
  'Catálogos de frontend/API diferentes',
);
assert.equal(AR_TARGETS.length, manifest.length);
assert.deepEqual(
  manifest.slice(0, 3).map((t) => t.file),
  ['nyy-navy.png', 'nyy-white.png', 'nyy-card.png'],
);
for (const [index, target] of AR_TARGETS.entries()) {
  assert.equal(target.index, index);
  assert.equal(target.teamId, manifest[index].team);
  assert.equal(target.model, `assets/models/cube-${target.teamId}.glb`);
  assert.ok(ids.includes(target.teamId));
  await readFile(resolve(root, 'design/targets', manifest[index].file));
}
assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length);
assert.equal(new Set(TRIVIA.map((q) => q.id)).size, TRIVIA.length);
assert.equal(STANDINGS.length, 15);
for (const division of ['AL East', 'AL Central', 'AL West']) {
  const teams = front.filter((t) => t.division === division);
  assert.equal(teams.length, 5);
  const rows = STANDINGS.filter((r) => teams.some((t) => t.id === r.teamId));
  assert.equal(rows.length, 5);
  assert.equal(rows[0].gamesBack, '-');
  for (const row of rows) {
    assert.equal(row.wins + row.losses, 139);
    const gb = (rows[0].wins - row.wins + row.losses - rows[0].losses) / 2;
    assert.equal(row.gamesBack === '-' ? 0 : Number(row.gamesBack), gb);
  }
}
for (const team of front) {
  assert.ok(
    AR_TARGETS.some((t) => t.teamId === team.id),
    `${team.id}: sin marcador`,
  );
  assert.equal(
    CARDS.filter((c) => c.teamId === team.id).length,
    1,
    `${team.id}: carta faltante o duplicada`,
  );
  assert.ok(
    TRIVIA.filter((q) => q.teamId === team.id).length >= 3,
    `${team.id}: menos de tres preguntas`,
  );
  assert.equal(STANDINGS.filter((s) => s.teamId === team.id).length, 1);
  await readFile(resolve(root, 'src', team.logo));
  const glb = await readFile(resolve(root, `src/assets/models/cube-${team.id}.glb`));
  assert.equal(glb.toString('ascii', 0, 4), 'glTF');
  assert.equal(glb.readUInt32LE(4), 2);
  assert.equal(glb.readUInt32LE(8), glb.length);
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  assert.ok(json.nodes.some((node) => node.extras?.teamId === team.id && node.extras?.placeholder));
  assert.equal(json.images.length, 1, `${team.id}: falta la textura del logo`);
  assert.ok(json.animations.length >= 1);
  assert.ok(glb.length < 200_000, `${team.id}: cubo demasiado pesado`);
}
for (const q of TRIVIA) {
  assert.ok(q.teamId === null || ids.includes(q.teamId));
  assert.ok(q.options.length >= 2 && q.options.length <= 6);
  assert.equal(new Set(q.options).size, q.options.length);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
}
assert.deepEqual(
  TRIVIA.filter((q) => q.id < 10).map((q) => q.id),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
);
console.log(
  `OK: 15 equipos, ${AR_TARGETS.length} marcadores, 15 cubos, 15 cartas, ${TRIVIA.length} trivias y tres divisiones completas.`,
);
