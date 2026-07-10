import { describe, expect, it } from "vitest";

import { stellarExplorerTxUrl, truncateStellarHash } from "./stellar";

describe("truncateStellarHash", () => {
  it("truncates a 64-character hash with ellipsis", () => {
    const hash = "a".repeat(32) + "b".repeat(32);
    expect(truncateStellarHash(hash)).toBe(`${"a".repeat(8)}…${"b".repeat(8)}`);
  });
});

describe("stellarExplorerTxUrl", () => {
  it("builds a Stellar Expert testnet transaction URL", () => {
    const hash = "abc123";
    expect(stellarExplorerTxUrl(hash)).toBe(
      "https://stellar.expert/explorer/testnet/tx/abc123",
    );
  });
});
