import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  var prismaInstance: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaInstance ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.prismaInstance = prisma;
}
