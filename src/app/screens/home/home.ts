import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Team, TEAMS } from '../../data/teams';

@Component({
  selector: 'app-home-screen',
  imports: [ScreenShell, SectionTitle, Icon, RouterLink],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-5 pt-3">
        <!-- branding -->
        <header class="flex items-center justify-between">
          <h1 class="text-gradient font-display text-[22px] font-black leading-normal">BaseDex Fan</h1>
          <a
            routerLink="/profile"
            (click)="fb.tap()"
            class="pressable -mr-1.5 flex h-11 w-11 items-center justify-center"
            aria-label="Abrir perfil"
          >
            <img src="assets/figma/avatar.png" width="32" height="32" class="h-8 w-8 rounded-full" alt="" />
          </a>
        </header>

        <!-- hero-mascot-card -->
        <section
          class="relative h-[320px] w-full overflow-hidden rounded-card border border-line bg-gradient-to-r from-white/[0.06] to-white/[0.01] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
        >
          <img
            src="assets/figma/hero-mascot.webp"
            class="absolute inset-0 h-full w-full scale-110 object-cover [object-position:63%_47%]"
            alt=""
            fetchpriority="high"
          />
          <div
            class="absolute inset-0 flex flex-col justify-between bg-gradient-to-b from-transparent to-[rgba(12,12,18,0.98)] p-5"
          >
            <div class="flex flex-col gap-1">
              <p class="font-display text-[18px] font-bold leading-normal text-white">SCAN. PLAY. COLLECT.</p>
              <p class="font-sans text-[12px] font-semibold leading-normal text-[#f73e92]">
                Experience the stadium with AR from your phone
              </p>
            </div>
          </div>
        </section>

        <!-- start-ar-cta -->
        <a
          routerLink="/scan"
          (click)="fb.tap()"
          class="pressable flex h-[60px] w-full items-center justify-center gap-3 rounded-cta bg-cta text-white shadow-[0_0_8px_#9d4edd]"
        >
          <app-icon name="Aperture" [size]="24" />
          <span class="font-display text-[16px] font-black leading-normal">START AR SCANNER</span>
        </a>

        <!-- team-slider-section -->
        <section class="flex flex-col gap-3">
          <app-section-title text="AL Team Channels" />
          <div class="no-scrollbar -mx-5 flex gap-[14px] overflow-x-auto px-5 pb-1">
            @for (team of teams; track team.id) {
              <button
                type="button"
                (click)="select(team)"
                class="pressable flex shrink-0 flex-col items-center gap-1.5"
                [attr.aria-pressed]="selected() === team.id"
              >
                <span
                  class="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-surface transition-colors"
                  [class.border-pink]="selected() === team.id"
                  [class.border-line]="selected() !== team.id"
                >
                  @if (team.logo) {
                    <img [src]="team.logo" width="48" height="48" class="h-12 w-12 rounded-full object-cover" alt="" />
                  } @else {
                    <span class="font-display text-[12px] font-bold" [style.color]="team.color">{{ team.abbr }}</span>
                  }
                </span>
                <span
                  class="font-sans text-[11px] font-bold leading-normal"
                  [class.text-white]="selected() === team.id"
                  [class.text-muted]="selected() !== team.id"
                  >{{ team.abbr }}</span
                >
              </button>
            }
          </div>
        </section>
      </div>
    </app-screen-shell>
  `,
})
export class HomeScreen {
  protected readonly fb = inject(Feedback);
  protected readonly teams = TEAMS;
  protected readonly selected = signal<string>('nyy');

  protected select(team: Team): void {
    this.fb.tap();
    this.selected.set(team.id);
  }
}
