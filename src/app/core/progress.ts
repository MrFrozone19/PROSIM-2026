import { Injectable, inject, signal } from '@angular/core';
import { Feedback } from '../shared/feedback';
import { Toast } from '../shared/toast';
import { Api, Me, Reward } from './api';

/**
 * Perfil y progreso del usuario: lo cargan las pantallas que lo muestran y se actualiza tras cada acción.
 * `celebrate` anuncia en toasts lo que la API acaba de desbloquear (carta, trofeos, nivel, insignias).
 */
@Injectable({ providedIn: 'root' })
export class Progress {
  private readonly api = inject(Api);
  private readonly toast = inject(Toast);
  private readonly fb = inject(Feedback);
  private queue: string[] = [];
  private showing = false;

  readonly me = signal<Me | null>(null);

  async refresh(): Promise<Me | null> {
    try {
      const me = await this.api.me();
      this.me.set(me);
      return me;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /** Corre una acción de la API sin bloquear la interfaz; si falla, solo se registra. */
  track(action: Promise<Reward>): void {
    action.then((r) => this.celebrate(r)).catch((e) => console.error(e));
  }

  celebrate(r: Reward): void {
    const msgs: string[] = [];
    if (r.card) msgs.push(`¡Carta desbloqueada: ${r.card.name}!`);
    for (const t of r.trophies) msgs.push(`🏆 Trofeo: ${t.title}`);
    if (r.leveledUp) msgs.push(`¡Subiste a nivel ${r.level}!`);
    for (const b of r.badges) msgs.push(`Insignia: ${b.label}`);
    if (r.xpGained > 0) {
      if (msgs.length) msgs[0] += ` · +${r.xpGained} XP`;
      else msgs.push(`+${r.xpGained} XP`);
    }
    if (!msgs.length) return;
    if (r.card || r.trophies.length || r.leveledUp || r.badges.length) this.fb.success();
    this.queue.push(...msgs);
    void this.refresh();
    this.next();
  }

  /** Muestra los mensajes uno tras otro para que no se pisen. */
  private next(): void {
    if (this.showing) return;
    const msg = this.queue.shift();
    if (!msg) return;
    this.showing = true;
    this.toast.show(msg, 2200);
    setTimeout(() => {
      this.showing = false;
      this.next();
    }, 2400);
  }
}
