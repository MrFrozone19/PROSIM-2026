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
import { RouterLink } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { FxRenderer } from '../../shared/fx-renderer';
import { FilterId, VIDEO_FILTERS } from '../../data/videos';
import { Api } from '../../core/api';
import { Gallery, saveErrorMessage } from '../../core/gallery';
import { Progress } from '../../core/progress';

type CamState = 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';

interface Recording {
  blob: Blob;
  url: string;
  durationMs: number;
  filter: FilterId | null;
}

/** Duración máxima de un clip: mantiene los archivos ligeros (~10 MB a 720p). */
const MAX_MS = 30_000;

/**
 * /videos — "AR Studio": grabadora con filtros en vivo. La cámara pasa por FxRenderer (WebGL) y se graba ese
 * lienzo con MediaRecorder, así que el filtro queda en el video. El clip se revisa y se guarda en la Galería
 * (TCG Vault). No se implementan B/N, escala de grises, sepia, exposición ni invertidos (prohibidos por la rúbrica).
 */
@Component({
  selector: 'app-videos-screen',
  imports: [ScreenShell, Icon, RouterLink],
  template: `
    <app-screen-shell>
      <div class="flex flex-col gap-4 pt-3">
        <header class="flex items-end justify-between gap-3">
          <div class="flex flex-col gap-1">
            <h1 class="font-display text-[20px] font-black leading-normal text-white">AR STUDIO</h1>
            <p class="font-sans text-[12px] leading-normal text-muted">Graba clips y aplícales filtros en vivo</p>
          </div>
          <a
            routerLink="/vault"
            [queryParams]="{ tab: 'gallery' }"
            class="pressable flex min-h-[36px] items-center gap-1.5 rounded-pill border border-line bg-surface px-3 font-sans text-[11px] font-bold text-white"
          >
            <app-icon name="Images" [size]="14" class="text-pink" />
            Galería
          </a>
        </header>

        <!-- visor: el canvas es a la vez la vista previa y lo que se graba -->
        <div class="relative h-[52dvh] min-h-[300px] w-full overflow-hidden rounded-row border border-line bg-black">
          <video #cam class="pointer-events-none absolute h-px w-px opacity-0" playsinline muted autoplay></video>
          <canvas #out class="absolute inset-0 h-full w-full object-contain"></canvas>

          @if (state() !== 'ready') {
            <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              @if (state() === 'loading') {
                <p class="font-display text-[12px] font-bold text-white">ABRIENDO CÁMARA…</p>
              } @else {
                <app-icon name="CameraOff" [size]="28" class="text-pink" />
                <p class="font-display text-[12px] font-bold text-white">
                  {{ state() === 'denied' ? 'CÁMARA BLOQUEADA' : state() === 'unsupported' ? 'SIN SOPORTE DE GRABACIÓN' : 'NO SE PUDO ABRIR LA CÁMARA' }}
                </p>
                <p class="font-sans text-[11px] leading-snug text-muted">{{ stateDetail() }}</p>
                @if (state() !== 'unsupported') {
                  <button
                    type="button"
                    (click)="startCamera()"
                    class="pressable rounded-pill bg-cta px-4 py-2 font-sans text-[12px] font-bold text-white"
                  >
                    Reintentar
                  </button>
                }
              }
            </div>
          }

          <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span class="rounded-md bg-pink px-2 py-1 font-sans text-[10px] font-extrabold uppercase leading-normal text-white">
              {{ filterLabel() }}
            </span>
            @if (recording()) {
              <span class="flex items-center gap-1.5 rounded-pill bg-black/70 px-2.5 py-1 font-display text-[11px] font-bold text-white">
                <span class="h-2 w-2 animate-pulse rounded-full bg-[#ff3b30]"></span>
                {{ elapsedLabel() }} / 0:30
              </span>
            }
            <button
              type="button"
              (click)="flip()"
              [disabled]="recording() || state() !== 'ready'"
              class="pressable pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white disabled:opacity-40"
              aria-label="Cambiar de cámara"
            >
              <app-icon name="RefreshCw" [size]="18" />
            </button>
          </div>

          <!-- botón de grabar -->
          <div class="absolute inset-x-0 bottom-4 flex justify-center">
            <button
              type="button"
              (click)="toggleRecord()"
              [disabled]="state() !== 'ready'"
              class="pressable flex h-[68px] w-[68px] items-center justify-center rounded-full border-4 border-white/90 bg-black/30 disabled:opacity-40"
              [attr.aria-label]="recording() ? 'Detener grabación' : 'Grabar'"
            >
              <span
                class="bg-[#ff3b30] transition-all duration-150"
                [class]="recording() ? 'h-6 w-6 rounded-md' : 'h-[50px] w-[50px] rounded-full'"
              ></span>
            </button>
          </div>
        </div>

        <!-- filtros -->
        <section class="flex flex-col gap-2">
          <p class="font-sans text-[11px] font-bold leading-normal text-muted">AR RENDER ENGINE FILTERS</p>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              (click)="pick(null)"
              [disabled]="recording()"
              [attr.aria-pressed]="filter() === null"
              class="pressable min-h-[36px] rounded-row border px-3 py-2 font-sans text-[11px] font-bold leading-normal text-white transition-colors disabled:opacity-50"
              [class]="filter() === null ? 'border-pink bg-purple' : 'border-line bg-surface'"
            >
              Sin filtro
            </button>
            @for (f of filters; track f.id) {
              <button
                type="button"
                (click)="pick(f.id)"
                [disabled]="recording()"
                [attr.aria-pressed]="filter() === f.id"
                class="pressable min-h-[36px] rounded-row border px-3 py-2 font-sans text-[11px] font-bold leading-normal text-white transition-colors disabled:opacity-50"
                [class]="filter() === f.id ? 'border-pink bg-purple' : 'border-line bg-surface'"
              >
                {{ f.label }}
              </button>
            }
          </div>
          @if (filter(); as f) {
            <div class="mt-1 flex flex-col gap-3 rounded-row border border-line bg-surface p-3">
              @if (f === 'color') {
                @for (c of colorControls; track c.key) {
                  <label class="flex flex-col gap-1">
                    <span class="flex justify-between font-sans text-[11px] text-muted">
                      <span>{{ c.label }}</span><span>{{ color()[c.key] }}%</span>
                    </span>
                    <input type="range" min="50" max="150" [value]="color()[c.key]" (input)="setColor(c.key, $event)" class="range" />
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
            </div>
          }
          @if (recording()) {
            <p class="font-sans text-[11px] text-muted">El filtro queda fijo durante la grabación; la intensidad sí se puede mover.</p>
          }
        </section>
      </div>

      <!-- revisión del clip grabado -->
      @if (take(); as t) {
        <div class="fixed inset-0 z-50 bg-black/70" aria-hidden="true"></div>
        <section
          class="sheet-in fixed inset-x-0 bottom-0 z-50 max-h-[90%] overflow-y-auto rounded-t-[32px] border-t border-line bg-surface px-5 pt-3"
          style="padding-bottom: calc(24px + env(safe-area-inset-bottom))"
          role="dialog"
          aria-label="Revisar clip"
        >
          <div class="mx-auto mb-3 h-1 w-9 rounded-full bg-white/20"></div>
          <h2 class="mb-3 font-display text-[16px] font-black uppercase text-white">Tu clip</h2>
          <video
            [src]="t.url"
            class="max-h-[50dvh] w-full rounded-row border border-line bg-black object-contain"
            controls
            autoplay
            loop
            playsinline
          ></video>
          <p class="mt-2 font-sans text-[11px] text-muted">
            {{ formatMs(t.durationMs) }} · {{ t.filter ? labelOf(t.filter) : 'Sin filtro' }} · {{ sizeLabel(t.blob.size) }}
          </p>
          <div class="mt-4 flex gap-3">
            <button
              type="button"
              (click)="discard()"
              [disabled]="saving()"
              class="pressable flex h-12 flex-1 items-center justify-center rounded-cta border border-line font-display text-[12px] font-bold text-white disabled:opacity-50"
            >
              DESCARTAR
            </button>
            <button
              type="button"
              (click)="save()"
              [disabled]="saving()"
              class="pressable flex h-12 flex-[2] items-center justify-center gap-2 rounded-cta bg-cta font-display text-[12px] font-bold text-white disabled:opacity-70"
            >
              <app-icon name="Images" [size]="16" />
              {{ saving() ? 'SUBIENDO ' + uploadPct() + '%' : 'GUARDAR EN GALERÍA' }}
            </button>
          </div>
        </section>
      }
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
    .sheet-in {
      animation: sheet 200ms ease-out;
    }
    @keyframes sheet {
      from { transform: translateY(24px); opacity: 0; }
      to { transform: none; opacity: 1; }
    }
  `,
})
export class VideosScreen implements AfterViewInit, OnDestroy {
  private readonly cam = viewChild.required<ElementRef<HTMLVideoElement>>('cam');
  private readonly out = viewChild.required<ElementRef<HTMLCanvasElement>>('out');
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);
  private readonly api = inject(Api);
  private readonly gallery = inject(Gallery);
  private readonly fan = inject(Progress);

  protected readonly filters = VIDEO_FILTERS;
  protected readonly colorControls = [
    { key: 'brightness' as const, label: 'Brillo' },
    { key: 'contrast' as const, label: 'Contraste' },
    { key: 'saturation' as const, label: 'Saturación' },
  ];

  protected readonly state = signal<CamState>('loading');
  protected readonly stateDetail = signal('');
  protected readonly facing = signal<'environment' | 'user'>('environment');
  protected readonly filter = signal<FilterId | null>('thermal');
  protected readonly intensity = signal(60);
  protected readonly color = signal({ brightness: 110, contrast: 115, saturation: 130 });
  protected readonly recording = signal(false);
  protected readonly elapsed = signal(0);
  protected readonly take = signal<Recording | null>(null);
  protected readonly saving = signal(false);
  protected readonly uploadPct = signal(0);

  protected readonly filterLabel = computed(() => {
    const f = this.filter();
    return f ? `${this.labelOf(f)} filter` : 'Sin filtro';
  });
  protected readonly elapsedLabel = computed(() => this.formatMs(this.elapsed()));

  private stream?: MediaStream;
  private renderer?: FxRenderer;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private recordStart = 0;
  private recordFilter: FilterId | null = null;
  private tick?: ReturnType<typeof setInterval>;
  private raf = 0;
  private destroyed = false;

  ngAfterViewInit(): void {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      this.state.set('unsupported');
      this.stateDetail.set('Abre la app por HTTPS en Safari (iOS 15+) o Chrome actualizados.');
      return;
    }
    try {
      this.renderer = new FxRenderer(this.out().nativeElement);
    } catch (e) {
      console.error(e);
      this.state.set('unsupported');
      this.stateDetail.set('Este navegador no tiene WebGL, que se usa para aplicar los filtros.');
      return;
    }
    this.loop();
    void this.startCamera();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearInterval(this.tick);
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.stopStream();
    this.renderer?.dispose();
    const t = this.take();
    if (t) URL.revokeObjectURL(t.url);
  }

  /** Abre la cámara (con micrófono si se permite; si no, solo video). */
  protected async startCamera(): Promise<void> {
    this.stopStream();
    this.state.set('loading');
    const video = { facingMode: { ideal: this.facing() }, width: { ideal: 1280 }, height: { ideal: 720 } };
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      }
      if (this.destroyed) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.stream = stream;
      const el = this.cam().nativeElement;
      el.srcObject = stream;
      await el.play();
      this.state.set('ready');
    } catch (e) {
      console.error(e);
      const name = (e as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        this.state.set('denied');
        this.stateDetail.set('Permite el acceso a la cámara en los ajustes del navegador para grabar clips.');
      } else {
        this.state.set('error');
        this.stateDetail.set('Revisa que ninguna otra app esté usando la cámara.');
      }
    }
  }

  protected flip(): void {
    this.fb.tap();
    this.facing.update((f) => (f === 'environment' ? 'user' : 'environment'));
    void this.startCamera();
  }

  protected pick(id: FilterId | null): void {
    this.fb.tap();
    this.filter.set(id);
    // Probar filtros cuenta para el trofeo Filter Freak.
    if (id) this.fan.track(this.api.event('filter', id));
  }

  protected setIntensity(e: Event): void {
    this.intensity.set(Number((e.target as HTMLInputElement).value));
  }

  protected setColor(key: 'brightness' | 'contrast' | 'saturation', e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    this.color.update((c) => ({ ...c, [key]: v }));
  }

  protected toggleRecord(): void {
    if (this.recording()) this.stopRecording();
    else this.startRecording();
  }

  protected discard(): void {
    this.fb.tap();
    const t = this.take();
    if (t) URL.revokeObjectURL(t.url);
    this.take.set(null);
  }

  protected async save(): Promise<void> {
    const t = this.take();
    if (!t) return;
    this.fb.tap();
    this.saving.set(true);
    this.uploadPct.set(0);
    try {
      const reward = await this.gallery.save('video', t.blob, {
        filter: t.filter,
        durationMs: t.durationMs,
        onProgress: (f) => this.uploadPct.set(Math.round(f * 100)),
      });
      URL.revokeObjectURL(t.url);
      this.take.set(null);
      this.fb.success();
      this.toast.show('Clip guardado en tu Galería');
      this.fan.celebrate(reward);
    } catch (e) {
      console.error(e);
      this.fb.error();
      this.toast.show(saveErrorMessage(e), 3500);
    } finally {
      this.saving.set(false);
    }
  }

  protected labelOf(id: FilterId): string {
    return this.filters.find((f) => f.id === id)?.label ?? id;
  }

  protected formatMs(ms: number): string {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  protected sizeLabel(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
  }

  private startRecording(): void {
    const canvas = this.out().nativeElement;
    const mimeType = pickMime();
    let rec: MediaRecorder;
    try {
      const out = canvas.captureStream(30);
      this.stream?.getAudioTracks().forEach((t) => out.addTrack(t));
      rec = new MediaRecorder(out, { mimeType, videoBitsPerSecond: 2_500_000 });
    } catch (e) {
      console.error(e);
      this.fb.error();
      this.toast.show('Este navegador no puede grabar el lienzo con filtros.', 3000);
      return;
    }
    this.fb.tap();
    this.chunks = [];
    this.recordFilter = this.filter();
    rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    rec.onstop = () => this.finishRecording(rec.mimeType || mimeType);
    rec.start(250);
    this.recorder = rec;
    this.recordStart = performance.now();
    this.elapsed.set(0);
    this.recording.set(true);
    this.tick = setInterval(() => {
      const ms = performance.now() - this.recordStart;
      this.elapsed.set(ms);
      if (ms >= MAX_MS) this.stopRecording();
    }, 200);
  }

  private stopRecording(): void {
    clearInterval(this.tick);
    if (this.recorder?.state === 'recording') this.recorder.stop();
    this.recording.set(false);
    this.fb.shutter();
  }

  private finishRecording(mimeType: string): void {
    if (this.destroyed) return;
    const durationMs = Math.min(MAX_MS, Math.round(performance.now() - this.recordStart));
    const blob = new Blob(this.chunks, { type: mimeType.split(';')[0] });
    this.chunks = [];
    if (!blob.size) {
      this.toast.show('La grabación salió vacía. Intenta de nuevo.');
      return;
    }
    this.take.set({ blob, url: URL.createObjectURL(blob), durationMs, filter: this.recordFilter });
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
  }

  /** Dibuja cada cuadro de la cámara con el filtro actual. */
  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const v = this.cam().nativeElement;
    if (!this.renderer || v.readyState < 2) return;
    const c = this.color();
    this.renderer.render(v, {
      filter: this.filter(),
      intensity: this.intensity() / 100,
      color: { brightness: c.brightness / 100, contrast: c.contrast / 100, saturation: c.saturation / 100 },
      mirror: this.facing() === 'user',
    });
  };
}

/** MP4 primero (lo reproducen iPhone y Android); WebM como respaldo en navegadores que no graban MP4. */
function pickMime(): string {
  const options = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}
