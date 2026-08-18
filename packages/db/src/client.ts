import { PrismaClient } from "@prisma/client";

declare global {
  var __reciclotronPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });
}

export const prisma = globalThis.__reciclotronPrisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__reciclotronPrisma__ = prisma;
}
