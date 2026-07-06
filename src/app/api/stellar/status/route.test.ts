import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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

function statusRequest(id: string) {
  return new NextRequest(`https://zero.test/api/stellar/status?id=${id}`);
}

describe("GET /api/stellar/status", () => {
  beforeEach(() => {
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
});
