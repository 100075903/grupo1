import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { generarCodigoInvitacion } from "../utils/inviteCode.js";

export async function crearFamilia(userId, nombre) {
  let codigo = generarCodigoInvitacion();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.familia.findUnique({
      where: { codigoInvitacion: codigo },
    });
    if (!clash) break;
    codigo = generarCodigoInvitacion();
  }

  const familia = await prisma.familia.create({
    data: {
      nombre: nombre.trim(),
      codigoInvitacion: codigo,
      createdById: userId,
      miembros: { create: { userId, rol: "ADMIN" } },
      listas: { create: { nombre: "Lista principal" } },
    },
    select: {
      id: true,
      nombre: true,
      codigoInvitacion: true,
      createdAt: true,
    },
  });
  return familia;
}

export async function unirseFamilia(userId, codigo) {
  const normalized = codigo.trim().toUpperCase();
  const familia = await prisma.familia.findUnique({
    where: { codigoInvitacion: normalized },
  });
  if (!familia) throw new AppError(404, "Código de invitación no válido");

  const ya = await prisma.familiaMiembro.findUnique({
    where: { familiaId_userId: { familiaId: familia.id, userId } },
  });
  if (ya) throw new AppError(409, "Ya eres miembro de esta familia");

  await prisma.familiaMiembro.create({
    data: { familiaId: familia.id, userId, rol: "MIEMBRO" },
  });

  return prisma.familia.findUnique({
    where: { id: familia.id },
    select: { id: true, nombre: true, codigoInvitacion: true, createdAt: true },
  });
}

export async function miembrosFamilia(familiaId) {
  const rows = await prisma.familiaMiembro.findMany({
    where: { familiaId },
    include: {
      user: { select: { id: true, email: true, nombre: true, createdAt: true } },
    },
    orderBy: { joinedAt: "asc" },
  });
  return rows.map((r) => ({
    userId: r.userId,
    rol: r.rol,
    joinedAt: r.joinedAt,
    user: r.user,
  }));
}
