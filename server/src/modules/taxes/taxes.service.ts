import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { CreateTaxRuleInput, UpdateTaxRuleInput } from "./taxes.validation";

export class TaxesService {
  /**
   * List tax rules.
   */
  async listTaxRules(params?: { isActive?: boolean }) {
    const where: Prisma.TaxRuleWhereInput = {};
    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    return prisma.taxRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get tax rule by ID.
   */
  async getTaxRuleById(id: string) {
    const taxRule = await prisma.taxRule.findUnique({
      where: { id },
    });

    if (!taxRule) {
      throw new AppError("Tax rule not found.", 404);
    }

    return taxRule;
  }

  /**
   * Get system default active tax rule.
   */
  async getDefaultTaxRule() {
    return prisma.taxRule.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }

  /**
   * Calculate tax amount for a given taxable decimal amount.
   * Performs exact Decimal arithmetic: (amount * taxRate) / 100
   */
  calculateTaxAmount(amount: Prisma.Decimal, taxRate: Prisma.Decimal): Prisma.Decimal {
    return amount.mul(taxRate).div(100).toDecimalPlaces(2);
  }

  /**
   * Admin-only: create tax rule.
   */
  async createTaxRule(input: CreateTaxRuleInput) {
    const { taxRate, effectiveFrom, effectiveUntil, isDefault, ...rest } = input;

    return prisma.$transaction(async (tx) => {
      if (isDefault) {
        // Unset other default tax rules
        await tx.taxRule.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRule.create({
        data: {
          ...rest,
          taxRate: new Prisma.Decimal(taxRate),
          isDefault,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
        },
      });
    });
  }

  /**
   * Admin-only: update tax rule.
   */
  async updateTaxRule(id: string, input: UpdateTaxRuleInput) {
    await this.getTaxRuleById(id);

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.taxRule.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const data: Prisma.TaxRuleUpdateInput = {
        ...(input.name && { name: input.name }),
        ...(input.taxRate && { taxRate: new Prisma.Decimal(input.taxRate) }),
        ...(input.taxType && { taxType: input.taxType }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.effectiveFrom && { effectiveFrom: new Date(input.effectiveFrom) }),
        ...(input.effectiveUntil !== undefined && {
          effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
        }),
      };

      return tx.taxRule.update({
        where: { id },
        data,
      });
    });
  }

  /**
   * Admin-only: delete or deactivate tax rule.
   */
  async deleteTaxRule(id: string) {
    await this.getTaxRuleById(id);

    return prisma.taxRule.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const taxesService = new TaxesService();
