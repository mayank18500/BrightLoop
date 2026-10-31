import { Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.types";
import { InvoicesService } from "./invoices.service";

const invoicesService = new InvoicesService();

export class InvoicesController {
  public async createInvoice(req: AuthenticatedRequest, res: Response) {
    const invoice = await invoicesService.createInvoice(req.body, req.user!);
    res.status(201).json({
      status: "success",
      message: "Invoice created successfully",
      data: invoice,
    });
  }

  public async getInvoices(req: AuthenticatedRequest, res: Response) {
    const result = await invoicesService.getInvoices(req.query as any, req.user!);
    res.status(200).json({
      status: "success",
      ...result,
    });
  }

  public async getInvoiceMetrics(req: AuthenticatedRequest, res: Response) {
    const metrics = await invoicesService.getInvoiceMetrics(req.user!);
    res.status(200).json({
      status: "success",
      data: metrics,
    });
  }

  public async getInvoiceById(req: AuthenticatedRequest, res: Response) {
    const invoice = await invoicesService.getInvoiceById(req.params.id as string, req.user!);
    res.status(200).json({
      status: "success",
      data: invoice,
    });
  }

  public async confirmInvoice(req: AuthenticatedRequest, res: Response) {
    const invoice = await invoicesService.confirmInvoice(req.params.id as string, req.user!);
    res.status(200).json({
      status: "success",
      message: "Invoice confirmed successfully",
      data: invoice,
    });
  }

  public async cancelInvoice(req: AuthenticatedRequest, res: Response) {
    const invoice = await invoicesService.cancelInvoice(req.params.id as string, req.body?.notes);
    res.status(200).json({
      status: "success",
      message: "Invoice cancelled successfully",
      data: invoice,
    });
  }

  public async runRecurringBilling(req: AuthenticatedRequest, res: Response) {
    const results = await invoicesService.runRecurringBilling(req.body, req.user!);
    res.status(200).json({
      status: "success",
      message: `Recurring billing executed. Generated ${results.createdInvoices.length} invoices.`,
      data: results,
    });
  }
}
