import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Response shapes matching backend models ──────────────────────────────────

export interface ApiUser { id: string; email: string; nombre: string; }
export interface AuthResponse { user: ApiUser; token: string; }
export interface FamiliaResponse {
  id: string; nombre: string; codigoInvitacion: string; createdAt: string;
}
export interface ApiFamiliaMiembro {
  userId: string; rol: string; joinedAt: string;
  user: { id: string; email: string; nombre: string; createdAt: string };
}

export interface ApiProductoLista {
  id: string; listaId: string; nombre: string;
  cantidad: number; notas: string | null;
  completado: boolean; barcode: string | null; createdAt: string;
}
export interface ApiLista {
  id: string; familiaId: string; nombre: string;
  createdAt: string; productos: ApiProductoLista[];
}

export interface ApiTienda {
  id: string; nombre: string; tipo: string;
  lat: number; lng: number; direccion: string;
  horario: string; abiertoAhora: boolean;
  distancia_km: number; createdAt: string;
}

export interface ApiProducto {
  id: string; barcode: string; nombre: string;
  marca: string | null; imagenUrl: string | null; createdAt: string;
}

export interface ApiPrecioReporte {
  id: string; productoId: string; tiendaId: string;
  precio: number; createdAt: string; distancia_km: number;
  producto: ApiProducto; tienda: ApiTienda;
}

export interface ApiHistorialItem {
  id: string; familiaId: string; productoNombre: string;
  cantidad: number; metadata: string | null; createdAt: string;
}
export interface ApiHistorialResponse {
  items: ApiHistorialItem[]; total: number; limit: number; offset: number;
}
export interface ApiHistorialFrecuente {
  productoNombre: string; veces: number; cantidadTotal: number;
}

export interface ApiNotificacion {
  id: string; userId: string; titulo: string;
  mensaje: string; leida: boolean; createdAt: string;
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth (no token required)
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password });
  }
  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, { nombre, email, password });
  }
  cambiarPassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/auth/cambiar-password`, { currentPassword, newPassword });
  }

  // Familia
  getMiFamilia(): Observable<FamiliaResponse> {
    return this.http.get<FamiliaResponse>(`${this.base}/familias/mia`);
  }
  getMiembrosFamilia(familiaId: string): Observable<ApiFamiliaMiembro[]> {
    return this.http.get<ApiFamiliaMiembro[]>(`${this.base}/familias/${familiaId}/miembros`);
  }
  crearFamilia(nombre: string): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(`${this.base}/familias`, { nombre });
  }
  unirseAFamilia(codigo: string): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(`${this.base}/familias/unirse`, { codigo });
  }

  // Listas
  getListas(familiaId: string): Observable<ApiLista[]> {
    return this.http.get<ApiLista[]>(`${this.base}/listas/${familiaId}`);
  }
  agregarProductoLista(
    listaId: string,
    data: { nombre: string; cantidad?: number; notas?: string; barcode?: string }
  ): Observable<ApiProductoLista> {
    return this.http.post<ApiProductoLista>(`${this.base}/listas/${listaId}/productos`, data);
  }
  actualizarProductoLista(
    listaId: string,
    productoId: string,
    data: { nombre?: string; cantidad?: number; completado?: boolean; notas?: string }
  ): Observable<ApiProductoLista> {
    return this.http.patch<ApiProductoLista>(
      `${this.base}/listas/${listaId}/productos/${productoId}`, data
    );
  }
  eliminarProductoLista(listaId: string, productoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/listas/${listaId}/productos/${productoId}`);
  }

  // Productos
  getBusquedaBarcode(codigo: string): Observable<ApiProducto> {
    return this.http.get<ApiProducto>(`${this.base}/productos/barcode/${codigo}`);
  }
  buscarProductos(q: string, limit = 10): Observable<ApiProducto[]> {
    const params = new HttpParams().set('q', q).set('limit', limit.toString());
    return this.http.get<ApiProducto[]>(`${this.base}/productos/buscar`, { params });
  }

  // Precios — lat/lng are required; q is optional per the route definition
  getPrecios(lat: number, lng: number, q?: string, radioKm = 10): Observable<ApiPrecioReporte[]> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radio_km', radioKm.toString());
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiPrecioReporte[]>(`${this.base}/precios`, { params });
  }

  // Tiendas
  getTiendas(lat: number, lng: number, tipo?: string, soloAbiertos = false, radioKm = 50): Observable<ApiTienda[]> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('radio_km', radioKm.toString());
    if (tipo && tipo !== 'todos') params = params.set('tipo', tipo);
    if (soloAbiertos) params = params.set('solo_abiertos', 'true');
    return this.http.get<ApiTienda[]>(`${this.base}/tiendas`, { params });
  }

  // Historial
  getHistorial(familiaId: string, limit = 50, offset = 0): Observable<ApiHistorialResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString()).set('offset', offset.toString());
    return this.http.get<ApiHistorialResponse>(`${this.base}/historial/${familiaId}`, { params });
  }
  getFrecuentes(familiaId: string): Observable<ApiHistorialFrecuente[]> {
    return this.http.get<ApiHistorialFrecuente[]>(`${this.base}/historial/${familiaId}/frecuentes`);
  }
  guardarHistorial(
    familiaId: string,
    items: Array<{ productoNombre: string; cantidad: number; metadata?: string }>
  ): Observable<{ guardados: number }> {
    return this.http.post<{ guardados: number }>(`${this.base}/historial/${familiaId}/guardar`, { items });
  }

  // Notificaciones
  getNotificaciones(usuarioId: string): Observable<ApiNotificacion[]> {
    return this.http.get<ApiNotificacion[]>(`${this.base}/notificaciones/${usuarioId}`);
  }
  marcarNotificacionesLeidas(usuarioId: string, ids?: string[]): Observable<{ actualizadas: number }> {
    return this.http.patch<{ actualizadas: number }>(
      `${this.base}/notificaciones/${usuarioId}/leer`, ids ? { ids } : {}
    );
  }
}
