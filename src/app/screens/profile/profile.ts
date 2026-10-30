import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { SectionTitle } from '../../shared/section-title';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { ArQuality, getArQuality, setArQuality } from '../../shared/prefs';
import { Api, CollectionTrophy } from '../../core/api';
import { AuthService } from '../../core/auth';
import { Progress } from '../../core/progress';
import { RARITY, Rarity } from '../../data/cards';
import { TEAMS, TEAM_BY_ID } from '../../data/teams';

type Sheet = 'name' | 'team' | null;

/** /profile — se llega desde el avatar de Home. Datos reales de la cuenta y del progreso. */
@Component({
  selector: 'app-profile-screen',
  imports: [ScreenShell, SectionTitle, Avatar, Icon, RouterLink, DecimalPipe, DatePipe],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-[18px] pt-3">
        <header class="flex items-center justify-between">
          <h1 class="font-display text-[20px] font-black leading-normal text-white">MY PROFILE</h1>
          @if (me()?.role === 'admin') {
            <span
              class="rounded-pill border border-pink/55 bg-pink/[0.16] px-3 py-1.5 font-display text-[9px] font-bold tracking-[0.6px] text-pink"
              >ADMIN</span
            >
          }
        </header>

        @if (me(); as m) {
          <!-- identity-card -->
          <section class="flex flex-col gap-[18px] rounded-card border border-line bg-surface p-5">
            <div class="flex items-center gap-4">
              <app-avatar [name]="m.displayName" [photo]="m.photoUrl" [size]="72" />
              <div class="flex min-w-0 flex-col gap-[5px]">
                <p class="truncate font-display text-[17px] font-bold leading-normal text-white">{{ m.displayName }}</p>
                <p class="truncate font-sans text-[12px] font-medium leading-normal text-muted">
                  {{ handle() }} &nbsp;·&nbsp; Fan desde {{ m.createdAt | date: 'yyyy' }}
                </p>
                @if (team(); as t) {
                  <span
                    class="self-start rounded-pill border border-pink/55 bg-pink/[0.16] px-2.5 py-[5px] font-sans text-[10px] font-bold tracking-[0.8px] text-pink"
                    >{{ t.abbr }} · {{ t.division.toUpperCase() }}</span
                  >
                } @else {
                  <button
                    type="button"
                    (click)="open('team')"
                    class="pressable self-start rounded-pill border border-dashed border-line px-2.5 py-[5px] font-sans text-[10px] font-bold tracking-[0.8px] text-muted"
                  >
                    ELIGE TU EQUIPO
                  </button>
                }
              </div>
            </div>
            <div class="flex flex-col gap-[9px]">
              <div class="flex items-center justify-between">
                <span class="font-display text-[12px] font-bold text-white">FAN LEVEL {{ m.level }}</span>
                <span class="font-sans text-[11px] font-medium text-muted"
                  >{{ m.levelXp | number }} / {{ m.levelXpMax | number }} XP</span
                >
              </div>
              <div class="h-2 w-full overflow-hidden rounded-pill bg-white/10">
                <div class="h-2 rounded-pill bg-cta" [style.width.%]="(m.levelXp / m.levelXpMax) * 100"></div>
              </div>
            </div>
          </section>

          <!-- stats-row -->
          <div class="flex gap-3">
            @for (s of stats(); track s.label) {
              <div class="flex flex-1 flex-col items-center gap-[3px] rounded-card-sm border border-line bg-surface p-3.5">
                <span class="font-display text-[22px] font-black leading-normal text-white">{{ s.value }}</span>
                <span class="font-display text-[9px] font-bold tracking-[0.6px] text-muted">{{ s.label }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="h-[300px] animate-pulse rounded-card border border-line bg-surface"></div>
        }

        <!-- trophies -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Recent trophies" />
          @if (trophies().length) {
            <div class="flex gap-3">
              @for (t of trophies(); track t.id) {
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
          } @else {
            <a
              routerLink="/scan"
              class="pressable flex items-center gap-3 rounded-card-sm border border-dashed border-line bg-surface p-4 font-sans text-[12px] text-muted"
            >
              <app-icon name="Trophy" [size]="22" class="text-pink" />
              Aún no tienes trofeos. Escanea un logo para empezar.
            </a>
          }
        </section>

        <!-- account -->
        <section class="flex flex-col gap-3">
          <app-section-title text="Account" />
          <div class="flex flex-col gap-2">
            <button type="button" (click)="open('name')" class="row pressable text-white">
              <span class="text-[13px] font-medium">Nombre</span>
              <span class="truncate pl-4 text-[12px] font-medium text-muted">{{ me()?.displayName }}<span class="ml-3">›</span></span>
            </button>
            <button type="button" (click)="open('team')" class="row pressable text-white">
              <span class="text-[13px] font-medium">Equipo favorito</span>
              <span class="text-[12px] font-medium text-muted"
                >{{ team() ? team()!.city + ' ' + team()!.name : 'Sin elegir' }}<span class="ml-3">›</span></span
              >
            </button>
            <button type="button" (click)="toggleQuality()" class="row pressable text-white">
              <span class="text-[13px] font-medium">Calidad AR</span>
              <span class="text-[12px] font-medium text-muted"
                >{{ quality() === 'high' ? 'Alta' : 'Rápida' }}<span class="ml-3">›</span></span
              >
            </button>
            <button type="button" (click)="signOut()" class="row pressable text-pink">
              <span class="text-[13px] font-medium">Cerrar sesión</span>
              <span class="text-[12px] font-medium">{{ me()?.email }}<span class="ml-3">›</span></span>
            </button>
            <button
              type="button"
              (click)="deleteAccount()"
              [disabled]="saving()"
              class="pressable mt-2 min-h-[44px] self-center px-4 font-sans text-[12px] font-medium text-muted underline"
            >
              Eliminar mi cuenta y mis datos
            </button>
          </div>
        </section>
      </div>

      @if (sheet(); as s) {
        <div class="fixed inset-0 z-50 bg-black/60" (click)="close()" aria-hidden="true"></div>
        <section
          class="sheet-in fixed inset-x-0 bottom-0 z-50 max-h-[75%] overflow-y-auto rounded-t-[32px] border-t border-line bg-surface px-5 pt-3"
          style="padding-bottom: calc(24px + env(safe-area-inset-bottom))"
          role="dialog"
          [attr.aria-label]="s === 'name' ? 'Cambiar nombre' : 'Equipo favorito'"
        >
          <div class="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20"></div>
          @if (s === 'name') {
            <h2 class="mb-4 font-display text-[16px] font-black uppercase text-white">Tu nombre</h2>
            <input
              type="text"
              maxlength="40"
              [value]="draftName()"
              (input)="draftName.set($any($event.target).value)"
              class="h-12 w-full rounded-row border border-line bg-ink px-4 font-sans text-[14px] text-white outline-none focus:border-pink"
            />
            <p class="mt-2 font-sans text-[11px] text-muted">Así apareces en el leaderboard.</p>
            <button
              type="button"
              (click)="saveName()"
              [disabled]="saving() || draftName().trim().length < 2"
              class="pressable mt-4 flex h-12 w-full items-center justify-center rounded-cta bg-cta font-display text-[12px] font-bold text-white disabled:opacity-50"
            >
              GUARDAR
            </button>
          } @else {
            <h2 class="mb-4 font-display text-[16px] font-black uppercase text-white">Equipo favorito</h2>
            <div class="flex flex-col gap-2">
              @for (t of teams; track t.id) {
                <button
                  type="button"
                  (click)="saveTeam(t.id)"
                  [disabled]="saving()"
                  class="pressable flex min-h-[48px] items-center justify-between rounded-row border px-4 font-sans text-[13px] font-semibold"
                  [class]="me()?.favoriteTeam === t.id ? 'border-pink bg-purple/25 text-white' : 'border-line bg-ink text-white/85'"
                >
                  <span>{{ t.city }} {{ t.name }}</span>
                  <span class="text-[11px] text-muted">{{ t.division }}</span>
                </button>
              }
            </div>
          }
        </section>
      }
    </app-screen-shell>
  `,
  styles: `
    .row {
      display: flex;
      min-height: 44px;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: var(--surface);
      padding: 13px 16px;
      text-align: left;
      font-family: 'Inter', system-ui, sans-serif;
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
export class ProfileScreen implements OnInit {
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);
  private readonly progress = inject(Progress);

  protected readonly teams = TEAMS;
  protected readonly me = this.progress.me;
  protected readonly trophies = signal<CollectionTrophy[]>([]);
  protected readonly quality = signal<ArQuality>(getArQuality());
  protected readonly sheet = signal<Sheet>(null);
  protected readonly draftName = signal('');
  protected readonly saving = signal(false);

  protected readonly team = computed(() => {
    const id = this.me()?.favoriteTeam;
    return id ? TEAM_BY_ID[id] : null;
  });
  protected readonly handle = computed(() => '@' + (this.me()?.email?.split('@')[0] ?? 'fan'));
  protected readonly stats = computed(() => {
    const c = this.me()?.counts;
    return [
      { label: 'SCANS', value: c?.scans ?? 0 },
      { label: 'TROPHIES', value: c?.trophies ?? 0 },
      { label: 'CARDS', value: `${c?.cards ?? 0}/${c?.cardsTotal ?? 0}` },
    ];
  });

  ngOnInit(): void {
    void this.progress.refresh();
    this.api
      .collection()
      .then((c) => this.trophies.set(c.trophies.filter((t) => t.unlockedAt).slice(0, 3)))
      .catch((e) => console.error(e));
  }

  protected rarity(r: Rarity) {
    return RARITY[r];
  }

  protected medal(r: Rarity): string {
    const c = RARITY[r].color;
    return r === 'mythic' ? c : `linear-gradient(90deg, ${c}, #f72585)`;
  }

  protected open(s: Exclude<Sheet, null>): void {
    this.fb.tap();
    this.draftName.set(this.me()?.displayName ?? '');
    this.sheet.set(s);
  }

  protected close(): void {
    this.sheet.set(null);
  }

  protected saveName(): Promise<void> {
    return this.save({ displayName: this.draftName().trim() }, 'Nombre actualizado');
  }

  protected saveTeam(id: string): Promise<void> {
    return this.save({ favoriteTeam: id }, 'Equipo favorito guardado');
  }

  protected toggleQuality(): void {
    this.fb.tap();
    const q: ArQuality = this.quality() === 'high' ? 'fast' : 'high';
    setArQuality(q);
    this.quality.set(q);
    this.toast.show(q === 'high' ? 'Calidad AR: Alta (mayor alcance)' : 'Calidad AR: Rápida (menos batería)');
  }

  protected async signOut(): Promise<void> {
    this.fb.tap();
    this.progress.me.set(null);
    await this.auth.signOut();
  }

  /** Borra los datos en la API y luego la cuenta de Firebase. */
  protected async deleteAccount(): Promise<void> {
    this.fb.tap();
    const ok = confirm(
      'Se borrarán tu cuenta, tus cartas, trofeos, insignias y puntos. No se puede deshacer. ¿Continuar?',
    );
    if (!ok) return;
    this.saving.set(true);
    try {
      await this.api.deleteMe();
      this.progress.me.set(null);
      await this.auth.deleteAccount();
      this.toast.show('Cuenta eliminada');
    } catch (e) {
      console.error(e);
      // Firebase exige un inicio de sesión reciente para borrar la cuenta: los datos ya se borraron,
      // se cierra la sesión para que vuelva a entrar y lo reintente.
      this.toast.show('Por seguridad, inicia sesión de nuevo y vuelve a intentarlo', 3500);
      await this.auth.signOut();
    } finally {
      this.saving.set(false);
    }
  }

  private async save(patch: { displayName?: string; favoriteTeam?: string }, done: string): Promise<void> {
    this.fb.tap();
    this.saving.set(true);
    try {
      await this.api.updateMe(patch);
      await this.progress.refresh();
      this.sheet.set(null);
      this.toast.show(done);
    } catch (e) {
      console.error(e);
      this.fb.error();
      this.toast.show('No se pudo guardar. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
