import { z } from "zod";
import { BillingFrequency } from "@prisma/client";

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

export const createPlanSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Plan name must be at least 2 characters"),
    description: z.string().optional(),
    price: decimalStringOrNumber,
    billingFrequency: z.nativeEnum(BillingFrequency).default(BillingFrequency.MONTHLY),
    billingInterval: z.number().int().min(1, "Billing interval must be at least 1").default(1),
    minQuantity: z.number().int().min(1).default(1),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    autoCloseOnExpiry: z.boolean().default(true),
    allowEarlyClosure: z.boolean().default(true),
    allowPause: z.boolean().default(true),
    allowRenewal: z.boolean().default(true),
    isActive: z.boolean().default(true),
  }),
});

export const updatePlanSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid plan ID format"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: decimalStringOrNumber.optional(),
    billingFrequency: z.nativeEnum(BillingFrequency).optional(),
    billingInterval: z.number().int().min(1).optional(),
    minQuantity: z.number().int().min(1).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    autoCloseOnExpiry: z.boolean().optional(),
    allowEarlyClosure: z.boolean().optional(),
    allowPause: z.boolean().optional(),
    allowRenewal: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>["body"];
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>["body"];
