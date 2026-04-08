import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ComprasService, Producto } from '../compras.service';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
})
export class ListaPage implements OnInit {

  productos: Producto[] = [];
  busqueda = '';
  integrantes = ['Ana', 'Luis', 'Mamá'];

  constructor(
    private svc: ComprasService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.svc.productos$.subscribe(p => this.productos = p);
  }

  get pendientes() {
    return this.productos.filter(p =>
      !p.comprado && p.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  get comprados() {
    return this.productos.filter(p =>
      p.comprado && p.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  get totalEstimado() {
    return this.pendientes.reduce((s, p) => s + (p.precio * p.cantidad), 0);
  }

  toggleComprado(id: number) {
    this.svc.toggleComprado(id);
  }

  eliminar(id: number) {
    this.svc.eliminarProducto(id);
    this.showToast('Producto eliminado', 'trash-outline');
  }

  async agregarProducto() {
    const alert = await this.alertCtrl.create({
      header: 'Agregar producto',
      inputs: [
        { name: 'nombre',   type: 'text',   placeholder: 'Nombre del producto' },
        { name: 'cantidad', type: 'number', placeholder: 'Cantidad', value: '1' },
        { name: 'precio',   type: 'number', placeholder: 'Precio (RD$)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            if (!data.nombre) return false;
            this.svc.agregarProducto({
              nombre: data.nombre,
              cantidad: +data.cantidad || 1,
              precio: +data.precio || 0,
              comprado: false,
              agregadoPor: 'Tú',
              categoria: 'General',
            });
            this.showToast(`"${data.nombre}" agregado`, 'checkmark-circle-outline');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, icon: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2000, position: 'bottom', icon,
      color: 'dark',
    });
    await toast.present();
  }
}
