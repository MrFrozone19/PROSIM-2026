import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, createFlight, replayFlight, stepFlight } from '../src/game-physics.ts';
import { TEAMS, TRIVIA } from '../src/catalog.ts';
import { winningFlaps } from './flight-helper.ts';

describe('Catálogo de trivia', () => {
  it('tiene 75 preguntas de equipos (5 por cada uno) y conserva 2 generales', () => {
    assert.equal(TRIVIA.length, 77);
    assert.equal(TRIVIA.filter((q) => q.teamId === null).length, 2);
    for (const team of TEAMS)
      assert.equal(TRIVIA.filter((q) => q.teamId === team.id).length, 5, team.id);
    assert.equal(new Set(TRIVIA.map((q) => q.id)).size, 77);
    assert.equal(new Set(TRIVIA.map((q) => q.question)).size, 77);
    for (const q of TRIVIA) {
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
    }
  });
});

describe('Diamond Flight', () => {
  it('reproduce exactamente el mismo resultado en navegador y servidor', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const inputs = winningFlaps(seed);
      const result = replayFlight(seed, inputs);
      assert.equal(result.won, true);
      assert.equal(result.score, FLIGHT.target);
      assert.deepEqual(replayFlight(seed, inputs), result);
    }
  });
  it('pierde al tocar el suelo y no entrega obstáculos no superados', () => {
    const result = replayFlight(1, []);
    assert.equal(result.won, false);
    assert.equal(result.score, 0);
    assert.ok(result.frames > 0 && result.frames < FLIGHT.fps * 2);
  });
  it('detecta una colisión lateral antes de contar el obstáculo', () => {
    const world = createFlight(1);
    world.y = 30;
    world.gates[0].x = FLIGHT.ballX;
    stepFlight(world, false);
    assert.equal(world.ended, true);
    assert.equal(world.score, 0);
  });
  it('rechaza saltos repetidos, desordenados, fuera de rango o posteriores al final', () => {
    for (const input of [
      null,
      {},
      [-1],
      [0, 0],
      [8, 2],
      [0, 2],
      [1.5],
      [FLIGHT.maxFrames],
      [200],
    ]) {
      assert.throws(() => replayFlight(1, input));
    }
  });
});
