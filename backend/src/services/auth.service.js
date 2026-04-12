import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { signAccessToken } from "../utils/tokens.js";

const SALT_ROUNDS = 12;

export async function register(data) {
  const email = data.email.trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "El correo ya está registrado");

  if (data.password.length < 8) {
    throw new AppError(400, "La contraseña debe tener al menos 8 caracteres");
  }

  const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, passwordHash, nombre: data.nombre.trim() },
    select: { id: true, email: true, nombre: true },
  });
  const token = signAccessToken({ sub: user.id, email: user.email });
  return { user, token };
}

export async function login(data) {
  const email = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "Credenciales inválidas");

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) throw new AppError(401, "Credenciales inválidas");

  const token = signAccessToken({ sub: user.id, email: user.email });
  return {
    user: { id: user.id, email: user.email, nombre: user.nombre },
    token,
  };
}
