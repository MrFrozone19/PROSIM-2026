/** Física determinista compartida por el navegador y la validación del servidor. Sin dependencias de entorno. */
export const FLIGHT = {
  version: 1,
  width: 360,
  height: 480,
  floor: 452,
  fps: 60,
  ballX: 86,
  radius: 11,
  gravity: 0.22,
  flapVelocity: -4.1,
  gateWidth: 46,
  gateGap: 158,
  gateSpacing: 176,
  speed: 2.1,
  target: 10,
  maxFrames: 3600,
  flapCooldown: 6,
  xpPerGate: 10,
  winXp: 50,
  xpLimit24h: 300,
} as const;

export interface Gate {
  x: number;
  center: number;
  passed: boolean;
}
export interface FlightState {
  frame: number;
  y: number;
  velocity: number;
  score: number;
  ended: boolean;
  won: boolean;
  gates: Gate[];
}

export function createFlight(seed: number): FlightState {
  let value = seed >>> 0;
  let center = 240;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const gates = Array.from({ length: FLIGHT.target }, (_, i) => {
    center = Math.max(145, Math.min(315, center + (random() - 0.5) * 110));
    return { x: 420 + i * FLIGHT.gateSpacing, center, passed: false };
  });
  return { frame: 0, y: 240, velocity: 0, score: 0, ended: false, won: false, gates };
}

/** Un tick fijo. No usa tiempo real ni azar después de crear el nivel. */
export function stepFlight(state: FlightState, flap: boolean): void {
  if (state.ended) return;
  if (flap) state.velocity = FLIGHT.flapVelocity;
  state.velocity += FLIGHT.gravity;
  state.y += state.velocity;
  for (const gate of state.gates) gate.x -= FLIGHT.speed;
  state.frame++;
  if (state.y - FLIGHT.radius <= 0 || state.y + FLIGHT.radius >= FLIGHT.floor) {
    state.ended = true;
    return;
  }
  for (const gate of state.gates) {
    const overlaps =
      FLIGHT.ballX + FLIGHT.radius > gate.x &&
      FLIGHT.ballX - FLIGHT.radius < gate.x + FLIGHT.gateWidth;
    if (
      overlaps &&
      (state.y - FLIGHT.radius < gate.center - FLIGHT.gateGap / 2 ||
        state.y + FLIGHT.radius > gate.center + FLIGHT.gateGap / 2)
    ) {
      state.ended = true;
      return;
    }
    if (!gate.passed && gate.x + FLIGHT.gateWidth < FLIGHT.ballX - FLIGHT.radius) {
      gate.passed = true;
      state.score++;
    }
  }
  if (state.score === FLIGHT.target) {
    state.won = true;
    state.ended = true;
  }
  if (state.frame >= FLIGHT.maxFrames) state.ended = true;
}

export interface FlightReplay {
  score: number;
  won: boolean;
  frames: number;
}

/** Reconstruye el resultado a partir de los saltos. Nunca confía en un score enviado por el cliente. */
export function replayFlight(seed: number, input: unknown): FlightReplay {
  if (!Array.isArray(input) || input.length > FLIGHT.maxFrames / FLIGHT.flapCooldown) {
    throw new Error('Registro de saltos inválido');
  }
  let previous = -FLIGHT.flapCooldown;
  for (const frame of input) {
    if (
      !Number.isInteger(frame) ||
      frame < 0 ||
      frame >= FLIGHT.maxFrames ||
      frame - previous < FLIGHT.flapCooldown
    ) {
      throw new Error('Registro de saltos inválido');
    }
    previous = frame;
  }
  const state = createFlight(seed);
  let cursor = 0;
  while (!state.ended) {
    const flap = input[cursor] === state.frame;
    if (flap) cursor++;
    stepFlight(state, flap);
  }
  if (cursor !== input.length) throw new Error('Hay saltos posteriores al final de la partida');
  return { score: state.score, won: state.won, frames: state.frame };
}
