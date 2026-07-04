import { z } from "zod";

const stellarPublicKeySchema = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar public key.");

export const paymentRequestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
  amount: z.coerce.number().positive().max(999999999.99),
  assetCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,12}$/)
    .default("XLM"),
  stellarDestination: stellarPublicKeySchema,
  productId: z.string().uuid().optional(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
