import { Request } from "express";
import { Role } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  customerId?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
