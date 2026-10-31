import { z } from "zod";
import { SubscriptionStatus } from "@prisma/client";

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

export const subscriptionItemInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID must be valid").optional().nullable(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  unitPrice: decimalStringOrNumber.optional(),
});

export const createSubscriptionSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    startDate: z.string().datetime().optional(),
    paymentTerms: z.string().min(1).default("Due on receipt"),
    items: z.array(subscriptionItemInputSchema).min(1, "Subscription must have at least one product"),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid subscription ID"),
  }),
  body: z.object({
    paymentTerms: z.string().min(1).optional(),
    status: z.nativeEnum(SubscriptionStatus).optional(),
  }),
});

export const pauseSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid subscription ID"),
  }),
  body: z
    .object({
      reason: z.string().optional(),
    })
    .optional(),
});

export const resumeSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid subscription ID"),
  }),
});

export const closeSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid subscription ID"),
  }),
  body: z.object({
    reason: z.string().min(2, "Closure reason is required"),
  }),
});

export const renewSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid subscription ID"),
  }),
  body: z
    .object({
      extensionIntervals: z.number().int().min(1).default(1),
    })
    .optional(),
});

export const getSubscriptionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    status: z.nativeEnum(SubscriptionStatus).optional(),
    customerId: z.string().min(1).optional(),
    search: z.string().optional(),
  }),
});

export type SubscriptionItemInput = z.infer<typeof subscriptionItemInputSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>["body"];
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>["body"];
export type CloseSubscriptionInput = z.infer<typeof closeSubscriptionSchema>["body"];
export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>["body"];
