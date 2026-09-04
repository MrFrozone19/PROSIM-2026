import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { FilterId, VIDEO_CLIPS, VIDEO_FILTERS, VideoClip } from '../../data/videos';

/**
 * /videos — "AR Studio": reproductor con filtros reales sobre el <video>.
 * Blur, Pastel y Color Adjust usan filtros CSS y capas de mezcla.
 * Pixelate y Thermal se procesan por cuadro en un <canvas> superpuesto (CSS no puede pixelar ni mapear a calor).
 * No se implementan B/N, escala de grises, sepia, exposición ni invertidos (prohibidos por la rúbrica).
 */
@Component({
  selector: 'app-videos-screen',
  imports: [ScreenShell, Icon, NgTemplateOutlet],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-4 pt-3">
        <header class="flex flex-col gap-1">
          <h1 class="font-display text-[20px] font-black leading-normal text-white">AR STUDIO</h1>
          <p class="font-sans text-[12px] leading-normal text-muted">Capture and customize fan experiences</p>
        </header>

        <!-- video-player-container -->
        <div #player class="relative h-[200px] w-full overflow-hidden rounded-row border border-line bg-surface">
          <video
            #vid
            class="absolute inset-0 h-full w-full object-cover"
            [style.filter]="cssFilter()"
            [src]="current().src"
            [poster]="current().poster"
            (timeupdate)="onTime()"
            (loadedmetadata)="onTime()"
            (play)="playing.set(true)"
            (pause)="playing.set(false)"
            (click)="togglePlay()"
            autoplay
            muted
            loop
            playsinline
          ></video>
          <canvas
            #fx
            width="640"
            height="360"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover"
            [class.hidden]="!canvasMode()"
            [style.image-rendering]="filter() === 'pixelate' ? 'pixelated' : 'auto'"
          ></canvas>
          @if (filter() === 'pastel' && applied()) {
            <div
              class="pointer-events-none absolute inset-0 mix-blend-soft-light"
              [style.opacity]="0.35 + intensity() / 100 * 0.6"
              style="background: linear-gradient(135deg, #ffd6e8 0%, #d8c7ff 50%, #c7f0ff 100%)"
            ></div>
          }
          <!-- player-overlay -->
          <div class="pointer-events-none absolute inset-0 flex flex-col justify-between bg-black/[0.38] p-3">
            <div class="flex items-start justify-between">
              <span class="rounded-md bg-pink px-2 py-1 font-sans text-[10px] font-extrabold uppercase leading-normal text-white">
                {{ badge() }}
              </span>
              <button
                type="button"
                (click)="fullscreen()"
                class="pressable pointer-events-auto -mr-1 -mt-1 flex h-9 w-9 items-center justify-center text-white"
                aria-label="Pantalla completa"
              >
                <app-icon name="Maximize" [size]="18" />
              </button>
            </div>
            <div class="flex justify-center">
              <button
                type="button"
                (click)="togglePlay()"
                class="pressable pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 text-white shadow-[0_0_16px_rgba(255,255,255,0.35)]"
                [attr.aria-label]="playing() ? 'Pausar' : 'Reproducir'"
              >
                <app-icon [name]="playing() ? 'Pause' : 'Play'" [size]="20" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-sans text-[11px] leading-normal text-white">{{ time() }}</span>
              <div
                class="pointer-events-auto relative h-4 flex-1 cursor-pointer"
                (click)="seek($event)"
                role="slider"
                aria-label="Progreso"
                [attr.aria-valuenow]="progress()"
              >
                <div class="absolute inset-x-0 top-1.5 h-1 rounded-sm bg-white/[0.19]">
                  <div class="h-full rounded-sm bg-purple" [style.width.%]="progress()"></div>
                </div>
                <div
                  class="absolute top-1 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white"
                  [style.left.%]="progress()"
                ></div>
              </div>
              <span class="font-sans text-[11px] leading-normal text-muted">{{ current().duration }}</span>
            </div>
          </div>
        </div>

        <!-- filters-section -->
        <section class="flex flex-col gap-2">
          <p class="font-sans text-[11px] font-bold leading-normal text-muted">AR RENDER ENGINE FILTERS</p>
          <div class="flex flex-wrap gap-2">
            @for (f of filters; track f.id) {
              <button
                type="button"
                (click)="pick(f.id)"
                [attr.aria-pressed]="filter() === f.id"
                class="pressable min-h-[36px] rounded-row border px-3 py-2 font-sans text-[11px] font-bold leading-normal text-white transition-colors"
                [class]="filter() === f.id ? 'border-pink bg-purple' : 'border-line bg-surface'"
              >
                {{ f.label }}
              </button>
            }
          </div>
          @if (filter(); as f) {
            <div class="mt-1 flex flex-col gap-3 rounded-row border border-line bg-surface p-3">
              <div class="flex items-center justify-between">
                <span class="font-sans text-[12px] font-semibold text-white">{{ filterLabel() }}</span>
                <label class="flex items-center gap-2 font-sans text-[11px] font-semibold text-muted">
                  {{ enabled() ? 'Activo' : 'Apagado' }}
                  <button
                    type="button"
                    role="switch"
                    [attr.aria-checked]="enabled()"
                    (click)="toggleEnabled()"
                    class="relative h-6 w-11 rounded-pill transition-colors"
                    [class]="enabled() ? 'bg-pink' : 'bg-white/20'"
                  >
                    <span
                      class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                      [class]="enabled() ? 'translate-x-[22px]' : 'translate-x-0.5'"
                    ></span>
                  </button>
                </label>
              </div>
              @if (f === 'color') {
                @for (c of colorControls; track c.key) {
                  <label class="flex flex-col gap-1">
                    <span class="flex justify-between font-sans text-[11px] text-muted">
                      <span>{{ c.label }}</span><span>{{ color()[c.key] }}%</span>
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      [value]="color()[c.key]"
                      (input)="setColor(c.key, $event)"
                      class="range"
                    />
                  </label>
                }
              } @else {
                <label class="flex flex-col gap-1">
                  <span class="flex justify-between font-sans text-[11px] text-muted">
                    <span>Intensidad</span><span>{{ intensity() }}%</span>
                  </span>
                  <input type="range" min="0" max="100" [value]="intensity()" (input)="setIntensity($event)" class="range" />
                </label>
              }
              <button
                type="button"
                (pointerdown)="compare.set(true)"
                (pointerup)="compare.set(false)"
                (pointercancel)="compare.set(false)"
                (pointerleave)="compare.set(false)"
                class="pressable flex min-h-[40px] items-center justify-center gap-2 rounded-pill border border-line font-sans text-[12px] font-bold text-white"
                [class.bg-white/10]="compare()"
              >
                <app-icon [name]="compare() ? 'EyeOff' : 'Eye'" [size]="16" class="text-pink" />
                {{ compare() ? 'Mostrando original' : 'Mantén presionado para comparar' }}
              </button>
            </div>
          }
        </section>

        <!-- favoritos -->
        <section class="flex flex-col gap-3">
          <p class="font-sans text-[11px] font-bold leading-normal text-muted">YOUR FAVORITE CLIPS</p>
          <div class="grid grid-cols-2 gap-3">
            @for (c of favorites; track c.id) {
              <ng-container *ngTemplateOutlet="card; context: { $implicit: c }" />
            }
          </div>
        </section>
        <section class="flex flex-col gap-3">
          <p class="font-sans text-[11px] font-bold leading-normal text-muted">ALL RECORDED CLIPS</p>
          <div class="grid grid-cols-2 gap-3">
            @for (c of clips; track c.id) {
              <ng-container *ngTemplateOutlet="card; context: { $implicit: c }" />
            }
          </div>
        </section>

        <ng-template #card let-c>
          <button
            type="button"
            (click)="select(c)"
            class="pressable relative h-[130px] overflow-hidden rounded-[12px] border bg-surface text-left transition-colors"
            [class]="current().id === c.id ? 'border-pink' : 'border-line'"
          >
            <img [src]="c.poster" class="absolute inset-0 h-full w-full object-cover" alt="" loading="lazy" />
            <div class="absolute inset-0 flex flex-col justify-between bg-black/[0.44] p-2.5">
              <div class="flex items-start justify-between text-white">
                <app-icon [name]="current().id === c.id && playing() ? 'Pause' : 'Play'" [size]="16" />
                <span class="font-sans text-[10px] leading-normal">{{ c.duration }}</span>
              </div>
              <p class="truncate font-sans text-[11px] font-bold leading-normal text-white">{{ c.title }}</p>
            </div>
          </button>
        </ng-template>
      </div>
    </app-screen-shell>
  `,
  styles: `
    .range {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.19);
      outline: none;
    }
    .range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #9d4edd;
      box-shadow: 0 0 8px rgba(157, 78, 221, 0.6);
    }
    .range::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #9d4edd;
    }
  `,
})
export class VideosScreen implements AfterViewInit, OnDestroy {
  private readonly vid = viewChild.required<ElementRef<HTMLVideoElement>>('vid');
  private readonly fx = viewChild.required<ElementRef<HTMLCanvasElement>>('fx');
  private readonly playerBox = viewChild.required<ElementRef<HTMLDivElement>>('player');
  private readonly fb = inject(Feedback);

  protected readonly filters = VIDEO_FILTERS;
  protected readonly clips = VIDEO_CLIPS;
  protected readonly favorites = VIDEO_CLIPS.filter((c) => c.favorite);
  protected readonly colorControls = [
    { key: 'brightness' as const, label: 'Brillo' },
    { key: 'contrast' as const, label: 'Contraste' },
    { key: 'saturation' as const, label: 'Saturación' },
  ];

  protected readonly current = signal<VideoClip>(VIDEO_CLIPS[0]);
  protected readonly playing = signal(false);
  protected readonly progress = signal(0);
  protected readonly time = signal('0:00');

  protected readonly filter = signal<FilterId | null>('thermal');
  protected readonly enabled = signal(true);
  protected readonly compare = signal(false);
  protected readonly intensity = signal(60);
  protected readonly color = signal({ brightness: 110, contrast: 115, saturation: 130 });

  /** El filtro se aplica salvo que esté apagado o se esté comparando con el original. */
  protected readonly applied = computed(() => this.filter() !== null && this.enabled() && !this.compare());
  protected readonly canvasMode = computed(
    () => this.applied() && (this.filter() === 'pixelate' || this.filter() === 'thermal'),
  );
  protected readonly filterLabel = computed(() => this.filters.find((f) => f.id === this.filter())?.label ?? '');
  protected readonly badge = computed(() =>
    this.applied() ? `${this.filterLabel()} filter` : this.filter() ? 'Original' : 'Sin filtro',
  );

  protected readonly cssFilter = computed(() => {
    if (!this.applied()) return 'none';
    const k = this.intensity() / 100;
    switch (this.filter()) {
      case 'blur':
        return `blur(${(k * 10).toFixed(1)}px)`;
      case 'pastel':
        return `saturate(${(1 + 0.4 * k).toFixed(2)}) brightness(${(1 + 0.15 * k).toFixed(2)}) contrast(${(1 - 0.3 * k).toFixed(2)}) blur(${(k * 0.8).toFixed(1)}px)`;
      case 'color': {
        const c = this.color();
        return `brightness(${c.brightness / 100}) contrast(${c.contrast / 100}) saturate(${c.saturation / 100})`;
      }
      default:
        return 'none';
    }
  });

  private raf = 0;
  private readonly small = document.createElement('canvas');
  private readonly thermalLut = this.buildThermalLut();

  ngAfterViewInit(): void {
    this.loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
  }

  protected pick(id: FilterId): void {
    this.fb.tap();
    this.filter.update((f) => (f === id ? null : id));
    this.enabled.set(true);
  }

  protected toggleEnabled(): void {
    this.fb.tap();
    this.enabled.update((v) => !v);
  }

  protected setIntensity(e: Event): void {
    this.intensity.set(Number((e.target as HTMLInputElement).value));
  }

  protected setColor(key: 'brightness' | 'contrast' | 'saturation', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    this.color.update((c) => ({ ...c, [key]: v }));
  }

  protected select(c: VideoClip): void {
    this.fb.tap();
    if (this.current().id === c.id) {
      this.togglePlay();
      return;
    }
    this.current.set(c);
    this.progress.set(0);
    queueMicrotask(() => void this.vid().nativeElement.play().catch(() => undefined));
  }

  protected togglePlay(): void {
    const v = this.vid().nativeElement;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }

  protected seek(e: MouseEvent): void {
    const v = this.vid().nativeElement;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (v.duration) v.currentTime = ratio * v.duration;
  }

  protected fullscreen(): void {
    this.fb.tap();
    const box = this.playerBox().nativeElement;
    const v = this.vid().nativeElement as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (box.requestFullscreen) void box.requestFullscreen();
    else v.webkitEnterFullscreen?.();
  }

  protected onTime(): void {
    const v = this.vid().nativeElement;
    const t = v.currentTime || 0;
    this.progress.set(v.duration ? (t / v.duration) * 100 : 0);
    this.time.set(`${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`);
  }

  /** Bucle de render para los filtros que necesitan procesar píxeles. */
  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.canvasMode()) return;
    const v = this.vid().nativeElement;
    if (v.readyState < 2) return;
    const out = this.fx().nativeElement;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    const k = this.intensity() / 100;

    if (this.filter() === 'pixelate') {
      const block = 2 + Math.round(k * 26);
      const w = Math.max(8, Math.round(out.width / block));
      const h = Math.max(4, Math.round(out.height / block));
      this.small.width = w;
      this.small.height = h;
      const sctx = this.small.getContext('2d')!;
      sctx.drawImage(v, 0, 0, w, h);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.small, 0, 0, w, h, 0, 0, out.width, out.height);
      return;
    }

    // thermal: luma → paleta de calor, mezclada con el original según la intensidad
    const w = 160;
    const h = 90;
    this.small.width = w;
    this.small.height = h;
    const sctx = this.small.getContext('2d', { willReadFrequently: true })!;
    sctx.drawImage(v, 0, 0, w, h);
    const img = sctx.getImageData(0, 0, w, h);
    const d = img.data;
    const lut = this.thermalLut;
    const mix = 0.35 + 0.65 * k;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const l = (r * 299 + g * 587 + b * 114) / 1000;
      const j = Math.min(255, Math.round(l * (0.8 + 0.6 * k))) * 3;
      d[i] = r + (lut[j] - r) * mix;
      d[i + 1] = g + (lut[j + 1] - g) * mix;
      d[i + 2] = b + (lut[j + 2] - b) * mix;
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.small, 0, 0, w, h, 0, 0, out.width, out.height);
  };

  /** Paleta térmica: negro → azul → morado → rojo → naranja → amarillo → blanco. */
  private buildThermalLut(): Uint8ClampedArray {
    const stops: [number, number, number][] = [
      [8, 8, 40],
      [20, 30, 200],
      [157, 78, 221],
      [247, 37, 133],
      [255, 110, 40],
      [255, 220, 60],
      [255, 255, 255],
    ];
    const lut = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const pos = (i / 255) * (stops.length - 1);
      const a = Math.floor(pos);
      const b = Math.min(stops.length - 1, a + 1);
      const t = pos - a;
      for (let c = 0; c < 3; c++) lut[i * 3 + c] = stops[a][c] + (stops[b][c] - stops[a][c]) * t;
    }
    return lut;
  }
}
