import { Location } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { savePhoto } from '../../shared/save-photo';
import { TEAM_BY_ID, TEAMS, Team } from '../../data/teams';
import { AR_TARGETS, TARGETS_SRC } from '../../data/targets';
import { ArEngine, CameraError } from '../../ar/ar-engine';
import { ArHud } from '../ar/ar-hud';

type ScanState = 'loading' | 'scanning' | 'denied' | 'unsupported' | 'error';

/**
 * /scan — escáner y ventana AR en una sola vista.
 * MindAR abre la cámara trasera y busca las imágenes detonadoras; al reconocer un logo aparece su modelo 3D
 * anclado y se muestran los controles de la ventana AR. Si el logo sale de cuadro, el modelo queda flotando
 * frente a la cámara ("modo libre") para seguir interactuando; la flecha regresa a escanear.
 */
@Component({
  selector: 'app-scan-screen',
  imports: [ScreenShell, Icon, ArHud],
  template: `
    <app-screen-shell [padded]="false">
      <div class="relative h-full min-h-full w-full overflow-hidden bg-ink">
        <!-- aquí MindAR monta el video de la cámara y el canvas de three.js -->
        <div #stage class="ar-stage absolute inset-0 overflow-hidden"></div>

        @if (state() !== 'scanning') {
          <img
            src="assets/figma/viewfinder-bg.webp"
            class="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style="object-position: 55% 40%"
            alt=""
          />
        }

        @if (team(); as t) {
          <div class="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent"></div>
          <app-ar-hud
            [team]="t"
            [animating]="animating()"
            [status]="tracking() ? 'TARGET LOCKED' : 'AR HUB ACTIVE'"
            [hint]="tracking() ? 'Desliza para girar · pellizca para escalar' : 'Modo libre · apunta al logo para anclarlo'"
            (back)="rescan()"
            (animationToggle)="toggleAnimation()"
            (infoOpened)="engine?.spin()"
            (photoRequested)="takePhoto()"
            (panelChange)="engine?.setPanelOpen($event)"
          />
        } @else {
          <!-- overlay oscuro + cuadrícula -->
          <div
            class="pointer-events-none absolute inset-0 transition-colors duration-300"
            [class.bg-black/45]="state() !== 'scanning'"
            [class.bg-black/25]="state() === 'scanning'"
          ></div>
          <div
            class="pointer-events-none absolute inset-0 opacity-60"
            style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"
          ></div>

          <div class="relative flex h-full flex-col items-center justify-between px-6 pb-5 pt-5">
            <!-- scanner-top-bar -->
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center gap-2 rounded-row border border-line bg-black/60 px-3 py-1.5">
                <span
                  class="h-2 w-2 rounded-full"
                  [class]="state() === 'scanning' ? 'animate-pulse bg-[#2ee6c5] shadow-[0_0_6px_#2ee6c5]' : 'bg-muted'"
                ></span>
                <span class="font-sans text-[12px] font-bold leading-normal text-white">{{ statusLabel() }}</span>
              </div>
              <button
                type="button"
                (click)="close()"
                class="pressable flex h-10 w-10 items-center justify-center rounded-full border border-line bg-black/60 text-white"
                aria-label="Cerrar escáner"
              >
                <app-icon name="X" [size]="18" />
              </button>
            </div>

            <!-- scanner-reticle -->
            <div class="relative h-[260px] w-[260px] max-w-full">
              <span class="reticle-corner left-0 top-0 rounded-tl-sm border-l-2 border-t-2"></span>
              <span class="reticle-corner right-0 top-0 rounded-tr-sm border-r-2 border-t-2"></span>
              <span class="reticle-corner bottom-0 left-0 rounded-bl-sm border-b-2 border-l-2"></span>
              <span class="reticle-corner bottom-0 right-0 rounded-br-sm border-b-2 border-r-2"></span>
              @if (state() === 'scanning') {
                <span class="scan-line absolute inset-x-3 h-0.5 rounded-full bg-pink shadow-[0_0_10px_#f72585]"></span>
              }
              @if (state() === 'denied' || state() === 'unsupported' || state() === 'error') {
                <div
                  class="absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-card-sm border border-line bg-surface/90 p-4 text-center"
                >
                  <app-icon name="CameraOff" [size]="28" class="text-pink" />
                  @switch (state()) {
                    @case ('denied') {
                      <p class="font-display text-[12px] font-bold text-white">CÁMARA BLOQUEADA</p>
                      <p class="font-sans text-[11px] leading-snug text-muted">
                        La experiencia AR necesita la cámara para reconocer los logos.
                      </p>
                    }
                    @case ('unsupported') {
                      <p class="font-display text-[12px] font-bold text-white">SIN SOPORTE DE CÁMARA</p>
                      <p class="font-sans text-[11px] leading-snug text-muted">
                        Este navegador no expone la cámara. Abre la app por HTTPS en Safari o Chrome.
                      </p>
                    }
                    @default {
                      <p class="font-display text-[12px] font-bold text-white">NO SE PUDO INICIAR EL AR</p>
                      <p class="font-sans text-[11px] leading-snug text-muted">{{ errorDetail() }}</p>
                    }
                  }
                  @if (state() !== 'unsupported') {
                    <button
                      type="button"
                      (click)="retry()"
                      class="pressable mt-1 rounded-pill bg-cta px-4 py-2 font-sans text-[12px] font-bold text-white"
                    >
                      Reintentar
                    </button>
                  }
                </div>
              }
            </div>

            <!-- instructional-overlay -->
            <div class="flex w-full flex-col items-center gap-2 px-4">
              <p class="text-center font-display text-[14px] font-bold leading-normal text-white">
                {{ state() === 'loading' ? 'STARTING AR ENGINE' : 'POINT AT A TEAM LOGO' }}
              </p>
              <p class="text-center font-sans text-[12px] leading-normal text-muted">
                {{ state() === 'loading' ? 'Loading camera, targets and 3D models…' : 'Scanning for AR stadium triggers...' }}
              </p>
              <div class="h-1 w-[140px] overflow-hidden rounded-sm bg-white/[0.13]">
                <div class="loader-fill h-full w-20 rounded-sm bg-pink"></div>
              </div>
              <p class="mt-1 text-center font-sans text-[10px] text-muted/80">Marcadores activos: {{ activeTeams }}</p>
              @if (canSimulate()) {
                <button
                  type="button"
                  (click)="simulate()"
                  class="pressable mt-2 flex min-h-[44px] items-center gap-2 rounded-pill border border-pink/70 bg-black/60 px-5 font-display text-[11px] font-bold tracking-wide text-white"
                >
                  <app-icon name="ScanLine" [size]="16" class="text-pink" />
                  SIMULAR DETECCIÓN
                </button>
              }
            </div>
          </div>
        }
      </div>
    </app-screen-shell>
  `,
  styles: `
    .reticle-corner {
      position: absolute;
      width: 30px;
      height: 30px;
      border-color: #9d4edd;
    }
    .loader-fill {
      animation: loader 1.4s ease-in-out infinite;
    }
    @keyframes loader {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(175%);
      }
    }
    .scan-line {
      animation: sweep 2.2s ease-in-out infinite alternate;
    }
    @keyframes sweep {
      from {
        top: 6%;
      }
      to {
        top: 94%;
      }
    }
  `,
})
export class ScanScreen implements AfterViewInit, OnDestroy {
  private readonly stage = viewChild.required<ElementRef<HTMLDivElement>>('stage');
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);
  private destroyed = false;

  protected engine?: ArEngine;
  protected readonly state = signal<ScanState>('loading');
  protected readonly errorDetail = signal('');
  /** Equipo cuyo modelo está en pantalla; null mientras se sigue escaneando. */
  protected readonly team = signal<Team | null>(null);
  /** El marcador está a la vista (modelo anclado) o se perdió (modo libre). */
  protected readonly tracking = signal(false);
  protected readonly animating = signal(true);

  protected readonly activeTeams = [...new Set(AR_TARGETS.map((t) => TEAM_BY_ID[t.teamId]?.name ?? t.teamId))].join(', ');

  protected readonly statusLabel = computed(() => {
    switch (this.state()) {
      case 'loading':
        return 'STARTING…';
      case 'scanning':
        return 'SCANNER ACTIVE';
      default:
        return 'SCANNER OFFLINE';
    }
  });

  /** La detección simulada queda como respaldo: sin cámara disponible, o a petición con ?sim=1. */
  protected readonly canSimulate = computed(
    () => this.state() !== 'loading' && (this.state() !== 'scanning' || this.route.snapshot.queryParamMap.has('sim')),
  );

  ngAfterViewInit(): void {
    void this.start();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.engine?.stop();
  }

  protected retry(): void {
    this.fb.tap();
    void this.start();
  }

  protected close(): void {
    this.fb.tap();
    this.location.back();
  }

  /** Flecha de la ventana AR: suelta el modelo y vuelve a buscar marcadores. */
  protected rescan(): void {
    this.fb.tap();
    this.engine?.reset();
    this.engine?.setPanelOpen(false);
    this.team.set(null);
    this.tracking.set(false);
  }

  /** Foto de la cámara con el modelo encima; se guarda por la hoja de compartir (Fotos / Galería) o descarga. */
  protected takePhoto(): void {
    const t = this.team();
    if (!this.engine || !t) return;
    let blob: Blob;
    try {
      blob = this.engine.capture(`BaseDex Fan · ${t.city} ${t.name}`);
    } catch (e) {
      console.error(e);
      this.fb.error();
      this.toast.show('No se pudo tomar la foto');
      return;
    }
    this.fb.shutter();
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
    void savePhoto(blob, `basedex-${t.id}-${stamp}.jpg`, `${t.city} ${t.name} en AR`).then((r) => {
      if (r === 'shared') this.toast.show('Foto guardada');
      else if (r === 'downloaded') this.toast.show('Foto descargada');
    });
  }

  protected toggleAnimation(): void {
    const on = !this.animating();
    this.animating.set(on);
    this.engine?.setAnimating(on);
  }

  /** Detección falsa: elige un equipo con logo y abre la ventana AR sin cámara. */
  protected simulate(): void {
    const withLogo = TEAMS.filter((t) => t.logo);
    const team = withLogo[Math.floor(Math.random() * withLogo.length)];
    this.fb.success();
    void this.router.navigate(['/ar'], { queryParams: { team: team.id } });
  }

  private async start(): Promise<void> {
    this.engine?.stop();
    this.engine = undefined;
    this.team.set(null);
    this.tracking.set(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.state.set('unsupported');
      return;
    }
    this.state.set('loading');

    const engine = new ArEngine({
      container: this.stage().nativeElement,
      targetsSrc: TARGETS_SRC,
      targets: AR_TARGETS.map((t) => ({ index: t.index, key: t.teamId, model: t.model })),
      // ?crop=256 permite comparar en el celular el recorte chico (más rápido) contra el de 512 (más confiable).
      detectionCropSize: Number(this.route.snapshot.queryParamMap.get('crop')) || undefined,
      onFound: (teamId) => {
        if (!this.team()) this.fb.success();
        this.team.set(TEAM_BY_ID[teamId]);
        this.tracking.set(true);
      },
      onLost: () => this.tracking.set(false),
    });
    this.engine = engine;
    engine.setAnimating(this.animating());

    try {
      await engine.start();
      if (!this.destroyed && this.engine === engine) this.state.set('scanning');
    } catch (e) {
      if (this.destroyed || this.engine !== engine) return;
      engine.stop();
      this.engine = undefined;
      if (e instanceof CameraError) this.state.set('denied');
      else {
        console.error(e);
        this.errorDetail.set(e instanceof Error ? e.message : 'Error desconocido');
        this.state.set('error');
      }
    }
  }
}
