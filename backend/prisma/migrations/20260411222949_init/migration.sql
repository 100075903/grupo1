-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "codigoInvitacion" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FamiliaMiembro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'MIEMBRO',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamiliaMiembro_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FamiliaMiembro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaCompra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT 'Lista principal',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListaCompra_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductoLista" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "notas" TEXT,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "barcode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductoLista_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "ListaCompra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barcode" TEXT,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "imagenUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tienda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "direccion" TEXT,
    "horario" TEXT,
    "abiertoAhora" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PrecioReporte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productoId" TEXT NOT NULL,
    "tiendaId" TEXT NOT NULL,
    "precio" REAL NOT NULL,
    "userId" TEXT,
    "lat" REAL,
    "lng" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrecioReporte_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrecioReporte_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrecioReporte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResenaTienda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tiendaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResenaTienda_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ResenaTienda_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistorialItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HistorialItem_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Familia_codigoInvitacion_key" ON "Familia"("codigoInvitacion");

-- CreateIndex
CREATE UNIQUE INDEX "FamiliaMiembro_familiaId_userId_key" ON "FamiliaMiembro"("familiaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_barcode_key" ON "Producto"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ResenaTienda_tiendaId_userId_key" ON "ResenaTienda"("tiendaId", "userId");
