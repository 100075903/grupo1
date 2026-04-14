import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface ProductoCantidad {
  nombre: string;
  cantidad: number;
  precio: number;
  categoria: string;
}

@Component({
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ajustar cantidades</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="cancelar()">
            <ion-icon slot="icon-only" name="close-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list lines="full">
        <ion-item *ngFor="let p of productos">
          <ion-label>{{ p.nombre }}</ion-label>
          <div slot="end" class="qty-control">
            <ion-button fill="clear" size="small" (click)="p.cantidad = p.cantidad > 0 ? p.cantidad - 1 : 0">
              <ion-icon slot="icon-only" name="remove-circle-outline"></ion-icon>
            </ion-button>
            <ion-input
              type="number"
              [(ngModel)]="p.cantidad"
              [min]="0"
              inputmode="numeric"
              class="qty-input"
            ></ion-input>
            <ion-button fill="clear" size="small" (click)="p.cantidad = p.cantidad + 1">
              <ion-icon slot="icon-only" name="add-circle-outline"></ion-icon>
            </ion-button>
          </div>
        </ion-item>
      </ion-list>

      <p class="skip-hint">Pon 0 para omitir un producto</p>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" color="primary" (click)="confirmar()" style="margin:8px">
          <ion-icon slot="start" name="bag-add-outline"></ion-icon>
          Agregar a lista
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .qty-control {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .qty-input {
      width: 48px;
      text-align: center;
      --padding-start: 0;
      --padding-end: 0;
      font-weight: 700;
      font-size: 16px;
      color: var(--ion-color-primary);
    }
    .skip-hint {
      font-size: 12px;
      color: var(--ion-color-medium);
      text-align: center;
      margin-top: 8px;
    }
  `],
})
export class CantidadesModalComponent {
  @Input() productos: ProductoCantidad[] = [];

  constructor(private modalCtrl: ModalController) {}

  cancelar(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  confirmar(): void {
    this.modalCtrl.dismiss(
      this.productos.filter(p => p.cantidad > 0),
      'confirm'
    );
  }
}
