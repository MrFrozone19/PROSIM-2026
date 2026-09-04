import { Component, computed, inject, signal } from '@angular/core';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { Card, CARDS, RARITY, Rarity, VAULT_PROGRESS } from '../../data/cards';
import { BADGES, TROPHIES } from '../../data/trophies';
import { TEAM_BY_ID } from '../../data/teams';

type VaultTab = 'trophies' | 'cards' | 'badges';

/** /vault — colección de cartas TCG, trofeos e insignias. Tocar una carta abre su detalle. */
@Component({
  selector: 'app-vault-screen',
  imports: [ScreenShell, Icon],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-4 pt-3">
        <!-- vault-header-stats -->
        <div class="flex items-center justify-between gap-3 rounded-row border border-line bg-surface p-3">
          <div class="flex flex-col gap-1">
            <p class="font-sans text-[10px] font-bold leading-normal text-muted">UNLOCKED CLIPS</p>
            <div class="flex items-center gap-1.5">
              <app-icon name="Award" [size]="18" class="text-pink" />
              <span class="font-display text-[16px] font-black leading-normal text-white"
                >{{ progress.unlockedClips }}/{{ progress.totalClips }}</span
              >
            </div>
          </div>
          <div class="flex w-[180px] max-w-[52%] flex-col gap-1.5">
            <div class="flex justify-between font-sans text-[10px] font-bold leading-normal">
              <span class="text-muted">VAULT TIER {{ progress.tier }}</span>
              <span class="text-pink">{{ progress.tierProgress }}%</span>
            </div>
            <div class="h-1.5 w-full overflow-hidden rounded-[3px] bg-white/[0.08]">
              <div class="h-full rounded-[3px] bg-cta" [style.width.%]="progress.tierProgress"></div>
            </div>
          </div>
        </div>

        <!-- featured-unlock-banner -->
        <button
          type="button"
          (click)="promo()"
          class="pressable relative flex h-[85px] w-full items-center gap-3 overflow-hidden rounded-row border border-purple bg-gradient-to-r from-white/[0.06] to-white/[0.01] p-3 text-left"
        >
          <img src="assets/figma/vault-promo.webp" class="absolute inset-0 h-full w-full object-cover opacity-25" alt="" />
          <span
            class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-pink bg-purple text-white"
          >
            <app-icon name="Award" [size]="24" />
          </span>
          <span class="relative flex min-w-0 flex-col gap-0.5">
            <span class="font-sans text-[10px] font-extrabold leading-normal text-pink">LATEST AR TROPHY UNLOCKED</span>
            <span class="font-display text-[12px] font-bold leading-normal text-white">AL EAST CHAMPIONS</span>
            <span class="font-sans text-[10px] leading-normal text-muted">Spawn virtual ring inside AR scanner now</span>
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
              @for (c of cards; track c.id) {
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
                    <img [src]="c.art" class="absolute inset-0 h-full w-full object-cover" alt="" loading="lazy" />
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
                    @if (!c.owned) {
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
              @for (t of trophies; track t.id) {
                <div
                  class="flex items-center gap-3 rounded-row border bg-surface px-3 py-3"
                  [class.opacity-60]="!t.unlocked"
                  [style.border-color]="t.unlocked ? rarity(t.rarity).color + '8c' : 'rgba(255,255,255,0.08)'"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-black text-white"
                    [style.background]="t.unlocked ? medal(t.rarity) : 'rgba(255,255,255,0.1)'"
                    >{{ t.code }}</span
                  >
                  <span class="flex min-w-0 flex-1 flex-col">
                    <span class="font-sans text-[13px] font-bold text-white">{{ t.title }}</span>
                    <span class="font-sans text-[11px] text-muted">{{ t.description }}</span>
                  </span>
                  <span class="flex flex-col items-end gap-1">
                    <span class="font-display text-[8px] font-bold uppercase tracking-wide" [style.color]="rarity(t.rarity).color">{{ rarity(t.rarity).label }}</span>
                    @if (t.unlocked) {
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
              @for (b of badges; track b.id) {
                <div
                  class="flex items-center gap-3 rounded-row border bg-surface p-3"
                  [class]="b.earned ? 'border-purple/60' : 'border-line opacity-60'"
                >
                  <span
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    [class]="b.earned ? 'bg-cta text-white' : 'bg-white/10 text-muted'"
                  >
                    <app-icon [name]="b.earned ? 'Medal' : 'Lock'" [size]="18" />
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
                <img [src]="c.art" class="h-full w-full object-cover" alt="" />
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
                  {{ teamName(c.teamId) }} · {{ c.owned ? c.serial : 'Bloqueada' }}
                </p>
              </div>
              @if (c.owned) {
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
                  Carta coleccionable de prototipo. Se desbloquea escaneando el logo de {{ teamName(c.teamId) }} en la
                  ventana AR.
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
export class VaultScreen {
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);

  protected readonly progress = VAULT_PROGRESS;
  protected readonly cards = CARDS;
  protected readonly trophies = TROPHIES;
  protected readonly badges = BADGES;
  protected readonly tabs: { id: VaultTab; label: string }[] = [
    { id: 'trophies', label: 'Trophies' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
  ];

  protected readonly tab = signal<VaultTab>('cards');
  protected readonly selected = signal<Card | null>(null);
  protected readonly selectedRarity = computed(() => (this.selected() ? RARITY[this.selected()!.rarity] : null));

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

  protected statsOf(c: Card) {
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

  protected open(c: Card): void {
    this.fb.tap();
    this.selected.set(c);
  }

  protected close(): void {
    this.selected.set(null);
  }

  protected promo(): void {
    this.fb.tap();
    this.toast.show('Anillo virtual: disponible en el modo AR (próximamente)');
  }
}
