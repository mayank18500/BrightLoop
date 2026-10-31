import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";

export class UsersController {
  async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staff = await usersService.createStaffAccount(req.body);
      res.status(201).json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }

  async listStaff(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const staffList = await usersService.listStaffMembers();
      res.status(200).json({
        success: true,
        data: { staff: staffList },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await usersService.updateUserStatus(id, req.body.isActive);
      res.status(200).json({
        success: true,
        data: { user: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
