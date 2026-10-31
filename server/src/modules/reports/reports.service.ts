import { prisma } from "../../lib/prisma";
import { BillingFrequency, InvoiceStatus, Prisma, SubscriptionStatus } from "@prisma/client";

export class ReportsService {
  /**
   * Executive Financial & Operational SaaS Metrics (MRR, ARR, Aging, Churn)
   */
  public async getFinancialAnalytics() {
    const now = new Date();

    // 1. Fetch active subscriptions for MRR / ARR computation
    const [activeSubscriptions, allSubscriptions] = await Promise.all([
      prisma.subscription.findMany({
        where: { status: SubscriptionStatus.ACTIVE },
        include: {
          plan: true,
          items: true,
        },
      }),
      prisma.subscription.findMany({
        select: {
          status: true,
        },
      }),
    ]);

    let mrr = new Prisma.Decimal(0);

    for (const sub of activeSubscriptions) {
      let subItemsTotal = new Prisma.Decimal(0);
      for (const item of sub.items) {
        subItemsTotal = subItemsTotal.add(item.unitPrice.mul(item.quantity));
      }

      const interval = Math.max(1, sub.plan.billingInterval);
      let monthlyContribution = new Prisma.Decimal(0);

      switch (sub.plan.billingFrequency) {
        case BillingFrequency.DAILY:
          monthlyContribution = subItemsTotal.mul(30).div(interval);
          break;
        case BillingFrequency.WEEKLY:
          // 52 / 12 approx 4.3333
          monthlyContribution = subItemsTotal.mul(52).div(12).div(interval);
          break;
        case BillingFrequency.MONTHLY:
          monthlyContribution = subItemsTotal.div(interval);
          break;
        case BillingFrequency.YEARLY:
          monthlyContribution = subItemsTotal.div(12).div(interval);
          break;
      }

      mrr = mrr.add(monthlyContribution);
    }

    const arr = mrr.mul(12);

    // 2. Subscription lifecycle counts
    let activeSubsCount = 0;
    let pausedSubsCount = 0;
    let closedSubsCount = 0;
    let draftSubsCount = 0;

    for (const s of allSubscriptions) {
      if (s.status === SubscriptionStatus.ACTIVE) activeSubsCount++;
      else if (s.status === SubscriptionStatus.PAUSED) pausedSubsCount++;
      else if (s.status === SubscriptionStatus.CLOSED) closedSubsCount++;
      else if (s.status === SubscriptionStatus.DRAFT) draftSubsCount++;
    }

    const totalSubscribersEver = activeSubsCount + closedSubsCount;
    const churnRate =
      totalSubscribersEver > 0
        ? ((closedSubsCount / totalSubscribersEver) * 100).toFixed(1)
        : "0.0";

    // 3. Invoices, Receivables & Overdue Aging Analysis
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.PAID] },
      },
      select: {
        status: true,
        totalAmount: true,
        amountPaid: true,
        dueDate: true,
      },
    });

    let totalInvoiced = new Prisma.Decimal(0);
    let totalPaid = new Prisma.Decimal(0);
    let totalOutstanding = new Prisma.Decimal(0);
    let totalOverdue = new Prisma.Decimal(0);

    const agingBuckets = {
      under30Days: new Prisma.Decimal(0),
      days31To60: new Prisma.Decimal(0),
      days61To90: new Prisma.Decimal(0),
      over90Days: new Prisma.Decimal(0),
    };

    for (const inv of invoices) {
      totalInvoiced = totalInvoiced.add(inv.totalAmount);
      totalPaid = totalPaid.add(inv.amountPaid);

      if (inv.status === InvoiceStatus.CONFIRMED) {
        const balance = inv.totalAmount.sub(inv.amountPaid);
        if (balance.gt(0)) {
          totalOutstanding = totalOutstanding.add(balance);

          if (inv.dueDate < now) {
            totalOverdue = totalOverdue.add(balance);

            const diffTime = Math.abs(now.getTime() - inv.dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
              agingBuckets.under30Days = agingBuckets.under30Days.add(balance);
            } else if (diffDays <= 60) {
              agingBuckets.days31To60 = agingBuckets.days31To60.add(balance);
            } else if (diffDays <= 90) {
              agingBuckets.days61To90 = agingBuckets.days61To90.add(balance);
            } else {
              agingBuckets.over90Days = agingBuckets.over90Days.add(balance);
            }
          }
        }
      }
    }

    // 4. Payments total
    const payments = await prisma.payment.findMany({
      select: {
        amount: true,
        unallocatedAmount: true,
      },
    });

    let totalPaymentsReceived = new Prisma.Decimal(0);
    let totalUnallocatedFloat = new Prisma.Decimal(0);

    for (const p of payments) {
      totalPaymentsReceived = totalPaymentsReceived.add(p.amount);
      totalUnallocatedFloat = totalUnallocatedFloat.add(p.unallocatedAmount);
    }

    // 5. Recent Activity Stream
    const [recentInvoices, recentPayments, recentSubs] = await Promise.all([
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { companyName: true } } },
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: { select: { companyName: true } } },
      }),
      prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { companyName: true } },
          plan: { select: { name: true } },
        },
      }),
    ]);

    return {
      mrr: mrr.toFixed(2),
      arr: arr.toFixed(2),
      activeSubscriptions: activeSubsCount,
      pausedSubscriptions: pausedSubsCount,
      closedSubscriptions: closedSubsCount,
      draftSubscriptions: draftSubsCount,
      churnRate: `${churnRate}%`,
      totalInvoiced: totalInvoiced.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalOutstanding: totalOutstanding.toFixed(2),
      totalOverdue: totalOverdue.toFixed(2),
      totalPaymentsReceived: totalPaymentsReceived.toFixed(2),
      totalUnallocatedFloat: totalUnallocatedFloat.toFixed(2),
      agingBuckets: {
        under30Days: agingBuckets.under30Days.toFixed(2),
        days31To60: agingBuckets.days31To60.toFixed(2),
        days61To90: agingBuckets.days61To90.toFixed(2),
        over90Days: agingBuckets.over90Days.toFixed(2),
      },
      recentActivity: {
        invoices: recentInvoices.map((i) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          customerName: i.customer.companyName,
          amount: i.totalAmount.toFixed(2),
          status: i.status,
          date: i.createdAt,
        })),
        payments: recentPayments.map((p) => ({
          id: p.id,
          paymentNumber: p.paymentNumber,
          customerName: p.customer.companyName,
          amount: p.amount.toFixed(2),
          method: p.paymentMethod,
          date: p.paymentDate,
        })),
        subscriptions: recentSubs.map((s) => ({
          id: s.id,
          subscriptionNumber: s.subscriptionNumber,
          customerName: s.customer.companyName,
          planName: s.plan.name,
          status: s.status,
          date: s.createdAt,
        })),
      },
    };
  }
}
