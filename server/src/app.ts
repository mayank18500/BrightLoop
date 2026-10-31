import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";

const app: Application = express();

// Security and utility middleware
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get("/api/v1/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "brightloop-server",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.NODE_ENV,
  });
});

// API v1 Module Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
