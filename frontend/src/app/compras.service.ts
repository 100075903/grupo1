import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { ApiService, ApiProductoLista } from './services/api.service';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

// ── Public interfaces ─────────────────────────────────────────────────────────
// IDs are strings so they can hold either mock numeric strings ('1') or
// backend UUIDs ('cuid...')

export interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  comprado: boolean;
  agregadoPor: string;
  categoria: string;
  codigoBarras?: string;
}

export interface Notificacion {
  id: string;
  usuario: string;
  iniciales: string;
  color: string;
  accion: string;
  producto: string;
  tiempo: string;
  leida: boolean;
}

export interface CompraHistorial {
  id: string;
  fecha: string;
  tienda: string;
  total: number;
  items: number;
  productos: string[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ComprasService implements OnDestroy {

  private _productos      = new BehaviorSubject<Producto[]>([]);
  private _notificaciones = new BehaviorSubject<Notificacion[]>([]);
  private _historial      = new BehaviorSubject<CompraHistorial[]>([]);
  private _cargando       = new BehaviorSubject<boolean>(false);

  productos$      = this._productos.asObservable();
  notificaciones$ = this._notificaciones.asObservable();
  historial$      = this._historial.asObservable();
  cargando$       = this._cargando.asObservable();

  private _sse: EventSource | null = null;
  private _sseListaId: string | null = null;
  private _syncError$ = new Subject<string>();
  syncError$ = this._syncError$.asObservable();

  constructor(private api: ApiService, private auth: AuthService) {
    // React to auth state changes (login / logout / familia set)
    let prevFamiliaId: string | null = null;
    this.auth.state$.subscribe(state => {
      if (state?.familiaId) {
        if (state.familiaId !== prevFamiliaId) {
          // Family changed — clear stale products immediately before reloading
          this._productos.next([]);
          this.cerrarSSE();
        }
        prevFamiliaId = state.familiaId;
        this.cargarDesdeApi();
      } else {
        prevFamiliaId = null;
        this.cerrarSSE();
        this._productos.next([]);
      }
    });
  }

  ngOnDestroy(): void {
    this.cerrarSSE();
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  get productos()      { return this._productos.getValue();      }
  get notificaciones() { return this._notificaciones.getValue(); }
  get historial()      { return this._historial.getValue();      }

  get totalGastado() {
    return this.historial.reduce((s, c) => s + c.total, 0);
  }
  get noLeidas() {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  // ── Shopping list mutations ───────────────────────────────────────────────

  toggleComprado(id: string): void {
    // Optimistic local update
    const updated = this.productos.map(p => p.id === id ? { ...p, comprado: !p.comprado } : p);
    this._productos.next(updated);

    const listaId = this.auth.listaId;
    if (!listaId) return;
    const producto = updated.find(p => p.id === id);
    if (!producto) return;

    this.api.actualizarProductoLista(listaId, id, { completado: producto.comprado })
      .subscribe({
        error: (e) => {
          console.error('[API] toggleComprado:', e);
          // Roll back optimistic update on failure
          this._productos.next(this.productos.map(p => p.id === id ? { ...p, comprado: !p.comprado } : p));
          this._syncError$.next('No se pudo sincronizar. Verifica tu conexión.');
        },
      });
  }

  eliminarProducto(id: string): void {
    // Optimistic local remove
    const prev = this.productos;
    this._productos.next(prev.filter(p => p.id !== id));

    const listaId = this.auth.listaId;
    if (!listaId) return;

    this.api.eliminarProductoLista(listaId, id)
      .subscribe({
        error: (e) => {
          console.error('[API] eliminarProducto:', e);
          this._productos.next(prev); // roll back
          this._syncError$.next('No se pudo eliminar. Verifica tu conexión.');
        },
      });
  }

  async finalizarCompra(): Promise<void> {
    const comprados = this.productos.filter(p => p.comprado);
    if (!comprados.length) return;

    const familiaId = this.auth.familiaId;
    const listaId   = this.auth.listaId;

    if (familiaId) {
      const items = comprados.map(p => ({
        productoNombre: p.nombre,
        cantidad: p.cantidad,
        metadata: JSON.stringify({ precio: p.precio, categoria: p.categoria }),
      }));
      await firstValueFrom(this.api.guardarHistorial(familiaId, items));
    }

    // Remove comprados from the live list (API + local)
    for (const p of comprados) {
      if (listaId) {
        this.api.eliminarProductoLista(listaId, p.id)
          .subscribe({ error: e => console.error('[API] finalizar/eliminar:', e) });
      }
    }
    this._productos.next(this.productos.filter(p => !p.comprado));
  }

  agregarProducto(p: Omit<Producto, 'id'>): void {
    const listaId = this.auth.listaId;

    // Always add notification locally
    this.agregarNotificacionLocal(p.nombre);

    if (listaId) {
      // Pack precio + categoria into `notas` as JSON (ProductoLista has no price field)
      const notas = JSON.stringify({ categoria: p.categoria || 'General', precio: p.precio || 0 });
      // Sync to API, then refresh list to get real UUID
      this.api.agregarProductoLista(listaId, {
        nombre: p.nombre,
        cantidad: p.cantidad,
        notas,
        barcode: p.codigoBarras || undefined,
      }).subscribe({
        next: () => this.cargarDesdeApi(),
        error: e => {
          console.error('[API] agregarProducto:', e);
          this.agregarLocal(p); // fall back to local add
        }
      });
    } else {
      this.agregarLocal(p);
    }
  }

  marcarTodasLeidas(): void {
    this._notificaciones.next(this.notificaciones.map(n => ({ ...n, leida: true })));

    const userId = this.auth.userId;
    if (!userId) return;
    this.api.marcarNotificacionesLeidas(userId)
      .subscribe({ error: e => console.error('[API] marcarTodasLeidas:', e) });
  }

  // ── API load / refresh ────────────────────────────────────────────────────

  cargarDesdeApi(): void {
    const familiaId = this.auth.familiaId;
    if (!familiaId) return;

    this._cargando.next(true);

    this.api.getListas(familiaId).subscribe({
      next: (listas) => {
        this._cargando.next(false);
        if (!listas.length) return;

        const lista = listas[0];
        // Persist listaId if not already stored
        if (!this.auth.listaId) {
          this.auth.setListaId(lista.id);
        }
        this._productos.next(lista.productos.map(p => this.mapApiProducto(p)));
        this.abrirSSE(lista.id);
      },
      error: (e) => {
        this._cargando.next(false);
        console.error('[API] getListas:', e);
        // Keep current state (mock or last good data)
      }
    });
  }

  // ── SSE real-time sync ────────────────────────────────────────────────────

  private abrirSSE(listaId: string): void {
    if (this._sseListaId === listaId && this._sse) return; // already connected
    this.cerrarSSE();

    const token = this.auth.token;
    if (!token) return;

    const url = `${environment.apiUrl}/listas/${listaId}/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    this._sse = es;
    this._sseListaId = listaId;

    const reload = () => this.cargarDesdeApi();
    es.addEventListener('producto_agregado',    reload);
    es.addEventListener('producto_actualizado', reload);
    es.addEventListener('producto_eliminado',   reload);

    es.onerror = () => {
      // Browser will auto-reconnect; nothing extra needed
    };
  }

  private cerrarSSE(): void {
    this._sse?.close();
    this._sse = null;
    this._sseListaId = null;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private agregarLocal(p: Omit<Producto, 'id'>): void {
    const id = Date.now().toString();
    this._productos.next([...this.productos, { ...p, id }]);
  }

  private agregarNotificacionLocal(nombre: string): void {
    const id = Date.now().toString();
    this._notificaciones.next([
      {
        id,
        usuario: this.auth.userName,
        iniciales: this.auth.userName.slice(0, 2).toUpperCase(),
        color: '#7c3aed',
        accion: 'agregaste',
        producto: nombre,
        tiempo: 'Ahora',
        leida: false,
      },
      ...this.notificaciones,
    ]);
  }

  private mapApiProducto(p: ApiProductoLista): Producto {
    // `notas` is either a JSON string {"categoria":"...","precio":0} (our format)
    // or a plain string (legacy / manually entered).
    let precio = 0;
    let categoria = 'General';
    if (p.notas) {
      try {
        const meta = JSON.parse(p.notas);
        precio    = Number(meta.precio)    || 0;
        categoria = String(meta.categoria) || 'General';
      } catch {
        // Plain text in notas → treat as category, price stays 0
        categoria = p.notas;
      }
    }
    return {
      id: p.id,
      nombre: p.nombre,
      cantidad: p.cantidad,
      precio,
      comprado: p.completado,
      agregadoPor: this.auth.userName,
      categoria,
      codigoBarras: p.barcode ?? undefined,
    };
  }
}
