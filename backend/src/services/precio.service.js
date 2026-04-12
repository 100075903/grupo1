import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { haversineKm, parseCoord } from "../utils/geo.js";

export async function compararPrecios({ q, lat, lng, radio_km }) {
  const term = (q || "").trim();
  const userLat = parseCoord(lat);
  const userLng = parseCoord(lng);
  const radio = Math.min(Math.max(Number(radio_km) || 10, 1), 200);

  if (userLat === null || userLng === null) {
    throw new AppError(400, "lat y lng son obligatorios");
  }

  const productos = term
    ? await prisma.producto.findMany({ take: 200, orderBy: { nombre: "asc" } })
    : await prisma.producto.findMany({ take: 50, orderBy: { createdAt: "desc" } });

  const lower = term.toLowerCase();
  const filtroProd = term
    ? productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(lower) ||
          (p.marca && p.marca.toLowerCase().includes(lower))
      )
    : productos;

  const ids = new Set(filtroProd.map((p) => p.id));
  if (ids.size === 0) return [];

  const reportes = await prisma.precioReporte.findMany({
    where: { productoId: { in: [...ids] } },
    include: {
      producto: true,
      tienda: true,
    },
    orderBy: { precio: "asc" },
    take: 500,
  });

  const out = [];
  for (const r of reportes) {
    const km = haversineKm(userLat, userLng, r.tienda.lat, r.tienda.lng);
    if (km <= radio) {
      out.push({
        ...r,
        distancia_km: Math.round(km * 100) / 100,
      });
    }
  }
  return out;
}

export async function reportarPrecio(userId, body) {
  const { productoId, tiendaId, precio, lat, lng } = body;
  if (!productoId || !tiendaId || precio === undefined || precio === null) {
    throw new AppError(400, "productoId, tiendaId y precio son obligatorios");
  }
  const p = Number(precio);
  if (!Number.isFinite(p) || p < 0) {
    throw new AppError(400, "precio inválido");
  }

  const [prod, tienda] = await Promise.all([
    prisma.producto.findUnique({ where: { id: productoId } }),
    prisma.tienda.findUnique({ where: { id: tiendaId } }),
  ]);
  if (!prod) throw new AppError(404, "Producto no encontrado");
  if (!tienda) throw new AppError(404, "Tienda no encontrada");

  return prisma.precioReporte.create({
    data: {
      productoId,
      tiendaId,
      precio: p,
      userId: userId ?? null,
      lat: lat != null ? parseCoord(lat) : null,
      lng: lng != null ? parseCoord(lng) : null,
    },
    include: { producto: true, tienda: true },
  });
}
