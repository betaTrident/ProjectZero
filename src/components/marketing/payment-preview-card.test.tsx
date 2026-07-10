import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentPreviewCard } from "./payment-preview-card";

describe("PaymentPreviewCard", () => {
  it("shows a realistic Testnet invoice and wallet authorization preview", () => {
    const html = renderToStaticMarkup(<PaymentPreviewCard />);

    expect(html).toContain("125.00 XLM");
    expect(html).toContain("XLM");
    expect(html).toContain("Sari-Sari ZERO");
    expect(html).toContain("Payment verified");
    expect(html).toContain("Freighter");
    expect(html).toContain("Stellar Testnet");
    expect(html).toContain("Example payment link QR code");
    expect(html).not.toMatch(/Phase\s*\d/i);
    expect(html).not.toContain("bg-zinc-950");
    expect(html).not.toContain("bg-white");
    expect(html).not.toContain("USDC");
  });
});
