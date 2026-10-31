import { api } from "./api";

export interface FinancialAnalytics {
  mrr: string;
  arr: string;
  activeSubscriptions: number;
  pausedSubscriptions: number;
  closedSubscriptions: number;
  draftSubscriptions: number;
  churnRate: string;
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  totalOverdue: string;
  totalPaymentsReceived: string;
  totalUnallocatedFloat: string;
  agingBuckets: {
    under30Days: string;
    days31To60: string;
    days61To90: string;
    over90Days: string;
  };
  recentActivity: {
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      customerName: string;
      amount: string;
      status: string;
      date: string;
    }>;
    payments: Array<{
      id: string;
      paymentNumber: string;
      customerName: string;
      amount: string;
      method: string;
      date: string;
    }>;
    subscriptions: Array<{
      id: string;
      subscriptionNumber: string;
      customerName: string;
      planName: string;
      status: string;
      date: string;
    }>;
  };
}

export const reportService = {
  async getFinancialAnalytics(): Promise<FinancialAnalytics> {
    const res = await api.get<{
      status: string;
      data: FinancialAnalytics;
    }>("/reports/analytics");
    return res.data.data;
  },
};
