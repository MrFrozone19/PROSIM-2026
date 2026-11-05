import { FLIGHT, createFlight, stepFlight } from '../src/game-physics.ts';

/** Jugador de prueba que mantiene la pelota dentro del próximo hueco. */
export function winningFlaps(seed: number): number[] {
  const world = createFlight(seed),
    flaps: number[] = [];
  let last = -FLIGHT.flapCooldown;
  while (!world.ended) {
    const gate = world.gates.find((g) => !g.passed)!;
    const flap =
      world.frame - last >= FLIGHT.flapCooldown && world.velocity >= 0 && world.y > gate.center + 8;
    if (flap) {
      flaps.push(world.frame);
      last = world.frame;
    }
    stepFlight(world, flap);
  }
  if (!world.won) throw new Error(`El nivel ${seed} no pudo completarse: ${world.score}`);
  return flaps;
}
