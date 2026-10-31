import { Request, Response, NextFunction } from "express";
import { discountsService } from "./discounts.service";

export class DiscountsController {
  async listDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const discounts = await discountsService.listDiscounts({ isActive });
      res.status(200).json({ success: true, data: { discounts } });
    } catch (error) {
      next(error);
    }
  }

  async getDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await discountsService.getDiscountById(req.params.id as string);
      res.status(200).json({ success: true, data: { discount } });
    } catch (error) {
      next(error);
    }
  }

  async createDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await discountsService.createDiscount(req.body);
      res.status(201).json({ success: true, data: { discount } });
    } catch (error) {
      next(error);
    }
  }

  async updateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await discountsService.updateDiscount(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { discount } });
    } catch (error) {
      next(error);
    }
  }

  async deleteDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discountsService.deleteDiscount(req.params.id as string);
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }

  async validateDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await discountsService.evaluateEligibility(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const discountsController = new DiscountsController();
