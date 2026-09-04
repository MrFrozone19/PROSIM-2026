import { Component, Injectable, inject, signal } from '@angular/core';

/** Mensajes cortos en pantalla ("próximamente", confirmaciones). */
@Injectable({ providedIn: 'root' })
export class Toast {
  readonly message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, ms = 1800): void {
    clearTimeout(this.timer);
    this.message.set(message);
    this.timer = setTimeout(() => this.message.set(null), ms);
  }
}

@Component({
  selector: 'app-toast',
  template: `
    @if (toast.message(); as msg) {
      <div
        class="toast-in pointer-events-none fixed inset-x-0 z-50 flex justify-center px-6"
        style="bottom: calc(72px + env(safe-area-inset-bottom) + 16px)"
        role="status"
        aria-live="polite"
      >
        <span
          class="rounded-pill border border-pink/60 bg-surface/95 px-4 py-2 font-sans text-[12px] font-bold text-white shadow-glow backdrop-blur"
          >{{ msg }}</span
        >
      </div>
    }
  `,
  styles: `
    .toast-in {
      animation: toast-in 180ms ease-out;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  `,
})
export class ToastHost {
  protected readonly toast = inject(Toast);
}
