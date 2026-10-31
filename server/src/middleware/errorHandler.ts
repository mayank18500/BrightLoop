import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errors?: unknown;

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized Express Error Handling Middleware.
 * Must declare exactly four parameters (err, req, res, next) for Express to recognize it.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Delegate to default Express error handler if headers have already been sent to client
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown = undefined;

  // 1. Custom Operational Application Error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  }
  // 2. Zod Schema Validation Error
  else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Request validation failed";
    errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
  }
  // 3. Prisma Database Error Handling
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        statusCode = 409;
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(", ")
          : (err.meta?.target as string) || "field";
        message = `A resource with this ${target} already exists.`;
        break;
      }
      case "P2025": {
        statusCode = 404;
        message = (err.meta?.cause as string) || "Requested record was not found.";
        break;
      }
      case "P2003": {
        statusCode = 400;
        message = "Operation failed due to a related record constraint.";
        break;
      }
      default: {
        statusCode = 400;
        message = "Database operation constraint error.";
        break;
      }
    }
  }
  // 4. Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid query or schema parameter provided to database engine.";
  }
  else if (err instanceof Error) {
    const errorWithStatus = err as Error & { statusCode?: unknown };
    if (typeof errorWithStatus.statusCode === "number") {
      statusCode = errorWithStatus.statusCode;
    }
    message = statusCode === 500 && env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "An unexpected error occurred";
  }

  // Server-side logging for debugging & audit trails
  if (statusCode >= 500) {
    console.error(`\n🔥 [500 SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  } else if (env.NODE_ENV === "development") {
    console.warn(`⚠️ [${statusCode} CLIENT ERROR] ${req.method} ${req.originalUrl}: ${message}`);
  }

  // Consistent JSON response format conforming to:
  // { success: false, message: string, errors?: unknown }
  // with backward compatibility for { error: { message } }
  const responsePayload: Record<string, unknown> = {
    success: false,
    message,
    error: {
      message,
    },
  };

  if (errors !== undefined) {
    responsePayload.errors = errors;
  }

  if (env.NODE_ENV === "development" && err instanceof Error && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};
