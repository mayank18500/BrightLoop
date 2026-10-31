import { Request, Response, NextFunction } from "express";
import { customersService } from "./customers.service";
import { AuthenticatedUser } from "../../middleware/auth.middleware";

export class CustomersController {
  async listCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === "string" ? req.query.search : undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await customersService.listCustomers({ search, page, limit });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const currentUser = (req as any).user as AuthenticatedUser;
      const customer = await customersService.getCustomerById(id, currentUser);
      res.status(200).json({
        success: true,
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customersService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        message: "Customer created successfully.",
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customersController = new CustomersController();
