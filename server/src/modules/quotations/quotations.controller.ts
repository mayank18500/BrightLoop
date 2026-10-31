import { Response, NextFunction } from "express";
import { quotationsService } from "./quotations.service";
import { AuthenticatedRequest } from "../auth/auth.types";
import { QuotationStatus } from "@prisma/client";

export class QuotationsController {
  async listQuotations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as QuotationStatus | undefined;
      const customerId = req.query.customerId as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await quotationsService.listQuotations(
        { page, limit, status, customerId, search },
        req.user!
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.getQuotationById(req.params.id as string, req.user!);
      res.status(200).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async createQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.createQuotation(req.body, req.user?.id);
      res.status(201).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async updateQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.updateQuotation(
        req.params.id as string,
        req.body,
        req.user!
      );
      res.status(200).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async sendQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.sendQuotation(req.params.id as string, req.user!);
      res.status(200).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async confirmQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.confirmQuotation(req.params.id as string, req.user!);
      res.status(200).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async cancelQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.cancelQuotation(req.params.id as string, req.user!);
      res.status(200).json({ success: true, data: { quotation } });
    } catch (error) {
      next(error);
    }
  }

  async convertToSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await quotationsService.convertToSubscription(
        req.params.id as string,
        req.body,
        req.user!
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // Templates
  async listTemplates(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templates = await quotationsService.listTemplates();
      res.status(200).json({ success: true, data: { templates } });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await quotationsService.createTemplate(req.body);
      res.status(201).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  async getTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await quotationsService.getTemplateById(req.params.id as string);
      res.status(200).json({ success: true, data: { template } });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await quotationsService.deleteTemplate(req.params.id as string);
      res.status(200).json({ success: true, data: { result } });
    } catch (error) {
      next(error);
    }
  }
}

export const quotationsController = new QuotationsController();
