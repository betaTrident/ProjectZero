import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductShowcase } from "./product-showcase";

describe("ProductShowcase", () => {
  it("renders illustrative merchant operations with accurate MVP assets", () => {
    const html = renderToStaticMarkup(<ProductShowcase />);

    expect(html).toContain("Invoice dashboard");
    expect(html).toContain("Create and share");
    expect(html).toContain("Verification timeline");
    expect(html).toContain("125.00 XLM");
    expect(html).toContain("Stellar");
    expect(html).toContain("Example invoice QR code");
    expect(html).not.toContain("USDC");
    expect(html).not.toContain("PHP");
  });
});
