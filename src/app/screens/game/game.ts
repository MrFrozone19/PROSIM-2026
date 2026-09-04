import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { GAME_HUD, LEADERBOARD } from '../../data/game';

/** /game — "Fan Arcade". El área de juego es un placeholder explícito; "Jugar ahora" muestra "próximamente". */
@Component({
  selector: 'app-game-screen',
  imports: [ScreenShell, SectionTitle, Icon, DecimalPipe],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-[18px] pt-3">
        <header class="flex items-center justify-between">
          <h1 class="font-display text-[20px] font-black leading-normal text-white">FAN ARCADE</h1>
          <span
            class="rounded-pill border border-pink/55 bg-pink/[0.16] px-3 py-1.5 font-display text-[9px] font-bold tracking-[0.6px] text-pink"
            >PROTOTIPO</span
          >
        </header>

        <!-- game-hud -->
        <div class="flex gap-3">
          @for (h of hud; track h.label) {
            <div class="flex flex-1 flex-col items-center gap-[3px] rounded-card-xs border border-line bg-surface p-3">
              <span class="font-display text-[9px] font-bold tracking-[0.6px] text-muted">{{ h.label }}</span>
              <span class="font-display text-[18px] font-black leading-normal text-white">{{ h.value }}</span>
            </div>
          }
        </div>

        <!-- game-stage-placeholder -->
        <div
          class="flex h-[262px] w-full flex-col items-center justify-center gap-[14px] rounded-card border-2 border-dashed border-purple/60 bg-surface p-6 text-center"
          [class.stage-shake]="comingSoon()"
        >
          <app-icon name="Gamepad2" [size]="44" class="text-muted" [strokeWidth]="1.75" />
          <p class="font-display text-[15px] font-bold tracking-[0.4px] text-white">ÁREA DE JUEGO</p>
          <p class="font-sans text-[12px] leading-[19px] text-muted">
            Espacio reservado para el minijuego.<br />La mecánica y la temática se definen<br />en la siguiente entrega.
          </p>
          <span
            class="rounded-pill border border-line bg-white/[0.06] px-[11px] py-[5px] font-sans text-[9px] font-bold tracking-[0.8px] text-muted"
            >PLACEHOLDER</span
          >
        </div>

        <!-- play-cta -->
        <button
          type="button"
          (click)="play()"
          class="pressable flex h-[60px] w-full items-center justify-center rounded-cta bg-cta font-display text-[16px] font-black text-white shadow-[0_8px_24px_rgba(247,37,133,0.35)] transition-opacity"
          [class.opacity-80]="comingSoon()"
        >
          {{ comingSoon() ? 'PRÓXIMAMENTE' : 'JUGAR AHORA' }}
        </button>

        <!-- leaderboard -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Weekly leaderboard" />
          <div class="flex flex-col gap-2">
            @for (row of leaderboard; track row.rank) {
              <div
                class="flex items-center gap-3 rounded-row border bg-surface py-[11px] pl-[14px] pr-4"
                [class]="row.me ? 'border-pink/55' : 'border-line'"
              >
                <span class="w-3 font-display text-[13px] font-black" [class]="row.me ? 'text-pink' : 'text-muted'">{{
                  row.rank
                }}</span>
                <span
                  class="flex h-[30px] w-[30px] items-center justify-center rounded-full font-sans text-[11px] font-bold text-white"
                  [class]="row.me ? 'bg-cta' : 'bg-white/10'"
                  >{{ row.initials }}</span
                >
                <span class="flex-1 font-sans text-[13px] font-medium text-white">{{ row.name }}</span>
                <span class="font-display text-[12px] font-bold" [class]="row.me ? 'text-pink' : 'text-muted'">{{
                  row.points | number
                }}</span>
              </div>
            }
          </div>
        </section>
      </div>
    </app-screen-shell>
  `,
  styles: `
    .stage-shake {
      animation: shake 400ms ease-in-out;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
  `,
})
export class GameScreen {
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);
  private timer?: ReturnType<typeof setTimeout>;

  protected readonly leaderboard = LEADERBOARD;
  protected readonly hud = [
    { label: 'SCORE', value: GAME_HUD.score.toLocaleString('en-US') },
    { label: 'STREAK', value: GAME_HUD.streak.toLocaleString('en-US') },
    { label: 'BEST', value: GAME_HUD.best.toLocaleString('en-US') },
  ];
  protected readonly comingSoon = signal(false);

  protected play(): void {
    this.fb.tap();
    this.comingSoon.set(true);
    this.toast.show('El minijuego llega en la siguiente entrega');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.comingSoon.set(false), 1800);
  }
}
