import { prisma } from "../../lib/prisma";
import { AppError } from "../../middleware/errorHandler";
import { AuthenticatedUser } from "../auth/auth.types";
import { InvoiceStatus, PaymentMethod, Prisma, Role } from "@prisma/client";
import { AllocatePaymentInput, RecordPaymentInput } from "./payments.validation";

export class PaymentsService {
  /**
   * Sequential Payment Reference Number Generator (PAY-YYYYMM-XXXX)
   */
  public async generatePaymentNumber(tx: Prisma.TransactionClient): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prefix = `PAY-${yearMonth}-`;

    const count = await tx.payment.count({
      where: {
        paymentNumber: {
          startsWith: prefix,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}${sequence}`;
  }

  /**
   * Record a new manual payment and optionally allocate immediately across invoices
   */
  public async recordPayment(input: RecordPaymentInput, user: AuthenticatedUser) {
    return prisma.$transaction(
      async (tx) => {
        // 1. Verify customer
        const customer = await tx.customer.findUnique({
          where: { id: input.customerId },
        });
        if (!customer || !customer.isActive) {
          throw new AppError("Active customer not found", 404);
        }

        const paymentAmount = new Prisma.Decimal(input.amount);
        let totalAllocated = new Prisma.Decimal(0);

        // 2. Validate allocations if provided
        if (input.allocations && input.allocations.length > 0) {
          const invoiceIds = input.allocations.map((a) => a.invoiceId);
          const invoices = await tx.invoice.findMany({
            where: { id: { in: invoiceIds } },
          });

          const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));

          for (const alloc of input.allocations) {
            const invoice = invoiceMap.get(alloc.invoiceId);
            if (!invoice) {
              throw new AppError(`Invoice with ID ${alloc.invoiceId} not found`, 404);
            }
            if (invoice.customerId !== customer.id) {
              throw new AppError(
                `Invoice ${invoice.invoiceNumber} does not belong to customer ${customer.companyName}`,
                400
              );
            }
            if (invoice.status !== InvoiceStatus.CONFIRMED) {
              throw new AppError(
                `Invoice ${invoice.invoiceNumber} cannot receive payments in ${invoice.status} status. It must be CONFIRMED.`,
                400
              );
            }

            const allocAmount = new Prisma.Decimal(alloc.amount);
            const balanceDue = invoice.totalAmount.sub(invoice.amountPaid);

            if (allocAmount.gt(balanceDue)) {
              throw new AppError(
                `Allocation amount of $${allocAmount.toFixed(2)} exceeds remaining balance of $${balanceDue.toFixed(2)} on invoice ${invoice.invoiceNumber}`,
                400
              );
            }

            totalAllocated = totalAllocated.add(allocAmount);
          }

          if (totalAllocated.gt(paymentAmount)) {
            throw new AppError(
              `Total allocations ($${totalAllocated.toFixed(2)}) cannot exceed payment amount ($${paymentAmount.toFixed(2)})`,
              400
            );
          }
        }

        const unallocatedAmount = paymentAmount.sub(totalAllocated);
        const paymentNumber = await this.generatePaymentNumber(tx);
        const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

        // 3. Create the Payment
        const payment = await tx.payment.create({
          data: {
            paymentNumber,
            customerId: customer.id,
            paymentMethod: input.paymentMethod,
            amount: paymentAmount,
            unallocatedAmount,
            paymentDate,
            notes: input.notes || null,
            recordedById: user.id,
          },
        });

        // 4. Create allocations and update invoice balances
        if (input.allocations && input.allocations.length > 0) {
          for (const alloc of input.allocations) {
            const allocAmount = new Prisma.Decimal(alloc.amount);

            await tx.paymentAllocation.create({
              data: {
                paymentId: payment.id,
                invoiceId: alloc.invoiceId,
                amount: allocAmount,
                notes: alloc.notes || null,
              },
            });

            // Update invoice
            const invoice = await tx.invoice.findUniqueOrThrow({
              where: { id: alloc.invoiceId },
            });

            const newAmountPaid = invoice.amountPaid.add(allocAmount);
            const isFullyPaid = newAmountPaid.gte(invoice.totalAmount);

            await tx.invoice.update({
              where: { id: alloc.invoiceId },
              data: {
                amountPaid: newAmountPaid,
                status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
              },
            });
          }
        }

        // 5. Return complete payment record
        return tx.payment.findUniqueOrThrow({
          where: { id: payment.id },
          include: {
            customer: true,
            allocations: {
              include: {
                invoice: true,
              },
            },
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  /**
   * Allocate unallocated funds from an existing payment to one or more invoices
   */
  public async allocatePayment(
    paymentId: string,
    input: AllocatePaymentInput,
    _user: AuthenticatedUser
  ) {
    return prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { id: paymentId },
          include: { customer: true },
        });

        if (!payment) {
          throw new AppError("Payment record not found", 404);
        }

        let totalNewAllocations = new Prisma.Decimal(0);
        for (const alloc of input.allocations) {
          totalNewAllocations = totalNewAllocations.add(new Prisma.Decimal(alloc.amount));
        }

        if (totalNewAllocations.gt(payment.unallocatedAmount)) {
          throw new AppError(
            `Total allocation ($${totalNewAllocations.toFixed(2)}) exceeds available unallocated payment balance of $${payment.unallocatedAmount.toFixed(2)}`,
            400
          );
        }

        // Validate invoices
        const invoiceIds = input.allocations.map((a) => a.invoiceId);
        const invoices = await tx.invoice.findMany({
          where: { id: { in: invoiceIds } },
        });

        const invoiceMap = new Map(invoices.map((inv) => [inv.id, inv]));

        for (const alloc of input.allocations) {
          const invoice = invoiceMap.get(alloc.invoiceId);
          if (!invoice) {
            throw new AppError(`Invoice with ID ${alloc.invoiceId} not found`, 404);
          }
          if (invoice.customerId !== payment.customerId) {
            throw new AppError(
              `Invoice ${invoice.invoiceNumber} belongs to a different customer`,
              400
            );
          }
          if (invoice.status !== InvoiceStatus.CONFIRMED) {
            throw new AppError(
              `Invoice ${invoice.invoiceNumber} cannot receive payments in ${invoice.status} status.`,
              400
            );
          }

          const allocAmount = new Prisma.Decimal(alloc.amount);
          const balanceDue = invoice.totalAmount.sub(invoice.amountPaid);

          if (allocAmount.gt(balanceDue)) {
            throw new AppError(
              `Allocation of $${allocAmount.toFixed(2)} exceeds invoice ${invoice.invoiceNumber} balance due of $${balanceDue.toFixed(2)}`,
              400
            );
          }

          // Create allocation
          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              invoiceId: alloc.invoiceId,
              amount: allocAmount,
              notes: alloc.notes || null,
            },
          });

          // Update invoice
          const newAmountPaid = invoice.amountPaid.add(allocAmount);
          const isFullyPaid = newAmountPaid.gte(invoice.totalAmount);

          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              amountPaid: newAmountPaid,
              status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
            },
          });
        }

        // Update payment unallocatedAmount
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            unallocatedAmount: payment.unallocatedAmount.sub(totalNewAllocations),
          },
          include: {
            customer: true,
            allocations: {
              include: {
                invoice: true,
              },
            },
            recordedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return updatedPayment;
      },
      { maxWait: 15000, timeout: 30000 }
    );
  }

  /**
   * List payments with role-based isolation, search, and unallocated filtering
   */
  public async getPayments(
    query: {
      page?: number;
      limit?: number;
      customerId?: string;
      paymentMethod?: PaymentMethod;
      hasUnallocated?: boolean;
      search?: string;
    },
    user: AuthenticatedUser
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};

    // Customer IDOR Guard
    if (user.role === Role.CUSTOMER) {
      if (!user.customerId) {
        throw new AppError("No customer profile linked to this user account", 403);
      }
      where.customerId = user.customerId;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.hasUnallocated) {
      where.unallocatedAmount = { gt: 0 };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { paymentNumber: { contains: s, mode: "insensitive" } },
        { customer: { companyName: { contains: s, mode: "insensitive" } } },
        { customer: { contactName: { contains: s, mode: "insensitive" } } },
      ];
    }

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: "desc" },
        include: {
          customer: true,
          allocations: {
            include: {
              invoice: true,
            },
          },
          recordedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieve single payment details by ID
   */
  public async getPaymentById(id: string, user: AuthenticatedUser) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        allocations: {
          include: {
            invoice: {
              include: {
                subscription: true,
              },
            },
          },
        },
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment record not found", 404);
    }

    // Customer IDOR Guard
    if (user.role === Role.CUSTOMER && payment.customerId !== user.customerId) {
      throw new AppError("Access denied: you can only view your own payment records", 403);
    }

    return payment;
  }

  /**
   * Summary Financial Metrics for Payments
   */
  public async getPaymentMetrics(user: AuthenticatedUser) {
    const where: Prisma.PaymentWhereInput = {};

    if (user.role === Role.CUSTOMER) {
      if (!user.customerId) {
        throw new AppError("No customer profile linked to this user account", 403);
      }
      where.customerId = user.customerId;
    }

    const payments = await prisma.payment.findMany({
      where,
      select: {
        amount: true,
        unallocatedAmount: true,
      },
    });

    let totalRecorded = new Prisma.Decimal(0);
    let totalUnallocated = new Prisma.Decimal(0);

    for (const p of payments) {
      totalRecorded = totalRecorded.add(p.amount);
      totalUnallocated = totalUnallocated.add(p.unallocatedAmount);
    }

    const totalAllocated = totalRecorded.sub(totalUnallocated);

    return {
      totalRecorded: totalRecorded.toFixed(2),
      totalAllocated: totalAllocated.toFixed(2),
      totalUnallocated: totalUnallocated.toFixed(2),
      paymentCount: payments.length,
    };
  }
}
