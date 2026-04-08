import { Component } from '@angular/core';

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

@Component({
  selector: 'app-comparador',
  templateUrl: './comparador.page.html',
  styleUrls: ['./comparador.page.scss'],
})
export class ComparadorPage {

  busqueda = '';
  buscando = false;
  resultado: ResultadoBusqueda | null = null;

  private baseDatos: Record<string, ResultadoBusqueda> = {
    'arroz': {
      nombre: 'Arroz Cristal 5 lbs',
      precios: [
        { tienda: 'Nacional Supermarket', distancia: '0.8 km', horario: 'Abierto hasta 10pm', precio: 195, actualizado: 'Hace 2h',  mejor: true  },
        { tienda: 'La Sirena',            distancia: '1.4 km', horario: 'Abierto hasta 9pm',  precio: 215, actualizado: 'Hace 5h',  mejor: false },
        { tienda: 'Jumbo',                distancia: '2.1 km', horario: 'Abierto 24h',        precio: 230, actualizado: 'Hace 1d',  mejor: false },
        { tienda: 'Bravo Supermercados',  distancia: '3.0 km', horario: 'Abierto hasta 8pm',  precio: 210, actualizado: 'Hace 3h',  mejor: false },
      ]
    },
    'leche': {
      nombre: 'Leche Nestlé Entera 1L',
      precios: [
        { tienda: 'La Sirena',            distancia: '1.4 km', horario: 'Abierto hasta 9pm',  precio: 79,  actualizado: 'Hace 1h',  mejor: true  },
        { tienda: 'Nacional Supermarket', distancia: '0.8 km', horario: 'Abierto hasta 10pm', precio: 85,  actualizado: 'Hace 2h',  mejor: false },
        { tienda: 'Jumbo',                distancia: '2.1 km', horario: 'Abierto 24h',        precio: 89,  actualizado: 'Hace 4h',  mejor: false },
      ]
    },
    'aceite': {
      nombre: 'Aceite Iberia 1L',
      precios: [
        { tienda: 'Jumbo',                distancia: '2.1 km', horario: 'Abierto 24h',        precio: 165, actualizado: 'Hace 30m', mejor: true  },
        { tienda: 'Nacional Supermarket', distancia: '0.8 km', horario: 'Abierto hasta 10pm', precio: 175, actualizado: 'Hace 2h',  mejor: false },
        { tienda: 'Bravo Supermercados',  distancia: '3.0 km', horario: 'Abierto hasta 8pm',  precio: 180, actualizado: 'Hace 6h',  mejor: false },
      ]
    },
    'pollo': {
      nombre: 'Pollo entero (precio/lb)',
      precios: [
        { tienda: 'Bravo Supermercados',  distancia: '3.0 km', horario: 'Abierto hasta 8pm',  precio: 68,  actualizado: 'Hace 1h',  mejor: true  },
        { tienda: 'Nacional Supermarket', distancia: '0.8 km', horario: 'Abierto hasta 10pm', precio: 72,  actualizado: 'Hace 2h',  mejor: false },
        { tienda: 'La Sirena',            distancia: '1.4 km', horario: 'Abierto hasta 9pm',  precio: 75,  actualizado: 'Hace 3h',  mejor: false },
        { tienda: 'Jumbo',                distancia: '2.1 km', horario: 'Abierto 24h',        precio: 80,  actualizado: 'Hace 5h',  mejor: false },
      ]
    },
  };

  buscar() {
    if (!this.busqueda.trim()) return;
    this.buscando = true;
    this.resultado = null;

    setTimeout(() => {
      const key = Object.keys(this.baseDatos).find(k =>
        this.busqueda.toLowerCase().includes(k)
      );
      this.resultado = key ? this.baseDatos[key] : {
        nombre: this.busqueda,
        precios: [
          { tienda: 'Nacional Supermarket', distancia: '0.8 km', horario: 'Abierto hasta 10pm', precio: Math.floor(Math.random()*200)+50, actualizado: 'Hace 1h', mejor: true },
          { tienda: 'La Sirena',            distancia: '1.4 km', horario: 'Abierto hasta 9pm',  precio: Math.floor(Math.random()*200)+80, actualizado: 'Hace 3h', mejor: false },
        ]
      };
      this.buscando = false;
    }, 1200);
  }

  getPorcentaje(precio: number, precios: PrecioTienda[]): number {
    const min = Math.min(...precios.map(p => p.precio));
    const max = Math.max(...precios.map(p => p.precio));
    if (max === min) return 100;
    return Math.round(100 - ((precio - min) / (max - min)) * 60);
  }

  buscarSugerida(term: string) {
    this.busqueda = term;
    this.buscar();
  }
}
