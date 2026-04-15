import { PrismaClient } from "@prisma/client";

// In development, Node's module cache is busted on every file change (--watch).
// Storing the instance on globalThis ensures we reuse a single PrismaClient
// instead of opening a new database connection pool on each hot reload.
const globalForPrisma = globalThis;

/** @type {PrismaClient | undefined} */
let prismaInstance = globalForPrisma.prisma;

export const prisma =
  prismaInstance ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
