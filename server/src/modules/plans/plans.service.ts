import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { CreatePlanInput, UpdatePlanInput } from "./plans.validation";

export class PlansService {
  /**
   * List all subscription plans with optional filtering.
   */
  async listPlans(params?: { isActive?: boolean; frequency?: string }) {
    const where: Prisma.PlanWhereInput = {};

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.frequency) {
      where.billingFrequency = params.frequency as Prisma.EnumBillingFrequencyFilter["equals"];
    }

    return prisma.plan.findMany({
      where,
      orderBy: { price: "asc" },
    });
  }

  /**
   * Get plan details by ID.
   */
  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new AppError("Subscription plan not found.", 404);
    }

    return plan;
  }

  /**
   * Admin-only: create a new subscription plan.
   */
  async createPlan(input: CreatePlanInput) {
    const { price, startDate, endDate, ...rest } = input;

    return prisma.plan.create({
      data: {
        ...rest,
        price: new Prisma.Decimal(price),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  /**
   * Admin-only: update an existing subscription plan.
   */
  async updatePlan(id: string, input: UpdatePlanInput) {
    await this.getPlanById(id);

    const data: Prisma.PlanUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price && { price: new Prisma.Decimal(input.price) }),
      ...(input.billingFrequency && { billingFrequency: input.billingFrequency }),
      ...(input.billingInterval && { billingInterval: input.billingInterval }),
      ...(input.minQuantity && { minQuantity: input.minQuantity }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null,
      }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.autoCloseOnExpiry !== undefined && { autoCloseOnExpiry: input.autoCloseOnExpiry }),
      ...(input.allowEarlyClosure !== undefined && { allowEarlyClosure: input.allowEarlyClosure }),
      ...(input.allowPause !== undefined && { allowPause: input.allowPause }),
      ...(input.allowRenewal !== undefined && { allowRenewal: input.allowRenewal }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };

    return prisma.plan.update({
      where: { id },
      data,
    });
  }

  /**
   * Admin-only: delete or deactivate plan.
   */
  async deletePlan(id: string) {
    await this.getPlanById(id);

    const hasSubscriptions = await prisma.subscription.findFirst({
      where: { planId: id },
    });

    if (hasSubscriptions) {
      return prisma.plan.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.plan.delete({
      where: { id },
    });
  }
}

export const plansService = new PlansService();
