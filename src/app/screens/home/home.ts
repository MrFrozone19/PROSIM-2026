import { Component } from '@angular/core';
import { ScreenShell } from '../../shared/screen-shell';

@Component({
  selector: 'app-home-screen',
  imports: [ScreenShell],
  template: `
    <app-screen-shell>
      <h1 class="pt-6 font-display text-[20px] font-black">Home</h1>
      <p class="mt-2 font-sans text-[13px] text-muted">Pantalla pendiente de extraer desde Figma.</p>
    </app-screen-shell>
  `,
})
export class HomeScreen {}
