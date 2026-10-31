import { Prisma, DiscountType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { CreateDiscountInput, UpdateDiscountInput, ValidateDiscountInput } from "./discounts.validation";

export class DiscountsService {
  /**
   * List all discount rules.
   */
  async listDiscounts(params?: { isActive?: boolean }) {
    const where: Prisma.DiscountWhereInput = {};
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return prisma.discount.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get discount by ID.
   */
  async getDiscountById(id: string) {
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        _count: { select: { usages: true } },
      },
    });

    if (!discount) {
      throw new AppError("Discount rule not found.", 404);
    }

    return discount;
  }

  /**
   * Admin-only: create a new discount rule.
   */
  async createDiscount(input: CreateDiscountInput) {
    const existing = await prisma.discount.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw new AppError(`A discount with code '${input.code.toUpperCase()}' already exists.`, 409);
    }

    const { value, minPurchaseAmount, startDate, endDate, ...rest } = input;

    return prisma.discount.create({
      data: {
        ...rest,
        code: input.code.toUpperCase(),
        value: new Prisma.Decimal(value),
        minPurchaseAmount: minPurchaseAmount ? new Prisma.Decimal(minPurchaseAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  /**
   * Admin-only: update discount rule.
   */
  async updateDiscount(id: string, input: UpdateDiscountInput) {
    await this.getDiscountById(id);

    const data: Prisma.DiscountUpdateInput = {
      ...(input.name && { name: input.name }),
      ...(input.discountType && { discountType: input.discountType }),
      ...(input.value && { value: new Prisma.Decimal(input.value) }),
      ...(input.minPurchaseAmount !== undefined && {
        minPurchaseAmount: input.minPurchaseAmount ? new Prisma.Decimal(input.minPurchaseAmount) : null,
      }),
      ...(input.minQuantity !== undefined && { minQuantity: input.minQuantity }),
      ...(input.maxUsageCount !== undefined && { maxUsageCount: input.maxUsageCount }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null,
      }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    };

    return prisma.discount.update({
      where: { id },
      data,
    });
  }

  /**
   * Admin-only: deactivate discount rule.
   */
  async deleteDiscount(id: string) {
    await this.getDiscountById(id);

    return prisma.discount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Evaluate eligibility and compute exact discount deduction using Decimal arithmetic.
   */
  async evaluateEligibility(input: ValidateDiscountInput) {
    const code = input.code.toUpperCase();
    const subtotal = new Prisma.Decimal(input.subtotal);
    const quantity = input.quantity;

    const discount = await prisma.discount.findUnique({
      where: { code },
    });

    if (!discount || !discount.isActive) {
      throw new AppError("Invalid or inactive discount code.", 404);
    }

    const now = new Date();

    if (discount.startDate && now < discount.startDate) {
      throw new AppError("This discount code is not yet active.", 400);
    }

    if (discount.endDate && now > discount.endDate) {
      throw new AppError("This discount code has expired.", 400);
    }

    if (discount.maxUsageCount !== null && discount.currentUsageCount >= discount.maxUsageCount) {
      throw new AppError("This discount code has reached its maximum usage limit.", 400);
    }

    if (discount.minPurchaseAmount !== null && subtotal.lessThan(discount.minPurchaseAmount)) {
      throw new AppError(
        `Minimum order amount of ₹${discount.minPurchaseAmount.toString()} required for this discount.`,
        400
      );
    }

    if (discount.minQuantity !== null && quantity < discount.minQuantity) {
      throw new AppError(`Minimum quantity of ${discount.minQuantity} items required for this discount.`, 400);
    }

    let calculatedDiscount: Prisma.Decimal;

    if (discount.discountType === DiscountType.PERCENTAGE) {
      calculatedDiscount = subtotal.mul(discount.value).div(100).toDecimalPlaces(2);
    } else {
      // Fixed amount discount cannot exceed subtotal
      calculatedDiscount = Prisma.Decimal.min(discount.value, subtotal);
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        discountType: discount.discountType,
        value: discount.value,
      },
      calculatedAmount: calculatedDiscount,
      newTotal: subtotal.sub(calculatedDiscount),
    };
  }
}

export const discountsService = new DiscountsService();
