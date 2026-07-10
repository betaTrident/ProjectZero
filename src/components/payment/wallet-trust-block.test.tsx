import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WalletTrustBlock } from "./wallet-trust-block";

describe("WalletTrustBlock", () => {
  it("shows secure connection and key custody messaging", () => {
    const html = renderToStaticMarkup(<WalletTrustBlock />);

    expect(html).toContain("Secure connection");
    expect(html).toContain("Powered by Stellar Testnet");
    expect(html).toContain("We never hold your keys");
  });
});
