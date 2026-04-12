import { AppError } from "./errorHandler.js";

export function requireSelfUsuario(req, _res, next) {
  if (req.params.usuario_id !== req.userId) {
    next(new AppError(403, "No puedes acceder a notificaciones de otro usuario"));
    return;
  }
  next();
}
