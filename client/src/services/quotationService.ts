import { api } from "./api";
import { Product, ProductVariant, Plan } from "./catalogService";

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  taxRate: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  total: string | number;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface CustomerInfo {
  id: string;
  userId?: string | null;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  planId?: string | null;
  createdById?: string | null;
  status: "DRAFT" | "SENT" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
  subtotal: string | number;
  taxAmount: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  expiresAt: string;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerInfo;
  plan?: Plan | null;
  items?: QuotationItem[];
  createdBy?: { id: string; name: string; email: string } | null;
  subscription?: { id: string; subscriptionNumber: string; status: string } | null;
  subscriptions?: { id: string; subscriptionNumber: string; status: string }[];
}

export interface QuotationTemplate {
  id: string;
  name: string;
  description?: string | null;
  validityDays: number;
  templateData: any;
  isActive: boolean;
  createdAt: string;
}

export interface CreateQuotationItemPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice?: number | string;
  taxRate?: number | string;
  discountAmount?: number | string;
}

export interface CreateQuotationPayload {
  customerId: string;
  planId?: string | null;
  validityDays?: number;
  discountCode?: string | null;
  items: CreateQuotationItemPayload[];
}

export const quotationService = {
  async getQuotations(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    search?: string;
  }) {
    const res = await api.get<{
      success: boolean;
      data: {
        quotations: Quotation[];
        pagination: { total: number; page: number; limit: number; pages: number };
      };
    }>("/quotations", { params });
    return res.data.data;
  },

  async getQuotation(id: string) {
    const res = await api.get<{ success: boolean; data: { quotation: Quotation } }>(
      `/quotations/${id}`
    );
    return res.data.data.quotation;
  },

  async createQuotation(payload: CreateQuotationPayload) {
    const res = await api.post<{ success: boolean; data: { quotation: Quotation } }>(
      "/quotations",
      payload
    );
    return res.data.data.quotation;
  },

  async updateQuotation(id: string, payload: Partial<CreateQuotationPayload> & { status?: string }) {
    const res = await api.patch<{ success: boolean; data: { quotation: Quotation } }>(
      `/quotations/${id}`,
      payload
    );
    return res.data.data.quotation;
  },

  async sendQuotation(id: string) {
    const res = await api.post<{ success: boolean; data: { quotation: Quotation } }>(
      `/quotations/${id}/send`
    );
    return res.data.data.quotation;
  },

  async confirmQuotation(id: string) {
    const res = await api.post<{ success: boolean; data: { quotation: Quotation } }>(
      `/quotations/${id}/confirm`
    );
    return res.data.data.quotation;
  },

  async convertToSubscription(id: string, payload?: { startDate?: string; paymentTerms?: string }) {
    const res = await api.post<{
      success: boolean;
      data: { subscription: any; message: string };
    }>(`/quotations/${id}/convert-to-subscription`, payload || {});
    return res.data.data;
  },

  async listTemplates() {
    const res = await api.get<{ success: boolean; data: { templates: QuotationTemplate[] } }>(
      "/quotations/templates"
    );
    return res.data.data.templates;
  },

  async createTemplate(payload: {
    name: string;
    description?: string;
    validityDays?: number;
    templateData: CreateQuotationItemPayload[];
  }) {
    const res = await api.post<{ success: boolean; data: { template: QuotationTemplate } }>(
      "/quotations/templates",
      payload
    );
    return res.data.data.template;
  },

  async deleteTemplate(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/quotations/templates/${id}`
    );
    return res.data;
  },

  async listCustomers(params?: { search?: string }) {
    const res = await api.get<{
      success: boolean;
      data: { customers: CustomerInfo[]; pagination: any };
    }>("/customers", { params });
    return res.data.data.customers;
  },
};
