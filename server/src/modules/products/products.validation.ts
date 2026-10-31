import { z } from "zod";

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

export const createProductVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  priceAdjustment: decimalStringOrNumber.default("0.00"),
  isActive: z.boolean().default(true),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    type: z.string().default("SOFTWARE"),
    salesPrice: decimalStringOrNumber,
    costPrice: decimalStringOrNumber.default("0.00"),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    variants: z.array(createProductVariantSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    type: z.string().optional(),
    salesPrice: decimalStringOrNumber.optional(),
    costPrice: decimalStringOrNumber.optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const addVariantSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid product ID format"),
  }),
  body: createProductVariantSchema,
});

export const updateVariantSchema = z.object({
  params: z.object({
    productId: z.string().uuid("Invalid product ID format"),
    variantId: z.string().uuid("Invalid variant ID format"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    priceAdjustment: decimalStringOrNumber.optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    search: z.string().optional(),
    type: z.string().optional(),
    isActive: z
      .string()
      .optional()
      .transform((val) => (val === undefined ? undefined : val === "true")),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type AddVariantInput = z.infer<typeof addVariantSchema>["body"];
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>["body"];
