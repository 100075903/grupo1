import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listasPorFamilia(familiaId) {
  return prisma.listaCompra.findMany({
    where: { familiaId },
    include: {
      productos: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function agregarProductoLista(listaId, data) {
  const lista = await prisma.listaCompra.findUnique({ where: { id: listaId } });
  if (!lista) throw new AppError(404, "Lista no encontrada");

  return prisma.productoLista.create({
    data: {
      listaId,
      nombre: data.nombre.trim(),
      cantidad: data.cantidad ?? 1,
      notas: data.notas?.trim() || null,
      barcode: data.barcode?.trim() || null,
    },
  });
}

export async function actualizarProductoLista(listaId, productoId, data) {
  const p = await prisma.productoLista.findFirst({
    where: { id: productoId, listaId },
  });
  if (!p) throw new AppError(404, "Producto no encontrado en esta lista");

  // Only include fields that were explicitly sent in the request.
  // `undefined` means the client didn't send that field — omitting it
  // prevents accidentally overwriting existing values with undefined/null.
  return prisma.productoLista.update({
    where: { id: productoId },
    data: {
      ...(data.nombre !== undefined && { nombre: data.nombre.trim() }),
      ...(data.cantidad !== undefined && { cantidad: data.cantidad }),
      ...(data.notas !== undefined && { notas: data.notas }),
      ...(data.completado !== undefined && { completado: data.completado }),
    },
  });
}

export async function eliminarProductoLista(listaId, productoId) {
  const p = await prisma.productoLista.findFirst({
    where: { id: productoId, listaId },
  });
  if (!p) throw new AppError(404, "Producto no encontrado en esta lista");

  await prisma.productoLista.delete({ where: { id: productoId } });
}
