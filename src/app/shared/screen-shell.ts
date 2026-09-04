import { Component, input } from '@angular/core';
import { TabBar } from './tab-bar';

/**
 * Contenedor de pantalla: fondo, safe areas, scroll del cuerpo y tab bar fija.
 * - `tabs=false` oculta la tab bar (pantallas AR).
 * - `padded=false` quita el padding lateral para contenido a sangre (cámara).
 */
@Component({
  selector: 'app-screen-shell',
  imports: [TabBar],
  template: `
    <div class="relative flex h-dvh flex-col bg-ink text-white">
      <main
        class="flex-1 overflow-y-auto overscroll-none pt-safe-top"
        [class.px-5]="padded()"
        [style.padding-bottom]="
          tabs() ? 'calc(72px + env(safe-area-inset-bottom) + 20px)' : 'env(safe-area-inset-bottom)'
        "
      >
        <ng-content />
      </main>
      @if (tabs()) {
        <app-tab-bar />
      }
    </div>
  `,
})
export class ScreenShell {
  readonly tabs = input(true);
  readonly padded = input(true);
}
