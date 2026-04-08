import { Component, OnInit } from '@angular/core';
import { ComprasService, Notificacion } from '../compras.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
})
export class NotificacionesPage implements OnInit {

  notificaciones: Notificacion[] = [];
  filtro: 'todas' | 'no-leidas' = 'todas';

  constructor(private svc: ComprasService) {}

  ngOnInit() {
    this.svc.notificaciones$.subscribe(n => this.notificaciones = n);
  }

  get filtradas() {
    return this.filtro === 'todas'
      ? this.notificaciones
      : this.notificaciones.filter(n => !n.leida);
  }

  get noLeidas() {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  marcarTodasLeidas() {
    this.svc.marcarTodasLeidas();
  }

  accionColor(accion: string): string {
    if (accion === 'eliminó') return 'danger';
    if (accion === 'compró') return 'success';
    return 'primary';
  }

  accionIcon(accion: string): string {
    if (accion === 'eliminó') return 'trash-outline';
    if (accion === 'compró') return 'checkmark-circle-outline';
    if (accion === 'creó')   return 'add-circle-outline';
    return 'cart-outline';
  }
}
