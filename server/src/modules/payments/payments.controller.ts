import { Response } from "express";
import { AuthenticatedRequest } from "../auth/auth.types";
import { PaymentsService } from "./payments.service";

const paymentsService = new PaymentsService();

export class PaymentsController {
  public async recordPayment(req: AuthenticatedRequest, res: Response) {
    const payment = await paymentsService.recordPayment(req.body, req.user!);
    res.status(201).json({
      status: "success",
      message: "Payment recorded successfully",
      data: payment,
    });
  }

  public async allocatePayment(req: AuthenticatedRequest, res: Response) {
    const payment = await paymentsService.allocatePayment(
      req.params.id as string,
      req.body,
      req.user!
    );
    res.status(200).json({
      status: "success",
      message: "Payment funds allocated successfully",
      data: payment,
    });
  }

  public async getPayments(req: AuthenticatedRequest, res: Response) {
    const result = await paymentsService.getPayments(req.query as any, req.user!);
    res.status(200).json({
      status: "success",
      ...result,
    });
  }

  public async getPaymentMetrics(req: AuthenticatedRequest, res: Response) {
    const metrics = await paymentsService.getPaymentMetrics(req.user!);
    res.status(200).json({
      status: "success",
      data: metrics,
    });
  }

  public async getPaymentById(req: AuthenticatedRequest, res: Response) {
    const payment = await paymentsService.getPaymentById(req.params.id as string, req.user!);
    res.status(200).json({
      status: "success",
      data: payment,
    });
  }
}
