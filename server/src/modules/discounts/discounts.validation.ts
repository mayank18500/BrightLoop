import { z } from "zod";
import { DiscountType } from "@prisma/client";

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

export const createDiscountSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(2, "Discount code must be at least 2 characters")
      .regex(/^[A-Z0-9_-]+$/, "Code must contain only uppercase letters, numbers, and hyphens"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    discountType: z.nativeEnum(DiscountType).default(DiscountType.PERCENTAGE),
    value: decimalStringOrNumber,
    minPurchaseAmount: decimalStringOrNumber.optional(),
    minQuantity: z.number().int().min(1).optional(),
    maxUsageCount: z.number().int().min(1).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().default(true),
  }),
});

export const updateDiscountSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid discount ID format"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    discountType: z.nativeEnum(DiscountType).optional(),
    value: decimalStringOrNumber.optional(),
    minPurchaseAmount: decimalStringOrNumber.nullable().optional(),
    minQuantity: z.number().int().min(1).nullable().optional(),
    maxUsageCount: z.number().int().min(1).nullable().optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const validateDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Discount code is required"),
    subtotal: decimalStringOrNumber,
    quantity: z.number().int().min(1).default(1),
  }),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>["body"];
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>["body"];
export type ValidateDiscountInput = z.infer<typeof validateDiscountSchema>["body"];
