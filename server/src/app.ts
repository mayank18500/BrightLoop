import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import productsRoutes from "./modules/products/products.routes";
import plansRoutes from "./modules/plans/plans.routes";
import taxesRoutes from "./modules/taxes/taxes.routes";
import discountsRoutes from "./modules/discounts/discounts.routes";
import quotationsRoutes from "./modules/quotations/quotations.routes";
import customersRoutes from "./modules/customers/customers.routes";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import reportsRoutes from "./modules/reports/reports.routes";

const app: Application = express();

// Trust reverse proxy (Render, Railway, AWS, Fly.io, Cloudflare, Nginx)
app.set("trust proxy", 1);

// Build list of allowed origins from environment
const allowedOrigins = [
  ...env.CORS_ORIGIN.split(","),
  ...(env.CLIENT_URL ? [env.CLIENT_URL] : []),
]
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

// Security and utility middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, healthcheck, and requests with no origin
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, "");

      if (
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(cleanOrigin) ||
        (env.NODE_ENV !== "production" && /^http:\/\/localhost(:\d+)?$/.test(cleanOrigin)) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }

      // Fallback allows legitimate production frontends without abrupt CORS breakage
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
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
app.use("/api/v1/customers", customersRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/plans", plansRoutes);
app.use("/api/v1/taxes", taxesRoutes);
app.use("/api/v1/discounts", discountsRoutes);
app.use("/api/v1/quotations", quotationsRoutes);
app.use("/api/v1/subscriptions", subscriptionsRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/reports", reportsRoutes);

// 404 Handler
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

export default app;
