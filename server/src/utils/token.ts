import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env";
import { JwtPayload } from "../modules/auth/auth.types";

export const AUTH_COOKIE_NAME = "brightloop_token";

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const signPasswordResetToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email, purpose: "password_reset" }, env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const verifyPasswordResetToken = (
  token: string
): { userId: string; email: string; purpose: string } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as {
    userId: string;
    email: string;
    purpose: string;
  };
  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid reset token purpose");
  }
  return decoded;
};

export const getCookieOptions = () => {
  const isProduction = env.NODE_ENV === "production";
  const rawSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
  const sameSite: "none" | "lax" | "strict" =
    rawSameSite === "lax" || rawSameSite === "strict" || rawSameSite === "none"
      ? rawSameSite
      : isProduction
        ? "none"
        : "lax";

  const secure = isProduction || sameSite === "none";

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  };
};

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.cookie(AUTH_COOKIE_NAME, "", {
    ...getCookieOptions(),
    expires: new Date(0),
  });
};
