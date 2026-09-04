import { Injectable, signal } from '@angular/core';

/**
 * Retroalimentación al usuario: sonido corto + vibración (si el dispositivo lo permite).
 * La rúbrica pide indicadores visuales o auditivos al realizar acciones.
 */
@Injectable({ providedIn: 'root' })
export class Feedback {
  private ctx?: AudioContext;
  readonly muted = signal(false);

  /** Toque genérico de botón. */
  tap(): void {
    this.play(880, 0.05, 'square', 0.025);
    this.vibrate(8);
  }

  /** Acción completada / respuesta correcta. */
  success(): void {
    this.play(660, 0.09);
    setTimeout(() => this.play(990, 0.14), 90);
    this.vibrate([10, 40, 12]);
  }

  /** Respuesta incorrecta / error. */
  error(): void {
    this.play(200, 0.18, 'sawtooth', 0.04);
    this.vibrate(35);
  }

  toggleMute(): void {
    this.muted.update((m) => !m);
  }

  private play(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.05): void {
    if (this.muted()) return;
    try {
      const ctx = (this.ctx ??= new AudioContext());
      if (ctx.state === 'suspended') void ctx.resume();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {
      /* sin audio disponible */
    }
  }

  private vibrate(pattern: number | number[]): void {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* sin vibración */
    }
  }
}
