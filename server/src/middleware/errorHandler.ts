import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        stack: err.stack,
      },
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 ? "Internal Server Error" : message,
    },
  });
};
