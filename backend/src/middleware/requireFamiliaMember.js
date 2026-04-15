import { prisma } from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";

// Factory — returns middleware so callers can specify which route param holds
// the familia ID (defaults to "familia_id"). Sets req.familiaRol for downstream use.
export function requireFamiliaMember(paramName = "familia_id") {
  return async (req, _res, next) => {
    const userId = req.userId;
    if (!userId) {
      next(new AppError(401, "No autenticado"));
      return;
    }
    const familiaId = req.params[paramName];
    if (!familiaId) {
      next(new AppError(400, "familia_id requerido"));
      return;
    }
    const m = await prisma.familiaMiembro.findUnique({
      where: { familiaId_userId: { familiaId, userId } },
    });
    if (!m) {
      next(new AppError(403, "No perteneces a esta familia"));
      return;
    }
    req.familiaRol = m.rol;
    next();
  };
}

export async function requireListaFamiliaMember(req, _res, next) {
  const userId = req.userId;
  if (!userId) {
    next(new AppError(401, "No autenticado"));
    return;
  }
  const listaId = req.params.lista_id;
  if (!listaId) {
    next(new AppError(400, "lista_id requerido"));
    return;
  }
  const lista = await prisma.listaCompra.findUnique({
    where: { id: listaId },
  });
  if (!lista) {
    next(new AppError(404, "Lista no encontrada"));
    return;
  }
  const m = await prisma.familiaMiembro.findUnique({
    where: { familiaId_userId: { familiaId: lista.familiaId, userId } },
  });
  if (!m) {
    next(new AppError(403, "No perteneces a la familia de esta lista"));
    return;
  }
  req.familiaRol = m.rol;
  req.listaFamiliaId = lista.familiaId;
  next();
}
