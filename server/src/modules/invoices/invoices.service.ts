import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { AuthenticatedUser } from "../auth/auth.types";
import {
  BillingFrequency,
  InvoiceStatus,
  Prisma,
  Role,
  SubscriptionStatus,
} from "@prisma/client";
import {
  CreateInvoiceInput,
  RunRecurringBillingInput,
} from "./invoices.validation";

export function calculateNextBillingDate(
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

export class InvoicesService {
  /**
   * Sequential Invoice Number Generator (INV-YYYYMM-XXXX)
   */
  public async generateInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `INV-${yearMonth}-`;

    const count = await tx.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}${sequence}`;
  }

  /**
   * Helper to compute due date from payment terms
   */
  private computeDueDate(issueDate: Date, terms: string): Date {
    const due = new Date(issueDate);
    const lower = terms.toLowerCase();
    if (lower.includes("30")) {
      due.setDate(due.getDate() + 30);
    } else if (lower.includes("15")) {
      due.setDate(due.getDate() + 15);
    } else if (lower.includes("receipt") || lower.includes("immediate")) {
      due.setDate(due.getDate() + 7); // Grace period of 7 days for receipt
    } else {
      due.setDate(due.getDate() + 14);
    }
    return due;
  }

  /**
   * Create an invoice manually (Staff / Admin)
   */
  public async createInvoice(input: CreateInvoiceInput, _user: AuthenticatedUser) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Verify customer
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (!customer || !customer.isActive) {
          throw new AppError("Active customer not found", 404);
        }

        // 2. If subscription provided, verify it
        if (input.subscriptionId) {
          const subscription = await tx.subscription.findUnique({
            where: { id: input.subscriptionId },
          });
          if (!subscription) {
            throw new AppError("Subscription not found", 404);
          }
          if (subscription.customerId !== customer.id) {
            throw new AppError("Subscription does not belong to specified customer", 400);
          }

          // Check composite uniqueness if billing period specified
          if (input.billingPeriodStart && input.billingPeriodEnd) {
            const existing = await tx.invoice.findFirst({
              where: {
                subscriptionId: input.subscriptionId,
                billingPeriodStart: new Date(input.billingPeriodStart),
                billingPeriodEnd: new Date(input.billingPeriodEnd),
              },
            });
            if (existing) {
              throw new AppError(
                `Invoice ${existing.invoiceNumber} already exists for this subscription and billing period`,
                409
              );
            }
          }
        }

        // 3. Resolve line items & tax rates
        const invoiceNumber = await this.generateInvoiceNumber(tx);
        const defaultTaxRule = await tx.taxRule.findFirst({
          where: { isDefault: true, isActive: true },
        });

        let invoiceSubtotal = new Prisma.Decimal(0);
        let invoiceTaxAmount = new Prisma.Decimal(0);
        let invoiceLineDiscounts = new Prisma.Decimal(0);

        const preparedItems: Array<{
          productId: string;
          variantId: string | null;
          description: string;
          quantity: number;
          unitPrice: Prisma.Decimal;
          subtotal: Prisma.Decimal;
          taxRate: Prisma.Decimal;
          taxAmount: Prisma.Decimal;
          discountAmount: Prisma.Decimal;
          totalAmount: Prisma.Decimal;
        }> = [];

        for (const item of input.items) {
          const unitPrice = new Prisma.Decimal(item.unitPrice);
          const quantity = item.quantity;
          const subtotal = unitPrice.mul(quantity);

          const taxRate = item.taxRate !== undefined
            ? new Prisma.Decimal(item.taxRate)
            : defaultTaxRule
              ? new Prisma.Decimal(defaultTaxRule.taxRate)
              : new Prisma.Decimal(0);

          const discountAmount = item.discountAmount !== undefined
            ? new Prisma.Decimal(item.discountAmount)
            : new Prisma.Decimal(0);

          const taxableAmount = Prisma.Decimal.max(0, subtotal.sub(discountAmount));
          const taxAmount = taxableAmount.mul(taxRate).div(100);
          const totalAmount = taxableAmount.add(taxAmount);

          invoiceSubtotal = invoiceSubtotal.add(subtotal);
          invoiceTaxAmount = invoiceTaxAmount.add(taxAmount);
          invoiceLineDiscounts = invoiceLineDiscounts.add(discountAmount);

          preparedItems.push({
            productId: item.productId,
            variantId: item.variantId || null,
            description: item.description,
            quantity,
            unitPrice,
            subtotal,
            taxRate,
            taxAmount,
            discountAmount,
            totalAmount,
          });
        }

        // 4. Handle optional coupon discount
        let couponDiscountAmount = new Prisma.Decimal(0);
        let appliedDiscountId: string | null = null;

        if (input.discountCode) {
          const discount = await tx.discount.findUnique({
            where: { code: input.discountCode.toUpperCase() },
          });

          if (discount && discount.isActive) {
            const now = new Date();
            const isStarted = !discount.startDate || discount.startDate <= now;
            const isNotExpired = !discount.endDate || discount.endDate >= now;
            const hasUsageRemaining =
              discount.maxUsageCount === null ||
              discount.currentUsageCount < discount.maxUsageCount;

            if (isStarted && isNotExpired && hasUsageRemaining) {
              appliedDiscountId = discount.id;
              if (discount.discountType === "PERCENTAGE") {
                couponDiscountAmount = invoiceSubtotal.mul(discount.value).div(100);
              } else {
                couponDiscountAmount = discount.value;
              }
            }
          }
        }

        const totalDiscountAmount = invoiceLineDiscounts.add(couponDiscountAmount);
        const finalTotalAmount = Prisma.Decimal.max(
          0,
          invoiceSubtotal.add(invoiceTaxAmount).sub(totalDiscountAmount)
        );

        const issueDate = input.issueDate ? new Date(input.issueDate) : new Date();
        const dueDate = new Date(input.dueDate);

        // 5. Create invoice
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: customer.id,
            subscriptionId: input.subscriptionId || null,
            billingPeriodStart: input.billingPeriodStart ? new Date(input.billingPeriodStart) : null,
            billingPeriodEnd: input.billingPeriodEnd ? new Date(input.billingPeriodEnd) : null,
            issueDate,
            dueDate,
            status: InvoiceStatus.DRAFT,
            subtotal: invoiceSubtotal,
            taxAmount: invoiceTaxAmount,
            discountAmount: totalDiscountAmount,
            totalAmount: finalTotalAmount,
            amountPaid: new Prisma.Decimal(0),
            notes: input.notes || null,
            items: {
              create: preparedItems,
            },
          },
          include: {
            customer: true,
            subscription: true,
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        });

        // 6. Record coupon usage if applied
        if (appliedDiscountId) {
          await tx.discountUsage.create({
            data: {
              discountId: appliedDiscountId,
              invoiceId: invoice.id,
              customerId: customer.id,
              amount: couponDiscountAmount,
            },
          });

          await tx.discount.update({
            where: { id: appliedDiscountId },
            data: {
              currentUsageCount: {
                increment: 1,
              },
            },
          });
        }

        return invoice;
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  /**
   * Automated Recurring Billing Runner
   * Evaluates active subscriptions due for billing and generates invoices idempotently
   */
  public async runRecurringBilling(input: RunRecurringBillingInput = {}, _user: AuthenticatedUser) {
    const targetDate = input.targetDate ? new Date(input.targetDate) : new Date();

    // Query active subscriptions ready for recurring billing
    const whereClause: Prisma.SubscriptionWhereInput = {
      status: SubscriptionStatus.ACTIVE,
      nextBillingDate: {
        lte: targetDate,
      },
    };

    if (input.subscriptionId) {
      whereClause.id = input.subscriptionId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where: whereClause,
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

    const defaultTaxRule = await prisma.taxRule.findFirst({
      where: { isDefault: true, isActive: true },
    });

    const defaultTaxRate = defaultTaxRule
      ? new Prisma.Decimal(defaultTaxRule.taxRate)
      : new Prisma.Decimal(0);

    const results = {
      evaluatedSubscriptions: subscriptions.length,
      createdInvoices: [] as string[],
      skippedDuplicates: [] as string[],
      errors: [] as Array<{ subscriptionNumber: string; error: string }>,
    };

    for (const sub of subscriptions) {
      try {
        await prisma.$transaction(
          async (tx) => {
            const billingPeriodStart = sub.lastBilledDate || sub.startDate;
            const billingPeriodEnd = sub.nextBillingDate;

            // Idempotency check: composite unique constraint
            const existingInvoice = await tx.invoice.findFirst({
              where: {
                subscriptionId: sub.id,
                billingPeriodStart,
                billingPeriodEnd,
              },
            });

            if (existingInvoice) {
              results.skippedDuplicates.push(
                `${sub.subscriptionNumber}: Invoice ${existingInvoice.invoiceNumber} already exists for period`
              );
              return;
            }

            const invoiceNumber = await this.generateInvoiceNumber(tx);
            const issueDate = new Date();
            const dueDate = this.computeDueDate(issueDate, sub.paymentTerms);

            let subtotal = new Prisma.Decimal(0);
            let taxAmount = new Prisma.Decimal(0);

            const invoiceItemsData = sub.items.map((item) => {
              const unitPrice = item.unitPrice;
              const quantity = item.quantity;
              const itemSubtotal = unitPrice.mul(quantity);
              const itemTax = itemSubtotal.mul(defaultTaxRate).div(100);
              const itemTotal = itemSubtotal.add(itemTax);

              subtotal = subtotal.add(itemSubtotal);
              taxAmount = taxAmount.add(itemTax);

              const variantDesc = item.variant ? ` (${item.variant.name})` : "";
              const description = `${item.product.name}${variantDesc} - ${sub.plan.name} Recurring Billing`;

              return {
                productId: item.productId,
                variantId: item.variantId || null,
                description,
                quantity,
                unitPrice,
                subtotal: itemSubtotal,
                taxRate: defaultTaxRate,
                taxAmount: itemTax,
                discountAmount: new Prisma.Decimal(0),
                totalAmount: itemTotal,
              };
            });

            const totalAmount = subtotal.add(taxAmount);

            // Create recurring invoice in CONFIRMED status directly
            const createdInvoice = await tx.invoice.create({
              data: {
                invoiceNumber,
                customerId: sub.customerId,
                subscriptionId: sub.id,
                billingPeriodStart,
                billingPeriodEnd,
                issueDate,
                dueDate,
                status: InvoiceStatus.CONFIRMED,
                subtotal,
                taxAmount,
                discountAmount: new Prisma.Decimal(0),
                totalAmount,
                amountPaid: new Prisma.Decimal(0),
                notes: `Automated recurring billing generated for ${sub.subscriptionNumber} (${sub.plan.name})`,
                items: {
                  create: invoiceItemsData,
                },
              },
            });

            // Advance subscription dates
            const newNextBillingDate = calculateNextBillingDate(
              sub.nextBillingDate,
              sub.plan.billingFrequency,
              sub.plan.billingInterval
            );

            await tx.subscription.update({
              where: { id: sub.id },
              data: {
                lastBilledDate: sub.nextBillingDate,
                nextBillingDate: newNextBillingDate,
              },
            });

            results.createdInvoices.push(
              `${createdInvoice.invoiceNumber} for ${sub.subscriptionNumber} ($${totalAmount.toFixed(2)})`
            );
          },
          { maxWait: 15000, timeout: 30000 }
        );
      } catch (err: any) {
        results.errors.push({
          subscriptionNumber: sub.subscriptionNumber,
          error: err.message || "Unknown error during billing generation",
        });
      }
    }

    return results;
  }

  /**
   * List invoices with role-based isolation, search, status, and overdue filtering
   */
  public async getInvoices(
    query: {
      page?: number;
      limit?: number;
      status?: InvoiceStatus;
      customerId?: string;
      subscriptionId?: string;
      search?: string;
      isOverdue?: boolean;
    },
    user: AuthenticatedUser
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    // Customer IDOR Guard: Customers can ONLY see their own invoices
    if (user.role === Role.CUSTOMER) {
      if (!user.customerId) {
        throw new AppError("No customer profile linked to this user account", 403);
      }
      where.customerId = user.customerId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.subscriptionId) {
      where.subscriptionId = query.subscriptionId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.isOverdue) {
      where.status = InvoiceStatus.CONFIRMED;
      where.dueDate = { lt: new Date() };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s, mode: "insensitive" } },
        { customer: { companyName: { contains: s, mode: "insensitive" } } },
        { customer: { contactName: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          subscription: {
            include: {
              plan: true,
            },
          },
          items: true,
          allocations: {
            include: {
              payment: true,
            },
          },
        },
      }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve single invoice by ID with items, customer, and payments
   */
  public async getInvoiceById(id: string, user: AuthenticatedUser) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: {
            plan: true,
          },
        },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        allocations: {
          include: {
            payment: {
              include: {
                recordedBy: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
        discountUsages: {
          include: {
            discount: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    // Customer IDOR Guard
    if (user.role === Role.CUSTOMER && invoice.customerId !== user.customerId) {
      throw new AppError("Access denied: you can only view your own invoices", 403);
    }

    const balanceDue = Prisma.Decimal.max(0, invoice.totalAmount.sub(invoice.amountPaid));
    const isOverdue =
      invoice.status === InvoiceStatus.CONFIRMED &&
      invoice.dueDate < new Date() &&
      balanceDue.gt(0);

    return {
      ...invoice,
      balanceDue,
      isOverdue,
    };
  }

  /**
   * Confirm an invoice (DRAFT -> CONFIRMED)
   */
  public async confirmInvoice(id: string, _user: AuthenticatedUser) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new AppError(`Cannot confirm an invoice in ${invoice.status} status`, 400);
    }

    return prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CONFIRMED,
      },
      include: {
        customer: true,
        subscription: true,
        items: true,
      },
    });
  }

  /**
   * Cancel an invoice (DRAFT/CONFIRMED -> CANCELLED)
   */
  public async cancelInvoice(id: string, notes?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new AppError("Cannot cancel an invoice that has been fully paid", 400);
    }

    if (invoice.amountPaid.gt(0)) {
      throw new AppError(
        "Cannot cancel an invoice with active payments. De-allocate payments first.",
        400
      );
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new AppError("Invoice is already cancelled", 400);
    }

    return prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: notes ? `${invoice.notes ? `${invoice.notes}\n` : ""}Cancellation: ${notes}` : invoice.notes,
      },
      include: {
        customer: true,
        items: true,
      },
    });
  }

  /**
   * Summary Financial & Operational Metrics
   */
  public async getInvoiceMetrics(user: AuthenticatedUser) {
    const where: Prisma.InvoiceWhereInput = {};

    if (user.role === Role.CUSTOMER) {
      if (!user.customerId) {
        throw new AppError("No customer profile linked to this user account", 403);
      }
      where.customerId = user.customerId;
    }

    const [allInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.findMany({
        where,
        select: {
          status: true,
          totalAmount: true,
          amountPaid: true,
          dueDate: true,
        },
      }),
      prisma.invoice.findMany({
        where: {
          ...where,
          status: InvoiceStatus.CONFIRMED,
          dueDate: { lt: new Date() },
        },
        select: {
          totalAmount: true,
          amountPaid: true,
        },
      }),
    ]);

    let totalInvoiced = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);
    let totalOutstanding = new Prisma.Decimal(0);
    let draftCount = 0;
    let confirmedCount = 0;
    let paidCount = 0;

    for (const inv of allInvoices) {
      if (inv.status === InvoiceStatus.DRAFT) {
        draftCount++;
      } else if (inv.status === InvoiceStatus.CONFIRMED) {
        confirmedCount++;
        totalInvoiced = totalInvoiced.add(inv.totalAmount);
        totalPaid = totalPaid.add(inv.amountPaid);
        totalOutstanding = totalOutstanding.add(inv.totalAmount.sub(inv.amountPaid));
      } else if (inv.status === InvoiceStatus.PAID) {
        paidCount++;
        totalInvoiced = totalInvoiced.add(inv.totalAmount);
        totalPaid = totalPaid.add(inv.amountPaid);
      }
    }

    let overdueAmount = new Prisma.Decimal(0);
    let overdueCount = 0;

    for (const inv of overdueInvoices) {
      const balance = inv.totalAmount.sub(inv.amountPaid);
      if (balance.gt(0)) {
        overdueCount++;
        overdueAmount = overdueAmount.add(balance);
      }
    }

    return {
      totalInvoiced: totalInvoiced.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      overdueAmount: overdueAmount.toFixed(2),
      overdueCount,
      draftCount,
      confirmedCount,
      paidCount,
      totalCount: allInvoices.length,
    };
  }
}
