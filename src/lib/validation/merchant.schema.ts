import { z } from "zod";

const stellarPublicKeySchema = z
  .string()
  .trim()
  .regex(/^G[A-Z2-7]{55}$/, "Enter a valid Stellar public key.");

export const merchantSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .min(3)
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  stellarPublicKey: stellarPublicKeySchema
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

export type MerchantInput = z.infer<typeof merchantSchema>;
