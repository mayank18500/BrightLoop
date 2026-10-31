import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

const decimalStringOrNumber = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "number" ? val : parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "Must be a valid non-negative number" }
  )
  .transform((val) => (typeof val === "number" ? val.toFixed(2) : parseFloat(val).toFixed(2)));

export const quotationItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID must be a valid string").optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unitPrice: decimalStringOrNumber.optional(),
  taxRate: decimalStringOrNumber.optional(),
  discountAmount: decimalStringOrNumber.optional(),
});

export const createQuotationSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    planId: z.string().min(1).optional().nullable(),
    validityDays: z.number().int().min(1).max(365).default(30),
    discountCode: z.string().optional().nullable(),
    items: z.array(quotationItemInputSchema).min(1, "Quotation must have at least one product item"),
  }),
});

export const updateQuotationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid quotation ID format"),
  }),
  body: z.object({
    planId: z.string().min(1).optional().nullable(),
    validityDays: z.number().int().min(1).max(365).optional(),
    discountCode: z.string().optional().nullable(),
    items: z.array(quotationItemInputSchema).min(1).optional(),
    status: z.nativeEnum(QuotationStatus).optional(),
  }),
});

export const convertQuotationSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid quotation ID format"),
  }),
  body: z.object({
    startDate: z.string().datetime().optional(),
    paymentTerms: z.string().min(1).default("Due on receipt"),
  }).optional(),
});

export const createTemplateSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Template name must be at least 2 characters"),
    description: z.string().optional(),
    validityDays: z.number().int().min(1).default(30),
    templateData: z.array(quotationItemInputSchema).min(1, "Template must define at least one item"),
    isActive: z.boolean().default(true),
  }),
});

export const getQuotationsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    status: z.nativeEnum(QuotationStatus).optional(),
    customerId: z.string().min(1).optional(),
    search: z.string().optional(),
  }),
});

export type QuotationItemInput = z.infer<typeof quotationItemInputSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>["body"];
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>["body"];
export type ConvertQuotationInput = z.infer<typeof convertQuotationSchema>["body"];
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>["body"];
