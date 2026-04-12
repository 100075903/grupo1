import { AppError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Token requerido"));
    return;
  }
  const token = header.slice(7);
  try {
    const { sub, email } = verifyAccessToken(token);
    if (!sub) {
      next(new AppError(401, "Token inválido"));
      return;
    }
    req.userId = sub;
    req.userEmail = email;
    next();
  } catch {
    next(new AppError(401, "Token inválido o expirado"));
  }
}
