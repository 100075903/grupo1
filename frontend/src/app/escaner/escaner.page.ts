import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { ComprasService } from '../compras.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ProfileService } from '../services/profile.service';

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
export class EscanerPage implements OnDestroy {

  @ViewChild('videoEl') videoElRef!: ElementRef<HTMLVideoElement>;

  escaneando = false;
  productoDetectado: ProductoEscaneado | null = null;
  cantidad = 1;
  agregadoExitoso = false;
  procesando = false;
  camaraError: string | null = null;

  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private reader: BrowserMultiFormatReader | null = null;
  private scanControls: IScannerControls | null = null;

  constructor(
    private svc: ComprasService,
    private api: ApiService,
    public auth: AuthService,
    public profile: ProfileService,
    private toastCtrl: ToastController,
    private zone: NgZone,
  ) {}

  ngOnDestroy(): void {
    this.detenerCamara();
  }

  async iniciarEscaneo(): Promise<void> {
    this.productoDetectado = null;
    this.agregadoExitoso = false;
    this.camaraError = null;
    this.procesando = false;
    this.escaneando = true;

    await new Promise(r => setTimeout(r, 100));

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      const videoEl = this.videoElRef?.nativeElement;
      if (!videoEl) throw new Error('Video element not found');

      videoEl.srcObject = this.stream;
      await videoEl.play();

      // Try native BarcodeDetector first (Android WebView / Chrome)
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'],
        });
        const scan = async () => {
          if (!this.escaneando || this.procesando) return;
          try {
            const barcodes = await detector.detect(videoEl);
            if (barcodes.length > 0) {
              this.zone.run(() => {
                this.procesando = true;
                this.escaneando = false;
                this.detenerCamara();
                this.buscarProducto(barcodes[0].rawValue);
              });
              return;
            }
          } catch { /* frame not ready yet */ }
          this.animFrameId = requestAnimationFrame(scan);
        };
        this.animFrameId = requestAnimationFrame(scan);

      } else {
        // Fallback: @zxing/browser
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,  BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        this.reader = new BrowserMultiFormatReader(hints);

        this.scanControls = await this.reader.decodeFromStream(
          this.stream,
          videoEl,
          (result, _err) => {
            if (result && !this.procesando) {
              this.zone.run(() => {
                this.procesando = true;
                this.escaneando = false;
                this.detenerCamara();
                this.buscarProducto(result.getText());
              });
            }
          },
        );
      }

    } catch (err: any) {
      this.zone.run(() => {
        this.escaneando = false;
        if (err?.name === 'NotAllowedError') {
          this.camaraError = 'Permiso de cámara denegado. Habilítalo en la configuración del dispositivo.';
        } else if (err?.name === 'NotFoundError') {
          this.camaraError = 'No se detectó ninguna cámara en este dispositivo.';
        } else {
          this.camaraError = 'No se pudo acceder a la cámara: ' + (err?.message ?? err);
        }
      });
    }
  }

  cancelarEscaneo(): void {
    this.detenerCamara();
    this.zone.run(() => { this.escaneando = false; });
  }

  agregarALista(): void {
    if (!this.productoDetectado) return;
    this.svc.agregarProducto({
      nombre: this.productoDetectado.nombre,
      cantidad: this.cantidad,
      precio: this.productoDetectado.precio,
      comprado: false,
      agregadoPor: this.auth.userName,
      categoria: this.productoDetectado.categoria,
      codigoBarras: this.productoDetectado.codigo,
    });
    this.agregadoExitoso = true;
    this.showToast(`"${this.productoDetectado.nombre}" agregado a la lista`);
    setTimeout(() => {
      this.zone.run(() => {
        this.productoDetectado = null;
        this.agregadoExitoso = false;
        this.cantidad = 1;
        this.procesando = false;
      });
    }, 1800);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private detenerCamara(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.scanControls?.stop();
    this.scanControls = null;
    this.reader = null;
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  private buscarProducto(codigo: string): void {
    this.api.getBusquedaBarcode(codigo).subscribe({
      next: (producto) => {
        this.zone.run(() => {
          this.productoDetectado = {
            nombre: producto.nombre,
            precio: 0,
            marca: producto.marca ?? '',
            codigo: producto.barcode,
            categoria: 'General',
          };
          this.procesando = false;
        });
      },
      error: () => {
        this.zone.run(() => {
          this.productoDetectado = {
            nombre: 'Producto desconocido',
            precio: 0,
            marca: '',
            codigo,
            categoria: 'General',
          };
          this.procesando = false;
        });
      },
    });
  }

  private async showToast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message, duration: 2200, position: 'bottom',
      icon: 'checkmark-circle-outline', color: 'success',
    });
    await t.present();
  }
}
