import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { ComprasService, Producto } from '../compras.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
})
export class ListaPage implements OnInit {

  productos: Producto[] = [];
  busqueda = '';
  cargando = false;
  integrantes: string[] = [];

  constructor(
    private svc: ComprasService,
    private api: ApiService,
    public auth: AuthService,
    public profile: ProfileService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.svc.productos$.subscribe(p => this.productos = p);
    this.svc.cargando$.subscribe(v => this.cargando = v);
    this.svc.syncError$.subscribe(msg =>
      this.showToast(msg, 'cloud-offline-outline', 'danger')
    );
    this.auth.state$.subscribe(state => {
      if (state?.familiaId) {
        this.api.getMiembrosFamilia(state.familiaId).subscribe({
          next: (rows) => { this.integrantes = rows.map(r => r.user.nombre); },
          error: () => { this.integrantes = []; },
        });
      } else {
        this.integrantes = [];
      }
    });
  }

  // ── Computed lists ────────────────────────────────────────────────────────

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

  // ── List actions ──────────────────────────────────────────────────────────

  toggleComprado(id: string): void {
    this.svc.toggleComprado(id);
  }

  eliminar(id: string): void {
    this.svc.eliminarProducto(id);
    this.showToast('Producto eliminado', 'trash-outline');
  }

  async finalizarCompra(): Promise<void> {
    const count = this.comprados.length;
    const alert = await this.alertCtrl.create({
      header: 'Finalizar compra',
      message: `¿Guardar ${count} producto${count !== 1 ? 's' : ''} comprado${count !== 1 ? 's' : ''} en el historial y limpiar la lista?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async () => {
            try {
              await this.svc.finalizarCompra();
              this.showToast('Compra guardada en el historial', 'checkmark-circle-outline', 'success');
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Error al guardar la compra'), 'alert-circle-outline', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async agregarProducto(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Agregar producto',
      inputs: [
        { name: 'nombre',   type: 'text',   placeholder: 'Nombre del producto' },
        { name: 'cantidad', type: 'number', placeholder: 'Cantidad', value: '1' },
        { name: 'precio',   type: 'number', placeholder: 'Precio estimado (RD$)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: (data) => {
            if (!data.nombre?.trim()) return false;
            this.svc.agregarProducto({
              nombre: data.nombre.trim(),
              cantidad: +data.cantidad || 1,
              precio: +data.precio || 0,
              comprado: false,
              agregadoPor: this.auth.userName,
              categoria: 'General',
            });
            this.showToast(`"${data.nombre.trim()}" agregado`, 'checkmark-circle-outline');
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Auth flow ─────────────────────────────────────────────────────────────

  async abrirLogin(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Iniciar sesión',
      inputs: [
        { name: 'email',    type: 'email',    placeholder: 'Correo electrónico' },
        { name: 'password', type: 'password', placeholder: 'Contraseña (mín. 8 caracteres)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Registrarse', handler: () => { this.abrirRegistro(); return false; } },
        {
          text: 'Entrar',
          handler: async (data) => {
            try {
              await this.auth.login(data.email, data.password);
              if (!this.auth.familiaId) {
                await this.pedirFamilia();
              }
              this.showToast(`Bienvenido, ${this.auth.userName}`, 'person-circle-outline');
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Credenciales incorrectas'), 'alert-circle-outline', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async abrirRegistro(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Crear cuenta',
      inputs: [
        { name: 'nombre',   type: 'text',     placeholder: 'Nombre' },
        { name: 'email',    type: 'email',    placeholder: 'Correo electrónico' },
        { name: 'password', type: 'password', placeholder: 'Contraseña (mín. 8 caracteres)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar',
          handler: async (data) => {
            try {
              await this.auth.register(data.nombre, data.email, data.password);
              await this.pedirFamilia();
              this.showToast(`Cuenta creada. ¡Hola, ${this.auth.userName}!`, 'checkmark-circle-outline');
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Error al registrar'), 'alert-circle-outline', 'danger');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async pedirFamilia(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Configurar familia',
      message: 'Crea un grupo familiar o únete con un código.',
      inputs: [
        { name: 'accion', type: 'radio', label: 'Crear nueva familia', value: 'crear', checked: true },
        { name: 'accion', type: 'radio', label: 'Unirse con código', value: 'unirse' },
      ],
      buttons: [
        { text: 'Más tarde', role: 'cancel' },
        {
          text: 'Continuar',
          handler: (accion: string) => {
            if (accion === 'crear') {
              this.pedirNombreFamilia();
            } else {
              this.pedirCodigoFamilia();
            }
            return false;
          },
        },
      ],
    });
    await alert.present();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async pedirNombreFamilia(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Nueva familia',
      inputs: [{ name: 'nombre', type: 'text', placeholder: 'Nombre del grupo familiar' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            if (!data.nombre?.trim()) return false;
            try {
              const f = await this.auth.crearFamilia(data.nombre.trim());
              this.svc.cargarDesdeApi();
              await this.mostrarCodigo(f.nombre, f.codigoInvitacion);
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Error al crear familia'), 'alert-circle-outline', 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async pedirCodigoFamilia(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Unirse a familia',
      inputs: [{ name: 'codigo', type: 'text', placeholder: 'Código de invitación' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Unirse',
          handler: async (data) => {
            if (!data.codigo?.trim()) return false;
            try {
              const f = await this.auth.unirseAFamilia(data.codigo.trim());
              this.svc.cargarDesdeApi();
              this.showToast(`Cambiaste a la familia "${f.nombre}"`, 'people-outline');
            } catch (e: any) {
              this.showToast(this.apiError(e, 'Código inválido'), 'alert-circle-outline', 'danger');
            }
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  async verCodigoFamilia(): Promise<void> {
    const code = this.auth.familiaCode;
    const nombre = this.auth.familiaNombre;
    if (code) {
      await this.mostrarCodigo(nombre ?? 'Tu familia', code);
    } else {
      this.showToast('Código no disponible. Vuelve a unirte a la familia.', 'alert-circle-outline', 'warning');
    }
  }

  private async mostrarCodigo(nombre: string, codigo: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Familia lista',
      subHeader: `${nombre} · Comparte este código con tu familia:`,
      message: codigo,
      cssClass: 'codigo-familia-alert',
      buttons: [
        {
          text: 'Copiar código',
          handler: () => {
            navigator.clipboard.writeText(codigo).then(() => {
              this.showToast('Código copiado al portapapeles', 'copy-outline');
            }).catch(() => {
              this.showToast('No se pudo copiar. Copia manualmente: ' + codigo, 'alert-circle-outline', 'warning');
            });
            return false; // keep alert open
          },
        },
        {
          text: 'Unirse a otra familia',
          handler: () => {
            this.pedirCodigoFamilia();
          },
        },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  /**
   * Extracts a readable message from an Angular HttpErrorResponse.
   *
   * The backend returns two shapes:
   *   • AppError  → { error: "message string" }
   *   • Validation → { error: "Validación fallida", details: [{ msg, path }] }
   */
  private apiError(e: any, fallback: string): string {
    const body = e?.error;
    if (!body) return e?.message ?? fallback;
    if (body.details?.[0]?.msg) return body.details[0].msg;
    if (body.error)             return body.error;
    return fallback;
  }

  private async showToast(
    message: string,
    icon = 'checkmark-circle-outline',
    color = 'dark',
  ): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', icon, color });
    await toast.present();
  }
}
