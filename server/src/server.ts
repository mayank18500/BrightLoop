import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`🚀 BrightLoop Server is running on port ${env.PORT} [${env.NODE_ENV}]`);
  console.log(`📡 Health-check available at: http://localhost:${env.PORT}/api/v1/health`);
});

// Guard against concurrent or duplicate shutdown invocations
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log(`⚠️ Shutdown already in progress. Ignoring duplicate signal: ${signal}`);
    return;
  }
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Ensure process terminates even if pending requests hang
  const shutdownTimeout = setTimeout(() => {
    console.error("⏱️ Graceful shutdown timed out after 10s. Forcing exit.");
    process.exit(1);
  }, 10000);
  shutdownTimeout.unref();

  // 1. Stop accepting new incoming requests
  server.close(async (closeErr) => {
    if (closeErr) {
      console.error("❌ Error while closing HTTP server:", closeErr);
    } else {
      console.log("🔒 HTTP server closed. No longer accepting connections.");
    }

    // 2. Disconnect Prisma database client
    try {
      await prisma.$disconnect();
      console.log("🔌 Prisma disconnected cleanly from database.");
      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (dbErr) {
      console.error("❌ Error during Prisma disconnection:", dbErr);
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
