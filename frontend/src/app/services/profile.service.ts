import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private api: ApiService,
    private auth: AuthService,
  ) {}

  async abrirPerfil(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.auth.userName,
      subHeader: 'Opciones de cuenta',
      buttons: [
        {
          text: 'Cambiar contraseña',
          handler: () => { this.cambiarPassword(); return false; },
        },
        {
          text: 'Acerca de',
          handler: () => { this.mostrarAcercaDe(); return false; },
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            this.auth.logout();
            this.showToast('Sesión cerrada', 'log-out-outline');
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  async mostrarAcercaDe(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Compras RD',
      subHeader: 'Trabajo Final — UAPA · Grupo 1',
      message:
        'Lista de compras colaborativa para familias dominicanas. ' +
        'Comparte tu lista en tiempo real, compara precios en supermercados cercanos ' +
        'y lleva el historial de tus compras.\n\n' +
        'Participantes:\n' +
        'Ahmed Enmanuel Luna · 100018865\n' +
        'Maicoln De la Rosa · 100063870\n' +
        'Raymi German · 100048833\n' +
        'Jesús A. Zapete de la Cruz · 100035031\n' +
        'Oscar Rafael De Jesus Tavarez · 100075903\n' +
        'Franny Pérez · 100059123',
      cssClass: 'acerca-de-alert',
      buttons: [{ text: 'Cerrar', role: 'cancel' }],
    });
    await alert.present();
  }

  async cambiarPassword(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar contraseña',
      inputs: [
        { name: 'current',  type: 'password', placeholder: 'Contraseña actual' },
        { name: 'nueva',    type: 'password', placeholder: 'Nueva contraseña (mín. 8 caracteres)' },
        { name: 'confirma', type: 'password', placeholder: 'Confirmar nueva contraseña' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.current || !data.nueva) {
              this.showToast('Completa todos los campos', 'alert-circle-outline', 'warning');
              return false;
            }
            if (data.nueva !== data.confirma) {
              this.showToast('Las contraseñas no coinciden', 'alert-circle-outline', 'warning');
              return false;
            }
            try {
              await this.api.cambiarPassword(data.current, data.nueva).toPromise();
              this.showToast('Contraseña actualizada', 'checkmark-circle-outline', 'success');
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Error al cambiar contraseña'), 'alert-circle-outline', 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private apiError(e: any, fallback: string): string {
    const body = e?.error;
    if (!body) return e?.message ?? fallback;
    if (body.details?.[0]?.msg) return body.details[0].msg;
    if (body.error) return body.error;
    return fallback;
  }

  private async showToast(message: string, icon = 'checkmark-circle-outline', color = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', icon, color });
    await toast.present();
  }
}
