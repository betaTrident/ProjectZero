import { describe, expect, it } from "vitest";
import { Networks, Transaction } from "@stellar/stellar-sdk";

import { buildPaymentXDR, buildSep7Uri } from "./build-payment";

describe("buildPaymentXDR", () => {
  const base = {
    destination: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
    amount: "10.0000000",
    assetCode: "XLM",
    assetIssuer: null,
    memo: "test-memo-123",
    networkPassphrase: Networks.TESTNET,
  };

  it("produces XDR decodable by stellar-sdk", () => {
    const xdr = buildPaymentXDR(base);

    expect(() => new Transaction(xdr, Networks.TESTNET)).not.toThrow();
  });

  it("embeds the correct memo text", () => {
    const xdr = buildPaymentXDR(base);
    const tx = new Transaction(xdr, Networks.TESTNET);

    expect(tx.memo.value?.toString()).toBe("test-memo-123");
  });

  it("targets the correct destination", () => {
    const xdr = buildPaymentXDR(base);
    const tx = new Transaction(xdr, Networks.TESTNET);
    const op = tx.operations[0];

    expect(op.type).toBe("payment");
    if (op.type === "payment") {
      expect(op.destination).toBe(base.destination);
    }
  });

  it("builds valid XDR for a credit asset with issuer", () => {
    const assetIssuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const xdr = buildPaymentXDR({
      ...base,
      amount: "5.0000000",
      assetCode: "USDC",
      assetIssuer,
      memo: "test-credit",
    });
    const tx = new Transaction(xdr, Networks.TESTNET);
    const op = tx.operations[0];

    expect(op.type).toBe("payment");
    if (op.type === "payment") {
      expect(op.asset.code).toBe("USDC");
      expect(op.asset.issuer).toBe(assetIssuer);
    }
  });

  it("rejects memo text longer than Stellar's 28-character limit", () => {
    expect(() =>
      buildPaymentXDR({
        ...base,
        memo: "A".repeat(29),
      }),
    ).toThrow("Memo exceeds 28-character MEMO_TEXT limit: 29 characters");
  });
});

describe("buildSep7Uri", () => {
  it("builds a SEP-7 pay URI with the Stellar network passphrase", () => {
    const uri = buildSep7Uri({
      destination: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
      amount: "10.0000000",
      assetCode: "XLM",
      assetIssuer: null,
      memo: "test-memo-123",
      networkPassphrase: Networks.TESTNET,
      payLink: "https://zero.test/pay/request-1",
    });
    const url = new URL(uri);

    expect(url.protocol).toBe("web+stellar:");
    expect(url.pathname).toBe("pay");
    expect(url.searchParams.get("destination")).toBe(
      "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
    );
    expect(url.searchParams.get("network_passphrase")).toBe(Networks.TESTNET);
    expect(url.searchParams.get("callback")).toBe("url:https://zero.test/pay/request-1");
  });
});
