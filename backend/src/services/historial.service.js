import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listarHistorial(familiaId, limit, offset) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const off = Math.max(Number(offset) || 0, 0);

  const [items, total] = await Promise.all([
    prisma.historialItem.findMany({
      where: { familiaId },
      orderBy: { createdAt: "desc" },
      take: lim,
      skip: off,
    }),
    prisma.historialItem.count({ where: { familiaId } }),
  ]);

  return { items, total, limit: lim, offset: off };
}

export async function productosFrecuentes(familiaId) {
  const rows = await prisma.historialItem.findMany({
    where: { familiaId },
    select: { productoNombre: true, cantidad: true },
  });

  const map = new Map();
  for (const r of rows) {
    const key = r.productoNombre.trim().toLowerCase();
    const prev = map.get(key) || { productoNombre: r.productoNombre, veces: 0, cantidadTotal: 0 };
    prev.veces += 1;
    prev.cantidadTotal += r.cantidad;
    map.set(key, prev);
  }

  return [...map.values()]
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 30);
}

export async function guardarHistorial(familiaId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(400, "items debe ser un arreglo no vacío");
  }
  const data = items.map((it) => {
    const nombre = (it.productoNombre || "").trim();
    if (!nombre) throw new AppError(400, "Cada ítem debe tener productoNombre");
    const cantidad = Number(it.cantidad);
    return {
      familiaId,
      productoNombre: nombre.slice(0, 500),
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
      metadata:
        it.metadata != null ? String(it.metadata).slice(0, 2000) : null,
    };
  });

  await prisma.historialItem.createMany({ data });
  return { guardados: data.length };
}
