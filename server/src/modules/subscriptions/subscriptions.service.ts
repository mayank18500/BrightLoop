import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { AuthenticatedUser } from "../../middleware/auth.middleware";
import {
  BillingFrequency,
  Prisma,
  Role,
  SubscriptionStatus,
} from "@prisma/client";
import {
  CreateSubscriptionInput,
  SubscriptionItemInput,
} from "./subscriptions.validation";

// Permitted State Machine Transitions
const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.DRAFT]: [
    SubscriptionStatus.QUOTATION,
    SubscriptionStatus.CONFIRMED,
    SubscriptionStatus.CLOSED,
  ],
  [SubscriptionStatus.QUOTATION]: [
    SubscriptionStatus.CONFIRMED,
    SubscriptionStatus.CLOSED,
  ],
  [SubscriptionStatus.CONFIRMED]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CLOSED,
  ],
  [SubscriptionStatus.ACTIVE]: [
    SubscriptionStatus.PAUSED,
    SubscriptionStatus.CLOSED,
  ],
  [SubscriptionStatus.PAUSED]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CLOSED,
  ],
  [SubscriptionStatus.CLOSED]: [
    // Terminal state: only renewed via explicit renewSubscription operation
  ],
};

export class SubscriptionsService {
  /**
   * Sequential Subscription Contract Number Generator (SUB-YYYYMM-XXXX)
   */
  private async generateSubscriptionNumber(tx: Prisma.TransactionClient): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `SUB-${yearMonth}-`;

    const count = await tx.subscription.count({
      where: {
        subscriptionNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}${sequence}`;
  }

  /**
   * Calendar-accurate next billing date calculation
   */
  public calculateNextBillingDate(
    baseDate: Date,
    frequency: BillingFrequency,
    interval: number
  ): Date {
    const nextDate = new Date(baseDate);
    switch (frequency) {
      case BillingFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case BillingFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7 * interval);
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
   * Validate and snapshot items pricing
   */
  private async resolveSubscriptionItems(
    items: SubscriptionItemInput[],
    tx: Prisma.TransactionClient
  ) {
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
          throw new AppError(`Variant '${item.variantId}' is not active or not found.`, 400);
        }
        effectivePrice = product.salesPrice.add(variant.priceAdjustment);
      }

      // Agreed unit price snapshot
      const unitPrice = item.unitPrice ? new Prisma.Decimal(item.unitPrice) : effectivePrice;

      resolvedItems.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        quantity: item.quantity,
        unitPrice,
      });
    }

    return resolvedItems;
  }

  /**
   * Create a new subscription contract with snapshot pricing
   */
  async createSubscription(input: CreateSubscriptionInput) {
    return prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (!customer || !customer.isActive) {
          throw new AppError("Customer not found or inactive.", 404);
        }

        const plan = await tx.plan.findUnique({
          where: { id: input.planId },
        });
        if (!plan || !plan.isActive) {
          throw new AppError("Subscription plan not found or inactive.", 404);
        }

        const resolvedItems = await this.resolveSubscriptionItems(input.items, tx);

        const subscriptionNumber = await this.generateSubscriptionNumber(tx);
        const startDate = input.startDate ? new Date(input.startDate) : new Date();
        const nextBillingDate = this.calculateNextBillingDate(
          startDate,
          plan.billingFrequency,
          plan.billingInterval
        );

        const subscription = await tx.subscription.create({
          data: {
            subscriptionNumber,
            customerId: input.customerId,
            planId: input.planId,
            status: SubscriptionStatus.ACTIVE,
            startDate,
            nextBillingDate,
            paymentTerms: input.paymentTerms || "Due on receipt",
            items: {
              create: resolvedItems,
            },
          },
          include: {
            customer: true,
            plan: true,
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        });

        return subscription;
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  /**
   * List subscriptions with pagination, filtering, search, and role isolation
   */
  async listSubscriptions(
    params: {
      page: number;
      limit: number;
      status?: SubscriptionStatus;
      customerId?: string;
      search?: string;
    },
    currentUser: AuthenticatedUser
  ) {
    const { page, limit, status, customerId, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SubscriptionWhereInput = {};

    // Customer IDOR tenant isolation
    if (currentUser.role === Role.CUSTOMER) {
      if (!currentUser.customerId) {
        throw new AppError("Customer profile not associated with this account.", 403);
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
        { subscriptionNumber: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
        { customer: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, subscriptions] = await Promise.all([
      prisma.subscription.count({ where }),
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactName: true,
              email: true,
              phone: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              billingFrequency: true,
              billingInterval: true,
              allowPause: true,
              allowEarlyClosure: true,
              allowRenewal: true,
            },
          },
          items: {
            include: {
              product: { select: { id: true, name: true } },
              variant: { select: { id: true, name: true } },
            },
          },
          quotation: {
            select: { id: true, quotationNumber: true },
          },
          _count: {
            select: { invoices: true },
          },
        },
      }),
    ]);

    return {
      subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve subscription details by ID with IDOR protection
   */
  async getSubscriptionById(id: string, currentUser: AuthenticatedUser) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        plan: true,
        quotation: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new AppError("Subscription not found.", 404);
    }

    // Role-based IDOR validation
    if (currentUser.role === Role.CUSTOMER && subscription.customerId !== currentUser.customerId) {
      throw new AppError("Access denied: You do not own this subscription contract.", 403);
    }

    return subscription;
  }

  /**
   * Pause an active subscription based on plan policy
   */
  async pauseSubscription(id: string, currentUser: AuthenticatedUser, reason?: string) {
    const subscription = await this.getSubscriptionById(id, currentUser);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new AppError(`Cannot pause subscription in '${subscription.status}' status. Only ACTIVE subscriptions can be paused.`, 400);
    }

    if (!subscription.plan.allowPause) {
      throw new AppError(
        `Plan '${subscription.plan.name}' policy disallows subscription pause operations.`,
        400
      );
    }

    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date(),
        closureReason: reason || "Paused by user request",
      },
      include: { customer: true, plan: true, items: true },
    });
  }

  /**
   * Resume a paused subscription with fair billing date recalibration
   */
  async resumeSubscription(id: string, currentUser: AuthenticatedUser) {
    const subscription = await this.getSubscriptionById(id, currentUser);

    if (subscription.status !== SubscriptionStatus.PAUSED) {
      throw new AppError(`Cannot resume subscription in '${subscription.status}' status. Only PAUSED subscriptions can be resumed.`, 400);
    }

    // Calculate elapsed paused duration to shift nextBillingDate forward
    let nextBillingDate = subscription.nextBillingDate;
    if (subscription.pausedAt) {
      const pausedDurationMs = Math.max(0, Date.now() - subscription.pausedAt.getTime());
      nextBillingDate = new Date(subscription.nextBillingDate.getTime() + pausedDurationMs);
    }

    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pausedAt: null,
        nextBillingDate,
      },
      include: { customer: true, plan: true, items: true },
    });
  }

  /**
   * Close/terminate subscription early based on plan policy
   */
  async closeSubscription(id: string, currentUser: AuthenticatedUser, reason: string) {
    const subscription = await this.getSubscriptionById(id, currentUser);

    if (subscription.status === SubscriptionStatus.CLOSED) {
      throw new AppError("Subscription is already closed.", 400);
    }

    // Customers and Staff must adhere to plan policy; Admins can override
    if (currentUser.role !== Role.ADMIN && !subscription.plan.allowEarlyClosure) {
      throw new AppError(
        `Plan '${subscription.plan.name}' policy disallows early contract termination.`,
        400
      );
    }

    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CLOSED,
        closedAt: new Date(),
        closureReason: reason,
      },
      include: { customer: true, plan: true, items: true },
    });
  }

  /**
   * Renew an existing contract based on plan policy
   */
  async renewSubscription(
    id: string,
    currentUser: AuthenticatedUser,
    extensionIntervals: number = 1
  ) {
    const subscription = await this.getSubscriptionById(id, currentUser);

    if (!subscription.plan.allowRenewal) {
      throw new AppError(
        `Plan '${subscription.plan.name}' policy does not permit renewals.`,
        400
      );
    }

    const baseDate =
      subscription.status === SubscriptionStatus.CLOSED || subscription.nextBillingDate < new Date()
        ? new Date()
        : subscription.nextBillingDate;

    const newNextBillingDate = this.calculateNextBillingDate(
      baseDate,
      subscription.plan.billingFrequency,
      subscription.plan.billingInterval * extensionIntervals
    );

    return prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: newNextBillingDate,
        closedAt: null,
        closureReason: null,
        pausedAt: null,
      },
      include: { customer: true, plan: true, items: true },
    });
  }

  /**
   * Update subscription metadata or enforce validated state transitions
   */
  async updateSubscription(
    id: string,
    input: { paymentTerms?: string; status?: SubscriptionStatus },
    currentUser: AuthenticatedUser
  ) {
    const subscription = await this.getSubscriptionById(id, currentUser);

    if (input.status && input.status !== subscription.status) {
      const allowed = ALLOWED_TRANSITIONS[subscription.status];
      if (!allowed.includes(input.status)) {
        throw new AppError(
          `Invalid state transition: Cannot transition from '${subscription.status}' to '${input.status}'.`,
          400
        );
      }
    }

    return prisma.subscription.update({
      where: { id },
      data: {
        paymentTerms: input.paymentTerms !== undefined ? input.paymentTerms : subscription.paymentTerms,
        status: input.status !== undefined ? input.status : subscription.status,
      },
      include: { customer: true, plan: true, items: true },
    });
  }
}

export const subscriptionsService = new SubscriptionsService();
