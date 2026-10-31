import { z } from "zod";
import { TaxType } from "@prisma/client";

const taxRateSchema = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "number" ? val : parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    { message: "Tax rate must be between 0 and 100" }
  )
  .transform((val) => (typeof val === "number" ? val.toFixed(2) : parseFloat(val).toFixed(2)));

export const createTaxRuleSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Tax name must be at least 2 characters"),
    taxRate: taxRateSchema,
    taxType: z.nativeEnum(TaxType).default(TaxType.PERCENTAGE),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    effectiveFrom: z.string().datetime().optional(),
    effectiveUntil: z.string().datetime().optional(),
  }),
});

export const updateTaxRuleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid tax rule ID format"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    taxRate: taxRateSchema.optional(),
    taxType: z.nativeEnum(TaxType).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    effectiveFrom: z.string().datetime().optional(),
    effectiveUntil: z.string().datetime().nullable().optional(),
  }),
});

export type CreateTaxRuleInput = z.infer<typeof createTaxRuleSchema>["body"];
export type UpdateTaxRuleInput = z.infer<typeof updateTaxRuleSchema>["body"];
