import { PrismaClient } from "@prisma/client";
function createPrismaClient() {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });
}
export const prisma = globalThis.__reciclotronPrisma__ ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
    globalThis.__reciclotronPrisma__ = prisma;
}
//# sourceMappingURL=client.js.map