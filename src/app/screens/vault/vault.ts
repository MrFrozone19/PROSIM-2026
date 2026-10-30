import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Api, CollectionBadge, CollectionCard, CollectionTrophy } from '../../core/api';
import { Progress } from '../../core/progress';
import { RARITY, Rarity } from '../../data/cards';
import { TEAM_BY_ID } from '../../data/teams';

type VaultTab = 'trophies' | 'cards' | 'badges';

/**
 * /vault — colección de cartas TCG, trofeos e insignias del usuario (API). Tocar una carta abre su detalle.
 * Cada carta se desbloquea escaneando el logo de su equipo.
 */
@Component({
  selector: 'app-vault-screen',
  imports: [ScreenShell, Icon, DatePipe],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-4 pt-3">
        <!-- vault-header-stats -->
        <div class="flex items-center justify-between gap-3 rounded-row border border-line bg-surface p-3">
          <div class="flex flex-col gap-1">
            <p class="font-sans text-[10px] font-bold leading-normal text-muted">UNLOCKED CARDS</p>
            <div class="flex items-center gap-1.5">
              <app-icon name="Award" [size]="18" class="text-pink" />
              <span class="font-display text-[16px] font-black leading-normal text-white"
                >{{ owned() }}/{{ cards().length }}</span
              >
            </div>
          </div>
          <div class="flex w-[180px] max-w-[52%] flex-col gap-1.5">
            <div class="flex justify-between font-sans text-[10px] font-bold leading-normal">
              <span class="text-muted">FAN LEVEL {{ me()?.level ?? 1 }}</span>
              <span class="text-pink">{{ levelPct() }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-[3px] bg-white/[0.08]">
              <div class="h-full rounded-[3px] bg-cta" [style.width.%]="levelPct()"></div>
            </div>
          </div>
        </div>

        <!-- featured-unlock-banner: último trofeo o invitación a escanear -->
        <button
          type="button"
          (click)="promo()"
          class="pressable relative flex h-[85px] w-full items-center gap-3 overflow-hidden rounded-row border border-purple bg-gradient-to-r from-white/[0.06] to-white/[0.01] p-3 text-left"
        >
          <img src="assets/figma/vault-promo.webp" class="absolute inset-0 h-full w-full object-cover opacity-25" alt="" />
          <span
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-pink bg-purple text-white"
          >
            <app-icon [name]="latest() ? 'Award' : 'ScanLine'" [size]="24" />
          </span>
          <span class="relative flex min-w-0 flex-col gap-0.5">
            @if (latest(); as t) {
              <span class="font-sans text-[10px] font-extrabold leading-normal text-pink">LATEST AR TROPHY UNLOCKED</span>
              <span class="font-display text-[12px] font-bold uppercase leading-normal text-white">{{ t.title }}</span>
              <span class="truncate font-sans text-[10px] leading-normal text-muted">{{ t.description }}</span>
            } @else {
              <span class="font-sans text-[10px] font-extrabold leading-normal text-pink">TU COLECCIÓN EMPIEZA AQUÍ</span>
              <span class="font-display text-[12px] font-bold leading-normal text-white">ESCANEA UN LOGO</span>
              <span class="font-sans text-[10px] leading-normal text-muted">Cada equipo escaneado desbloquea su carta</span>
            }
          </span>
        </button>

        <!-- category-tabs -->
        <div class="flex gap-2">
          @for (t of tabs; track t.id) {
            <button
              type="button"
              (click)="setTab(t.id)"
              [attr.aria-pressed]="tab() === t.id"
              class="pressable min-h-[36px] rounded-[20px] border px-4 py-2 font-sans text-[11px] font-bold leading-normal text-white transition-colors"
              [class]="tab() === t.id ? 'border-pink bg-purple' : 'border-line bg-surface'"
            >
              {{ t.label }}
            </button>
          }
        </div>

        @switch (tab()) {
          @case ('cards') {
            <div class="grid grid-cols-3 gap-3">
              @for (c of cards(); track c.id) {
                <button
                  type="button"
                  (click)="open(c)"
                  class="pressable relative h-[130px] overflow-hidden rounded-[12px] bg-surface text-left"
                  [class]="rarity(c.rarity).glow ? 'border-[1.5px]' : 'border border-line'"
                  [style.border-color]="rarity(c.rarity).glow ? rarity(c.rarity).color : null"
                  [style.box-shadow]="rarity(c.rarity).glow ? '0 0 16px ' + rarity(c.rarity).color : null"
                  [attr.aria-label]="c.name + ', ' + rarity(c.rarity).label"
                >
                  @if (c.art) {
                    <img
                      [src]="c.art"
                      class="absolute inset-0 h-full w-full object-cover"
                      [class]="c.obtainedAt ? '' : 'opacity-25 blur-[3px]'"
                      alt=""
                      loading="lazy"
                    />
                  }
                  <div
                    class="absolute inset-0 flex flex-col justify-between p-2"
                    [class]="rarity(c.rarity).glow ? 'bg-black/[0.31]' : 'bg-black/[0.52]'"
                  >
                    <span
                      class="self-start rounded-[4px] px-1.5 py-0.5 font-sans text-[8px] uppercase leading-normal text-white"
                      [class]="rarity(c.rarity).glow ? 'bg-pink' : 'bg-black/[0.67]'"
                      >{{ rarity(c.rarity).label }}</span
                    >
                    @if (!c.obtainedAt) {
                      <span class="absolute inset-0 flex items-center justify-center text-muted">
                        <app-icon name="Lock" [size]="22" />
                      </span>
                    }
                    <span class="truncate font-sans text-[10px] font-extrabold leading-normal text-white">{{ c.name }}</span>
                  </div>
                </button>
              }
            </div>
          }
          @case ('trophies') {
            <div class="flex flex-col gap-2">
              @for (t of trophies(); track t.id) {
                <div
                  class="flex items-center gap-3 rounded-row border bg-surface px-3 py-3"
                  [class.opacity-60]="!t.unlockedAt"
                  [style.border-color]="t.unlockedAt ? rarity(t.rarity).color + '8c' : 'rgba(255,255,255,0.08)'"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-black text-white"
                    [style.background]="t.unlockedAt ? medal(t.rarity) : 'rgba(255,255,255,0.1)'"
                    >{{ t.code }}</span
                  >
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="font-sans text-[13px] font-bold text-white">{{ t.title }}</span>
                    <span class="font-sans text-[11px] text-muted">{{ t.description }}</span>
                  </span>
                  <span class="flex flex-col items-end gap-1">
                    <span class="font-display text-[8px] font-bold uppercase tracking-wide" [style.color]="rarity(t.rarity).color">{{ rarity(t.rarity).label }}</span>
                    @if (t.unlockedAt) {
                      <app-icon name="Check" [size]="14" class="text-[#80ed99]" />
                    } @else {
                      <app-icon name="Lock" [size]="14" class="text-muted" />
                    }
                  </span>
                </div>
              }
            </div>
          }
          @case ('badges') {
            <div class="grid grid-cols-2 gap-3">
              @for (b of badges(); track b.id) {
                <div
                  class="flex items-center gap-3 rounded-row border bg-surface p-3"
                  [class]="b.earnedAt ? 'border-purple/60' : 'border-line opacity-60'"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    [class]="b.earnedAt ? 'bg-cta text-white' : 'bg-white/10 text-muted'"
                  >
                    <app-icon [name]="b.earnedAt ? 'Medal' : 'Lock'" [size]="18" />
                  </span>
                  <span class="flex min-w-0 flex-col">
                    <span class="truncate font-sans text-[12px] font-bold text-white">{{ b.label }}</span>
                    <span class="truncate font-sans text-[10px] text-muted">{{ b.description }}</span>
                  </span>
                </div>
              }
            </div>
          }
        }
      </div>

      <!-- detalle de carta -->
      @if (selected(); as c) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          (click)="close()"
          role="dialog"
          [attr.aria-label]="c.name"
        >
          <div
            class="modal-in w-full max-w-[320px] overflow-hidden rounded-card border-[1.5px] bg-surface"
            [style.border-color]="rarity(c.rarity).color"
            [style.box-shadow]="'0 0 32px ' + rarity(c.rarity).color + '99'"
            (click)="$event.stopPropagation()"
          >
            <div class="relative h-44 w-full bg-ink">
              @if (c.art) {
                <img [src]="c.art" class="h-full w-full object-cover" [class]="c.obtainedAt ? '' : 'opacity-25 blur-[4px]'" alt="" />
              } @else {
                <div class="flex h-full items-center justify-center text-muted"><app-icon name="Lock" [size]="36" /></div>
              }
              <span
                class="absolute left-3 top-3 rounded-[4px] px-2 py-1 font-sans text-[9px] font-extrabold uppercase text-white"
                [style.background]="rarity(c.rarity).color"
                >{{ rarity(c.rarity).label }}</span
              >
              <button
                type="button"
                (click)="close()"
                class="pressable absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Cerrar"
              >
                <app-icon name="X" [size]="18" />
              </button>
            </div>
            <div class="flex flex-col gap-3 p-5">
              <div>
                <p class="font-display text-[18px] font-black uppercase leading-tight text-white">{{ c.name }}</p>
                <p class="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {{ teamName(c.teamId) }} · {{ c.obtainedAt ? c.serial : 'Bloqueada' }}
                </p>
              </div>
              @if (c.obtainedAt) {
                @for (s of statsOf(c); track s.label) {
                  <div class="flex items-center gap-3">
                    <span class="w-16 font-sans text-[11px] font-bold uppercase text-muted">{{ s.label }}</span>
                    <div class="h-1.5 flex-1 overflow-hidden rounded-pill bg-white/10">
                      <div class="h-full rounded-pill bg-cta" [style.width.%]="s.value"></div>
                    </div>
                    <span class="w-7 text-right font-display text-[12px] font-bold text-white">{{ s.value }}</span>
                  </div>
                }
                <p class="font-sans text-[11px] text-muted">
                  Desbloqueada el {{ c.obtainedAt | date: 'd MMM yyyy' }} al escanear el logo de {{ teamName(c.teamId) }}.
                </p>
              } @else {
                <p class="font-sans text-[12px] text-muted">
                  Escanea el logo de {{ teamName(c.teamId) }} en el modo AR para desbloquear esta carta.
                </p>
              }
            </div>
          </div>
        </div>
      }
    </app-screen-shell>
  `,
  styles: `
    .modal-in {
      animation: modal-in 180ms ease-out;
    }
    @keyframes modal-in {
      from {
        opacity: 0;
        transform: scale(0.94) translateY(10px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class VaultScreen implements OnInit {
  private readonly fb = inject(Feedback);
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly progress = inject(Progress);

  protected readonly me = this.progress.me;
  protected readonly cards = signal<CollectionCard[]>([]);
  protected readonly trophies = signal<CollectionTrophy[]>([]);
  protected readonly badges = signal<CollectionBadge[]>([]);
  protected readonly tabs: { id: VaultTab; label: string }[] = [
    { id: 'trophies', label: 'Trophies' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
  ];

  protected readonly tab = signal<VaultTab>('cards');
  protected readonly selected = signal<CollectionCard | null>(null);
  protected readonly owned = computed(() => this.cards().filter((c) => c.obtainedAt).length);
  /** La API ordena los trofeos con el más reciente primero. */
  protected readonly latest = computed(() => this.trophies().find((t) => t.unlockedAt) ?? null);
  protected readonly levelPct = computed(() => {
    const m = this.me();
    return m ? Math.round((m.levelXp / m.levelXpMax) * 100) : 0;
  });

  ngOnInit(): void {
    void this.progress.refresh();
    this.api
      .collection()
      .then((c) => {
        this.cards.set(c.cards);
        this.trophies.set(c.trophies);
        this.badges.set(c.badges);
      })
      .catch((e) => console.error(e));
  }

  protected rarity(r: Rarity) {
    return RARITY[r];
  }

  protected medal(r: Rarity): string {
    const c = RARITY[r].color;
    return r === 'mythic' ? c : `linear-gradient(90deg, ${c}, #f72585)`;
  }

  protected teamName(id: string): string {
    const t = TEAM_BY_ID[id];
    return t ? `${t.city} ${t.name}` : id.toUpperCase();
  }

  protected statsOf(c: CollectionCard) {
    return [
      { label: 'Power', value: c.power },
      { label: 'Speed', value: c.speed },
      { label: 'Charisma', value: c.charisma },
    ];
  }

  protected setTab(t: VaultTab): void {
    this.fb.tap();
    this.tab.set(t);
  }

  protected open(c: CollectionCard): void {
    this.fb.tap();
    this.selected.set(c);
  }

  protected close(): void {
    this.selected.set(null);
  }

  /** Con trofeo: abre la pestaña de trofeos. Sin trofeos todavía: lleva al escáner. */
  protected promo(): void {
    this.fb.tap();
    if (this.latest()) this.tab.set('trophies');
    else void this.router.navigateByUrl('/scan');
  }
}
