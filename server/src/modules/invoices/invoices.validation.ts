import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

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

export const invoiceItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID must be valid").optional().nullable(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unitPrice: decimalStringOrNumber,
  taxRate: decimalStringOrNumber.optional(),
  discountAmount: decimalStringOrNumber.optional(),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    subscriptionId: z.string().min(1, "Subscription ID must be valid").optional().nullable(),
    billingPeriodStart: z.string().datetime().optional().nullable(),
    billingPeriodEnd: z.string().datetime().optional().nullable(),
    issueDate: z.string().datetime().optional(),
    dueDate: z.string().datetime({ message: "Valid due date is required" }),
    notes: z.string().optional().nullable(),
    discountCode: z.string().optional().nullable(),
    items: z.array(invoiceItemInputSchema).min(1, "Invoice must contain at least one line item"),
  }),
});

export const updateInvoiceStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid invoice ID"),
  }),
  body: z
    .object({
      notes: z.string().optional(),
    })
    .optional(),
});

export const runRecurringBillingSchema = z.object({
  body: z
    .object({
      targetDate: z.string().datetime().optional(),
      subscriptionId: z.string().min(1).optional(),
    })
    .optional(),
});

export const getInvoicesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    status: z.nativeEnum(InvoiceStatus).optional(),
    customerId: z.string().min(1).optional(),
    subscriptionId: z.string().min(1).optional(),
    search: z.string().optional(),
    isOverdue: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  }),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>["body"];
export type RunRecurringBillingInput = z.infer<typeof runRecurringBillingSchema>["body"];
