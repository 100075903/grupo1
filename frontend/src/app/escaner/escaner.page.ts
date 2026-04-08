import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ComprasService } from '../compras.service';

interface ProductoEscaneado {
  nombre: string;
  precio: number;
  marca: string;
  codigo: string;
  categoria: string;
}

@Component({
  selector: 'app-escaner',
  templateUrl: './escaner.page.html',
  styleUrls: ['./escaner.page.scss'],
})
export class EscanerPage {

  escaneando = false;
  productoDetectado: ProductoEscaneado | null = null;
  cantidad = 1;
  agregadoExitoso = false;

  // Productos simulados por código de barras
  private db: Record<string, ProductoEscaneado> = {
    '7750506800114': { nombre: 'Leche Nestlé Entera 1L',   precio: 85,  marca: 'Nestlé',  codigo: '7750506800114', categoria: 'Lácteos'   },
    '7622210100054': { nombre: 'Arroz Cristal 5 lbs',      precio: 220, marca: 'Cristal', codigo: '7622210100054', categoria: 'Granos'    },
    '7441001620021': { nombre: 'Aceite Iberia 1L',         precio: 180, marca: 'Iberia',  codigo: '7441001620021', categoria: 'Aceites'   },
    '7801640061523': { nombre: 'Salami Campofrío',         precio: 75,  marca: 'Campofrío',codigo:'7801640061523', categoria: 'Embutidos' },
  };

  private codigos = Object.keys(this.db);
  private scanInterval: any;

  constructor(
    private svc: ComprasService,
    private toastCtrl: ToastController,
  ) {}

  iniciarEscaneo() {
    this.escaneando = true;
    this.productoDetectado = null;
    this.agregadoExitoso = false;

    // Simula lectura de código después de 2s
    this.scanInterval = setTimeout(() => {
      const codigoAleatorio = this.codigos[Math.floor(Math.random() * this.codigos.length)];
      this.productoDetectado = this.db[codigoAleatorio];
      this.escaneando = false;
    }, 2000);
  }

  cancelarEscaneo() {
    clearTimeout(this.scanInterval);
    this.escaneando = false;
  }

  agregarALista() {
    if (!this.productoDetectado) return;
    this.svc.agregarProducto({
      nombre: this.productoDetectado.nombre,
      cantidad: this.cantidad,
      precio: this.productoDetectado.precio,
      comprado: false,
      agregadoPor: 'Tú',
      categoria: this.productoDetectado.categoria,
      codigoBarras: this.productoDetectado.codigo,
    });
    this.agregadoExitoso = true;
    this.showToast(`"${this.productoDetectado.nombre}" agregado a la lista`);
    setTimeout(() => {
      this.productoDetectado = null;
      this.agregadoExitoso = false;
      this.cantidad = 1;
    }, 1800);
  }

  private async showToast(message: string) {
    const t = await this.toastCtrl.create({
      message, duration: 2200, position: 'bottom',
      icon: 'checkmark-circle-outline', color: 'success'
    });
    await t.present();
  }
}
