import { api } from "./api";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  variantId?: string | null;
  description: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  product?: {
    id: string;
    name: string;
    salesPrice: string | number;
  };
  variant?: {
    id: string;
    name: string;
    priceAdjustment: string | number;
  } | null;
}

export interface InvoiceAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: string | number;
  allocatedAt: string;
  notes?: string | null;
  payment?: {
    id: string;
    paymentNumber: string;
    paymentMethod: string;
    amount: string | number;
    paymentDate: string;
    recordedBy?: {
      name: string;
    };
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  subscriptionId?: string | null;
  customerId: string;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  issueDate: string;
  dueDate: string;
  status: "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED";
  subtotal: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  amountPaid: string | number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone?: string | null;
    billingAddress?: string | null;
    taxId?: string | null;
  };
  subscription?: {
    id: string;
    subscriptionNumber: string;
    paymentTerms: string;
    plan?: {
      id: string;
      name: string;
      billingFrequency: string;
      billingInterval: number;
    };
  } | null;
  items: InvoiceItem[];
  allocations?: InvoiceAllocation[];
  balanceDue?: string | number;
  isOverdue?: boolean;
}

export interface InvoiceMetrics {
  totalInvoiced: string;
  totalPaid: string;
  totalOutstanding: string;
  overdueAmount: string;
  overdueCount: number;
  draftCount: number;
  confirmedCount: number;
  paidCount: number;
  totalCount: number;
}

export interface CreateInvoicePayload {
  customerId: string;
  subscriptionId?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
  issueDate?: string;
  dueDate: string;
  notes?: string | null;
  discountCode?: string | null;
  items: {
    productId: string;
    variantId?: string | null;
    description: string;
    quantity: number;
    unitPrice: string | number;
    taxRate?: string | number;
    discountAmount?: string | number;
  }[];
}

export const invoiceService = {
  async getInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    subscriptionId?: string;
    search?: string;
    isOverdue?: boolean;
  }) {
    const res = await api.get<{
      status: string;
      data: Invoice[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/invoices", { params });
    return res.data;
  },

  async getInvoiceMetrics() {
    const res = await api.get<{
      status: string;
      data: InvoiceMetrics;
    }>("/invoices/metrics");
    return res.data.data;
  },

  async getInvoiceById(id: string) {
    const res = await api.get<{
      status: string;
      data: Invoice;
    }>(`/invoices/${id}`);
    return res.data.data;
  },

  async createInvoice(payload: CreateInvoicePayload) {
    const res = await api.post<{
      status: string;
      message: string;
      data: Invoice;
    }>("/invoices", payload);
    return res.data.data;
  },

  async confirmInvoice(id: string) {
    const res = await api.post<{
      status: string;
      message: string;
      data: Invoice;
    }>(`/invoices/${id}/confirm`);
    return res.data.data;
  },

  async cancelInvoice(id: string, notes?: string) {
    const res = await api.post<{
      status: string;
      message: string;
      data: Invoice;
    }>(`/invoices/${id}/cancel`, { notes });
    return res.data.data;
  },

  async runRecurringBilling(payload?: { targetDate?: string; subscriptionId?: string }) {
    const res = await api.post<{
      status: string;
      message: string;
      data: {
        evaluatedSubscriptions: number;
        createdInvoices: string[];
        skippedDuplicates: string[];
        errors: Array<{ subscriptionNumber: string; error: string }>;
      };
    }>("/invoices/generate-recurring", payload);
    return res.data;
  },
};
