import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(payload) {
  return jwt.sign(
    { email: payload.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN, subject: payload.sub }
  );
}

export function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") throw new Error("Token inválido");
  return {
    sub: decoded.sub ?? "",
    email: typeof decoded.email === "string" ? decoded.email : "",
  };
}
