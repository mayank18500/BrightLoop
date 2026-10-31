import { api } from "./api";
import { Product, ProductVariant, Plan } from "./catalogService";
import { CustomerInfo } from "./quotationService";

export interface SubscriptionItem {
  id: string;
  subscriptionId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: string | number;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  quotationId?: string | null;
  status: "DRAFT" | "QUOTATION" | "CONFIRMED" | "ACTIVE" | "PAUSED" | "CLOSED";
  startDate: string;
  expiryDate?: string | null;
  nextBillingDate: string;
  lastBilledDate?: string | null;
  paymentTerms: string;
  pausedAt?: string | null;
  closedAt?: string | null;
  closureReason?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerInfo;
  plan?: Plan;
  items: SubscriptionItem[];
  quotation?: { id: string; quotationNumber: string } | null;
  invoices?: any[];
  _count?: { invoices: number };
}

export interface CreateSubscriptionPayload {
  customerId: string;
  planId: string;
  startDate?: string;
  paymentTerms?: string;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice?: number | string;
  }[];
}

export const subscriptionService = {
  async getSubscriptions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    search?: string;
  }) {
    const res = await api.get<{
      success: boolean;
      data: {
        subscriptions: Subscription[];
        pagination: { total: number; page: number; limit: number; pages: number };
      };
    }>("/subscriptions", { params });
    return res.data.data;
  },

  async getSubscription(id: string) {
    const res = await api.get<{ success: boolean; data: { subscription: Subscription } }>(
      `/subscriptions/${id}`
    );
    return res.data.data.subscription;
  },

  async createSubscription(payload: CreateSubscriptionPayload) {
    const res = await api.post<{ success: boolean; data: { subscription: Subscription } }>(
      "/subscriptions",
      payload
    );
    return res.data.data.subscription;
  },

  async pauseSubscription(id: string, reason?: string) {
    const res = await api.post<{ success: boolean; data: { subscription: Subscription } }>(
      `/subscriptions/${id}/pause`,
      { reason }
    );
    return res.data.data.subscription;
  },

  async resumeSubscription(id: string) {
    const res = await api.post<{ success: boolean; data: { subscription: Subscription } }>(
      `/subscriptions/${id}/resume`
    );
    return res.data.data.subscription;
  },

  async closeSubscription(id: string, reason: string) {
    const res = await api.post<{ success: boolean; data: { subscription: Subscription } }>(
      `/subscriptions/${id}/close`,
      { reason }
    );
    return res.data.data.subscription;
  },

  async renewSubscription(id: string, extensionIntervals: number = 1) {
    const res = await api.post<{ success: boolean; data: { subscription: Subscription } }>(
      `/subscriptions/${id}/renew`,
      { extensionIntervals }
    );
    return res.data.data.subscription;
  },
};
