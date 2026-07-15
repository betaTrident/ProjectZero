import { beforeEach, describe, expect, it, vi } from "vitest";
import { Account, Networks, Transaction } from "@stellar/stellar-sdk";

const loadAccount = vi.fn();

vi.mock("./client", () => ({
  getStellarServer: vi.fn(() => ({
    loadAccount,
  })),
}));

import { buildPaymentXDR, buildSep7Uri } from "./build-payment";

const SOURCE_KEY = "GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D";
const DESTINATION = "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4";

describe("buildPaymentXDR", () => {
  const base = {
    sourcePublicKey: SOURCE_KEY,
    destination: DESTINATION,
    amount: "10.0000000",
    assetCode: "XLM",
    assetIssuer: null,
    memo: "test-memo-123",
    networkPassphrase: Networks.TESTNET,
  };

  beforeEach(() => {
    loadAccount.mockResolvedValue(new Account(SOURCE_KEY, "123456789"));
  });

  it("loads the customer source account from Horizon", async () => {
    await buildPaymentXDR(base);

    expect(loadAccount).toHaveBeenCalledWith(SOURCE_KEY);
  });

  it("produces XDR decodable by stellar-sdk", async () => {
    const xdr = await buildPaymentXDR(base);

    expect(() => new Transaction(xdr, Networks.TESTNET)).not.toThrow();
  });

  it("uses the customer wallet as transaction source, not the destination", async () => {
    const xdr = await buildPaymentXDR(base);
    const tx = new Transaction(xdr, Networks.TESTNET);

    expect(tx.source).toBe(SOURCE_KEY);
  });

  it("embeds the correct memo text", async () => {
    const xdr = await buildPaymentXDR(base);
    const tx = new Transaction(xdr, Networks.TESTNET);

    expect(tx.memo.value?.toString()).toBe("test-memo-123");
  });

  it("targets the correct destination", async () => {
    const xdr = await buildPaymentXDR(base);
    const tx = new Transaction(xdr, Networks.TESTNET);
    const op = tx.operations[0];

    expect(op.type).toBe("payment");
    if (op.type === "payment") {
      expect(op.destination).toBe(base.destination);
    }
  });

  it("builds valid XDR for a credit asset with issuer", async () => {
    const assetIssuer = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
    const xdr = await buildPaymentXDR({
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

  it("rejects memo text longer than Stellar's 28-character limit", async () => {
    await expect(
      buildPaymentXDR({
        ...base,
        memo: "A".repeat(29),
      }),
    ).rejects.toThrow("Memo exceeds 28-character MEMO_TEXT limit: 29 characters");
  });
});

describe("buildSep7Uri", () => {
  it("builds a SEP-7 pay URI with the Stellar network passphrase", () => {
    const uri = buildSep7Uri({
      destination: DESTINATION,
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
    expect(url.searchParams.get("destination")).toBe(DESTINATION);
    expect(url.searchParams.get("network_passphrase")).toBe(Networks.TESTNET);
    expect(url.searchParams.get("callback")).toBe("url:https://zero.test/pay/request-1");
  });
});
