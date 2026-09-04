import { Component, input, output } from '@angular/core';

/** Píldora seleccionable (chips de filtros y pestañas internas). */
@Component({
  selector: 'app-pill',
  template: `
    <button
      type="button"
      class="pressable inline-flex min-h-[36px] items-center gap-1.5 rounded-pill border px-4 font-sans text-[13px] font-semibold transition-colors"
      [class]="
        active()
          ? 'border-transparent bg-purple text-white shadow-glow-purple'
          : 'border-line bg-surface text-white/90'
      "
      [attr.aria-pressed]="active()"
      (click)="pressed.emit()"
    >
      <ng-content />
    </button>
  `,
  host: { class: 'inline-flex' },
})
export class Pill {
  readonly active = input(false);
  readonly pressed = output<void>();
}
