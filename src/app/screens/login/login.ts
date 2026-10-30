import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScreenShell } from '../../shared/screen-shell';
import { Feedback } from '../../shared/feedback';
import { Toast } from '../../shared/toast';
import { AuthService, authErrorMessage } from '../../core/auth';

type Mode = 'signup' | 'signin';

/** /login — crear cuenta o iniciar sesión (Google o correo). Basada en la pantalla "Create an account" del diseño. */
@Component({
  selector: 'app-login-screen',
  imports: [ScreenShell],
  template: `
    <app-screen-shell [tabs]="false">
      <div class="mx-auto flex min-h-full w-full max-w-[380px] flex-col justify-center gap-6 py-10">
        <header class="flex flex-col items-center gap-2 text-center">
          <h1 class="text-gradient font-display text-[28px] font-black leading-normal">BaseDex Fan</h1>
          <p class="font-sans text-[12px] font-semibold text-muted">Escanea. Juega. Colecciona.</p>
        </header>

        <section class="flex flex-col gap-1 text-center">
          <h2 class="font-sans text-[17px] font-bold text-white">
            {{ mode() === 'signup' ? 'Crea tu cuenta' : 'Inicia sesión' }}
          </h2>
          <p class="font-sans text-[13px] text-muted">
            {{ mode() === 'signup' ? 'Regístrate para guardar tu colección y tus puntos' : 'Qué bueno verte de nuevo' }}
          </p>
        </section>

        <button
          type="button"
          (click)="google()"
          [disabled]="busy()"
          class="pressable flex h-12 w-full items-center justify-center gap-3 rounded-row bg-white font-sans text-[14px] font-semibold text-[#1f1f1f] disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" class="h-5 w-5" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          Continuar con Google
        </button>

        <div class="flex items-center gap-3 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span class="h-px flex-1 bg-line"></span>o con tu correo<span class="h-px flex-1 bg-line"></span>
        </div>

        <form class="flex flex-col gap-3" (submit)="submit($event)">
          @if (mode() === 'signup') {
            <label class="flex flex-col gap-1">
              <span class="font-sans text-[11px] font-semibold text-muted">Nombre</span>
              <input
                type="text"
                autocomplete="name"
                maxlength="40"
                [value]="name()"
                (input)="name.set(value($event))"
                class="h-12 rounded-row border border-line bg-surface px-4 font-sans text-[14px] text-white outline-none focus:border-pink"
                placeholder="Cómo te verán en el leaderboard"
              />
            </label>
          }
          <label class="flex flex-col gap-1">
            <span class="font-sans text-[11px] font-semibold text-muted">Correo</span>
            <input
              type="email"
              autocomplete="email"
              inputmode="email"
              [value]="email()"
              (input)="email.set(value($event))"
              class="h-12 rounded-row border border-line bg-surface px-4 font-sans text-[14px] text-white outline-none focus:border-pink"
              placeholder="correo@dominio.com"
            />
          </label>
          <label class="flex flex-col gap-1">
            <span class="font-sans text-[11px] font-semibold text-muted">Contraseña</span>
            <input
              type="password"
              [attr.autocomplete]="mode() === 'signup' ? 'new-password' : 'current-password'"
              [value]="password()"
              (input)="password.set(value($event))"
              class="h-12 rounded-row border border-line bg-surface px-4 font-sans text-[14px] text-white outline-none focus:border-pink"
              [placeholder]="mode() === 'signup' ? 'Mínimo 6 caracteres' : ''"
            />
          </label>

          @if (error()) {
            <p class="font-sans text-[12px] font-semibold text-pink" role="alert">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="busy() || !canSubmit()"
            class="pressable mt-1 flex h-12 w-full items-center justify-center rounded-row bg-pink font-sans text-[14px] font-bold text-white disabled:opacity-50"
          >
            {{ busy() ? 'Un momento…' : mode() === 'signup' ? 'Crear cuenta' : 'Entrar' }}
          </button>
        </form>

        <div class="flex flex-col items-center gap-3 font-sans text-[13px]">
          <button type="button" (click)="toggleMode()" class="pressable min-h-[44px] text-muted">
            {{ mode() === 'signup' ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?' }}
            <span class="font-bold text-white">{{ mode() === 'signup' ? 'Inicia sesión' : 'Regístrate' }}</span>
          </button>
          @if (mode() === 'signin') {
            <button type="button" (click)="reset()" class="pressable min-h-[44px] text-muted underline">
              Olvidé mi contraseña
            </button>
          }
        </div>
      </div>
    </app-screen-shell>
  `,
})
export class LoginScreen {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(Feedback);
  private readonly toast = inject(Toast);

  protected readonly mode = signal<Mode>('signup');
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly canSubmit = computed(
    () =>
      this.email().includes('@') &&
      this.password().length >= 6 &&
      (this.mode() === 'signin' || this.name().trim().length >= 2),
  );

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected toggleMode(): void {
    this.fb.tap();
    this.error.set('');
    this.mode.update((m) => (m === 'signup' ? 'signin' : 'signup'));
  }

  protected google(): Promise<void> {
    return this.run(() => this.auth.signInWithGoogle());
  }

  protected submit(e: Event): Promise<void> {
    e.preventDefault();
    const email = this.email().trim();
    return this.run(() =>
      this.mode() === 'signup'
        ? this.auth.signUp(this.name().trim(), email, this.password())
        : this.auth.signIn(email, this.password()),
    );
  }

  protected async reset(): Promise<void> {
    this.fb.tap();
    const email = this.email().trim();
    if (!email.includes('@')) {
      this.error.set('Escribe tu correo arriba y vuelve a tocar "Olvidé mi contraseña".');
      return;
    }
    try {
      await this.auth.resetPassword(email);
      this.error.set('');
      this.toast.show('Te enviamos un correo para cambiar tu contraseña', 3000);
    } catch (e) {
      this.error.set(authErrorMessage(e));
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.fb.tap();
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
      this.fb.success();
      const next = this.route.snapshot.queryParamMap.get('next');
      await this.router.navigateByUrl(next?.startsWith('/') && !next.startsWith('/login') ? next : '/home');
    } catch (e) {
      this.error.set(authErrorMessage(e));
      if (this.error()) this.fb.error();
    } finally {
      this.busy.set(false);
    }
  }
}
