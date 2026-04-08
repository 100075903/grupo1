# Compras RD — Lista de Compras Inteligente

Aplicación Ionic/Angular para organización familiar de compras con comparación de precios en tiempo real.

---

## Estructura del Proyecto

```
src/app/
├── tabs/                   # Navegación por pestañas
├── lista/                  # Lista de compras con gestos táctiles
├── escaner/                # Escáner de códigos de barras
├── comparador/             # Comparador de precios por tienda
├── tiendas/                # Tiendas y supermercados cercanos
├── historial/              # Historial de compras
├── notificaciones/         # Alertas familiares en tiempo real
└── compras.service.ts      # Servicio compartido con estado reactivo
```

---

## Instalación

### Requisitos
- Node.js 18+
- npm 9+

### Pasos

```bash
# 1. Instalar Ionic CLI globalmente
npm install -g @ionic/cli

# 2. Instalar dependencias del proyecto
npm install

# 3. Ejecutar en el navegador
ionic serve

# 4. Ejecutar en dispositivo Android
ionic capacitor add android
ionic capacitor run android

# 5. Ejecutar en dispositivo iOS (solo macOS)
ionic capacitor add ios
ionic capacitor run ios
```

---

## Pantallas implementadas

| Pantalla | Ruta | Descripción |
|---|---|---|
| Lista | `/tabs/lista` | Lista con swipe para marcar/eliminar |
| Tiendas | `/tabs/tiendas` | Comercios cercanos con horarios y valoraciones |
| Escáner | `/tabs/escaner` | Captura de productos por código de barras |
| Precios | `/tabs/comparador` | Comparación de precios entre tiendas |
| Historial | `/tabs/historial` | Registro de compras y productos frecuentes |
| Alertas | navegación interna | Notificaciones de cambios en lista compartida |

---

## Características implementadas

- ✅ **Listas compartidas** — estado reactivo con RxJS BehaviorSubject (Unidad V)
- ✅ **Escáner de códigos de barras** — simulación con datos reales (Unidad VIII)
- ✅ **Tiendas cercanas** — filtros por categoría y mapa placeholder (Unidad VI)
- ✅ **Comparador de precios** — resultados con barra visual de comparación (Unidad X)
- ✅ **Historial de compras** — totales, promedios, productos frecuentes (Unidad IX)
- ✅ **Notificaciones familiares** — feed con filtro leídas/no leídas (Unidad IV)
- ✅ **Gestos táctiles** — ion-item-sliding con swipe izquierdo/derecho (Unidad III)

---

## Para agregar escáner real (Capacitor)

```bash
npm install @capacitor/camera
# o usando un plugin de barcode:
npm install @capacitor-community/barcode-scanner
ionic capacitor sync
```

Luego reemplaza el `setTimeout` en `escaner.page.ts` con:

```typescript
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';

async iniciarEscaneo() {
  await BarcodeScanner.checkPermission({ force: true });
  BarcodeScanner.hideBackground();
  const result = await BarcodeScanner.startScan();
  if (result.hasContent) {
    // result.content = código escaneado
  }
}
```

---

## Integración API de precios

En `comparador.page.ts`, reemplaza `baseDatos` por una llamada HTTP real:

```typescript
constructor(private http: HttpClient) {}

async buscar() {
  const res = await this.http
    .get<any>(`https://tu-api.com/precios?q=${this.busqueda}`)
    .toPromise();
  this.resultado = res;
}
```
