import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentReceipt } from "./payment-receipt";

describe("PaymentReceipt", () => {
  it("shows amount, merchant, and explorer link when hash is available", () => {
    const html = renderToStaticMarkup(
      <PaymentReceipt
        amount="42.50"
        assetCode="XLM"
        merchantName="Sari-Sari ZERO"
        txHash="abc123def4567890abcdef1234567890abcdef1234567890abcdef1234567890"
      />,
    );

    expect(html).toContain("42.50");
    expect(html).toContain("XLM");
    expect(html).toContain("Sari-Sari ZERO");
    expect(html).toContain("Payment confirmed");
    expect(html).toContain("stellar.expert");
    expect(html).toContain("Return to merchant");
  });

  it("omits explorer link when hash is missing", () => {
    const html = renderToStaticMarkup(
      <PaymentReceipt amount="10.00" assetCode="XLM" merchantName="Test Merchant" />,
    );

    expect(html).toContain("Payment confirmed");
    expect(html).not.toContain("stellar.expert");
  });
});
