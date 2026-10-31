import { Prisma, QuotationStatus, SubscriptionStatus, BillingFrequency, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { discountsService } from "../discounts/discounts.service";
import { taxesService } from "../taxes/taxes.service";
import {
  CreateQuotationInput,
  UpdateQuotationInput,
  ConvertQuotationInput,
  CreateTemplateInput,
  QuotationItemInput,
} from "./quotations.validation";
import { AuthenticatedUser } from "../auth/auth.types";

export class QuotationsService {
  /**
   * Generate sequential, collision-free quotation number: QT-YYYYMM-XXXX
   */
  private async generateQuotationNumber(tx?: Prisma.TransactionClient): Promise<string> {
    const client = tx || prisma;
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `QT-${yearMonth}-`;

    const count = await client.quotation.count({
      where: { quotationNumber: { startsWith: prefix } },
    });

    const sequential = String(count + 1).padStart(4, "0");
    return `${prefix}${sequential}`;
  }

  /**
   * Generate sequential subscription number: SUB-YYYYMM-XXXX
   */
  private async generateSubscriptionNumber(tx: Prisma.TransactionClient): Promise<string> {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `SUB-${yearMonth}-`;

    const count = await tx.subscription.count({
      where: { subscriptionNumber: { startsWith: prefix } },
    });

    const sequential = String(count + 1).padStart(4, "0");
    return `${prefix}${sequential}`;
  }

  /**
   * Helper: calculate next billing date from start date and plan frequency & interval
   */
  private calculateNextBillingDate(startDate: Date, frequency: BillingFrequency, interval: number): Date {
    const nextDate = new Date(startDate);
    switch (frequency) {
      case BillingFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case BillingFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + interval * 7);
        break;
      case BillingFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case BillingFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }
    return nextDate;
  }

  /**
   * Resolve and snapshot items pricing, taxes, and discounts
   */
  private async resolveQuotationItems(
    items: QuotationItemInput[],
    defaultTaxRate: Prisma.Decimal,
    tx: Prisma.TransactionClient
  ) {
    let subtotal = new Prisma.Decimal(0);
    let totalTax = new Prisma.Decimal(0);
    let totalItemDiscount = new Prisma.Decimal(0);

    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const resolvedItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product || !product.isActive) {
        throw new AppError(`Product with ID '${item.productId}' not found or inactive.`, 400);
      }

      let variant = null;
      let effectivePrice = product.salesPrice;

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          throw new AppError(`Variant '${item.variantId}' is not active or not found for product.`, 400);
        }
        effectivePrice = product.salesPrice.add(variant.priceAdjustment);
      }

      // Snapshot unit price (use provided custom price if given, otherwise effective price)
      const unitPrice = item.unitPrice ? new Prisma.Decimal(item.unitPrice) : effectivePrice;
      const quantity = item.quantity;
      const lineSubtotal = unitPrice.mul(quantity);

      // Snapshot tax rate and calculate line tax
      const taxRate = item.taxRate !== undefined ? new Prisma.Decimal(item.taxRate) : defaultTaxRate;
      const lineTax = lineSubtotal.mul(taxRate).div(100).toDecimalPlaces(2);

      // Snapshot discount
      const lineDiscount = item.discountAmount ? new Prisma.Decimal(item.discountAmount) : new Prisma.Decimal(0);
      const lineTotal = lineSubtotal.add(lineTax).sub(lineDiscount);

      subtotal = subtotal.add(lineSubtotal);
      totalTax = totalTax.add(lineTax);
      totalItemDiscount = totalItemDiscount.add(lineDiscount);

      resolvedItems.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        quantity,
        unitPrice,
        subtotal: lineSubtotal,
        taxRate,
        taxAmount: lineTax,
        discountAmount: lineDiscount,
        total: lineTotal,
      });
    }

    return { resolvedItems, subtotal, totalTax, totalItemDiscount };
  }

  /**
   * Create a new formal quotation with price snapshots.
   */
  async createQuotation(input: CreateQuotationInput, createdById?: string) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Verify customer exists
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (!customer || !customer.isActive) {
          throw new AppError("Customer not found or inactive.", 404);
        }

        // 2. Verify plan if attached
        if (input.planId) {
          const plan = await tx.plan.findUnique({
            where: { id: input.planId },
          });
          if (!plan || !plan.isActive) {
            throw new AppError("Subscription plan not found or inactive.", 404);
          }
        }

        // 3. Resolve default tax rule
        const defaultTax = await tx.taxRule.findFirst({
          where: { isDefault: true, isActive: true },
        });
        const defaultTaxRate = defaultTax ? defaultTax.taxRate : new Prisma.Decimal(0);

        // 4. Resolve and snapshot items
        const { resolvedItems, subtotal, totalTax, totalItemDiscount } = await this.resolveQuotationItems(
          input.items,
          defaultTaxRate,
          tx
        );

      // 5. Evaluate order-wide coupon discount if provided
      let couponDiscountAmount = new Prisma.Decimal(0);
      if (input.discountCode) {
        const totalItemsCount = input.items.reduce((acc, it) => acc + it.quantity, 0);
        const evalResult = await discountsService.evaluateEligibility({
          code: input.discountCode,
          subtotal: subtotal.toString(),
          quantity: totalItemsCount,
        });
        couponDiscountAmount = new Prisma.Decimal(evalResult.calculatedAmount);
      }

      const totalDiscount = totalItemDiscount.add(couponDiscountAmount);
      const totalAmount = subtotal.add(totalTax).sub(totalDiscount);

      const quotationNumber = await this.generateQuotationNumber(tx);
      const validityDays = input.validityDays || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validityDays);

      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          customerId: customer.id,
          planId: input.planId || null,
          createdById: createdById || null,
          status: QuotationStatus.DRAFT,
          subtotal,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          totalAmount,
          expiresAt,
          items: {
            create: resolvedItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: true,
          plan: true,
        },
      });

      return quotation;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * List quotations with pagination, filtering, and role isolation.
   */
  async listQuotations(
    params: {
      page: number;
      limit: number;
      status?: QuotationStatus;
      customerId?: string;
      search?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    const { page, limit, status, customerId, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.QuotationWhereInput = {};

    // Customer role: strictly enforce tenant isolation (IDOR protection)
    if (currentUser.role === Role.CUSTOMER) {
      if (!currentUser.customerId) {
        throw new AppError("No customer profile linked to this user.", 403);
      }
      where.customerId = currentUser.customerId;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, quotations] = await Promise.all([
      prisma.quotation.count({ where }),
      prisma.quotation.findMany({
        where,
        include: {
          customer: { select: { id: true, companyName: true, contactName: true, email: true } },
          plan: { select: { id: true, name: true, billingFrequency: true, billingInterval: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return {
      quotations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve full quotation details by ID with access control.
   */
  async getQuotationById(id: string, currentUser: AuthenticatedUser) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        createdBy: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        subscription: {
          select: { id: true, subscriptionNumber: true, status: true },
        },
      },
    });

    if (!quotation) {
      throw new AppError("Quotation not found.", 404);
    }

    // Role verification
    if (currentUser.role === Role.CUSTOMER && quotation.customerId !== currentUser.customerId) {
      throw new AppError("Access denied: You can only view your own quotations.", 403);
    }

    return quotation;
  }

  /**
   * Update draft quotation.
   */
  async updateQuotation(id: string, input: UpdateQuotationInput, currentUser: AuthenticatedUser) {
    const existing = await this.getQuotationById(id, currentUser);

    if (existing.status !== QuotationStatus.DRAFT) {
      throw new AppError("Only quotations in DRAFT status can be modified.", 400);
    }

    return prisma.$transaction(async (tx) => {
      let subtotal = existing.subtotal;
      let totalTax = existing.taxAmount;
      let totalDiscount = existing.discountAmount;
      let totalAmount = existing.totalAmount;

      if (input.items && input.items.length > 0) {
        const defaultTax = await taxesService.getDefaultTaxRule();
        const defaultTaxRate = defaultTax ? defaultTax.taxRate : new Prisma.Decimal(0);

        const resolved = await this.resolveQuotationItems(input.items, defaultTaxRate, tx);
        subtotal = resolved.subtotal;
        totalTax = resolved.totalTax;
        totalDiscount = resolved.totalItemDiscount;

        // Delete existing items and insert refreshed snapshots
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });
        await tx.quotationItem.createMany({
          data: resolved.resolvedItems.map((it) => ({
            ...it,
            quotationId: id,
          })),
        });

        totalAmount = subtotal.add(totalTax).sub(totalDiscount);
      }

      return tx.quotation.update({
        where: { id },
        data: {
          planId: input.planId !== undefined ? input.planId : existing.planId,
          status: input.status !== undefined ? input.status : existing.status,
          subtotal,
          taxAmount: totalTax,
          discountAmount: totalDiscount,
          totalAmount,
        },
        include: {
          items: { include: { product: true, variant: true } },
          customer: true,
          plan: true,
        },
      });
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * Change quotation status: DRAFT -> SENT
   */
  async sendQuotation(id: string, currentUser: AuthenticatedUser) {
    const quotation = await this.getQuotationById(id, currentUser);
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new AppError("Only DRAFT quotations can be marked as SENT.", 400);
    }

    return prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.SENT },
    });
  }

  /**
   * Confirm quotation: SENT/DRAFT -> CONFIRMED
   */
  async confirmQuotation(id: string, currentUser: AuthenticatedUser) {
    const quotation = await this.getQuotationById(id, currentUser);

    if (quotation.status === QuotationStatus.CONFIRMED) {
      return quotation;
    }

    if (quotation.status === QuotationStatus.CANCELLED || quotation.status === QuotationStatus.EXPIRED) {
      throw new AppError(`Cannot confirm a quotation in ${quotation.status} state.`, 400);
    }

    return prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });
  }

  /**
   * Cancel quotation: -> CANCELLED
   */
  async cancelQuotation(id: string, currentUser: AuthenticatedUser) {
    const quotation = await this.getQuotationById(id, currentUser);

    if (quotation.subscription) {
      throw new AppError("Cannot cancel quotation that has already been converted to an active subscription.", 400);
    }

    return prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.CANCELLED },
    });
  }

  /**
   * Convert CONFIRMED quotation into an immutable Subscription contract with agreed price snapshots!
   */
  async convertToSubscription(
    id: string,
    input: ConvertQuotationInput = { paymentTerms: "Due on receipt" },
    currentUser: AuthenticatedUser
  ) {
    const quotation = await this.getQuotationById(id, currentUser);

    if (quotation.status !== QuotationStatus.CONFIRMED) {
      throw new AppError("Only CONFIRMED quotations can be converted into subscriptions.", 400);
    }

    if (quotation.subscription) {
      throw new AppError("This quotation has already been converted into a subscription contract.", 409);
    }

    if (new Date() > quotation.expiresAt) {
      throw new AppError("Cannot convert: Quotation has expired.", 400);
    }

    if (!quotation.planId || !quotation.plan) {
      throw new AppError("Cannot convert: Quotation must specify a subscription plan.", 400);
    }

    const plan = quotation.plan;

    return prisma.$transaction(async (tx) => {
      const subscriptionNumber = await this.generateSubscriptionNumber(tx);
      const startDate = input.startDate ? new Date(input.startDate) : new Date();
      const nextBillingDate = this.calculateNextBillingDate(startDate, plan.billingFrequency, plan.billingInterval);

      // Create Subscription Contract
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quotation.customerId,
          planId: quotation.planId!,
          quotationId: quotation.id,
          status: SubscriptionStatus.ACTIVE,
          startDate,
          nextBillingDate,
          paymentTerms: input.paymentTerms || "Due on receipt",
          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice, // Immutable snapshot of agreed unit price!
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          customer: true,
          plan: true,
        },
      });

      return {
        subscription,
        message: "Quotation successfully converted to active recurring subscription contract.",
      };
    }, { maxWait: 15000, timeout: 30000 });
  }

  // ==========================================
  // REUSABLE QUOTATION TEMPLATES
  // ==========================================

  async listTemplates() {
    return prisma.quotationTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createTemplate(input: CreateTemplateInput) {
    return prisma.quotationTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        validityDays: input.validityDays,
        templateData: input.templateData as unknown as Prisma.InputJsonValue,
        isActive: input.isActive,
      },
    });
  }

  async getTemplateById(id: string) {
    const template = await prisma.quotationTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new AppError("Quotation template not found.", 404);
    }
    return template;
  }

  async deleteTemplate(id: string) {
    return prisma.quotationTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const quotationsService = new QuotationsService();
