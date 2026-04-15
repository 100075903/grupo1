# Compras RD

**Trabajo Final — Programación de Dispositivos Móviles**
**Universidad UAPA · Grupo 1 · 2026**

---

## Participantes

| Nombre | Matrícula |
|---|---|
| Ahmed Enmanuel Luna | 100018865 |
| Maicoln De la Rosa | 100063870 |
| Raymi German | 100048833 |
| Jesús Alejandro Zapete de la Cruz | 100035031 |
| Oscar Rafael De Jesus Tavarez | 100075903 |
| Franny Pérez | 100059123 |

---

## Descripción del proyecto

**Compras RD** es una aplicación móvil de lista de compras colaborativa diseñada para familias dominicanas. Permite a los miembros de una familia compartir y gestionar su lista de compras en tiempo real, escanear productos con la cámara del teléfono, comparar precios entre supermercados cercanos y llevar un historial detallado de sus compras.

### Funcionalidades principales

- **Lista compartida en tiempo real** — todos los miembros de la familia ven los cambios al instante mediante Server-Sent Events (SSE)
- **Escáner de códigos de barras** — identifica productos apuntando la cámara al código de barras
- **Comparador de precios** — busca un producto y compara su precio en distintas tiendas
- **Tiendas cercanas** — muestra supermercados y colmados en el mapa con horarios y valoraciones
- **Historial de compras** — registro de compras anteriores con estadísticas y productos frecuentes
- **Modo sin cuenta** — funciona localmente sin necesidad de registrarse
- **Aplicación Android** — disponible como APK instalable en cualquier teléfono Android

---

## Estructura del repositorio

```
grupo1/
├── backend/    # API REST con Node.js, Express y Prisma
└── frontend/   # Aplicación móvil con Ionic, Angular y Capacitor
```

Cada carpeta tiene su propio `README.md` con instrucciones detalladas de instalación y despliegue.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 17 + Ionic 7 |
| Móvil nativo | Capacitor 8 |
| Backend | Node.js 20 + Express 4 |
| Base de datos | SQLite (desarrollo) / PostgreSQL (producción) |
| ORM | Prisma 6 |
| Autenticación | JWT (JSON Web Token) |
| Tiempo real | Server-Sent Events (SSE) |

---

## Inicio rápido

### Backend

```bash
cd backend
npm install
cp .env.example .env   # ajustar variables de entorno
npm run db:migrate
npm run dev
# API disponible en http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start
# Aplicación disponible en http://localhost:4200
```

Consulta el `README.md` de cada carpeta para instrucciones completas de configuración, compilación del APK Android y despliegue en producción.
