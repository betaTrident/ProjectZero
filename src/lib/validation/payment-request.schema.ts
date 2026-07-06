import { z } from "zod";

export const paymentRequestSchema = z
  .object({
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
    assetIssuer: z
      .string()
      .trim()
      .regex(/^G[A-Z2-7]{55}$/)
      .optional()
      .transform((value) => (value ? value : undefined)),
    productId: z.string().uuid().optional(),
    expiresAt: z
      .string()
      .datetime()
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .superRefine((value, context) => {
    if (value.assetCode !== "XLM" && !value.assetIssuer) {
      context.addIssue({
        code: "custom",
        path: ["assetIssuer"],
        message: "Asset issuer is required for non-native Stellar assets.",
      });
    }
  });

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;
