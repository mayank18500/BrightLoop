import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { CreateStaffInput } from "./users.validation";

export class UsersService {
  /**
   * Admin-only: create a new staff account.
   */
  async createStaffAccount(input: CreateStaffInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError("An account with this email address already exists.", 409);
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const staffUser = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash,
        role: Role.STAFF,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return staffUser;
  }

  /**
   * Admin-only: list all staff members.
   */
  async listStaffMembers() {
    return prisma.user.findMany({
      where: { role: Role.STAFF },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Admin-only: update user active/inactive status.
   */
  async updateUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (user.role === Role.ADMIN && !isActive) {
      throw new AppError("Cannot deactivate the primary administrator account.", 400);
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}

export const usersService = new UsersService();
