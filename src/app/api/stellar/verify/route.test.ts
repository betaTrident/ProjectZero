import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { resetRateLimitStoreForTests } from "@/lib/http/request-rate-limit";

const maybeSingle = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/service", () => ({
  getServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
    })),
    rpc,
  })),
}));

vi.mock("@/lib/stellar/verify-payment", () => ({
  verifyPaymentByHash: vi.fn(async () => ({ ok: true })),
}));

function verifyRequest(paymentRequestId: string, ip = "203.0.113.10") {
  return new NextRequest("https://zero.test/api/stellar/verify", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({
      paymentRequestId,
      stellarTxHash: "a".repeat(64),
    }),
  });
}

describe("POST /api/stellar/verify", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    maybeSingle.mockResolvedValue({
      data: {
        id: "20000000-0000-4000-8000-000000000001",
        status: "pending",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        memo: "ZERO-TEST",
        stellar_destination: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
        amount: "5.00",
        asset_code: "XLM",
        asset_issuer: null,
      },
      error: null,
    });
    rpc.mockResolvedValue({ error: null });
  });

  it("rate-limits repeated verify attempts for the same payment request", async () => {
    const { POST } = await import("./route");
    const paymentRequestId = "20000000-0000-4000-8000-000000000001";

    const first = await POST(verifyRequest(paymentRequestId));
    const second = await POST(verifyRequest(paymentRequestId));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toEqual({ ok: false, reason: "rate limited" });
  });
});
