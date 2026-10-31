import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 BrightLoop Server is running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Health-check available at: http://localhost:${env.PORT}/api/v1/health`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("❌ Error during Prisma disconnection:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
