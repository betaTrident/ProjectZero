import { describe, expect, it } from "vitest";

import { paymentRequestSchema } from "./payment-request.schema";

describe("paymentRequestSchema", () => {
  it("normalizes XLM asset code and validates positive amount", () => {
    const parsed = paymentRequestSchema.parse({
      title: " Market invoice ",
      amount: "12.50",
      stellarDestination: "G".repeat(56),
    });

    expect(parsed.title).toBe("Market invoice");
    expect(parsed.amount).toBe(12.5);
    expect(parsed.assetCode).toBe("XLM");
  });

  it("rejects invalid Stellar public keys", () => {
    const parsed = paymentRequestSchema.safeParse({
      title: "Market invoice",
      amount: "12.50",
      stellarDestination: "not-a-key",
    });

    expect(parsed.success).toBe(false);
  });
});
