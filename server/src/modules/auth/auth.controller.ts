import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { setAuthCookie, clearAuthCookie } from "../../utils/token";
import { AuthenticatedRequest } from "./auth.types";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerCustomer(req.body);
      setAuthCookie(res, result.token);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          customer: result.customer,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.loginUser(req.body);
      setAuthCookie(res, result.token);

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
          customer: result.customer,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearAuthCookie(res);
      res.status(200).json({
        success: true,
        data: {
          message: "Logged out successfully",
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: "Unauthorized" } });
        return;
      }
      const user = await authService.getCurrentUser(req.user.id);
      res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
