import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { shareFile } from '../../shared/share-file';
import { VIDEO_FILTERS } from '../../data/videos';
import { Api, CollectionBadge, CollectionCard, CollectionTrophy, GalleryItem } from '../../core/api';
import { Progress } from '../../core/progress';
import { RARITY, Rarity } from '../../data/cards';
import { TEAM_BY_ID } from '../../data/teams';

type VaultTab = 'trophies' | 'cards' | 'badges' | 'gallery';
type GalleryKind = 'all' | 'photo' | 'video';

/**
 * /vault — colección de cartas TCG, trofeos e insignias del usuario (API). Tocar una carta abre su detalle.
 * Cada carta se desbloquea escaneando el logo de su equipo.
 */
@Component({
  selector: 'app-vault-screen',
  imports: [ScreenShell, Icon, DatePipe, RouterLink],
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
        <div class="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
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
          @case ('gallery') {
            <div class="flex gap-2">
              @for (k of kinds; track k.id) {
                <button
                  type="button"
                  (click)="kind.set(k.id)"
                  [attr.aria-pressed]="kind() === k.id"
                  class="pressable min-h-[32px] rounded-pill border px-3 font-sans text-[11px] font-semibold transition-colors"
                  [class]="kind() === k.id ? 'border-pink bg-pink/20 text-white' : 'border-line bg-surface text-muted'"
                >
                  {{ k.label }} · {{ countOf(k.id) }}
                </button>
              }
            </div>
            @if (!galleryLoaded()) {
              <div class="grid grid-cols-3 gap-2">
                @for (i of [1, 2, 3]; track i) {
                  <div class="aspect-[3/4] animate-pulse rounded-[12px] border border-line bg-surface"></div>
                }
              </div>
            } @else if (!shown().length) {
              <div class="flex flex-col gap-2 rounded-row border border-dashed border-line bg-surface p-4">
                <p class="font-sans text-[12px] text-muted">Aquí aparecen tus fotos del escáner AR y tus clips grabados.</p>
                <div class="flex gap-2">
                  <a routerLink="/scan" class="pressable flex min-h-[36px] items-center gap-1.5 rounded-pill bg-cta px-3 font-sans text-[11px] font-bold text-white">
                    <app-icon name="Camera" [size]="14" /> Tomar foto
                  </a>
                  <a routerLink="/videos" class="pressable flex min-h-[36px] items-center gap-1.5 rounded-pill border border-line px-3 font-sans text-[11px] font-bold text-white">
                    <app-icon name="Video" [size]="14" /> Grabar clip
                  </a>
                </div>
              </div>
            } @else {
              <div class="grid grid-cols-3 gap-2">
                @for (g of shown(); track g.id) {
                  <button
                    type="button"
                    (click)="openItem(g)"
                    class="pressable relative aspect-[3/4] overflow-hidden rounded-[12px] border border-line bg-surface"
                    [attr.aria-label]="g.kind === 'photo' ? 'Foto' : 'Video'"
                  >
                    @if (g.kind === 'photo') {
                      <img [src]="g.url" class="absolute inset-0 h-full w-full object-cover" loading="lazy" alt="" />
                    } @else {
                      <video
                        [src]="g.url + '#t=0.1'"
                        class="absolute inset-0 h-full w-full object-cover"
                        preload="metadata"
                        muted
                        playsinline
                      ></video>
                      <span class="absolute inset-0 flex items-center justify-center">
                        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white">
                          <app-icon name="Play" [size]="14" />
                        </span>
                      </span>
                    }
                    <span
                      class="absolute left-1.5 top-1.5 rounded-[4px] px-1.5 py-0.5 font-sans text-[8px] font-bold uppercase text-white"
                      [class]="g.filter ? 'bg-pink' : 'bg-black/70'"
                      >{{ tagOf(g) }}</span
                    >
                    @if (g.durationMs) {
                      <span class="absolute bottom-1.5 right-1.5 rounded-[4px] bg-black/70 px-1.5 py-0.5 font-sans text-[9px] font-semibold text-white">{{
                        duration(g.durationMs)
                      }}</span>
                    }
                  </button>
                }
              </div>
            }
          }
        }
      </div>

      <!-- visor de la galería -->
      @if (viewing(); as g) {
        <div class="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-label="Galería">
          <div class="flex items-center justify-between px-4 pb-2" style="padding-top: calc(12px + env(safe-area-inset-top))">
            <div class="flex flex-col">
              <span class="font-display text-[13px] font-bold uppercase text-white">{{ tagOf(g) }}</span>
              <span class="font-sans text-[11px] text-muted">
                {{ g.createdAt | date: 'd MMM yyyy, HH:mm' }}{{ g.teamId ? ' · ' + teamName(g.teamId) : '' }}
              </span>
            </div>
            <button
              type="button"
              (click)="closeItem()"
              class="pressable flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Cerrar"
            >
              <app-icon name="X" [size]="18" />
            </button>
          </div>
          <div class="flex min-h-0 flex-1 items-center justify-center px-3">
            @if (g.kind === 'photo') {
              <img [src]="g.url" class="max-h-full max-w-full rounded-row object-contain" alt="" />
            } @else {
              <video [src]="g.url" class="max-h-full max-w-full rounded-row" controls autoplay loop playsinline></video>
            }
          </div>
          <div class="flex gap-3 px-4 pt-3" style="padding-bottom: calc(16px + env(safe-area-inset-bottom))">
            <button
              type="button"
              (click)="removeItem(g)"
              [disabled]="busy()"
              class="pressable flex h-12 flex-1 items-center justify-center gap-2 rounded-cta border border-pink/60 font-display text-[12px] font-bold text-pink disabled:opacity-50"
            >
              <app-icon name="Trash2" [size]="16" /> ELIMINAR
            </button>
            <button
              type="button"
              (click)="shareItem(g)"
              [disabled]="!viewBlob() || busy()"
              class="pressable flex h-12 flex-[2] items-center justify-center gap-2 rounded-cta bg-cta font-display text-[12px] font-bold text-white disabled:opacity-60"
            >
              <app-icon name="Share2" [size]="16" /> {{ viewBlob() ? 'COMPARTIR / GUARDAR' : 'PREPARANDO…' }}
            </button>
          </div>
        </div>
      }

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
  private readonly toast = inject(Toast);

  protected readonly me = this.progress.me;
  protected readonly cards = signal<CollectionCard[]>([]);
  protected readonly trophies = signal<CollectionTrophy[]>([]);
  protected readonly badges = signal<CollectionBadge[]>([]);
  protected readonly tabs: { id: VaultTab; label: string }[] = [
    { id: 'trophies', label: 'Trophies' },
    { id: 'cards', label: 'Cards' },
    { id: 'badges', label: 'Badges' },
    { id: 'gallery', label: 'Galería' },
  ];
  protected readonly kinds: { id: GalleryKind; label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'photo', label: 'Fotos' },
    { id: 'video', label: 'Videos' },
  ];

  protected readonly tab = signal<VaultTab>(
    (inject(ActivatedRoute).snapshot.queryParamMap.get('tab') as VaultTab | null) ?? 'cards',
  );

  // Galería
  protected readonly galleryItems = signal<GalleryItem[]>([]);
  protected readonly galleryLoaded = signal(false);
  protected readonly kind = signal<GalleryKind>('all');
  protected readonly shown = computed(() =>
    this.kind() === 'all' ? this.galleryItems() : this.galleryItems().filter((g) => g.kind === this.kind()),
  );
  protected readonly viewing = signal<GalleryItem | null>(null);
  /** El archivo se descarga al abrir el visor para que Compartir se llame directo desde el toque (requisito de Safari). */
  protected readonly viewBlob = signal<Blob | null>(null);
  protected readonly busy = signal(false);
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
    this.api
      .gallery()
      .then((items) => this.galleryItems.set(items))
      .catch((e) => console.error(e))
      .finally(() => this.galleryLoaded.set(true));
  }

  protected countOf(k: GalleryKind): number {
    return k === 'all' ? this.galleryItems().length : this.galleryItems().filter((g) => g.kind === k).length;
  }

  protected tagOf(g: GalleryItem): string {
    if (g.kind === 'photo') return 'Foto AR';
    return g.filter ? (VIDEO_FILTERS.find((f) => f.id === g.filter)?.label ?? g.filter) : 'Video';
  }

  protected duration(ms: number): string {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  protected openItem(g: GalleryItem): void {
    this.fb.tap();
    this.viewing.set(g);
    this.viewBlob.set(null);
    fetch(g.url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((b) => {
        if (this.viewing()?.id === g.id) this.viewBlob.set(b);
      })
      .catch((e) => console.error(e));
  }

  protected closeItem(): void {
    this.viewing.set(null);
    this.viewBlob.set(null);
  }

  protected async shareItem(g: GalleryItem): Promise<void> {
    const blob = this.viewBlob();
    if (!blob) return;
    const ext = g.mime === 'image/jpeg' ? 'jpg' : g.mime === 'video/webm' ? 'webm' : 'mp4';
    const r = await shareFile(blob, `basedex-${g.id.slice(0, 8)}.${ext}`, 'BaseDex Fan');
    if (r === 'downloaded') this.toast.show('Descargado');
  }

  protected async removeItem(g: GalleryItem): Promise<void> {
    this.fb.tap();
    if (!confirm(g.kind === 'photo' ? '¿Eliminar esta foto?' : '¿Eliminar este clip?')) return;
    this.busy.set(true);
    try {
      await this.api.deleteGalleryItem(g.id);
      this.galleryItems.update((items) => items.filter((i) => i.id !== g.id));
      this.closeItem();
      this.toast.show('Eliminado de la Galería');
    } catch (e) {
      console.error(e);
      this.fb.error();
      this.toast.show('No se pudo eliminar. Intenta de nuevo.');
    } finally {
      this.busy.set(false);
    }
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
