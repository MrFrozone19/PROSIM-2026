import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, from, switchMap } from 'rxjs';
import { Rarity } from '../data/cards';
import { AuthService } from './auth';

/** Ruta relativa: en Firebase Hosting /api se reescribe a Cloud Run; en `ng serve`, proxy.conf.json la manda a :8080. */
const BASE = 'api';

/** Agrega el ID token de Firebase a las llamadas a la API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(`${BASE}/`)) return next(req);
  const auth = inject(AuthService);
  return from(auth.token()).pipe(
    switchMap((token) =>
      next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req),
    ),
  );
};

export interface Me {
  uid: string;
  email: string | null;
  displayName: string;
  photoUrl: string | null;
  favoriteTeam: string | null;
  role: 'fan' | 'admin';
  createdAt: string;
  xp: number;
  level: number;
  levelXp: number;
  levelXpMax: number;
  weekly: { points: number; rank: number | null };
  counts: {
    cards: number;
    cardsTotal: number;
    trophies: number;
    badges: number;
    scans: number;
    teamsScanned: number;
  };
}

export interface CollectionCard {
  id: string;
  name: string;
  teamId: string;
  rarity: Rarity;
  serial: string;
  power: number;
  speed: number;
  charisma: number;
  art: string | null;
  obtainedAt: string | null;
}

export interface CollectionTrophy {
  id: string;
  code: string;
  title: string;
  description: string;
  rarity: Rarity;
  unlockedAt: string | null;
}

export interface CollectionBadge {
  id: string;
  label: string;
  description: string;
  earnedAt: string | null;
}

export interface Collection {
  cards: CollectionCard[];
  trophies: CollectionTrophy[];
  badges: CollectionBadge[];
}

/** Respuesta de toda acción que da XP. */
export interface Reward {
  xpGained: number;
  xp: number;
  level: number;
  leveledUp: boolean;
  card: { id: string; name: string; rarity: Rarity } | null;
  trophies: { id: string; code: string; title: string; rarity: Rarity }[];
  badges: { id: string; label: string }[];
}

export interface TriviaQuestion {
  id: number;
  teamId: string | null;
  question: string;
  options: string[];
}

export interface TriviaSummary {
  total: number;
  general: number;
  teams: { teamId: string; abbr: string; name: string; count: number }[];
}

export interface GameSession {
  id: string;
  seed: number;
  rulesVersion: number;
}
export interface GameStats {
  runs: number;
  wins: number;
  bestScore: number;
  gates: number;
  xp24h: number;
  xpRemaining: number;
}
export interface GameStatus {
  rules: { version: number; target: number; xpPerGate: number; winXp: number; xpLimit24h: number };
  stats: GameStats;
  weekly: {
    trivia: number;
    game: number;
    achievements: number;
    exploration: number;
    total: number;
  };
}
export interface GameResult extends Reward {
  duplicate: boolean;
  run: { score: number; won: boolean; xpEarned: number };
  stats: GameStats;
}

export interface GalleryItem {
  id: string;
  kind: 'photo' | 'video';
  url: string;
  mime: string;
  /** Filtro con el que se grabó el video (null = sin filtro, o foto). */
  filter: string | null;
  /** Equipo escaneado cuando se tomó la foto. */
  teamId: string | null;
  durationMs: number | null;
  sizeBytes: number;
  createdAt: string;
}

export interface NewGalleryItem {
  id: string;
  kind: 'photo' | 'video';
  mime: string;
  url: string;
  filter?: string | null;
  teamId?: string | null;
  durationMs?: number | null;
}

export interface Leaderboard {
  entries: { rank: number; name: string; photoUrl: string | null; points: number; me: boolean }[];
  me: { points: number; rank: number | null };
}

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  private get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return firstValueFrom(this.http.get<T>(`${BASE}/${path}`, { params }));
  }

  private send<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
    return firstValueFrom(this.http.request<T>(method, `${BASE}/${path}`, { body }));
  }

  me = () => this.get<Me>('me');
  updateMe = (patch: { displayName?: string; favoriteTeam?: string | null }) =>
    this.send<{ ok: true }>('PATCH', 'me', patch);
  deleteMe = () => this.send<{ ok: true }>('DELETE', 'me');
  collection = () => this.get<Collection>('collection');
  leaderboard = () => this.get<Leaderboard>('leaderboard');
  trivia = (teamId: string) => this.get<TriviaQuestion[]>('trivia', { teamId });
  triviaSummary = () => this.get<TriviaSummary>('trivia/summary');
  gameStatus = () => this.get<GameStatus>('game');
  startGame = () => this.send<GameSession>('POST', 'game/start');
  finishGame = (id: string, flaps: number[]) =>
    this.send<GameResult>('POST', `game/${id}/finish`, { flaps });

  scan = (teamId: string, durationMs: number | null) =>
    this.send<Reward & { firstScanOfTeam: boolean }>('POST', 'scans', { teamId, durationMs });
  answer = (questionId: number, option: number) =>
    this.send<Reward & { correct: boolean; answer: number }>(
      'POST',
      `trivia/${questionId}/answer`,
      { option },
    );
  event = (type: 'effect' | 'filter', value?: string) =>
    this.send<Reward>('POST', 'events', { type, value });

  gallery = () => this.get<GalleryItem[]>('gallery');
  addGalleryItem = (item: NewGalleryItem) => this.send<Reward>('POST', 'gallery', item);
  deleteGalleryItem = (id: string) => this.send<{ ok: true }>('DELETE', `gallery/${id}`);
}
