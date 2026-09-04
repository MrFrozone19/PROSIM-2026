import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { ACCOUNT_ROWS, AccountRow, PROFILE } from '../../data/profile';
import { TROPHIES } from '../../data/trophies';
import { RARITY, Rarity } from '../../data/cards';
import { TEAM_BY_ID } from '../../data/teams';

/** /profile — se llega desde el avatar de Home. Sin lógica real de cuenta. */
@Component({
  selector: 'app-profile-screen',
  imports: [ScreenShell, SectionTitle, DecimalPipe],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-[18px] pt-3">
        <header class="flex items-center justify-between">
          <h1 class="font-display text-[20px] font-black leading-normal text-white">MY PROFILE</h1>
          <button
            type="button"
            (click)="soon('Ajustes')"
            class="pressable min-h-[36px] rounded-pill border border-line bg-white/[0.06] px-3.5 py-[7px] font-display text-[10px] font-bold tracking-[0.6px] text-muted"
          >
            SETTINGS
          </button>
        </header>

        <!-- identity-card -->
        <section class="flex flex-col gap-[18px] rounded-card border border-line bg-surface p-5">
          <div class="flex items-center gap-4">
            <span
              class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-cta font-display text-[24px] font-black text-white"
              >{{ profile.initials }}</span
            >
            <div class="flex min-w-0 flex-col gap-[5px]">
              <p class="font-display text-[17px] font-bold leading-normal text-white">{{ profile.name }}</p>
              <p class="font-sans text-[12px] font-medium leading-normal text-muted">
                {{ profile.handle }} &nbsp;·&nbsp; Fan desde {{ profile.fanSince }}
              </p>
              <span
                class="self-start rounded-pill border border-pink/55 bg-pink/[0.16] px-2.5 py-[5px] font-sans text-[10px] font-bold tracking-[0.8px] text-pink"
                >{{ team.abbr }} · {{ team.division.toUpperCase() }}</span
              >
            </div>
          </div>
          <div class="flex flex-col gap-[9px]">
            <div class="flex items-center justify-between">
              <span class="font-display text-[12px] font-bold text-white">FAN LEVEL {{ profile.level }}</span>
              <span class="font-sans text-[11px] font-medium text-muted"
                >{{ profile.xp | number }} / {{ profile.xpMax | number }} XP</span
              >
            </div>
            <div class="h-2 w-full overflow-hidden rounded-pill bg-white/10">
              <div class="h-2 rounded-pill bg-cta" [style.width.%]="(profile.xp / profile.xpMax) * 100"></div>
            </div>
          </div>
        </section>

        <!-- stats-row -->
        <div class="flex gap-3">
          @for (s of stats; track s.label) {
            <div class="flex flex-1 flex-col items-center gap-[3px] rounded-card-sm border border-line bg-surface p-3.5">
              <span class="font-display text-[22px] font-black leading-normal text-white">{{ s.value }}</span>
              <span class="font-display text-[9px] font-bold tracking-[0.6px] text-muted">{{ s.label }}</span>
            </div>
          }
        </div>

        <!-- trophies -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Recent trophies" />
          <div class="flex gap-3">
            @for (t of trophies; track t.id) {
              <div
                class="flex flex-1 flex-col items-center gap-2 rounded-card-sm border bg-surface px-2.5 py-3.5 text-center"
                [style.border-color]="rarity(t.rarity).color + '8c'"
              >
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-full font-display text-[13px] font-black text-white"
                  [style.background]="medal(t.rarity)"
                  >{{ t.code }}</span
                >
                <span class="font-sans text-[10px] font-bold leading-normal text-white">{{ t.title }}</span>
                <span class="font-display text-[8px] font-bold uppercase tracking-[0.5px]" [style.color]="rarity(t.rarity).color">{{
                  rarity(t.rarity).label
                }}</span>
              </div>
            }
          </div>
        </section>

        <!-- account -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Account" />
          <div class="flex flex-col gap-2">
            @for (row of rows; track row.id) {
              <button
                type="button"
                (click)="tapRow(row)"
                class="pressable flex min-h-[44px] w-full items-center justify-between rounded-row border border-line bg-surface px-4 py-[13px] text-left font-sans"
                [class]="row.danger ? 'text-pink' : 'text-white'"
              >
                <span class="text-[13px] font-medium">{{ row.label }}</span>
                <span class="text-[12px] font-medium" [class.text-muted]="!row.danger"
                  >{{ row.value }}<span class="ml-3">›</span></span
                >
              </button>
            }
          </div>
        </section>
      </div>
    </app-screen-shell>
  `,
})
export class ProfileScreen {
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);

  protected readonly profile = PROFILE;
  protected readonly team = TEAM_BY_ID[PROFILE.teamId];
  protected readonly rows = ACCOUNT_ROWS;
  protected readonly trophies = TROPHIES.filter((t) => t.unlocked).slice(0, 3);
  protected readonly stats = [
    { label: 'CLIPS', value: PROFILE.clips },
    { label: 'TROPHIES', value: PROFILE.trophies },
    { label: 'CARDS', value: PROFILE.cards },
  ];

  protected rarity(r: Rarity) {
    return RARITY[r];
  }

  protected medal(r: Rarity): string {
    const c = RARITY[r].color;
    return r === 'mythic' ? c : `linear-gradient(90deg, ${c}, #f72585)`;
  }

  protected soon(what: string): void {
    this.fb.tap();
    this.toast.show(`${what}: próximamente`);
  }

  protected tapRow(row: AccountRow): void {
    this.fb.tap();
    this.toast.show(row.danger ? 'Sesión simulada: no hay login en el prototipo' : `${row.label}: próximamente`);
  }
}
