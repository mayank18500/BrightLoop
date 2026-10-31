import { api } from "./api";
import { CustomerInfo } from "./quotationService";

export type PaymentMethodType = "UPI" | "BANK_TRANSFER" | "CASH" | "CHEQUE" | "OTHER";

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: string | number;
  allocatedAt: string;
  notes?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: string | number;
    amountPaid: string | number;
    status: string;
    dueDate: string;
  };
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  paymentMethod: PaymentMethodType;
  amount: string | number;
  unallocatedAmount: string | number;
  paymentDate: string;
  notes?: string | null;
  recordedById?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerInfo;
  allocations: PaymentAllocation[];
  recordedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface PaymentMetrics {
  totalRecorded: string;
  totalAllocated: string;
  totalUnallocated: string;
  paymentCount: number;
}

export interface RecordPaymentPayload {
  customerId: string;
  paymentMethod: PaymentMethodType;
  amount: number | string;
  paymentDate?: string;
  notes?: string | null;
  allocations?: Array<{
    invoiceId: string;
    amount: number | string;
    notes?: string | null;
  }>;
}

export interface AllocatePaymentPayload {
  allocations: Array<{
    invoiceId: string;
    amount: number | string;
    notes?: string | null;
  }>;
}

export const paymentService = {
  async getPayments(params?: {
    page?: number;
    limit?: number;
    customerId?: string;
    paymentMethod?: string;
    hasUnallocated?: boolean;
    search?: string;
  }) {
    const res = await api.get<{
      status: string;
      data: Payment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/payments", { params });
    return res.data;
  },

  async getPaymentMetrics() {
    const res = await api.get<{
      status: string;
      data: PaymentMetrics;
    }>("/payments/metrics");
    return res.data.data;
  },

  async getPaymentById(id: string) {
    const res = await api.get<{
      status: string;
      data: Payment;
    }>(`/payments/${id}`);
    return res.data.data;
  },

  async recordPayment(payload: RecordPaymentPayload) {
    const res = await api.post<{
      status: string;
      message: string;
      data: Payment;
    }>("/payments", payload);
    return res.data.data;
  },

  async allocatePayment(id: string, payload: AllocatePaymentPayload) {
    const res = await api.post<{
      status: string;
      message: string;
      data: Payment;
    }>(`/payments/${id}/allocate`, payload);
    return res.data.data;
  },
};
