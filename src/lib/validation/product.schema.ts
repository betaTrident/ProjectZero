import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
  price: z.coerce.number().positive().max(999999999.99),
  assetCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,12}$/)
    .default("XLM"),
  imageUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;
