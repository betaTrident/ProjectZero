import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyPaymentByHash } from "./verify-payment";

const mockTransactionCall = vi.fn();
const mockPaymentsCall = vi.fn();

vi.mock("./client", () => ({
  getStellarServer: vi.fn(() => ({
    transactions: () => ({
      transaction: () => ({
        call: mockTransactionCall,
      }),
    }),
    payments: () => ({
      forTransaction: () => ({
        call: mockPaymentsCall,
      }),
    }),
  })),
}));

const expected = {
  memo: "test-memo-123",
  destination: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
  amount: "10.0000000",
  assetCode: "XLM",
  assetIssuer: null,
};

describe("verifyPaymentByHash", () => {
  beforeEach(() => {
    mockTransactionCall.mockResolvedValue({
      memo: expected.memo,
    });
    mockPaymentsCall.mockResolvedValue({
      records: [
        {
          type: "payment",
          to: expected.destination,
          amount: expected.amount,
          asset_type: "native",
        },
      ],
    });
  });

  it("returns ok:true for exact memo, destination, amount, and native asset match", async () => {
    await expect(verifyPaymentByHash("a".repeat(64), expected)).resolves.toEqual({ ok: true });
  });

  it("returns memo reason when transaction memo does not match", async () => {
    await expect(
      verifyPaymentByHash("a".repeat(64), { ...expected, memo: "wrong-memo" }),
    ).resolves.toEqual({ ok: false, reason: "memo" });
  });

  it("returns destination reason when payment destination does not match", async () => {
    await expect(
      verifyPaymentByHash("a".repeat(64), {
        ...expected,
        destination: "GBVQ7HRPQ52P4GKHRXAFRDKKL3BXQNMKJ3OAMDCMZRQ7S7XGJPNEGFE",
      }),
    ).resolves.toEqual({ ok: false, reason: "destination" });
  });

  it("returns amount reason when payment amount does not match at 7-decimal precision", async () => {
    await expect(
      verifyPaymentByHash("a".repeat(64), { ...expected, amount: "99.0000000" }),
    ).resolves.toEqual({ ok: false, reason: "amount" });
  });

  it("returns asset reason when credit asset code or issuer does not match", async () => {
    mockPaymentsCall.mockResolvedValue({
      records: [
        {
          type: "payment",
          to: expected.destination,
          amount: expected.amount,
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        },
      ],
    });

    await expect(
      verifyPaymentByHash("a".repeat(64), {
        ...expected,
        assetCode: "EURC",
        assetIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      }),
    ).resolves.toEqual({ ok: false, reason: "asset" });
  });

  it("returns a clear reason when the transaction has no payment operation", async () => {
    mockPaymentsCall.mockResolvedValue({
      records: [
        {
          type: "manage_data",
        },
      ],
    });

    await expect(verifyPaymentByHash("a".repeat(64), expected)).resolves.toEqual({
      ok: false,
      reason: "no payment operation in transaction",
    });
  });
});
