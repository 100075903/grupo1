import * as notificacionService from "../services/notificacion.service.js";

export async function listar(req, res) {
  const rows = await notificacionService.listarNotificaciones(req.params.usuario_id);
  res.json(rows);
}

export async function marcarLeidas(req, res) {
  const data = await notificacionService.marcarNotificacionesLeidas(
    req.params.usuario_id,
    req.body?.ids
  );
  res.json(data);
}
