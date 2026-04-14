import { Component } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ComprasService, CompraHistorial } from '../compras.service';
import { ApiService, ApiHistorialItem } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';
import { CantidadesModalComponent, ProductoCantidad } from './cantidades-modal.component';

interface FrecuenteItem {
  nombre: string;
  veces: number;
  icono: string;
}

// Generic icon pool for frequently-bought items
const ICONOS = [
  'leaf-outline', 'water-outline', 'nutrition-outline',
  'flask-outline', 'cafe-outline', 'fast-food-outline',
  'basket-outline', 'cube-outline',
];

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage {

  historial: CompraHistorial[] = [];
  totalGastado = 0;
  cargando = false;
  desdeApi = false;

  frecuentes: FrecuenteItem[] = [];

  // Keeps raw API items per compra id so repetirCompra can restore prices/qty
  private rawItemsMap = new Map<string, ApiHistorialItem[]>();

  constructor(
    private svc: ComprasService,
    private api: ApiService,
    public auth: AuthService,
    public profile: ProfileService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
  ) {}

  ionViewWillEnter(): void {
    // Reset stale data before loading
    this.historial = [];
    this.totalGastado = 0;
    this.frecuentes = [];

    if (this.auth.isAuthenticated && this.auth.familiaId) {
      this.cargarDesdeApi();
    } else {
      this.svc.historial$.subscribe(h => {
        this.historial = h;
        this.totalGastado = h.reduce((s, c) => s + c.total, 0);
      });
    }
  }

  get promedioCompra() {
    if (!this.historial.length) return 0;
    return Math.round(this.totalGastado / this.historial.length);
  }

  get compraMax() {
    if (!this.historial.length) return 0;
    return Math.max(...this.historial.map(h => h.total));
  }

  barWidth(total: number): number {
    const max = this.compraMax;
    return max ? Math.round((total / max) * 100) : 0;
  }

  async repetirCompra(compra: CompraHistorial): Promise<void> {
    const rawItems = this.rawItemsMap.get(compra.id) ?? [];

    // Build deduplicated product list with metadata
    interface ProductoRepetir {
      nombre: string; cantidad: number; precio: number; categoria: string;
    }
    const productos: ProductoRepetir[] = [];
    if (rawItems.length > 0) {
      for (const item of rawItems) {
        let precio = 0; let categoria = 'General';
        try {
          const meta = item.metadata ? JSON.parse(item.metadata) : null;
          if (meta?.precio)    precio    = Number(meta.precio);
          if (meta?.categoria) categoria = String(meta.categoria);
        } catch { /* ignore */ }

        const existing = productos.find(p => p.nombre === item.productoNombre);
        if (existing) {
          // Same product appeared multiple times — accumulate quantities
          existing.cantidad += (item.cantidad ?? 1);
        } else {
          productos.push({ nombre: item.productoNombre, cantidad: item.cantidad ?? 1, precio, categoria });
        }
      }
    } else {
      compra.productos.forEach(n => productos.push({ nombre: n, cantidad: 1, precio: 0, categoria: 'General' }));
    }

    const modal = await this.modalCtrl.create({
      component: CantidadesModalComponent,
      componentProps: { productos },
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();

    const { data, role } = await modal.onWillDismiss<ProductoCantidad[]>();
    if (role !== 'confirm' || !data?.length) return;

    data.forEach(p => {
      this.svc.agregarProducto({
        nombre: p.nombre,
        cantidad: p.cantidad,
        precio: p.precio,
        comprado: false,
        agregadoPor: this.auth.userName,
        categoria: p.categoria,
      });
    });

    const toast = await this.toastCtrl.create({
      message: `${data.length} producto(s) agregados a la lista`,
      duration: 2500,
      position: 'bottom',
      icon: 'checkmark-circle-outline',
      color: 'success',
    });
    await toast.present();
    this.router.navigate(['/tabs/lista']);
  }

  // ── API loading ───────────────────────────────────────────────────────────

  private cargarDesdeApi(): void {
    const familiaId = this.auth.familiaId!;
    this.cargando = true;

    this.api.getHistorial(familiaId).subscribe({
      next: ({ items }) => {
        this.cargando = false;
        this.historial = items.length > 0 ? this.agruparPorFecha(items) : [];
        this.totalGastado = this.historial.reduce((s, c) => s + c.total, 0);
        this.desdeApi = true;
        this.cargarFrecuentes(familiaId); // always refresh after historial loads
      },
      error: (e) => {
        this.cargando = false;
        console.error('[API] getHistorial:', e);
      }
    });
  }

  private cargarFrecuentes(familiaId: string): void {
    this.api.getFrecuentes(familiaId).subscribe({
      next: (rows) => {
        if (rows.length > 0) {
          this.frecuentes = rows.slice(0, 5).map((r, i) => ({
            nombre: r.productoNombre,
            veces: r.veces,
            icono: ICONOS[i % ICONOS.length],
          }));
        }
      },
      error: (e) => console.error('[API] getFrecuentes:', e)
    });
  }

  /**
   * Groups HistorialItems into purchase sessions: items saved within 2 minutes
   * of each other are considered the same shopping trip.
   */
  private agruparPorFecha(items: ApiHistorialItem[]): CompraHistorial[] {
    // Sort oldest → newest
    const sorted = [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Cluster into sessions (2-minute windows)
    const sessions: ApiHistorialItem[][] = [];
    let current: ApiHistorialItem[] = [];
    let windowStart = 0;

    for (const item of sorted) {
      const t = new Date(item.createdAt).getTime();
      if (current.length === 0) {
        windowStart = t;
        current.push(item);
      } else if (t - windowStart <= 2 * 60 * 1000) {
        current.push(item);
      } else {
        sessions.push(current);
        current = [item];
        windowStart = t;
      }
    }
    if (current.length > 0) sessions.push(current);

    // Sort sessions newest → oldest for display
    sessions.sort(
      (a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()
    );

    this.rawItemsMap.clear();
    let idx = 1;
    const result: CompraHistorial[] = [];

    for (const sessionItems of sessions) {
      const fecha = new Date(sessionItems[0].createdAt).toLocaleDateString('es-DO', {
        weekday: 'short', day: 'numeric', month: 'short',
      });

      // Try to parse tienda from metadata
      let tienda = 'Compra guardada';
      try {
        const meta = sessionItems[0].metadata ? JSON.parse(sessionItems[0].metadata) : null;
        if (meta?.tienda) tienda = meta.tienda;
      } catch { /* ignore */ }

      // Sum prices from metadata
      let total = 0;
      for (const item of sessionItems) {
        try {
          const meta = item.metadata ? JSON.parse(item.metadata) : null;
          if (meta?.precio) total += Number(meta.precio) * (item.cantidad ?? 1);
        } catch { /* ignore */ }
      }

      const id = (idx++).toString();
      this.rawItemsMap.set(id, sessionItems);
      result.push({
        id,
        fecha,
        tienda,
        total,
        items: sessionItems.length,
        productos: [...new Set(sessionItems.map(i => i.productoNombre))].slice(0, 5),
      });
    }
    return result;
  }
}
