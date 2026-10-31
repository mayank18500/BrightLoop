import { Request, Response, NextFunction } from "express";
import { taxesService } from "./taxes.service";

export class TaxesController {
  async listTaxRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
      const taxes = await taxesService.listTaxRules({ isActive });
      res.status(200).json({ success: true, data: { taxes } });
    } catch (error) {
      next(error);
    }
  }

  async getTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taxRule = await taxesService.getTaxRuleById(req.params.id as string);
      res.status(200).json({ success: true, data: { taxRule } });
    } catch (error) {
      next(error);
    }
  }

  async createTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taxRule = await taxesService.createTaxRule(req.body);
      res.status(201).json({ success: true, data: { taxRule } });
    } catch (error) {
      next(error);
    }
  }

  async updateTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taxRule = await taxesService.updateTaxRule(req.params.id as string, req.body);
      res.status(200).json({ success: true, data: { taxRule } });
    } catch (error) {
      next(error);
    }
  }

  async deleteTaxRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await taxesService.deleteTaxRule(req.params.id as string);
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }
}

export const taxesController = new TaxesController();
