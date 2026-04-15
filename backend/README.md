# Compras RD — Backend API

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

API REST para **Compras RD**, una aplicación móvil de lista de compras colaborativa para familias dominicanas. Permite a los miembros de una familia compartir y gestionar su lista de compras en tiempo real, comparar precios en supermercados cercanos y llevar el historial de compras.

### Tecnologías

- **Node.js 20+** con ES Modules
- **Express 4** — framework HTTP
- **Prisma 6** — ORM con base de datos SQLite (desarrollo) o PostgreSQL (producción)
- **bcryptjs** — hash de contraseñas
- **jsonwebtoken** — autenticación mediante JWT
- **express-validator** — validación de entradas
- **express-rate-limit** — protección contra abuso
- **helmet** — cabeceras de seguridad HTTP
- **Server-Sent Events (SSE)** — sincronización en tiempo real de la lista

### Módelos de datos principales

| Modelo | Descripción |
|---|---|
| `User` | Usuario registrado |
| `Familia` | Grupo familiar con código de invitación |
| `FamiliaMiembro` | Relación usuario-familia con rol (ADMIN / MIEMBRO) |
| `ListaCompra` | Lista de compras de una familia |
| `ProductoLista` | Ítem dentro de una lista |
| `Producto` | Catálogo de productos con código de barras |
| `Tienda` | Supermercado con ubicación geográfica |
| `PrecioReporte` | Precio reportado de un producto en una tienda |
| `HistorialItem` | Registro de productos comprados |
| `Notificacion` | Notificaciones por usuario |

---

## Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma        # Definición de modelos y base de datos
│   ├── seed.mjs             # Datos de prueba (tiendas, productos)
│   ├── migrations/          # Historial de migraciones de la BD
│   └── dev.db               # Base de datos SQLite local (se genera automáticamente)
│
├── src/
│   ├── server.js            # Punto de entrada — arranca el servidor HTTP
│   ├── app.js               # Configuración de Express (cors, helmet, rutas)
│   │
│   ├── config/
│   │   └── env.js           # Lee y valida las variables de entorno
│   │
│   ├── routes/
│   │   └── api.routes.js    # Declara todas las rutas con sus validaciones
│   │
│   ├── controllers/         # Reciben la petición HTTP y devuelven la respuesta
│   │   ├── auth.controller.js
│   │   ├── familia.controller.js
│   │   ├── lista.controller.js
│   │   ├── producto.controller.js
│   │   ├── precio.controller.js
│   │   ├── tienda.controller.js
│   │   ├── historial.controller.js
│   │   └── notificacion.controller.js
│   │
│   ├── services/            # Lógica de negocio y acceso a la base de datos
│   │   ├── auth.service.js
│   │   ├── familia.service.js
│   │   ├── lista.service.js
│   │   ├── producto.service.js
│   │   ├── precio.service.js
│   │   ├── tienda.service.js
│   │   ├── historial.service.js
│   │   └── notificacion.service.js
│   │
│   ├── middleware/
│   │   ├── auth.js                    # Verifica el JWT en el header Authorization
│   │   ├── requireFamiliaMember.js    # Verifica que el usuario pertenece a la familia
│   │   ├── requireSelf.js             # Verifica que el recurso pertenece al usuario
│   │   ├── validate.js                # Procesa errores de express-validator
│   │   ├── asyncHandler.js            # Envuelve controladores async para capturar errores
│   │   └── errorHandler.js            # Manejador global de errores
│   │
│   ├── lib/
│   │   ├── prisma.js        # Instancia única del cliente Prisma
│   │   └── listaBus.js      # Bus de eventos para SSE (Server-Sent Events)
│   │
│   └── utils/
│       ├── tokens.js        # Generación y verificación de JWT
│       ├── inviteCode.js    # Generador de códigos de invitación
│       └── geo.js           # Cálculo de distancia geográfica (Haversine)
│
├── .env.example             # Plantilla de variables de entorno
├── package.json
└── README.md
```

### Dónde cambiar la URL de la base de datos

La URL de conexión se define en el archivo `.env` mediante la variable `DATABASE_URL`:

```env
# SQLite local (por defecto en desarrollo)
DATABASE_URL="file:./dev.db"

# PostgreSQL externo (para producción)
DATABASE_URL="postgresql://usuario:contraseña@host:5432/nombre_db"
```

Si se usa PostgreSQL también hay que cambiar el `provider` en `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   // cambiar de "sqlite" a "postgresql"
  url      = env("DATABASE_URL")
}
```

### Base de datos SQLite como respaldo

Si no se dispone de una base de datos externa (PostgreSQL, etc.), el proyecto funciona **completamente con SQLite** sin ninguna instalación adicional. SQLite crea un archivo local en `prisma/dev.db` de forma automática al ejecutar:

```bash
npm run db:migrate
```

Esto es suficiente para desarrollo, pruebas y demos. El archivo `dev.db` se genera en la misma máquina donde corre el servidor y no requiere ningún servicio externo.

---

## Autenticación con JWT

Todos los endpoints protegidos requieren un **JSON Web Token (JWT)** en el header de la petición.

### 1. Registrar un usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@correo.com",
  "password": "micontraseña123"
}
```

Respuesta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxyz...",
    "nombre": "Juan Pérez",
    "email": "juan@correo.com"
  }
}
```

### 2. Iniciar sesión

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@correo.com",
  "password": "micontraseña123"
}
```

La respuesta devuelve el mismo formato con un nuevo `token`.

### 3. Usar el token en las peticiones

Incluye el token en el header `Authorization` de todas las solicitudes posteriores:

```bash
GET /api/familias/mia
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> El token tiene una validez de **7 días** (configurable con `JWT_EXPIRES_IN` en `.env`). Al vencer, el usuario deberá iniciar sesión nuevamente.

### Reglas de validación

| Campo | Regla |
|---|---|
| `email` | Debe ser un email válido |
| `password` | Mínimo 8 caracteres, máximo 128 |
| `nombre` | Entre 1 y 120 caracteres |

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión (devuelve JWT) |
| PATCH | `/api/auth/cambiar-password` | Cambiar contraseña |
| GET | `/api/familias/mia` | Obtener familia del usuario |
| POST | `/api/familias` | Crear familia |
| POST | `/api/familias/unirse` | Unirse a familia por código |
| GET | `/api/familias/:id/miembros` | Listar miembros de la familia |
| GET | `/api/listas/:familia_id` | Obtener lista de la familia |
| GET | `/api/listas/:lista_id/events` | Stream SSE de cambios en tiempo real |
| POST | `/api/listas/:lista_id/productos` | Agregar producto a la lista |
| PATCH | `/api/listas/:lista_id/productos/:id` | Actualizar producto (nombre, cantidad, completado) |
| DELETE | `/api/listas/:lista_id/productos/:id` | Eliminar producto de la lista |
| GET | `/api/productos/barcode/:codigo` | Buscar producto por código de barras |
| GET | `/api/productos/buscar?q=` | Buscar productos por nombre |
| GET | `/api/tiendas?lat=&lng=` | Listar tiendas cercanas |
| GET | `/api/precios?lat=&lng=&q=` | Comparar precios en tiendas cercanas |
| POST | `/api/precios/reportar` | Reportar precio de un producto |
| GET | `/api/historial/:familia_id` | Historial de compras de la familia |
| POST | `/api/historial/:familia_id/guardar` | Guardar compra en el historial |
| GET | `/api/historial/:familia_id/frecuentes` | Productos más comprados |
| GET | `/api/notificaciones/:usuario_id` | Listar notificaciones |
| PATCH | `/api/notificaciones/:usuario_id/leer` | Marcar notificaciones como leídas |

Todos los endpoints excepto `register` y `login` requieren el header:
```
Authorization: Bearer <token>
```

---

## Desarrollo local

### Requisitos previos

- Node.js 20 o superior
- npm 9 o superior

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores:

```bash
cp .env.example .env
```

Contenido mínimo del `.env` para desarrollo:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="un-secreto-largo-y-aleatorio-minimo-32-caracteres"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGIN="*"
```

### 3. Crear y migrar la base de datos

```bash
npm run db:migrate
```

Esto crea el archivo SQLite en `prisma/dev.db` y aplica todas las migraciones.

### 4. (Opcional) Cargar datos de prueba

```bash
npm run db:seed
```

### 5. Iniciar el servidor

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000` con recarga automática al guardar cambios.

Verifica que esté activo:

```bash
curl http://localhost:3000/health
# → {"ok":true}
```

---

## Despliegue en producción

### Variables de entorno requeridas

```env
DATABASE_URL="postgresql://usuario:contraseña@host:5432/nombre_db"
JWT_SECRET="secreto-largo-aleatorio-unico-de-produccion"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://tu-dominio.com"
```

> En producción se recomienda PostgreSQL. Cambia el `provider` en `prisma/schema.prisma` de `sqlite` a `postgresql` antes de desplegar.

### Despliegue manual en servidor Linux (Ubuntu/Debian)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd grupo1/backend

# 2. Instalar dependencias de producción
npm install --omit=dev

# 3. Configurar variables de entorno
cp .env.example .env
# editar .env con los valores de producción

# 4. Aplicar migraciones sobre la base de datos de producción
npm run db:deploy

# 5. Iniciar el servidor
npm start
```

### Con PM2 (recomendado para mantener el proceso activo)

```bash
npm install -g pm2

pm2 start src/server.js --name compras-rd-api --interpreter node
pm2 save
pm2 startup
```

### Con nginx como proxy inverso

Configura nginx para redirigir el tráfico al puerto de Node:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        # Necesario para SSE (eventos en tiempo real)
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }
}
```

Luego habilita HTTPS con Certbot:

```bash
certbot --nginx -d tu-dominio.com
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia en modo desarrollo con recarga automática |
| `npm start` | Inicia en modo producción |
| `npm run db:migrate` | Crea/aplica migraciones (desarrollo) |
| `npm run db:deploy` | Aplica migraciones en producción (sin borrar datos) |
| `npm run db:seed` | Carga datos de prueba |
| `npm run db:reset` | Reinicia la base de datos (borra todos los datos) |
| `npm run db:generate` | Regenera el cliente de Prisma |
