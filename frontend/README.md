# Compras RD — Aplicación Móvil

**Trabajo Final · Programación de Dispositivos Móviles · UAPA · Grupo 1**

| Participante | Matrícula |
|---|---|
| Ahmed Enmanuel Luna | 100018865 |
| Maicoln De la Rosa | 100063870 |
| Raymi German | 100048833 |
| Jesús Alejandro Zapete de la Cruz | 100035031 |
| Oscar Rafael De Jesus Tavarez | 100075903 |
| Franny Pérez | 100059123 |

---

## Descripción

Aplicación móvil de lista de compras colaborativa para familias dominicanas. Permite compartir y gestionar una lista de compras en tiempo real, escanear productos con la cámara, comparar precios en supermercados cercanos y consultar el historial de compras con estadísticas.

### Tecnologías

- **Angular 17** — framework frontend (NgModule)
- **Ionic 7** — componentes UI móviles
- **Capacitor 8** — empaquetado nativo Android/iOS
- **RxJS** — estado reactivo con `BehaviorSubject`
- **Server-Sent Events (SSE)** — sincronización en tiempo real de la lista
- **BarcodeDetector API / @zxing/browser** — escaneo de códigos de barras
- **Leaflet** — mapa interactivo de tiendas

---

## Estructura del proyecto

```
frontend/
├── android/                        # Proyecto Android generado por Capacitor
├── src/
│   ├── environments/
│   │   ├── environment.ts          # URL de API para desarrollo
│   │   └── environment.prod.ts     # URL de API para producción
│   ├── global.scss                 # Estilos globales y overrides de Ionic
│   └── app/
│       ├── app.module.ts           # Módulo raíz, imports globales (HttpClient, Interceptors)
│       ├── app-routing.module.ts   # Rutas principales
│       ├── app.component.ts        # Componente raíz
│       ├── compras.service.ts      # Estado global de la lista (BehaviorSubject)
│       │
│       ├── tabs/                   # Contenedor de navegación por pestañas
│       ├── lista/                  # Lista de compras con sincronización en tiempo real
│       ├── escaner/                # Escáner de códigos de barras con la cámara
│       ├── comparador/             # Comparador de precios entre tiendas
│       ├── tiendas/                # Mapa y listado de supermercados cercanos
│       ├── historial/              # Historial de compras, estadísticas y frecuentes
│       │   └── cantidades-modal.component.ts  # Modal para editar cantidades al repetir compra
│       ├── notificaciones/         # Notificaciones familiares
│       │
│       ├── services/
│       │   ├── api.service.ts      # Cliente HTTP centralizado para todos los endpoints
│       │   ├── auth.service.ts     # Gestión de sesión, token JWT y estado de autenticación
│       │   └── profile.service.ts  # Acciones de perfil: contraseña, acerca de, cerrar sesión
│       │
│       └── interceptors/
│           └── auth.interceptor.ts # Agrega automáticamente el JWT a todas las peticiones HTTP
│
├── capacitor.config.ts             # Configuración de Capacitor (appId, webDir)
├── ionic.config.json               # Configuración del proyecto Ionic
└── angular.json                    # Configuración de compilación de Angular
```

---

## Dónde cambiar la URL de la API

La URL del backend se configura en los archivos de entorno:

**`src/environments/environment.ts`** — usado en `npm run build` (desarrollo):
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://qsupport.salemdo.app/api'
};
```

**`src/environments/environment.prod.ts`** — usado en `npm run build --configuration production`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://qsupport.salemdo.app/api'
};
```

Angular inyecta automáticamente el archivo correcto según la configuración de compilación. El `ApiService` lo consume así:

```typescript
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
}
```

---

## Autenticación

La aplicación usa **JWT (JSON Web Token)** para autenticar al usuario. El flujo es:

1. El usuario se registra o inicia sesión desde la pantalla Lista
2. El backend devuelve un `token` que se guarda en `localStorage`
3. El `AuthInterceptor` agrega automáticamente `Authorization: Bearer <token>` a todas las peticiones HTTP
4. Al cerrar sesión el token se elimina y el usuario vuelve al modo sin conexión

Sin cuenta, la app funciona en modo local (la lista se guarda solo en el dispositivo). Con cuenta, la lista se sincroniza con la familia en tiempo real.

---

## Pantallas

| Pantalla | Ruta | Descripción |
|---|---|---|
| Lista | `/tabs/lista` | Lista compartida con swipe para marcar/eliminar, sincronización SSE |
| Tiendas | `/tabs/tiendas` | Supermercados cercanos con mapa, horarios y valoraciones |
| Escáner | `/tabs/escaner` | Escaneo de códigos de barras con la cámara del dispositivo |
| Precios | `/tabs/comparador` | Comparación de precios de un producto entre tiendas |
| Historial | `/tabs/historial` | Registro de compras, estadísticas y productos más frecuentes |

---

## Características

- **Lista colaborativa en tiempo real** — sincronización via SSE entre todos los miembros de la familia
- **Escaneo de códigos de barras** — usa `BarcodeDetector` nativo en Android/Chrome, con fallback a `@zxing/browser` en otros navegadores
- **Tiendas cercanas** — filtros por tipo, mapa interactivo con Leaflet
- **Comparador de precios** — busca y compara precios del mismo producto en distintas tiendas
- **Historial con estadísticas** — total gastado, promedio por compra, agrupación por sesión de compra, productos frecuentes
- **Repetir compra** — recrea una compra anterior con opción de ajustar cantidades
- **Gestos táctiles** — swipe izquierdo/derecho con `ion-item-sliding`
- **Modo sin conexión** — funciona sin cuenta con estado local
- **Aplicación Android** — empaquetada con Capacitor, genera APK instalable

---

## Instalación y desarrollo

### Requisitos

- Node.js 20 o superior
- npm 9 o superior

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar en el navegador
npm start
# o
npx ionic serve

# La aplicación queda disponible en http://localhost:4200
```

---

## Compilar para producción (web)

```bash
npm run build
# Los archivos quedan en la carpeta www/
```

Para producción optimizada:

```bash
npm run build -- --configuration production
```

---

## Compilar APK para Android

### Requisitos previos

- Java 21 (`openjdk-21-jdk`)
- Android SDK con `platform-tools`, `platforms;android-34` y `build-tools;34.0.0`
- Variables de entorno configuradas:

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

### Pasos

```bash
# 1. Compilar la app web
npm run build

# 2. Sincronizar con el proyecto Android
npx cap sync android

# 3. Generar el APK de debug
cd android
./gradlew assembleDebug
```

El APK queda en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

En Windows con WSL, se puede acceder desde el explorador de archivos en:
```
\\wsl$\Ubuntu\home\<usuario>\src\grupo1\frontend\android\app\build\outputs\apk\debug\app-debug.apk
```

> Para instalar el APK en el teléfono, activar **"Instalar desde fuentes desconocidas"** en los ajustes de Android.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción (web) |
| `npx cap sync android` | Copia los archivos web al proyecto Android |
| `npx cap open android` | Abre el proyecto en Android Studio |
