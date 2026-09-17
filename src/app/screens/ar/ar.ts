import { Location } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Feedback } from '../../shared/feedback';
import { TEAM_BY_ID, Team } from '../../data/teams';
import { ArHud } from './ar-hud';

/**
 * /ar — ventana AR sin cámara: respaldo de la detección simulada (equipos sin marcador o dispositivos sin cámara).
 * En lugar del modelo 3D muestra el logo holográfico; la experiencia real con seguimiento vive en /scan.
 */
@Component({
  selector: 'app-ar-screen',
  imports: [ScreenShell, ArHud],
  template: `
    <app-screen-shell [padded]="false">
      <div class="relative h-full w-full overflow-hidden bg-ink">
        <img
          src="assets/figma/viewfinder-bg.webp"
          class="absolute inset-0 h-full w-full object-cover"
          style="object-position: 55% 40%"
          alt=""
        />
        <div class="absolute inset-0 bg-black/45"></div>
        <div
          class="pointer-events-none absolute inset-0 opacity-60"
          style="background-image: linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 40px 40px;"
        ></div>

        <!-- placeholder del modelo 3D: logo holográfico -->
        <div class="pointer-events-none absolute left-1/2 top-[46%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          <img
            [src]="team().logo"
            class="hologram h-36 w-36 rounded-full"
            [class.hologram--dance]="animating()"
            [class.hologram--spin]="spinning()"
            alt=""
          />
          <div class="mt-2 h-3 w-24 rounded-[50%] bg-purple/40 blur-md"></div>
          <span class="mt-3 rounded-pill border border-line bg-black/50 px-2 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wide text-muted">
            Detección simulada · sin modelo 3D
          </span>
        </div>

        <app-ar-hud
          [team]="team()"
          [animating]="animating()"
          status="AR HUB · SIMULADO"
          (back)="back()"
          (animationToggle)="animating.set(!animating())"
          (infoOpened)="spin()"
        />
      </div>
    </app-screen-shell>
  `,
  styles: `
    .hologram {
      filter: drop-shadow(0 0 18px rgba(157, 78, 221, 0.8)) drop-shadow(0 0 4px rgba(247, 37, 133, 0.6));
    }
    .hologram--dance {
      animation: dance 0.6s ease-in-out infinite;
    }
    .hologram--spin {
      animation: spin360 2.4s linear 1;
    }
    @keyframes dance {
      0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
      50% { transform: translateY(-22px) rotate(8deg) scale(1.08); }
    }
    @keyframes spin360 {
      from { transform: rotateY(0deg); }
      to { transform: rotateY(360deg); }
    }
  `,
})
export class ArScreen implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly fb = inject(Feedback);
  private timer?: ReturnType<typeof setTimeout>;

  protected readonly team = signal<Team>(TEAM_BY_ID[this.route.snapshot.queryParamMap.get('team') ?? ''] ?? TEAM_BY_ID['tor']);
  protected readonly animating = signal(true);
  protected readonly spinning = signal(false);

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }

  protected back(): void {
    this.fb.tap();
    this.location.back();
  }

  protected spin(): void {
    this.spinning.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.spinning.set(false), 2500);
  }
}
