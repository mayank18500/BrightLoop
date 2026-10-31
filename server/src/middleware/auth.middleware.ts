import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE_NAME, verifyToken } from "../utils/token";
import { AppError } from "./errorHandler";
import { AuthenticatedRequest } from "../modules/auth/auth.types";

export const authenticateUser = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new AppError("Authentication required. Please log in.", 401);
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { customer: { select: { id: true } } },
    });

    if (!user || !user.isActive) {
      throw new AppError("User account not found or has been deactivated.", 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id ?? null,
    };

    next();
  } catch (err: unknown) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError("Invalid or expired session. Please log in again.", 401));
  }
};

export const authorizeRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Access forbidden: Role '${req.user.role}' lacks permission for this action.`,
          403
        )
      );
      return;
    }

    next();
  };
};

export const requireCustomerOwnership = (paramKey = "customerId") => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    // Admins and Staff have internal access across customers
    if (req.user.role === Role.ADMIN || req.user.role === Role.STAFF) {
      next();
      return;
    }

    // Customer role: target ID must strictly match their own customer profile ID
    const targetCustomerId = req.params[paramKey] || req.body[paramKey] || req.query[paramKey];

    if (!targetCustomerId || targetCustomerId !== req.user.customerId) {
      next(new AppError("Access denied: You can only access your own customer records.", 403));
      return;
    }

    next();
  };
};
