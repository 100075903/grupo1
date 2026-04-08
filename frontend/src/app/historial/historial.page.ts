import { Component, OnInit } from '@angular/core';
import { ComprasService, CompraHistorial } from '../compras.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  historial: CompraHistorial[] = [];
  totalGastado = 0;

  // Frecuencia de productos más comprados
  frecuentes = [
    { nombre: 'Arroz 5 lbs',      veces: 8, icono: 'leaf-outline'       },
    { nombre: 'Leche entera',      veces: 7, icono: 'water-outline'      },
    { nombre: 'Pollo entero',      veces: 6, icono: 'nutrition-outline'  },
    { nombre: 'Aceite de cocina',  veces: 6, icono: 'flask-outline'      },
    { nombre: 'Pan de agua',       veces: 5, icono: 'cafe-outline'       },
  ];

  constructor(private svc: ComprasService) {}

  ngOnInit() {
    this.svc.historial$.subscribe(h => {
      this.historial = h;
      this.totalGastado = h.reduce((s, c) => s + c.total, 0);
    });
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

  repetirCompra(compra: CompraHistorial) {
    compra.productos.forEach(nombre => {
      this.svc.agregarProducto({
        nombre, cantidad: 1, precio: 0,
        comprado: false, agregadoPor: 'Tú', categoria: 'General'
      });
    });
  }
}
