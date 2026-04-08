import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Producto {
  id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  comprado: boolean;
  agregadoPor: string;
  categoria: string;
  codigoBarras?: string;
}

export interface Notificacion {
  id: number;
  usuario: string;
  iniciales: string;
  color: string;
  accion: string;
  producto: string;
  tiempo: string;
  leida: boolean;
}

export interface CompraHistorial {
  id: number;
  fecha: string;
  tienda: string;
  total: number;
  items: number;
  productos: string[];
}

@Injectable({ providedIn: 'root' })
export class ComprasService {

  private _productos = new BehaviorSubject<Producto[]>([
    { id: 1, nombre: 'Leche entera 1L',    cantidad: 2, precio: 85,  comprado: false, agregadoPor: 'Ana',   categoria: 'Lácteos' },
    { id: 2, nombre: 'Pan de agua',         cantidad: 1, precio: 45,  comprado: false, agregadoPor: 'Tú',    categoria: 'Panadería' },
    { id: 3, nombre: 'Arroz 5 lbs',         cantidad: 1, precio: 220, comprado: false, agregadoPor: 'Luis',  categoria: 'Granos' },
    { id: 4, nombre: 'Aceite de cocina',    cantidad: 1, precio: 180, comprado: true,  agregadoPor: 'Mamá',  categoria: 'Aceites' },
    { id: 5, nombre: 'Pollo entero',        cantidad: 2, precio: 350, comprado: false, agregadoPor: 'Ana',   categoria: 'Carnes' },
    { id: 6, nombre: 'Huevos x12',          cantidad: 1, precio: 130, comprado: false, agregadoPor: 'Tú',    categoria: 'Lácteos' },
    { id: 7, nombre: 'Detergente 500ml',    cantidad: 1, precio: 95,  comprado: true,  agregadoPor: 'Luis',  categoria: 'Limpieza' },
    { id: 8, nombre: 'Salami dominicano',   cantidad: 2, precio: 65,  comprado: false, agregadoPor: 'Ana',   categoria: 'Embutidos' },
    { id: 9, nombre: 'Habichuelas rojas',   cantidad: 1, precio: 55,  comprado: false, agregadoPor: 'Mamá',  categoria: 'Granos' },
  ]);

  private _notificaciones = new BehaviorSubject<Notificacion[]>([
    { id: 1, usuario: 'Ana',  iniciales: 'AN', color: '#1B6CA8', accion: 'agregó',  producto: 'Pollo entero ×2',       tiempo: 'Hace 5 min',   leida: false },
    { id: 2, usuario: 'Luis', iniciales: 'LU', color: '#1a7a45', accion: 'eliminó', producto: 'Jugo de naranja',        tiempo: 'Hace 18 min',  leida: false },
    { id: 3, usuario: 'Mamá', iniciales: 'MA', color: '#b8860b', accion: 'compró',  producto: 'Aceite de cocina',       tiempo: 'Hace 1 hora',  leida: false },
    { id: 4, usuario: 'Ana',  iniciales: 'AN', color: '#1B6CA8', accion: 'creó',    producto: 'lista "Compras viernes"',tiempo: 'Ayer 7:30pm',  leida: true  },
    { id: 5, usuario: 'Luis', iniciales: 'LU', color: '#1a7a45', accion: 'agregó',  producto: 'Habichuelas ×2',         tiempo: 'Ayer 6:10pm',  leida: true  },
  ]);

  private _historial = new BehaviorSubject<CompraHistorial[]>([
    { id: 1, fecha: 'Sáb 5 Abr',  tienda: 'Nacional Supermarket', total: 1850, items: 12, productos: ['Arroz','Pollo','Aceite','Leche','Pan'] },
    { id: 2, fecha: 'Mar 2 Abr',  tienda: 'La Sirena',            total: 650,  items: 5,  productos: ['Detergente','Jabón','Pasta dent.','Shampoo'] },
    { id: 3, fecha: 'Sáb 29 Mar', tienda: 'Jumbo',                total: 2100, items: 15, productos: ['Pollo','Res','Carne molida','Jamón'] },
    { id: 4, fecha: 'Mié 26 Mar', tienda: 'Nacional Supermarket', total: 980,  items: 8,  productos: ['Arroz','Habichuelas','Aceite','Huevos'] },
  ]);

  productos$ = this._productos.asObservable();
  notificaciones$ = this._notificaciones.asObservable();
  historial$ = this._historial.asObservable();

  get productos() { return this._productos.getValue(); }
  get notificaciones() { return this._notificaciones.getValue(); }
  get historial() { return this._historial.getValue(); }

  toggleComprado(id: number) {
    const list = this.productos.map(p => p.id === id ? { ...p, comprado: !p.comprado } : p);
    this._productos.next(list);
  }

  eliminarProducto(id: number) {
    this._productos.next(this.productos.filter(p => p.id !== id));
  }

  agregarProducto(p: Omit<Producto, 'id'>) {
    const id = Date.now();
    this._productos.next([...this.productos, { ...p, id }]);
    this._notificaciones.next([
      { id, usuario: 'Tú', iniciales: 'TU', color: '#7c3aed',
        accion: 'agregaste', producto: p.nombre, tiempo: 'Ahora', leida: false },
      ...this.notificaciones
    ]);
  }

  marcarTodasLeidas() {
    this._notificaciones.next(this.notificaciones.map(n => ({ ...n, leida: true })));
  }

  get totalGastado() {
    return this.historial.reduce((s, c) => s + c.total, 0);
  }

  get noLeidas() {
    return this.notificaciones.filter(n => !n.leida).length;
  }
}
