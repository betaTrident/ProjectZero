import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "@/app/(marketing)/page";

describe("Marketing landing page", () => {
  it("uses accurate CTAs, section anchors, and product claims", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("Start accepting payments");
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="#how-it-works"');
    expect(html).toContain('id="product"');
    expect(html).toContain('id="how-it-works"');
    expect(html).toContain('id="security"');
    expect(html).toContain('id="use-cases"');
    expect(html).not.toMatch(/Phase\s*\d/i);
    expect(html).toContain("Freighter");
    expect(html).toContain("Stellar Testnet");
    expect(html).toContain("XLM");
    expect(html).toContain("server-side");
    expect(html).not.toContain("USDC");
    expect(html).not.toContain("PHP");
    expect(html).not.toContain("anonymous");
    expect(html).not.toContain("Mainnet");
  });
});
