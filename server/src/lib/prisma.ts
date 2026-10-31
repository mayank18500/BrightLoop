import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

/**
 * Global singleton pattern for PrismaClient.
 * In development, hot module reloading (tsx watch) can create multiple
 * client instances, exhausting database connections in Neon's connection pool.
 * We store the client on `globalThis` so it persists across reloads.
 */
declare global {
  var prismaInstance: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaInstance ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalThis.prismaInstance = prisma;
}
