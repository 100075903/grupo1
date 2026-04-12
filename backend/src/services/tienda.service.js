import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { haversineKm, parseCoord } from "../utils/geo.js";

export async function listarTiendas({ lat, lng, radio_km, tipo, solo_abiertos }) {
  const userLat = parseCoord(lat);
  const userLng = parseCoord(lng);
  if (userLat === null || userLng === null) {
    throw new AppError(400, "lat y lng son obligatorios");
  }
  const radio = Math.min(Math.max(Number(radio_km) || 10, 1), 200);
  const tipoF = (tipo || "").trim().toLowerCase();
  const soloAb = solo_abiertos === "true" || solo_abiertos === "1" || solo_abiertos === true;

  const tiendas = await prisma.tienda.findMany({
    where: soloAb ? { abiertoAhora: true } : undefined,
    take: 400,
  });

  let rows = tiendas.map((t) => ({
    ...t,
    distancia_km: haversineKm(userLat, userLng, t.lat, t.lng),
  }));

  rows = rows.filter((t) => t.distancia_km <= radio);
  if (tipoF) {
    rows = rows.filter((t) => (t.tipo || "").toLowerCase().includes(tipoF));
  }
  rows.sort((a, b) => a.distancia_km - b.distancia_km);
  return rows.map((t) => ({
    ...t,
    distancia_km: Math.round(t.distancia_km * 100) / 100,
  }));
}

export async function crearResena(userId, tiendaId, { rating, comentario }) {
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    throw new AppError(400, "rating debe ser entero entre 1 y 5");
  }

  const tienda = await prisma.tienda.findUnique({ where: { id: tiendaId } });
  if (!tienda) throw new AppError(404, "Tienda no encontrada");

  try {
    return await prisma.resenaTienda.create({
      data: {
        tiendaId,
        userId,
        rating: r,
        comentario: comentario?.trim() || null,
      },
    });
  } catch (e) {
    if (e?.code === "P2002") {
      throw new AppError(409, "Ya dejaste una reseña en esta tienda");
    }
    throw e;
  }
}
