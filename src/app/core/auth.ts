import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { firebaseApp } from './firebase';

/** Sesión con Firebase Auth: Google o correo y contraseña. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly auth = getAuth(firebaseApp);

  /** undefined mientras Firebase restaura la sesión guardada; después, el usuario o null. */
  readonly user = signal<User | null | undefined>(undefined);
  /** Se resuelve cuando ya se sabe si hay sesión (los guards lo esperan). */
  readonly ready: Promise<void>;

  constructor() {
    this.auth.languageCode = 'es';
    this.ready = new Promise((resolve) => {
      onAuthStateChanged(this.auth, (u) => {
        this.user.set(u);
        resolve();
      });
    });
  }

  async signInWithGoogle(): Promise<void> {
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // El token se emitió antes de poner el nombre: se renueva para que la API lo reciba.
    await cred.user.getIdToken(true);
    this.user.set(cred.user);
  }

  resetPassword(email: string): Promise<void> {
    return sendPasswordResetEmail(this.auth, email);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigateByUrl('/login');
  }

  /**
   * Borra la cuenta de Firebase. Si la sesión es vieja, Firebase pide volver a iniciarla
   * (auth/requires-recent-login): se cierra la sesión para que el usuario entre de nuevo y lo reintente.
   */
  async deleteAccount(): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) return;
    await deleteUser(u);
    await this.router.navigateByUrl('/login');
  }

  /** ID token vigente para la API (Firebase lo renueva solo cuando está por vencer). */
  token(): Promise<string | null> {
    return this.auth.currentUser?.getIdToken() ?? Promise.resolve(null);
  }
}

/** Mensaje en español para los errores comunes de Firebase Auth. */
export function authErrorMessage(e: unknown): string {
  const code = e instanceof FirebaseError ? e.code : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use':
      return 'Ese correo ya tiene cuenta. Inicia sesión.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}
