import { describe, expect, it } from "vitest";

import { paymentRequestSchema } from "./payment-request.schema";

describe("paymentRequestSchema", () => {
  it("normalizes XLM asset code and validates positive amount", () => {
    const parsed = paymentRequestSchema.parse({
      title: " Market invoice ",
      amount: "12.50",
    });

    expect(parsed.title).toBe("Market invoice");
    expect(parsed.amount).toBe(12.5);
    expect(parsed.assetCode).toBe("XLM");
  });

  it("ignores client-supplied Stellar destinations", () => {
    const parsed = paymentRequestSchema.parse({
      title: "Market invoice",
      amount: "12.50",
      stellarDestination: "not-a-key",
    } as unknown);

    expect("stellarDestination" in parsed).toBe(false);
  });
});
