import { Request, Response } from "express";
import { ReportsService } from "./reports.service";

const reportsService = new ReportsService();

export class ReportsController {
  public async getFinancialAnalytics(_req: Request, res: Response) {
    const analytics = await reportsService.getFinancialAnalytics();
    res.status(200).json({
      status: "success",
      data: analytics,
    });
  }
}
