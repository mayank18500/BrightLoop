import { z } from "zod";

const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
  }),
});

export const updateStaffStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>["body"];
