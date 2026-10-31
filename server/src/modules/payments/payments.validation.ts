import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

const decimalStringOrNumber = z
  .union([z.number(), z.string()])
  .refine(
    (val) => {
      const num = typeof val === "number" ? val : parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Must be a valid positive number" }
  )
  .transform((val) => (typeof val === "number" ? val.toFixed(2) : parseFloat(val).toFixed(2)));

export const paymentAllocationInputSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: decimalStringOrNumber,
  notes: z.string().optional().nullable(),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, "Customer ID is required"),
    paymentMethod: z.nativeEnum(PaymentMethod, {
      errorMap: () => ({ message: "Invalid payment method. Must be UPI, BANK_TRANSFER, CASH, CHEQUE, or OTHER." }),
    }),
    amount: decimalStringOrNumber,
    paymentDate: z.string().datetime().optional(),
    notes: z.string().optional().nullable(),
    allocations: z.array(paymentAllocationInputSchema).optional(),
  }),
});

export const allocatePaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Payment ID is required"),
  }),
  body: z.object({
    allocations: z.array(paymentAllocationInputSchema).min(1, "At least one allocation is required"),
  }),
});

export const getPaymentsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    customerId: z.string().min(1).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    hasUnallocated: z
      .string()
      .optional()
      .transform((val) => val === "true"),
    search: z.string().optional(),
  }),
});

export type PaymentAllocationInput = z.infer<typeof paymentAllocationInputSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>["body"];
export type AllocatePaymentInput = z.infer<typeof allocatePaymentSchema>["body"];
