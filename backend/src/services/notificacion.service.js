import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listarNotificaciones(userId) {
  return prisma.notificacion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function marcarNotificacionesLeidas(userId, ids) {
  if (Array.isArray(ids) && ids.length > 0) {
    await prisma.notificacion.updateMany({
      where: { userId, id: { in: ids } },
      data: { leida: true },
    });
    return { actualizadas: ids.length };
  }

  const r = await prisma.notificacion.updateMany({
    where: { userId, leida: false },
    data: { leida: true },
  });
  return { actualizadas: r.count };
}

export async function crearNotificacionEjemplo(userId, titulo, mensaje) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) throw new AppError(404, "Usuario no encontrado");
  return prisma.notificacion.create({
    data: {
      userId,
      titulo: titulo.slice(0, 200),
      mensaje: mensaje.slice(0, 2000),
    },
  });
}
