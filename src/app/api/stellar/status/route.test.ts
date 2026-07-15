import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { resetRateLimitStoreForTests } from "@/lib/http/request-rate-limit";

const single = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single,
    })),
  })),
}));

function statusRequest(id: string, ip = "203.0.113.10") {
  return new NextRequest(`https://zero.test/api/stellar/status?id=${id}`, {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("GET /api/stellar/status", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    single.mockResolvedValue({
      data: {
        id: "request-1",
        status: "pending",
        paid_at: null,
      },
      error: null,
    });
  });

  it("rate-limits repeated status polling for the same payment request", async () => {
    const { GET } = await import("./route");

    const first = await GET(statusRequest("request-1"));
    const second = await GET(statusRequest("request-1"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    await expect(second.json()).resolves.toEqual({ error: "rate limited" });
  });

  it("does not rate-limit a different payment request id", async () => {
    const { GET } = await import("./route");

    const response = await GET(statusRequest("request-2"));

    expect(response.status).toBe(200);
  });

  it("does not let one client rate-limit another client for the same payment request", async () => {
    const { GET } = await import("./route");

    const first = await GET(statusRequest("request-3", "203.0.113.10"));
    const second = await GET(statusRequest("request-3", "203.0.113.11"));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});
