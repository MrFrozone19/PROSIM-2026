import { Component, input } from '@angular/core';

/** Tarjeta de estadística: etiqueta chica arriba, número grande Unbounded abajo. */
@Component({
  selector: 'app-stat-card',
  template: `
    <div class="rounded-card-xs border border-line bg-surface px-4 py-3">
      <p class="font-sans text-[11px] font-medium uppercase tracking-wide text-muted">{{ label() }}</p>
      <p class="mt-1 font-display text-[20px] font-black leading-none text-white">{{ value() }}</p>
      @if (hint()) {
        <p class="mt-1 font-sans text-[11px] text-muted">{{ hint() }}</p>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
}
