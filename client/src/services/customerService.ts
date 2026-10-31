import { api } from "./api";
import { CustomerInfo } from "./quotationService";

export interface CreateCustomerPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  taxId?: string;
  password?: string;
}

export interface CustomerDetail extends CustomerInfo {
  user?: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  _count?: {
    quotations: number;
    subscriptions: number;
    invoices: number;
  };
  quotations?: Record<string, unknown>[];
  subscriptions?: Record<string, unknown>[];
  invoices?: Record<string, unknown>[];
}

export const customerService = {
  async listCustomers(params?: { search?: string; page?: number; limit?: number }) {
    const res = await api.get<{
      success: boolean;
      data: {
        customers: CustomerDetail[];
        pagination: { total: number; page: number; limit: number; pages: number };
      };
    }>("/customers", { params });
    return res.data.data;
  },

  async getCustomerById(id: string) {
    const res = await api.get<{
      success: boolean;
      data: { customer: CustomerDetail };
    }>(`/customers/${id}`);
    return res.data.data.customer;
  },

  async createCustomer(payload: CreateCustomerPayload) {
    const res = await api.post<{
      success: boolean;
      data: { customer: CustomerDetail; message: string };
    }>("/customers", payload);
    return res.data.data.customer;
  },
};
