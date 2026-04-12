import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/** @type {PrismaClient | undefined} */
let prismaInstance = globalForPrisma.prisma;

export const prisma =
  prismaInstance ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
