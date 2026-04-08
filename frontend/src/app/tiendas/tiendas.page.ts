import { Component } from '@angular/core';

export interface Tienda {
  id: number;
  nombre: string;
  tipo: string;
  distancia: string;
  distanciaNum: number;
  direccion: string;
  horario: string;
  abierto: boolean;
  valoracion: number;
  reseñas: number;
  icon: string;
  color: string;
  especialidades: string[];
}

@Component({
  selector: 'app-tiendas',
  templateUrl: './tiendas.page.html',
  styleUrls: ['./tiendas.page.scss'],
})
export class TiendasPage {

  filtroActivo = 'todos';
  busqueda = '';

  tiendas: Tienda[] = [
    {
      id: 1, nombre: 'Nacional Supermarket', tipo: 'supermercado',
      distancia: '0.8 km', distanciaNum: 0.8,
      direccion: 'Av. San Vicente de Paul, SDE',
      horario: 'Lun–Dom 7am–10pm', abierto: true,
      valoracion: 4.5, reseñas: 234,
      icon: 'storefront', color: '#1B6CA8',
      especialidades: ['Carnes frescas', 'Panadería', 'Productos locales'],
    },
    {
      id: 2, nombre: 'La Sirena', tipo: 'supermercado',
      distancia: '1.4 km', distanciaNum: 1.4,
      direccion: 'Av. Las Américas Km 8, SDE',
      horario: 'Lun–Dom 8am–9pm', abierto: true,
      valoracion: 4.2, reseñas: 512,
      icon: 'storefront', color: '#e11d48',
      especialidades: ['Electrodomésticos', 'Ropa', 'Alimentos importados'],
    },
    {
      id: 3, nombre: 'Jumbo', tipo: 'hipermercado',
      distancia: '2.1 km', distanciaNum: 2.1,
      direccion: 'Av. Charles de Gaulle, SDE',
      horario: 'Lun–Dom 24 horas', abierto: true,
      valoracion: 4.3, reseñas: 389,
      icon: 'business', color: '#16a34a',
      especialidades: ['Abierto 24h', 'Mayoreo', 'Productos importados'],
    },
    {
      id: 4, nombre: 'Bravo Supermercados', tipo: 'supermercado',
      distancia: '3.0 km', distanciaNum: 3.0,
      direccion: 'C/ Mella esq. Duarte, SDE',
      horario: 'Lun–Sáb 7am–8pm', abierto: false,
      valoracion: 3.9, reseñas: 98,
      icon: 'storefront', color: '#d97706',
      especialidades: ['Precios bajos', 'Frutas y verduras'],
    },
    {
      id: 5, nombre: 'Colmado Don Pepe', tipo: 'colmado',
      distancia: '0.3 km', distanciaNum: 0.3,
      direccion: 'C/ 15 #22, Los Girasoles, SDE',
      horario: 'Lun–Dom 6am–11pm', abierto: true,
      valoracion: 4.8, reseñas: 67,
      icon: 'home', color: '#7c3aed',
      especialidades: ['Más cercano', 'Fiado disponible', 'Delivery rápido'],
    },
    {
      id: 6, nombre: 'MercaSID', tipo: 'mercado',
      distancia: '4.5 km', distanciaNum: 4.5,
      direccion: 'Autopista del Este Km 12',
      horario: 'Mar–Dom 6am–2pm', abierto: false,
      valoracion: 4.6, reseñas: 143,
      icon: 'leaf', color: '#059669',
      especialidades: ['Frutas tropicales', 'Verduras frescas', 'Precios mercado'],
    },
  ];

  get filtros() {
    return ['todos', 'supermercado', 'hipermercado', 'colmado', 'mercado'];
  }

  get tiendrasFiltradas() {
    return this.tiendas
      .filter(t => {
        const matchFiltro = this.filtroActivo === 'todos' || t.tipo === this.filtroActivo;
        const matchBusqueda = !this.busqueda ||
          t.nombre.toLowerCase().includes(this.busqueda.toLowerCase()) ||
          t.especialidades.some(e => e.toLowerCase().includes(this.busqueda.toLowerCase()));
        return matchFiltro && matchBusqueda;
      })
      .sort((a, b) => a.distanciaNum - b.distanciaNum);
  }

  estrellas(val: number): string[] {
    return Array.from({ length: 5 }, (_, i) => {
      if (i < Math.floor(val)) return 'star';
      if (i < val) return 'star-half';
      return 'star-outline';
    });
  }

  labelFiltro(f: string) {
    const map: Record<string, string> = {
      todos: 'Todos', supermercado: 'Supermercado',
      hipermercado: 'Hipermercado', colmado: 'Colmado', mercado: 'Mercado'
    };
    return map[f] ?? f;
  }
}
