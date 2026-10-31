import dotenv from "dotenv";
import { z } from "zod";

// Ensure dotenv is loaded before schema validation
dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 65535) {
        throw new Error("PORT must be a valid integer between 1 and 65535");
      }
      return parsed;
    }),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL cannot be empty"),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z
    .string({ required_error: "JWT_SECRET is required" })
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_SECRET: z
    .string({ required_error: "COOKIE_SECRET is required" })
    .min(16, "COOKIE_SECRET must be at least 16 characters long"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CLIENT_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

const parsedResult = envSchema.safeParse(process.env);

if (!parsedResult.success) {
  console.error("\n=======================================================");
  console.error("❌ CRITICAL: Environment Variable Validation Failed");
  console.error("=======================================================");
  const formattedErrors = parsedResult.error.format();
  for (const [key, val] of Object.entries(formattedErrors)) {
    if (key !== "_errors" && val && typeof val === "object" && "_errors" in val) {
      const errMsgs = (val as { _errors: string[] })._errors;
      if (errMsgs.length > 0) {
        console.error(`  • [${key}]: ${errMsgs.join(", ")}`);
      }
    }
  }
  console.error("=======================================================\n");
  process.exit(1);
}

export const env: EnvConfig = {
  ...parsedResult.data,
  CLIENT_URL: parsedResult.data.CLIENT_URL || parsedResult.data.CORS_ORIGIN,
};
