import { Location } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Icon } from '../../shared/icon';
import { Feedback } from '../../shared/feedback';
import { TEAMS } from '../../data/teams';

type CameraState = 'requesting' | 'granted' | 'denied' | 'unsupported';

/**
 * /scan — cámara real (getUserMedia, cámara trasera) detrás del marco guía.
 * El reconocimiento de imágenes NO está implementado: el botón "Simular detección" navega a /ar.
 */
@Component({
  selector: 'app-scan-screen',
  imports: [ScreenShell, Icon],
  template: `
    <app-screen-shell [padded]="false">
      <div class="relative h-full min-h-full w-full overflow-hidden bg-ink">
        <!-- viewfinder: video en vivo o imagen de respaldo -->
        <video
          #cam
          class="absolute inset-0 h-full w-full object-cover"
          [class.hidden]="state() !== 'granted'"
          autoplay
          muted
          playsinline
        ></video>
        @if (state() !== 'granted') {
          <img
            src="assets/figma/viewfinder-bg.webp"
            class="absolute inset-0 h-full w-full object-cover"
            style="object-position: 55% 40%"
            alt=""
          />
        }
        <!-- overlay oscuro + cuadrícula -->
        <div
          class="absolute inset-0 transition-colors duration-300"
          [class.bg-black/45]="state() !== 'granted'"
          [class.bg-black/25]="state() === 'granted'"
        ></div>
        <div
          class="pointer-events-none absolute inset-0 opacity-60"
          style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"
        ></div>

        <!-- contenido -->
        <div class="relative flex h-full flex-col items-center justify-between px-6 pb-5 pt-5">
          <!-- scanner-top-bar -->
          <div class="flex w-full items-center justify-between">
            <div
              class="flex items-center gap-2 rounded-row border px-3 py-1.5 transition-colors"
              [class]="
                locked()
                  ? 'border-pink bg-pink/25'
                  : 'border-line bg-black/60'
              "
            >
              <span
                class="h-2 w-2 rounded-full"
                [class]="locked() ? 'bg-pink' : 'animate-pulse bg-[#2ee6c5] shadow-[0_0_6px_#2ee6c5]'"
              ></span>
              <span class="font-sans text-[12px] font-bold leading-normal text-white">{{
                locked() ? 'TARGET LOCKED' : 'SCANNER ACTIVE'
              }}</span>
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
            @if (locked()) {
              <div class="absolute inset-0 flex items-center justify-center">
                <img [src]="lockedTeam().logo" class="h-24 w-24 animate-ping-slow rounded-full opacity-90" alt="" />
              </div>
            }
            @if (state() === 'denied' || state() === 'unsupported') {
              <div
                class="absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-card-sm border border-line bg-surface/90 p-4 text-center"
              >
                <app-icon name="CameraOff" [size]="28" class="text-pink" />
                @if (state() === 'denied') {
                  <p class="font-display text-[12px] font-bold text-white">CÁMARA BLOQUEADA</p>
                  <p class="font-sans text-[11px] leading-snug text-muted">
                    La experiencia AR necesita la cámara para reconocer los logos.
                  </p>
                  <button
                    type="button"
                    (click)="retry()"
                    class="pressable mt-1 rounded-pill bg-cta px-4 py-2 font-sans text-[12px] font-bold text-white"
                  >
                    Reintentar
                  </button>
                } @else {
                  <p class="font-display text-[12px] font-bold text-white">SIN SOPORTE DE CÁMARA</p>
                  <p class="font-sans text-[11px] leading-snug text-muted">
                    Este navegador no expone la cámara. Abre la app por HTTPS en Safari o Chrome.
                  </p>
                }
              </div>
            }
          </div>

          <!-- instructional-overlay + simulación -->
          <div class="flex w-full flex-col items-center gap-2 px-4">
            <p class="text-center font-display text-[14px] font-bold leading-normal text-white">
              {{ locked() ? lockedTeam().city.toUpperCase() + ' ' + lockedTeam().name.toUpperCase() : 'POINT AT A TEAM LOGO' }}
            </p>
            <p class="text-center font-sans text-[12px] leading-normal text-muted">
              {{ locked() ? 'Loading AR experience…' : 'Scanning for AR stadium triggers...' }}
            </p>
            <div class="h-1 w-[140px] overflow-hidden rounded-sm bg-white/[0.13]">
              <div class="loader-fill h-full w-20 rounded-sm bg-pink"></div>
            </div>
            <button
              type="button"
              (click)="simulate()"
              [disabled]="locked()"
              class="pressable mt-3 flex min-h-[44px] items-center gap-2 rounded-pill border border-pink/70 bg-black/60 px-5 font-display text-[11px] font-bold tracking-wide text-white disabled:opacity-60"
            >
              <app-icon name="ScanLine" [size]="16" class="text-pink" />
              SIMULAR DETECCIÓN
            </button>
            <p class="font-sans text-[10px] text-muted/80">Prototipo: el reconocimiento real llega en la siguiente entrega</p>
          </div>
        </div>
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
    .animate-ping-slow {
      animation: ping-slow 0.9s ease-out infinite;
    }
    @keyframes ping-slow {
      0% {
        transform: scale(0.9);
        filter: drop-shadow(0 0 0 #f72585);
      }
      100% {
        transform: scale(1.05);
        filter: drop-shadow(0 0 14px #f72585);
      }
    }
  `,
})
export class ScanScreen implements AfterViewInit, OnDestroy {
  private readonly cam = viewChild.required<ElementRef<HTMLVideoElement>>('cam');
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fb = inject(Feedback);
  private stream?: MediaStream;
  private timer?: ReturnType<typeof setTimeout>;

  protected readonly state = signal<CameraState>('requesting');
  protected readonly locked = signal(false);
  protected readonly lockedTeam = signal(TEAMS[3]);

  ngAfterViewInit(): void {
    void this.start();
  }

  ngOnDestroy(): void {
    this.stop();
    clearTimeout(this.timer);
  }

  protected retry(): void {
    this.fb.tap();
    void this.start();
  }

  protected close(): void {
    this.fb.tap();
    this.location.back();
  }

  /** Detección falsa: elige un equipo con logo y navega a /ar tras una breve confirmación visual. */
  protected simulate(): void {
    const withLogo = TEAMS.filter((t) => t.logo);
    const team = withLogo[Math.floor(Math.random() * withLogo.length)];
    this.lockedTeam.set(team);
    this.locked.set(true);
    this.fb.success();
    this.timer = setTimeout(() => void this.router.navigate(['/ar'], { queryParams: { team: team.id } }), 900);
  }

  private async start(): Promise<void> {
    this.stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      this.state.set('unsupported');
      return;
    }
    this.state.set('requesting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      const video = this.cam().nativeElement;
      video.srcObject = this.stream;
      await video.play().catch(() => undefined);
      this.state.set('granted');
    } catch {
      this.state.set('denied');
    }
  }

  private stop(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = undefined;
  }
}
