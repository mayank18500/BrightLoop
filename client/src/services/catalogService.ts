import { api } from "./api";

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: string | number;
  effectivePrice?: string | number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  type: string;
  salesPrice: string | number;
  costPrice: string | number;
  description?: string | null;
  isActive: boolean;
  variants: ProductVariant[];
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  billingFrequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  billingInterval: number;
  minQuantity: number;
  startDate?: string | null;
  endDate?: string | null;
  autoCloseOnExpiry: boolean;
  allowEarlyClosure: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  isActive: boolean;
}

export interface TaxRule {
  id: string;
  name: string;
  taxRate: string | number;
  taxType: "PERCENTAGE" | "FIXED_AMOUNT";
  isDefault: boolean;
  isActive: boolean;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string | number;
  minPurchaseAmount?: string | number | null;
  minQuantity?: number | null;
  maxUsageCount?: number | null;
  currentUsageCount: number;
  isActive: boolean;
}

export const catalogService = {
  // Products
  async getProducts() {
    const res = await api.get<{ success: boolean; data: { products: Product[] } }>("/products");
    return res.data.data.products;
  },

  async createProduct(data: {
    name: string;
    type: string;
    salesPrice: string;
    costPrice: string;
    description?: string;
    variants?: { name: string; priceAdjustment: string; isActive: boolean }[];
  }) {
    const res = await api.post<{ success: boolean; data: { product: Product } }>("/products", data);
    return res.data.data.product;
  },

  async deleteProduct(id: string) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  // Plans
  async getPlans() {
    const res = await api.get<{ success: boolean; data: { plans: Plan[] } }>("/plans");
    return res.data.data.plans;
  },

  async createPlan(data: Partial<Plan>) {
    const res = await api.post<{ success: boolean; data: { plan: Plan } }>("/plans", data);
    return res.data.data.plan;
  },

  async deletePlan(id: string) {
    const res = await api.delete(`/plans/${id}`);
    return res.data;
  },

  // Taxes
  async getTaxes() {
    const res = await api.get<{ success: boolean; data: { taxes: TaxRule[] } }>("/taxes");
    return res.data.data.taxes;
  },

  async createTax(data: Partial<TaxRule>) {
    const res = await api.post<{ success: boolean; data: { taxRule: TaxRule } }>("/taxes", data);
    return res.data.data.taxRule;
  },

  // Discounts
  async getDiscounts() {
    const res = await api.get<{ success: boolean; data: { discounts: Discount[] } }>("/discounts");
    return res.data.data.discounts;
  },

  async createDiscount(data: Partial<Discount>) {
    const res = await api.post<{ success: boolean; data: { discount: Discount } }>("/discounts", data);
    return res.data.data.discount;
  },
};
