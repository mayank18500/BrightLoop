import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { signToken, signPasswordResetToken, verifyPasswordResetToken } from "../../utils/token";
import { RegisterInput, LoginInput, ResetPasswordInput } from "./auth.validation";

export class AuthService {
  /**
   * Register a new commercial customer and corresponding portal user.
   * Public registration is restricted to CUSTOMER role.
   */
  async registerCustomer(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError("An account with this email address already exists.", 409);
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingCustomer) {
      throw new AppError("A customer profile with this email address already exists.", 409);
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash,
          role: Role.CUSTOMER,
          isActive: true,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          companyName: input.companyName,
          contactName: input.name,
          email: input.email.toLowerCase(),
          phone: input.phone,
          billingAddress: input.billingAddress,
          taxId: input.taxId,
          isActive: true,
        },
      });

      return { user, customer };
    });

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
      customerId: result.customer.id,
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        customerId: result.customer.id,
      },
      customer: result.customer,
      token,
    };
  }

  /**
   * Authenticate any active system user (ADMIN, STAFF, CUSTOMER).
   */
  async loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        customer: true,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been deactivated. Please contact support.", 403);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password.", 401);
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customer?.id ?? null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customer?.id ?? null,
      },
      customer: user.customer,
      token,
    };
  }

  /**
   * Retrieve current user profile and linked customer data.
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        customer: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive.", 404);
    }

    return user;
  }

  /**
   * Generate password reset token.
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Timing-attack mitigation: do not reveal whether user exists
    if (!user || !user.isActive) {
      return {
        message: "If that email address is registered, a password reset link has been dispatched.",
      };
    }

    const resetToken = signPasswordResetToken(user.id, user.email);

    return {
      message: "If that email address is registered, a password reset link has been dispatched.",
      resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    };
  }

  /**
   * Validate token and reset user password.
   */
  async resetPassword(input: ResetPasswordInput) {
    let payload;
    try {
      payload = verifyPasswordResetToken(input.token);
    } catch {
      throw new AppError("Invalid or expired password reset token.", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError("User account not found or has been deactivated.", 404);
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.newPassword, saltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return {
      message: "Password has been updated successfully. You may now log in with your new password.",
    };
  }
}

export const authService = new AuthService();
