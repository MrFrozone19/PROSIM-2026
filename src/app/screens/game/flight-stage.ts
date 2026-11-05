import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  FLIGHT,
  createFlight,
  stepFlight,
  type FlightState,
} from '../../../../api/src/game-physics';
import { GameSession } from '../../core/api';
import { Feedback } from '../../shared/feedback';
import { Icon } from '../../shared/icon';

export interface FlightFinish {
  flaps: number[];
  score: number;
  won: boolean;
}

@Component({
  selector: 'app-flight-stage',
  imports: [Icon],
  template: `
    <div class="relative overflow-hidden rounded-card border border-purple/50 bg-surface">
      <div class="flex items-center justify-between border-b border-line px-4 py-3">
        <span class="font-display text-[11px] font-bold text-white">DIAMOND FLIGHT</span>
        <div class="flex items-center gap-3">
          <span class="font-display text-[12px] font-bold text-pink" aria-live="polite"
            >{{ score() }}/{{ target }}</span
          >
          <button
            type="button"
            (click)="togglePause()"
            [disabled]="phase() === 'ready' || phase() === 'over'"
            class="flex h-9 w-9 items-center justify-center rounded-full border border-line text-white disabled:opacity-30"
            [attr.aria-label]="phase() === 'paused' ? 'Reanudar partida' : 'Pausar partida'"
          >
            <app-icon [name]="phase() === 'paused' ? 'Play' : 'Pause'" [size]="16" />
          </button>
        </div>
      </div>
      <div
        #surface
        class="relative mx-auto touch-none outline-none focus-visible:ring-2 focus-visible:ring-pink"
        style="width: min(100%, max(165px, calc(75dvh - 260px)))"
        tabindex="0"
        role="application"
        aria-label="Diamond Flight. Toca, pulsa espacio o flecha arriba para subir. Supera diez obstáculos."
        (pointerdown)="onPointer($event)"
        (keydown)="onKey($event)"
      >
        <canvas #canvas class="block aspect-[3/4] w-full" aria-hidden="true"></canvas>
        @if (phase() === 'ready') {
          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/40 px-7 text-center"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full border border-pink/50 bg-purple/50 text-white shadow-glow"
            >
              <app-icon name="Play" [size]="28" />
            </div>
            <h2 class="font-display text-xl font-black text-white">LISTO PARA VOLAR</h2>
            <p class="font-sans text-sm text-white/85">
              Toca para subir. Pasa entre las torres.<br />Cruza 10 obstáculos para ganar.
            </p>
            <p
              class="mt-2 rounded-pill border border-line bg-ink/80 px-4 py-2 font-sans text-xs text-white"
            >
              Toca aquí · Espacio · ↑
            </p>
          </div>
        }
        @if (phase() === 'paused') {
          <div
            class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/75 text-center backdrop-blur-sm"
          >
            <app-icon name="Pause" [size]="36" class="text-pink" />
            <p class="font-display text-xl font-black text-white">PAUSA</p>
            <p class="font-sans text-xs text-white/80">Toca para continuar</p>
          </div>
        }
        @if (phase() === 'over') {
          <div
            class="pointer-events-none absolute inset-x-4 top-1/3 rounded-card border border-line bg-ink/85 p-5 text-center backdrop-blur"
          >
            <p
              class="font-display text-xl font-black"
              [class]="won() ? 'text-[#80ed99]' : 'text-white'"
            >
              {{ won() ? '¡HOME RUN!' : 'SIGUE INTENTANDO' }}
            </p>
            <p class="mt-2 font-sans text-sm text-white/90">
              {{ score() }} de {{ target }} obstáculos
            </p>
            <button type="button" (pointerdown)="$event.stopPropagation()" (click)="restarted.emit()"
              [disabled]="!canRestart()"
              class="pointer-events-auto mt-4 min-h-11 rounded-cta bg-cta px-5 font-display text-[11px] font-bold text-white disabled:opacity-40">
              VOLVER A JUGAR
            </button>
          </div>
        }
      </div>
      <p class="border-t border-line px-4 py-2 text-center font-sans text-[11px] text-muted">
        Toca para elevar la pelota · evita las torres y el suelo
      </p>
    </div>
  `,
})
export class FlightStage implements AfterViewInit, OnDestroy {
  readonly session = input.required<GameSession>();
  readonly finished = output<FlightFinish>();
  readonly canRestart = input(false);
  readonly restarted = output<void>();
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly surface = viewChild.required<ElementRef<HTMLDivElement>>('surface');
  private readonly feedback = inject(Feedback);
  protected readonly phase = signal<'ready' | 'playing' | 'paused' | 'over'>('ready');
  protected readonly score = signal(0);
  protected readonly won = signal(false);
  protected readonly target = FLIGHT.target;
  private world!: FlightState;
  private ctx!: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private accumulated = 0;
  private queued = false;
  private flaps: number[] = [];
  private destroyed = false;
  private readonly onVisibility = () => {
    if (document.hidden && this.phase() === 'playing') this.pause();
  };

  ngAfterViewInit(): void {
    this.world = createFlight(this.session().seed);
    const canvas = this.canvas().nativeElement;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FLIGHT.width * dpr;
    canvas.height = FLIGHT.height * dpr;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
    this.surface().nativeElement.focus({ preventScroll: true });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  protected onPointer(event: PointerEvent): void {
    event.preventDefault();
    this.surface().nativeElement.focus({ preventScroll: true });
    this.flap();
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLButtonElement) return;
    if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) {
      event.preventDefault();
      if (!event.repeat) this.flap();
    } else if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
      event.preventDefault();
      this.togglePause();
    }
  }

  protected togglePause(): void {
    if (this.phase() === 'playing') this.pause();
    else if (this.phase() === 'paused') this.resume();
  }

  private flap(): void {
    if (this.phase() === 'over') return;
    if (this.phase() === 'paused') {
      this.resume();
      return;
    }
    if (this.phase() === 'ready') {
      this.phase.set('playing');
      this.last = performance.now();
      this.accumulated = 0;
    }
    const previous = this.flaps.at(-1) ?? -FLIGHT.flapCooldown;
    if (this.world.frame - previous >= FLIGHT.flapCooldown) this.queued = true;
  }

  private pause(): void {
    this.phase.set('paused');
    this.queued = false;
    this.accumulated = 0;
  }
  private resume(): void {
    this.phase.set('playing');
    this.last = performance.now();
    this.accumulated = 0;
  }

  private frame = (time: number): void => {
    if (this.destroyed) return;
    if (this.phase() === 'playing') {
      // Un salto grande de reloj pausa la partida; no mata al jugador al regresar de otra aplicación.
      const elapsed = time - this.last;
      if (elapsed > 500) this.pause();
      else {
        this.accumulated += Math.max(0, elapsed);
        const tick = 1000 / FLIGHT.fps;
        while (this.accumulated >= tick && !this.world.ended) {
          if (this.queued) this.flaps.push(this.world.frame);
          stepFlight(this.world, this.queued);
          this.queued = false;
          this.accumulated -= tick;
          if (this.world.score !== this.score()) this.score.set(this.world.score);
          if (this.world.ended) {
            this.phase.set('over');
            this.won.set(this.world.won);
            if (this.world.won) this.feedback.success();
            else this.feedback.error();
            this.finished.emit({
              flaps: [...this.flaps],
              score: this.world.score,
              won: this.world.won,
            });
          }
        }
      }
    }
    this.last = time;
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw(): void {
    const g = this.ctx,
      w = this.world;
    const sky = g.createLinearGradient(0, 0, 0, FLIGHT.height);
    sky.addColorStop(0, '#101025');
    sky.addColorStop(1, '#28143e');
    g.fillStyle = sky;
    g.fillRect(0, 0, FLIGHT.width, FLIGHT.height);
    // Estrellas y luces de estadio, con geometría propia.
    g.fillStyle = '#ffffff55';
    for (let i = 0; i < 25; i++) g.fillRect((i * 79) % 360, 22 + ((i * 43) % 240), 2, 2);
    g.fillStyle = '#0d1021';
    for (let i = 0; i < 12; i++) g.fillRect(i * 32, 350 + (i % 3) * 12, 30, 102);
    for (let y = 370; y < 440; y += 15)
      for (let x = 6; x < 360; x += 14) {
        g.fillStyle = (x + y) % 3 === 0 ? '#f7258566' : '#9d4edd55';
        g.fillRect(x, y, 4, 3);
      }
    for (const gate of w.gates) {
      if (gate.x < -FLIGHT.gateWidth || gate.x > FLIGHT.width) continue;
      const top = gate.center - FLIGHT.gateGap / 2,
        bottom = gate.center + FLIGHT.gateGap / 2;
      g.fillStyle = '#272d4e';
      g.fillRect(gate.x, 0, FLIGHT.gateWidth, top);
      g.fillRect(gate.x, bottom, FLIGHT.gateWidth, FLIGHT.floor - bottom);
      g.fillStyle = '#9d4edd';
      g.fillRect(gate.x, 0, 4, top);
      g.fillRect(gate.x, bottom, 4, FLIGHT.floor - bottom);
      g.fillStyle = '#f72585';
      g.fillRect(gate.x - 4, top - 9, FLIGHT.gateWidth + 8, 9);
      g.fillRect(gate.x - 4, bottom, FLIGHT.gateWidth + 8, 9);
      g.fillStyle = '#ffffff70';
      for (let x = gate.x + 8; x < gate.x + FLIGHT.gateWidth; x += 11) {
        g.fillRect(x, top - 6, 4, 3);
        g.fillRect(x, bottom + 3, 4, 3);
      }
    }
    g.fillStyle = '#215b48';
    g.fillRect(0, FLIGHT.floor, 360, 28);
    g.fillStyle = '#80ed99';
    g.fillRect(0, FLIGHT.floor, 360, 3);
    g.save();
    g.translate(FLIGHT.ballX, w.y);
    g.rotate(Math.max(-0.5, Math.min(0.7, w.velocity * 0.09)));
    g.shadowColor = '#f72585';
    g.shadowBlur = 14;
    g.fillStyle = '#fff5e6';
    g.beginPath();
    g.arc(0, 0, FLIGHT.radius, 0, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = '#d62856';
    g.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(side * 5, -8);
      g.quadraticCurveTo(side * 1, 0, side * 5, 8);
      g.stroke();
    }
    g.restore();
    g.fillStyle = '#ffffffcc';
    g.font = 'bold 10px Inter, sans-serif';
    g.textAlign = 'right';
    g.fillText('META · ' + FLIGHT.target + ' OBSTÁCULOS', 346, 21);
  }
}
