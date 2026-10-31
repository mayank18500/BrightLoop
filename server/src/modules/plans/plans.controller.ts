import { Request, Response, NextFunction } from "express";
import { plansService } from "./plans.service";

export class PlansController {
  async listPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const frequency = req.query.frequency as string | undefined;

      const plans = await plansService.listPlans({ isActive, frequency });
      res.status(200).json({ success: true, data: { plans } });
    } catch (error) {
      next(error);
    }
  }

  async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await plansService.getPlanById(req.params.id as string);
      res.status(200).json({ success: true, data: { plan } });
    } catch (error) {
      next(error);
    }
  }

  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await plansService.createPlan(req.body);
      res.status(201).json({ success: true, data: { plan } });
    } catch (error) {
      next(error);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await plansService.updatePlan(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { plan } });
    } catch (error) {
      next(error);
    }
  }

  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await plansService.deletePlan(req.params.id as string);
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }
}

export const plansController = new PlansController();
