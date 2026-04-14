import "dotenv/config";

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT) || 3000,
  DATABASE_URL: required("DATABASE_URL", "file:./dev.db"),
  JWT_SECRET: required("JWT_SECRET", "supersecret"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
};
