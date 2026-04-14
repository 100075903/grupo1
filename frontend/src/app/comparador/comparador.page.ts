import { Component } from '@angular/core';
import { ApiService, ApiPrecioReporte } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

interface PrecioTienda {
  tienda: string;
  distancia: string;
  horario: string;
  precio: number;
  actualizado: string;
  mejor: boolean;
}

interface ResultadoBusqueda {
  nombre: string;
  precios: PrecioTienda[];
}

// Default location: Santo Domingo
const DEFAULT_LAT = 18.4861;
const DEFAULT_LNG = -69.9312;


@Component({
  selector: 'app-comparador',
  templateUrl: './comparador.page.html',
  styleUrls: ['./comparador.page.scss'],
})
export class ComparadorPage {

  busqueda = '';
  buscando = false;
  resultado: ResultadoBusqueda | null = null;

  constructor(private api: ApiService, public auth: AuthService, public profile: ProfileService) {}

  buscar(): void {
    const q = this.busqueda.trim();
    if (!q) return;

    this.buscando = true;
    this.resultado = null;

    this.obtenerUbicacion().then(({ lat, lng }) => {
      this.api.getPrecios(lat, lng, q, 50).subscribe({
        next: (reportes) => {
          this.buscando = false;
          this.resultado = reportes.length > 0 ? this.transformarReportes(reportes) : null;
        },
        error: (e) => {
          console.error('[API] getPrecios:', e);
          this.buscando = false;
        }
      });
    });
  }

  buscarSugerida(term: string): void {
    this.busqueda = term;
    this.buscar();
  }

  getPorcentaje(precio: number, precios: PrecioTienda[]): number {
    const min = Math.min(...precios.map(p => p.precio));
    const max = Math.max(...precios.map(p => p.precio));
    if (max === min) return 100;
    return Math.round(100 - ((precio - min) / (max - min)) * 60);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private transformarReportes(reportes: ApiPrecioReporte[]): ResultadoBusqueda {
    // Group by producto id; pick the product group with the most matches
    const grupos = new Map<string, { nombre: string; precios: PrecioTienda[] }>();

    for (const r of reportes) {
      const key = r.productoId;
      if (!grupos.has(key)) {
        grupos.set(key, { nombre: r.producto.nombre, precios: [] });
      }
      grupos.get(key)!.precios.push({
        tienda: r.tienda.nombre,
        distancia: `${r.distancia_km} km`,
        horario: r.tienda.horario ?? 'Horario no disponible',
        precio: r.precio,
        actualizado: this.formatearTiempo(r.createdAt),
        mejor: false,
      });
    }

    // Pick first group (already sorted by price asc from backend)
    const first = [...grupos.values()][0];
    first.precios.sort((a, b) => a.precio - b.precio);
    if (first.precios.length > 0) first.precios[0].mejor = true;

    return { nombre: first.nombre, precios: first.precios };
  }

  private formatearTiempo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  }

  private obtenerUbicacion(): Promise<{ lat: number; lng: number }> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        _err => resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }),
        { timeout: 5000 }
      );
    });
  }
}
