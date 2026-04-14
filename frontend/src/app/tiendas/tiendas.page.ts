import { Component, OnDestroy, ViewChild } from '@angular/core';
import { AlertController, IonContent, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import { ApiService, ApiTienda } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

export interface Tienda {
  id: string;
  nombre: string;
  tipo: string;
  distancia: string;
  distanciaNum: number;
  lat: number;
  lng: number;
  direccion: string;
  horario: string;
  abierto: boolean;
  valoracion: number;
  resenas: number;
  icon: string;
  color: string;
  especialidades: string[];
  telefono?: string;
}

const DEFAULT_LAT = 18.4861;
const DEFAULT_LNG = -69.9312;

const ICON_MAP: Record<string, string> = {
  supermercado: 'storefront', hipermercado: 'business',
  colmado: 'home', mercado: 'leaf',
};
const COLOR_MAP: Record<string, string> = {
  supermercado: '#1B6CA8', hipermercado: '#16a34a',
  colmado: '#7c3aed', mercado: '#059669',
};


@Component({
  selector: 'app-tiendas',
  templateUrl: './tiendas.page.html',
  styleUrls: ['./tiendas.page.scss'],
})
export class TiendasPage implements OnDestroy {

  @ViewChild(IonContent, { static: false }) content!: IonContent;

  filtroActivo = 'todos';
  busqueda = '';
  cargando = false;
  tiendaSeleccionada: Tienda | null = null;

  // Settings
  radioKm = 50;
  soloAbiertos = false;
  ordenarPor: 'distancia' | 'valoracion' = 'distancia';

  tiendas: Tienda[] = [];

  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private userLat = DEFAULT_LAT;
  private userLng = DEFAULT_LNG;

  constructor(
    private api: ApiService,
    public auth: AuthService,
    public profile: ProfileService,
    private router: Router,
    private toast: ToastController,
    private alertCtrl: AlertController,
  ) {}

  // ── Ionic lifecycle: use ionViewDidEnter so the DOM is ready ─────────────

  ionViewDidEnter(): void {
    this.cargarTiendas();
  }

  ionViewWillLeave(): void {
    this.destroyMap();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  get filtros() {
    return ['todos', 'supermercado', 'hipermercado', 'colmado', 'mercado'];
  }

  get tiendrasFiltradas() {
    return this.tiendas
      .filter(t => {
        const matchFiltro   = this.filtroActivo === 'todos' || t.tipo === this.filtroActivo;
        const matchAbierto  = !this.soloAbiertos || t.abierto;
        const matchBusqueda = !this.busqueda ||
          t.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
          t.especialidades.some(e => e.toLowerCase().includes(this.busqueda.toLowerCase()));
        return matchFiltro && matchAbierto && matchBusqueda;
      })
      .sort((a, b) =>
        this.ordenarPor === 'valoracion'
          ? b.valoracion - a.valoracion
          : a.distanciaNum - b.distanciaNum
      );
  }

  async abrirConfiguracion(): Promise<void> {
    // Step 1 – radio de búsqueda
    const alertRadio = await this.alertCtrl.create({
      header: 'Radio de búsqueda',
      inputs: [
        { type: 'radio', label: '5 km',  value: 5,  checked: this.radioKm === 5  },
        { type: 'radio', label: '10 km', value: 10, checked: this.radioKm === 10 },
        { type: 'radio', label: '25 km', value: 25, checked: this.radioKm === 25 },
        { type: 'radio', label: '50 km', value: 50, checked: this.radioKm === 50 },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Siguiente',
          handler: (km: number) => { this.radioKm = Number(km); },
        },
      ],
    });
    await alertRadio.present();
    const { role: r1 } = await alertRadio.onDidDismiss();
    if (r1 === 'cancel') return;

    // Step 2 – filtros y orden
    const alertFiltros = await this.alertCtrl.create({
      header: 'Filtros y orden',
      inputs: [
        {
          type: 'checkbox',
          label: 'Solo tiendas abiertas',
          value: 'soloAbiertos',
          checked: this.soloAbiertos,
        },
        {
          type: 'checkbox',
          label: 'Ordenar por valoración',
          value: 'valoracion',
          checked: this.ordenarPor === 'valoracion',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aplicar',
          handler: (vals: string[]) => {
            this.soloAbiertos = vals.includes('soloAbiertos');
            this.ordenarPor   = vals.includes('valoracion') ? 'valoracion' : 'distancia';
            this.cargarTiendas();
          },
        },
      ],
    });
    await alertFiltros.present();
  }

  comoLlegar(t: Tienda, event: Event): void {
    event.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&destination_place_id=${encodeURIComponent(t.nombre)}`;
    window.open(url, '_blank');
  }

  async llamar(t: Tienda, event: Event): Promise<void> {
    event.stopPropagation();
    if (t.telefono) {
      window.open(`tel:${t.telefono}`, '_system');
    } else {
      const toast = await this.toast.create({
        message: 'Número de teléfono no disponible',
        duration: 2000,
        position: 'bottom',
        color: 'medium',
      });
      await toast.present();
    }
  }

  verPrecios(t: Tienda, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/tabs/comparador'], { queryParams: { q: t.nombre } });
  }

  onFiltroChange(): void {
    this.tiendaSeleccionada = null;
    this.actualizarMarkers();
  }

  seleccionarTienda(t: Tienda): void {
    this.tiendaSeleccionada = t;
    this.content?.scrollToTop(400);
    if (!this.map) return;
    setTimeout(() => {
      this.map!.flyTo([t.lat, t.lng], 16, { duration: 0.8 });
      const idx = this.tiendrasFiltradas.findIndex(x => x.id === t.id);
      if (idx >= 0 && this.markers[idx]) {
        setTimeout(() => this.markers[idx].openPopup(), 900);
      }
    }, 300);
  }

  estrellas(val: number): string[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(val)) return 'star';
      if (i < val) return 'star-half';
      return 'star-outline';
    });
  }

  labelFiltro(f: string): string {
    const map: Record<string, string> = {
      todos: 'Todos', supermercado: 'Supermercado',
      hipermercado: 'Hipermercado', colmado: 'Colmado', mercado: 'Mercado',
    };
    return map[f] ?? f;
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  cargarTiendas(): void {
    this.obtenerUbicacion().then(({ lat, lng }) => {
      this.userLat = lat;
      this.userLng = lng;
      this.initMap(lat, lng);

      this.cargando = true;
      this.api.getTiendas(lat, lng, undefined, this.soloAbiertos, this.radioKm).subscribe({
        next: (rows) => {
          this.cargando = false;
          this.tiendas = rows.map(t => this.mapApiTienda(t));
          this.actualizarMarkers();
        },
        error: (e) => {
          this.cargando = false;
          console.error('[API] getTiendas:', e);
          this.tiendas = [];
          this.actualizarMarkers();
        },
      });
    });
  }

  // ── Map ───────────────────────────────────────────────────────────────────

  private initMap(lat: number, lng: number): void {
    if (this.map) {
      this.map.setView([lat, lng], 13);
      return;
    }

    const container = document.getElementById('tiendas-map');
    if (!container) return;

    this.map = L.map('tiendas-map', { zoomControl: true, attributionControl: false }).setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.map);

    // User location marker
    L.marker([lat, lng], { icon: this.buildIcon('#1B6CA8', '📍') })
      .addTo(this.map)
      .bindPopup('<b>Tu ubicación</b>')
      .openPopup();
  }

  private actualizarMarkers(): void {
    if (!this.map) return;

    // Remove old store markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const t of this.tiendrasFiltradas) {
      const marker = L.marker([t.lat, t.lng], { icon: this.buildIcon(t.color, '') })
        .addTo(this.map!)
        .bindPopup(`
          <div style="min-width:160px">
            <b>${t.nombre}</b><br>
            <small>${t.direccion}</small><br>
            <small>${t.horario}</small><br>
            <span style="color:${t.abierto ? '#16a34a' : '#6b7280'}">
              ${t.abierto ? '● Abierto' : '○ Cerrado'}
            </span>
            &nbsp;·&nbsp;${t.distancia}
          </div>
        `);
      this.markers.push(marker);
    }

    // Fit map to all visible markers
    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map!.fitBounds(group.getBounds().pad(0.15));
    }
  }

  private buildIcon(color: string, emoji: string): L.DivIcon {
    return L.divIcon({
      html: `<div style="
        background:${color};
        width:28px;height:28px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 5px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:12px">${emoji}</span>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
      className: '',
    });
  }

  private destroyMap(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private mapApiTienda(t: ApiTienda): Tienda {
    const tipo = (t.tipo ?? '').toLowerCase();
    return {
      id: t.id,
      nombre: t.nombre,
      tipo: t.tipo,
      distancia: `${t.distancia_km} km`,
      distanciaNum: t.distancia_km,
      lat: t.lat,
      lng: t.lng,
      direccion: t.direccion,
      horario: t.horario,
      abierto: t.abiertoAhora,
      valoracion: 4.0,
      resenas: 0,
      icon: ICON_MAP[tipo] ?? 'storefront',
      color: COLOR_MAP[tipo] ?? '#1B6CA8',
      especialidades: [],
    };
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
        { timeout: 5000 },
      );
    });
  }
}
