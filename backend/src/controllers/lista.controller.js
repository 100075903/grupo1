import * as listaService from "../services/lista.service.js";
import * as listaBus from "../lib/listaBus.js";
import { verifyAccessToken } from "../utils/tokens.js";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";

export async function porFamilia(req, res) {
  const listas = await listaService.listasPorFamilia(req.params.familia_id);
  res.json(listas);
}

export async function agregarProducto(req, res) {
  const row = await listaService.agregarProductoLista(req.params.lista_id, req.body);
  listaBus.publish(req.params.lista_id, "producto_agregado", row);
  res.status(201).json(row);
}

export async function actualizarProducto(req, res) {
  const row = await listaService.actualizarProductoLista(
    req.params.lista_id,
    req.params.id,
    req.body
  );
  listaBus.publish(req.params.lista_id, "producto_actualizado", row);
  res.json(row);
}

export async function eliminarProducto(req, res) {
  await listaService.eliminarProductoLista(req.params.lista_id, req.params.id);
  listaBus.publish(req.params.lista_id, "producto_eliminado", { id: req.params.id });
  res.status(204).send();
}

// SSE endpoint — token is passed as ?token= because EventSource cannot set headers
export async function eventos(req, res) {
  const token = req.query.token;
  if (!token) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  let userId;
  try {
    const payload = verifyAccessToken(token);
    userId = payload.sub;
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }

  const listaId = req.params.lista_id;
  const lista = await prisma.listaCompra.findUnique({ where: { id: listaId } });
  if (!lista) {
    res.status(404).json({ error: "Lista no encontrada" });
    return;
  }

  const member = await prisma.familiaMiembro.findUnique({
    where: { familiaId_userId: { familiaId: lista.familiaId, userId } },
  });
  if (!member) {
    res.status(403).json({ error: "No perteneces a la familia de esta lista" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Keep-alive ping every 25 s to prevent proxy timeouts
  const ping = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { clearInterval(ping); }
  }, 25_000);

  listaBus.subscribe(listaId, res);

  req.on("close", () => {
    clearInterval(ping);
    listaBus.unsubscribe(listaId, res);
  });
}
