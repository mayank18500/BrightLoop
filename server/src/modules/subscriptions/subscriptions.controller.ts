import { Request, Response, NextFunction } from "express";
import { subscriptionsService } from "./subscriptions.service";
import { AuthenticatedUser } from "../../middleware/auth.middleware";
import { SubscriptionStatus } from "@prisma/client";

export class SubscriptionsController {
  async listSubscriptions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as SubscriptionStatus | undefined;
      const customerId = typeof req.query.customerId === "string" ? req.query.customerId : undefined;
      const search = typeof req.query.search === "string" ? req.query.search : undefined;

      const currentUser = (req as any).user as AuthenticatedUser;
      const result = await subscriptionsService.listSubscriptions(
        { page, limit, status, customerId, search },
        currentUser
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const subscription = await subscriptionsService.getSubscriptionById(id, currentUser);

      res.status(200).json({
        success: true,
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const subscription = await subscriptionsService.createSubscription(req.body);
      res.status(201).json({
        success: true,
        message: "Subscription created successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const subscription = await subscriptionsService.updateSubscription(id, req.body, currentUser);

      res.status(200).json({
        success: true,
        message: "Subscription updated successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async pauseSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const reason = req.body?.reason;
      const subscription = await subscriptionsService.pauseSubscription(id, currentUser, reason);

      res.status(200).json({
        success: true,
        message: "Subscription paused successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async resumeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const subscription = await subscriptionsService.resumeSubscription(id, currentUser);

      res.status(200).json({
        success: true,
        message: "Subscription resumed successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async closeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const { reason } = req.body;
      const subscription = await subscriptionsService.closeSubscription(id, currentUser, reason);

      res.status(200).json({
        success: true,
        message: "Subscription closed successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }

  async renewSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const extensionIntervals = req.body?.extensionIntervals || 1;
      const subscription = await subscriptionsService.renewSubscription(
        id,
        currentUser,
        extensionIntervals
      );

      res.status(200).json({
        success: true,
        message: "Subscription renewed successfully.",
        data: { subscription },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
