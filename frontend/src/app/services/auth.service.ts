import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ApiService, ApiUser, FamiliaResponse } from './api.service';

export interface AuthState {
  token: string;
  user: ApiUser;
  familiaId: string | null;
  familiaNombre: string | null;
  familiaCode: string | null;
  listaId: string | null;
}

const STORAGE_KEY = 'compras_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state = new BehaviorSubject<AuthState | null>(null);
  state$: Observable<AuthState | null> = this._state.asObservable();

  constructor(private api: ApiService) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this._state.next(JSON.parse(saved) as AuthState);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  get token(): string | null         { return this._state.value?.token          ?? null; }
  get userId(): string | null         { return this._state.value?.user?.id       ?? null; }
  get userName(): string              { return this._state.value?.user?.nombre   ?? 'Tú'; }
  get familiaId(): string | null      { return this._state.value?.familiaId      ?? null; }
  get familiaNombre(): string | null  { return this._state.value?.familiaNombre  ?? null; }
  get familiaCode(): string | null    { return this._state.value?.familiaCode    ?? null; }
  get listaId(): string | null        { return this._state.value?.listaId        ?? null; }
  get isAuthenticated(): boolean      { return !!this.token; }

  // ── Auth actions ──────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.api.login(email, password));
    const prev = this._state.value;
    // If the same user is logging in again, preserve their cached familia data
    // so we don't lose the family context while the server request is in flight.
    const sameUser = prev?.user?.id === res.user.id;

    const familiaId     = sameUser ? (prev?.familiaId     ?? null) : null;
    const familiaNombre = sameUser ? (prev?.familiaNombre ?? null) : null;
    const familiaCode   = sameUser ? (prev?.familiaCode   ?? null) : null;
    const listaId       = sameUser ? (prev?.listaId       ?? null) : null;

    this.persist({ token: res.token, user: res.user, familiaId, familiaNombre, familiaCode, listaId });

    // Always fetch the latest familia from the server to stay in sync
    try {
      const familia = await firstValueFrom(this.api.getMiFamilia());
      const changed = familia.id !== this._state.value?.familiaId;
      this.patchState({
        familiaId: familia.id,
        familiaNombre: familia.nombre,
        familiaCode: familia.codigoInvitacion,
        // Reset listaId when the family changed — the old lista belongs to a different family
        listaId: changed ? null : this._state.value?.listaId ?? null,
      });
    } catch {
      // 404 = user has no familia yet — banner will prompt them
    }
  }

  async register(nombre: string, email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.api.register(nombre, email, password));
    this.persist({
      token: res.token, user: res.user,
      familiaId: null, familiaNombre: null, familiaCode: null, listaId: null,
    });
  }

  async crearFamilia(nombre: string): Promise<FamiliaResponse> {
    const familia = await firstValueFrom(this.api.crearFamilia(nombre));
    this.patchState({
      familiaId: familia.id,
      familiaNombre: familia.nombre,
      familiaCode: familia.codigoInvitacion,
      listaId: null,
    });
    return familia;
  }

  async unirseAFamilia(codigo: string): Promise<FamiliaResponse> {
    const familia = await firstValueFrom(this.api.unirseAFamilia(codigo));
    this.patchState({
      familiaId: familia.id,
      familiaNombre: familia.nombre,
      familiaCode: familia.codigoInvitacion,
      listaId: null,
    });
    return familia;
  }

  setListaId(id: string): void {
    this.patchState({ listaId: id });
  }

  logout(): void {
    this._state.next(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private patchState(patch: Partial<AuthState>): void {
    const current = this._state.value;
    if (!current) return;
    this.persist({ ...current, ...patch });
  }

  private persist(state: AuthState): void {
    this._state.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
