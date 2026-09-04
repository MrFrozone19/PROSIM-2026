import { Location, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon, IconName } from '../../shared/icon';
import { StatCard } from '../../shared/stat-card';
import { Feedback } from '../../shared/feedback';
import { TEAM_BY_ID, TEAMS, Team } from '../../data/teams';
import { STANDINGS, TRIVIA } from '../../data/standings';
import { VIDEO_CLIPS } from '../../data/videos';

type DockId = 'animation' | 'info' | 'video' | 'effects' | 'stats' | 'trivia';
type Panel = 'info' | 'video' | 'stats' | 'trivia' | null;

interface DockItem {
  id: DockId;
  label: string;
  icon: IconName;
}

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

/**
 * /ar — el momento "modelo anclado": placeholder del modelo 3D (logo holográfico) + dock de seis acciones.
 * Ningún botón navega: cada uno cambia de estado y muestra algo (panel inferior, animación o efecto).
 */
@Component({
  selector: 'app-ar-screen',
  imports: [ScreenShell, Icon, StatCard, NgTemplateOutlet],
  template: `
    <app-screen-shell [padded]="false">
      <div class="relative h-full w-full overflow-hidden bg-ink">
        <img
          src="assets/figma/viewfinder-bg.webp"
          class="absolute inset-0 h-full w-full object-cover"
          style="object-position: 55% 40%"
          alt=""
        />
        <div class="absolute inset-0 bg-black/45"></div>
        <div
          class="pointer-events-none absolute inset-0 opacity-60"
          style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"
        ></div>

        <!-- placeholder del modelo 3D: logo holográfico anclado -->
        <div class="pointer-events-none absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <img
            [src]="team().logo"
            class="hologram h-36 w-36 rounded-full"
            [class.hologram--dance]="animating()"
            [class.hologram--spin]="spinning()"
            alt=""
          />
          <div class="mt-2 h-3 w-24 rounded-[50%] bg-purple/40 blur-md"></div>
          <span class="mt-3 rounded-pill border border-line bg-black/50 px-2 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wide text-muted">
            Modelo 3D · placeholder
          </span>
        </div>

        <!-- partículas de celebración -->
        @if (effectsOn()) {
          <div class="pointer-events-none absolute left-1/2 top-[46%] h-0 w-0">
            @for (p of particles(); track $index) {
              <span
                class="particle absolute rounded-full"
                [style.--dx.px]="p.x"
                [style.--dy.px]="p.y"
                [style.background]="p.color"
                [style.width.px]="p.size"
                [style.height.px]="p.size"
                [style.animation-delay.ms]="p.delay"
              ></span>
            }
          </div>
          <div class="banner absolute inset-x-6 top-[30%] rounded-card bg-cta px-5 py-3 text-center shadow-glow">
            <p class="font-display text-[18px] font-black text-white">HOME RUN!</p>
            <p class="font-sans text-[11px] font-semibold text-white/80">{{ team().name }} celebration</p>
          </div>
        }

        <!-- top-controls -->
        <div class="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-5">
          <button
            type="button"
            (click)="back()"
            class="pressable flex h-10 w-10 items-center justify-center rounded-full border border-line bg-black/[0.67] text-white"
            aria-label="Regresar"
          >
            <app-icon name="ArrowLeft" [size]="18" />
          </button>
          <div class="flex items-center gap-1.5 rounded-row border border-pink bg-pink/25 px-3 py-1.5">
            <span class="h-2 w-2 animate-pulse rounded-full bg-pink"></span>
            <span class="font-sans text-[11px] font-bold leading-normal text-white">AR HUB ACTIVE</span>
          </div>
        </div>

        <!-- mascot-info -->
        <div class="absolute left-6 right-6 top-[74px] flex flex-col gap-1">
          <div class="flex items-center gap-1.5">
            <span class="font-display text-[11px] font-extrabold uppercase leading-normal text-pink">
              {{ team().city }} {{ team().name }}
            </span>
            <span class="h-1 w-1 rounded-full bg-muted"></span>
            <span class="font-sans text-[11px] font-semibold uppercase leading-normal text-muted">Official mascot</span>
          </div>
          <p class="font-display text-[22px] font-black uppercase leading-normal text-white">{{ team().mascot }}</p>
        </div>

        <!-- dock: columna izquierda -->
        <div class="absolute left-6 top-[55%] flex -translate-y-1/2 flex-col gap-[13px]">
          @for (item of leftDock; track item.id) {
            <ng-container *ngTemplateOutlet="dockBtn; context: { $implicit: item }" />
          }
        </div>
        <!-- dock: fila inferior -->
        <div class="absolute inset-x-0 bottom-3 flex justify-center gap-[46px]">
          @for (item of bottomDock; track item.id) {
            <ng-container *ngTemplateOutlet="dockBtn; context: { $implicit: item }" />
          }
        </div>

        <ng-template #dockBtn let-item>
          <button
            type="button"
            (click)="press(item.id)"
            [attr.aria-pressed]="isActive(item.id)"
            class="pressable flex w-[54px] flex-col items-center gap-1.5"
          >
            <span
              class="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[1.5px] transition-all duration-150"
              [class]="
                isActive(item.id)
                  ? 'border-pink bg-purple text-white shadow-[0_0_8px_#9d4edd]'
                  : 'border-line bg-surface text-muted'
              "
            >
              <app-icon [name]="item.icon" [size]="22" />
            </span>
            <span
              class="whitespace-nowrap font-sans text-[11px] font-semibold leading-normal"
              [class]="isActive(item.id) ? 'text-white' : 'text-muted'"
              >{{ item.label }}</span
            >
          </button>
        </ng-template>

        <!-- panel inferior -->
        @if (panel(); as p) {
          <div class="absolute inset-0 bg-black/40" (click)="closePanel()" aria-hidden="true"></div>
          <section
            class="sheet-in absolute inset-x-0 bottom-0 max-h-[72%] overflow-y-auto rounded-t-[32px] border-t border-line bg-surface/95 px-5 pb-6 pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] backdrop-blur"
            role="dialog"
            [attr.aria-label]="panelTitle()"
          >
            <div class="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20"></div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="font-display text-[16px] font-black uppercase text-white">{{ panelTitle() }}</h2>
              <button
                type="button"
                (click)="closePanel()"
                class="pressable -mr-2 flex h-10 w-10 items-center justify-center rounded-full text-muted"
                aria-label="Cerrar panel"
              >
                <app-icon name="X" [size]="18" />
              </button>
            </div>

            @switch (p) {
              @case ('info') {
                <div class="grid grid-cols-2 gap-3">
                  <app-stat-card label="Fundado" [value]="team().founded" />
                  <app-stat-card label="Títulos" [value]="team().titles" hint="Series Mundiales" />
                  <app-stat-card label="Estadio" [value]="team().stadium" />
                  <app-stat-card label="División" [value]="team().division" />
                </div>
                <p class="mt-4 font-sans text-[13px] leading-relaxed text-white/90">{{ narration() }}</p>
                <button
                  type="button"
                  (click)="toggleNarration()"
                  class="pressable mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-cta bg-cta font-display text-[12px] font-bold text-white"
                >
                  <app-icon [name]="narrating() ? 'VolumeX' : 'Volume2'" [size]="18" />
                  {{ narrating() ? 'DETENER NARRACIÓN' : 'ESCUCHAR NARRACIÓN' }}
                </button>
              }
              @case ('video') {
                <div class="overflow-hidden rounded-row border border-line bg-black">
                  <video
                    class="aspect-video w-full"
                    [src]="clip().src"
                    [poster]="clip().poster"
                    controls
                    autoplay
                    muted
                    loop
                    playsinline
                  ></video>
                </div>
                <p class="mt-3 font-sans text-[13px] font-bold text-white">{{ clip().title }}</p>
                <p class="font-sans text-[11px] text-muted">{{ clip().duration }} · {{ team().city }} {{ team().name }}</p>
              }
              @case ('stats') {
                <p class="mb-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {{ team().division }} · temporada simulada
                </p>
                <div class="overflow-hidden rounded-row border border-line">
                  @for (row of standings(); track row.teamId; let i = $index) {
                    <div
                      class="flex items-center gap-3 px-3 py-2.5 font-sans text-[13px]"
                      [class]="row.teamId === team().id ? 'bg-purple/25 text-white' : 'bg-surface text-white/85'"
                      [class.border-t]="i > 0"
                      [class.border-line]="i > 0"
                    >
                      <span class="w-4 text-muted">{{ i + 1 }}</span>
                      <span class="flex-1 font-bold">{{ teamName(row.teamId) }}</span>
                      <span class="w-14 text-right font-display text-[12px] font-bold">{{ row.wins }}-{{ row.losses }}</span>
                      <span class="w-10 text-right text-muted">{{ row.gamesBack }}</span>
                      <span
                        class="w-8 text-right font-bold"
                        [class]="row.streak.startsWith('W') ? 'text-[#80ed99]' : 'text-pink'"
                        >{{ row.streak }}</span
                      >
                    </div>
                  }
                </div>
              }
              @case ('trivia') {
                <p class="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Pregunta {{ triviaIndex() + 1 }} de {{ trivia.length }}
                </p>
                <p class="mt-1 font-sans text-[15px] font-bold leading-snug text-white">{{ question().question }}</p>
                <div class="mt-4 flex flex-col gap-2">
                  @for (opt of question().options; track opt; let i = $index) {
                    <button
                      type="button"
                      (click)="answer(i)"
                      [disabled]="answered() !== null"
                      class="pressable flex min-h-[44px] items-center justify-between rounded-row border px-4 text-left font-sans text-[13px] font-semibold transition-colors"
                      [class]="optionClass(i)"
                    >
                      {{ opt }}
                      @if (answered() !== null && i === question().answer) {
                        <app-icon name="Check" [size]="16" />
                      }
                    </button>
                  }
                </div>
                @if (answered() !== null) {
                  <p
                    class="mt-3 font-display text-[12px] font-bold"
                    [class]="answered() === question().answer ? 'text-[#80ed99]' : 'text-pink'"
                  >
                    {{ answered() === question().answer ? '¡CORRECTO!' : 'INCORRECTO' }}
                  </p>
                  <button
                    type="button"
                    (click)="nextQuestion()"
                    class="pressable mt-3 flex min-h-[44px] w-full items-center justify-center rounded-cta bg-cta font-display text-[12px] font-bold text-white"
                  >
                    SIGUIENTE
                  </button>
                }
              }
            }
          </section>
        }
      </div>
    </app-screen-shell>
  `,
  styles: `
    .hologram {
      filter: drop-shadow(0 0 18px rgba(157, 78, 221, 0.8)) drop-shadow(0 0 4px rgba(247, 37, 133, 0.6));
      animation: float 3s ease-in-out infinite;
    }
    .hologram--dance {
      animation: dance 0.6s ease-in-out infinite;
    }
    .hologram--spin {
      animation: spin360 2.4s linear 1;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes dance {
      0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
      50% { transform: translateY(-22px) rotate(8deg) scale(1.08); }
    }
    @keyframes spin360 {
      from { transform: rotateY(0deg); }
      to { transform: rotateY(360deg); }
    }
    .particle {
      animation: burst 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
    }
    @keyframes burst {
      0% { transform: translate(0, 0) scale(0.6); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(1.2); opacity: 0; }
    }
    .banner {
      animation: banner 2.6s ease-out forwards;
    }
    @keyframes banner {
      0% { transform: translateY(-16px) scale(0.9); opacity: 0; }
      12% { transform: none; opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
    .sheet-in {
      animation: sheet 200ms ease-out;
    }
    @keyframes sheet {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: none; opacity: 1; }
    }
  `,
})
export class ArScreen implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly fb = inject(Feedback);
  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly team = signal<Team>(TEAM_BY_ID[this.route.snapshot.queryParamMap.get('team') ?? ''] ?? TEAM_BY_ID['tor']);

  protected readonly leftDock: DockItem[] = [
    { id: 'trivia', label: 'Trivia', icon: 'CircleHelp' },
    { id: 'stats', label: 'Stats', icon: 'BarChart3' },
    { id: 'info', label: 'Info', icon: 'Info' },
  ];
  protected readonly bottomDock: DockItem[] = [
    { id: 'effects', label: 'Effects', icon: 'Sparkles' },
    { id: 'animation', label: 'Animation', icon: 'RefreshCw' },
    { id: 'video', label: 'Video', icon: 'Video' },
  ];

  protected readonly panel = signal<Panel>(null);
  protected readonly animating = signal(false);
  protected readonly effectsOn = signal(false);
  protected readonly spinning = signal(false);
  protected readonly narrating = signal(false);
  protected readonly particles = signal<Particle[]>([]);

  protected readonly trivia = TRIVIA;
  protected readonly triviaIndex = signal(0);
  protected readonly answered = signal<number | null>(null);
  protected readonly question = computed(() => this.trivia[this.triviaIndex()]);

  protected readonly clip = computed(() => {
    const t = this.team();
    const c = VIDEO_CLIPS.find((v) => v.teamId === t.id) ?? VIDEO_CLIPS[0];
    const n = (VIDEO_CLIPS.indexOf(c) % 4) + 1;
    return { ...c, src: `assets/video/clip-${n}.mp4`, poster: `assets/figma/clip-${n}.webp` };
  });

  protected readonly standings = computed(() => {
    const div = this.team().division;
    const rows = STANDINGS.filter((r) => TEAM_BY_ID[r.teamId]?.division === div);
    return rows.length ? rows : STANDINGS;
  });

  protected readonly narration = computed(() => {
    const t = this.team();
    return `${t.mascot} es la mascota oficial de los ${t.name} de ${t.city}, fundados en ${t.founded}. Juegan en ${t.stadium}, en la ${t.division}, y suman ${t.titles} ${t.titles === 1 ? 'título' : 'títulos'} de Serie Mundial.`;
  });

  protected readonly panelTitle = computed(() => {
    switch (this.panel()) {
      case 'info':
        return 'Información';
      case 'video':
        return 'Video';
      case 'stats':
        return 'Estadísticas';
      case 'trivia':
        return 'Trivia';
      default:
        return '';
    }
  });

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.stopNarration();
  }

  protected isActive(id: DockId): boolean {
    if (id === 'animation') return this.animating();
    if (id === 'effects') return this.effectsOn();
    return this.panel() === id;
  }

  protected press(id: DockId): void {
    this.fb.tap();
    switch (id) {
      case 'animation':
        this.animating.update((v) => !v);
        if (this.animating()) this.after(3000, () => this.animating.set(false));
        break;
      case 'effects':
        this.particles.set(this.makeParticles());
        this.effectsOn.set(true);
        this.fb.success();
        this.after(2600, () => this.effectsOn.set(false));
        break;
      case 'info':
        this.togglePanel('info');
        if (this.panel() === 'info') {
          this.spinning.set(true);
          this.after(2500, () => this.spinning.set(false));
        }
        break;
      case 'video':
      case 'stats':
      case 'trivia':
        this.togglePanel(id);
        break;
    }
  }

  protected closePanel(): void {
    this.panel.set(null);
    this.stopNarration();
  }

  protected back(): void {
    this.fb.tap();
    this.location.back();
  }

  protected teamName(id: string): string {
    return TEAM_BY_ID[id]?.name ?? id.toUpperCase();
  }

  protected answer(i: number): void {
    this.answered.set(i);
    if (i === this.question().answer) this.fb.success();
    else this.fb.error();
  }

  protected nextQuestion(): void {
    this.fb.tap();
    this.answered.set(null);
    this.triviaIndex.update((n) => (n + 1) % this.trivia.length);
  }

  protected optionClass(i: number): string {
    const a = this.answered();
    if (a === null) return 'border-line bg-ink text-white';
    if (i === this.question().answer) return 'border-[#80ed99] bg-[#80ed99]/15 text-[#80ed99]';
    if (i === a) return 'border-pink bg-pink/15 text-pink';
    return 'border-line bg-ink text-muted';
  }

  protected toggleNarration(): void {
    this.fb.tap();
    if (this.narrating()) {
      this.stopNarration();
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(this.narration());
    u.lang = 'es-MX';
    u.rate = 1;
    u.onend = () => this.narrating.set(false);
    u.onerror = () => this.narrating.set(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    this.narrating.set(true);
  }

  private togglePanel(p: Exclude<Panel, null>): void {
    if (this.panel() === p) this.closePanel();
    else {
      this.panel.set(p);
      this.stopNarration();
    }
  }

  private stopNarration(): void {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.narrating.set(false);
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private makeParticles(): Particle[] {
    const colors = ['#f72585', '#9d4edd', '#4cc9f0', '#f5c518', '#ffffff'];
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 110;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 40,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 6,
        delay: Math.random() * 120,
      };
    });
  }
}
