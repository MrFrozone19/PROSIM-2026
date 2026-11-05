import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FLIGHT } from '../../../../api/src/game-physics';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { initials } from '../../shared/prefs';
import {
  Api,
  GameResult,
  GameSession,
  GameStatus,
  Leaderboard,
  TriviaSummary,
} from '../../core/api';
import { Progress } from '../../core/progress';
import { FlightStage, FlightFinish } from './flight-stage';

@Component({
  selector: 'app-game-screen',
  imports: [ScreenShell, SectionTitle, Icon, DecimalPipe, RouterLink, FlightStage],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-5 pt-3">
        <header class="flex items-center justify-between gap-3">
          <h1 class="font-display text-[20px] font-black text-white">FAN ARCADE</h1>
          <span
            class="rounded-pill border border-pink/50 bg-pink/10 px-3 py-1.5 font-sans text-[10px] font-bold text-pink"
            >DIAMOND FLIGHT</span
          >
        </header>

        <div class="grid grid-cols-3 gap-3">
          @for (h of hud(); track h.label) {
            <div
              class="flex flex-col items-center gap-1 rounded-card-xs border border-line bg-surface px-2 py-3"
            >
              <span class="font-sans text-[10px] font-bold uppercase tracking-wide text-muted">{{
                h.label
              }}</span>
              <span class="font-display text-[18px] font-black text-white">{{ h.value }}</span>
            </div>
          }
        </div>

        @if (loadError()) {
          <div
            class="flex items-center justify-between gap-3 rounded-row border border-pink/30 bg-surface p-3 font-sans text-xs text-white/85"
            role="status"
          >
            <span>No se pudo actualizar el marcador.</span>
            <button type="button" (click)="refresh()" class="min-h-11 font-bold text-pink">
              Reintentar
            </button>
          </div>
        }

        @for (run of activeRuns(); track run.id) {
          <app-flight-stage [session]="run" [canRestart]="!saving() && !starting()"
            (finished)="onFinished($event)" (restarted)="play()" />
        } @empty {
          <section
            class="relative flex min-h-[270px] flex-col items-center justify-center gap-4 overflow-hidden rounded-card border border-purple/40 bg-gradient-to-br from-purple/20 via-surface to-pink/10 p-6 text-center"
          >
            <div
              class="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[48px] shadow-glow-purple"
              aria-hidden="true"
            >
              ⚾
            </div>
            <div>
              <h2 class="font-display text-xl font-black text-white">CRUZA EL DIAMANTE</h2>
              <p class="mt-2 font-sans text-sm leading-relaxed text-white/75">
                Toca para mantener la pelota en el aire.<br />Supera {{ target }} obstáculos para
                ganar.
              </p>
            </div>
            <span class="font-sans text-xs text-muted">También puedes jugar con Espacio o ↑</span>
          </section>
        }

        @if (saving()) {
          <p
            class="rounded-row border border-purple/40 bg-purple/10 p-4 text-center font-sans text-sm text-white"
            role="status"
          >
            Guardando tu partida y tus recompensas…
          </p>
        }
        @if (saveError()) {
          <div class="rounded-row border border-pink/40 bg-surface p-4" role="alert">
            <p class="font-sans text-sm text-white">{{ saveError() }}</p>
            <button
              type="button"
              (click)="saveResult()"
              [disabled]="saving()"
              class="mt-2 min-h-11 font-sans text-sm font-bold text-pink"
            >
              Reintentar guardado
            </button>
          </div>
        }
        @if (result(); as r) {
          <section
            class="rounded-card-xs border border-purple/40 bg-surface p-4"
            aria-live="polite"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-display text-[12px] font-bold text-white">PARTIDA GUARDADA</p>
              <span class="font-display text-[18px] font-black text-[#80ed99]"
                >+{{ r.run.xpEarned }} XP</span
              >
            </div>
            <p class="mt-2 font-sans text-xs text-muted">
              {{ r.run.score }}/{{ target }} obstáculos ·
              {{ r.run.won ? '¡Victoria!' : 'Vuelve a intentarlo' }} · Récord:
              {{ r.stats.bestScore }}/{{ target }}
            </p>
            @if (!r.stats.xpRemaining) {
              <p class="mt-2 font-sans text-xs text-white/75">
                Alcanzaste las {{ xpLimit }} XP de partidas en las últimas 24 horas. Puedes seguir
                jugando y desbloqueando logros.
              </p>
            }
          </section>
        }

        @if (!session() || localFinish()) {
          <button
            type="button"
            (click)="play()"
            [disabled]="starting() || saving()"
            class="pressable flex min-h-[56px] w-full items-center justify-center gap-2 rounded-cta bg-cta px-5 font-display text-sm font-black text-white shadow-glow-purple disabled:opacity-50"
          >
            <app-icon [name]="session() ? 'RefreshCw' : 'Play'" [size]="20" />
            {{ starting() ? 'PREPARANDO PARTIDA…' : session() ? 'VOLVER A JUGAR' : 'JUGAR AHORA' }}
          </button>
        }

        <div
          class="grid grid-cols-3 gap-2 rounded-card-xs border border-line bg-surface p-3 text-center font-sans"
        >
          <div>
            <p class="text-[10px] uppercase text-muted">Récord</p>
            <p class="mt-1 text-sm font-bold text-white">
              {{ status()?.stats?.bestScore ?? 0 }}/{{ target }}
            </p>
          </div>
          <div>
            <p class="text-[10px] uppercase text-muted">Victorias</p>
            <p class="mt-1 text-sm font-bold text-white">{{ status()?.stats?.wins ?? 0 }}</p>
          </div>
          <div>
            <p class="text-[10px] uppercase text-muted">XP disponibles</p>
            <p class="mt-1 text-sm font-bold text-white">
              {{ status()?.stats?.xpRemaining ?? xpLimit }}
            </p>
          </div>
        </div>

        <section class="flex flex-col gap-3">
          <app-section-title text="Tu XP de esta semana" />
          <p class="font-sans text-xs leading-relaxed text-muted">
            Trivia, arcade, escaneos y logros suman al mismo nivel y a la misma clasificación.
          </p>
          <div class="grid grid-cols-2 gap-2">
            @for (source of sources(); track source.label) {
              <div
                class="flex items-center justify-between rounded-row border border-line bg-surface px-3 py-3 font-sans text-xs"
              >
                <span class="text-muted">{{ source.label }}</span
                ><span class="font-bold text-white">{{ source.value | number }} XP</span>
              </div>
            }
          </div>
          <a
            routerLink="/scan"
            class="pressable flex min-h-11 items-center justify-between rounded-row border border-purple/40 bg-purple/10 px-4 font-sans text-xs font-bold text-white"
          >
            <span>Escanea un equipo y responde su trivia</span
            ><app-icon name="ChevronRight" [size]="16" />
          </a>
          @if (summary(); as count) {
            <details
              class="rounded-row border border-line bg-surface px-4 py-3 font-sans text-xs text-muted"
            >
              <summary class="cursor-pointer py-1 text-white">
                {{ count.total }} preguntas disponibles · ver por equipo
              </summary>
              <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                @for (team of count.teams; track team.teamId) {
                  <div class="flex justify-between">
                    <span>{{ team.abbr }}</span
                    ><span class="font-bold text-white">{{ team.count }}</span>
                  </div>
                }
              </div>
              <p class="mt-3 border-t border-line pt-2">
                Generales de la liga: {{ count.general }}
              </p>
            </details>
          }
        </section>

        <details
          class="rounded-card-xs border border-line bg-surface px-4 py-3 font-sans text-xs leading-relaxed text-muted"
        >
          <summary class="cursor-pointer py-1 font-bold text-white">
            Cómo ganar puntos y recompensas
          </summary>
          <ul class="mt-3 flex list-disc flex-col gap-2 pl-4">
            <li>Trivia: +50 XP la primera vez que aciertas cada pregunta.</li>
            <li>
              Diamond Flight: +10 XP por obstáculo y +50 XP por ganar. Hasta {{ xpLimit }} XP de
              partidas cada 24 horas.
            </li>
            <li>First Flight: trofeo al ganar tu primera partida, con +50 XP adicionales.</li>
            <li>Arcade Champion: trofeo al ganar cinco partidas, con +50 XP adicionales.</li>
            <li>Aviator: insignia al superar 50 obstáculos en total.</li>
            <li>
              Two-Way Star: insignia al ganar una partida y dominar cinco preguntas distintas.
            </li>
          </ul>
          <a routerLink="/vault" class="mt-3 inline-flex min-h-11 items-center font-bold text-pink"
            >Ver mis recompensas →</a
          >
        </details>

        <section class="mb-2 flex flex-col gap-3">
          <app-section-title text="Clasificación semanal · XP" />
          @if (board() && !leaderboard().length) {
            <p
              class="rounded-row border border-dashed border-line bg-surface p-4 font-sans text-xs text-muted"
            >
              Todavía no hay puntos esta semana. Responde una trivia o juega para entrar.
            </p>
          }
          @for (row of leaderboard(); track $index) {
            <div
              class="flex items-center gap-3 rounded-row border bg-surface px-4 py-3"
              [class]="row.me ? 'border-pink/55' : 'border-line'"
            >
              <span class="w-4 font-display text-sm font-black text-pink">{{ row.rank }}</span>
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-sans text-xs font-bold text-white"
                >{{ initials(row.name) }}</span
              >
              <span class="flex-1 truncate font-sans text-sm text-white">{{
                row.me ? 'Tú' : row.name
              }}</span>
              <span class="font-display text-xs font-bold text-white">{{
                row.points | number
              }}</span>
            </div>
          }
        </section>
      </div>
    </app-screen-shell>
  `,
})
export class GameScreen implements OnInit, OnDestroy {
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);
  private readonly api = inject(Api);
  private readonly progress = inject(Progress);
  private destroyed = false;
  private pending: (FlightFinish & { id: string }) | null = null;
  protected readonly initials = initials;
  protected readonly target = FLIGHT.target;
  protected readonly xpLimit = FLIGHT.xpLimit24h;
  protected readonly board = signal<Leaderboard | null>(null);
  protected readonly status = signal<GameStatus | null>(null);
  protected readonly summary = signal<TriviaSummary | null>(null);
  protected readonly session = signal<GameSession | null>(null);
  protected readonly activeRuns = computed(() => {
    const run = this.session();
    return run ? [run] : [];
  });
  protected readonly localFinish = signal<FlightFinish | null>(null);
  protected readonly result = signal<GameResult | null>(null);
  protected readonly starting = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal(false);
  protected readonly saveError = signal('');
  protected readonly leaderboard = computed(() => this.board()?.entries ?? []);
  protected readonly hud = computed(() => [
    { label: 'XP semana', value: (this.board()?.me.points ?? 0).toLocaleString('es-MX') },
    { label: 'Lugar', value: this.board()?.me.rank ? '#' + this.board()!.me.rank : '—' },
    { label: 'Nivel', value: String(this.progress.me()?.level ?? 1) },
  ]);
  protected readonly sources = computed(() => {
    const xp = this.status()?.weekly;
    return [
      { label: 'Trivia', value: xp?.trivia ?? 0 },
      { label: 'Arcade', value: xp?.game ?? 0 },
      { label: 'Explorar', value: xp?.exploration ?? 0 },
      { label: 'Logros', value: xp?.achievements ?? 0 },
    ];
  });

  ngOnInit(): void {
    void this.refresh();
  }
  ngOnDestroy(): void {
    this.destroyed = true;
  }

  protected async refresh(): Promise<void> {
    const responses = await Promise.allSettled([
      this.api.leaderboard().then((value) => {
        if (!this.destroyed) this.board.set(value);
      }),
      this.api.gameStatus().then((value) => {
        if (!this.destroyed) this.status.set(value);
      }),
      this.api.triviaSummary().then((value) => {
        if (!this.destroyed) this.summary.set(value);
      }),
      this.progress.refresh(),
    ]);
    if (!this.destroyed) this.loadError.set(responses.some((r) => r.status === 'rejected'));
  }

  protected async play(): Promise<void> {
    if (this.starting() || this.saving()) return;
    this.fb.tap();
    this.starting.set(true);
    try {
      const run = await this.api.startGame();
      if (this.destroyed) return;
      if (run.rulesVersion !== FLIGHT.version)
        throw new Error('Actualiza la página para cargar la versión nueva del juego.');
      this.pending = null;
      this.result.set(null);
      this.localFinish.set(null);
      this.saveError.set('');
      this.session.set(run);
    } catch (error) {
      if (!this.destroyed) this.toast.show(this.message(error), 3500);
    } finally {
      if (!this.destroyed) this.starting.set(false);
    }
  }

  protected onFinished(finish: FlightFinish): void {
    const run = this.session();
    if (!run || this.localFinish()) return;
    this.localFinish.set(finish);
    this.pending = { ...finish, id: run.id };
    void this.saveResult();
  }

  protected async saveResult(): Promise<void> {
    const pending = this.pending;
    if (!pending || this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      const result = await this.api.finishGame(pending.id, pending.flaps);
      this.progress.celebrate(result);
      if (this.destroyed) return;
      this.result.set(result);
      this.pending = null;
      await this.refresh();
    } catch (error) {
      if (!this.destroyed) this.saveError.set(this.message(error));
    } finally {
      if (!this.destroyed) this.saving.set(false);
    }
  }

  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse)
      return error.error?.error ?? 'No se pudo conectar. Reintenta para guardar tus puntos.';
    return error instanceof Error ? error.message : 'No se pudo guardar. Intenta de nuevo.';
  }
}
