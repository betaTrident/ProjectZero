import { describe, expect, it, vi } from "vitest";

import {
  buildPaymentLink,
  canMarkPaymentRequestPaid,
  canExpirePaymentRequest,
  createPaymentMemo,
} from "./payment-request";

describe("payment request helpers", () => {
  it("creates a stable ZERO memo prefix with compact entropy", () => {
    expect(createPaymentMemo("12345678-1234-1234-1234-123456789abc")).toMatch(
      /^ZERO-12345678-[A-Z0-9]{6}$/,
    );
  });

  it("does not use Math.random for memo entropy", () => {
    const randomSpy = vi.spyOn(Math, "random");

    createPaymentMemo("12345678-1234-1234-1234-123456789abc");

    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it("builds shareable app links without trailing slash duplication", () => {
    expect(buildPaymentLink("https://zero.test/", "pay_123")).toBe(
      "https://zero.test/pay/pay_123",
    );
  });

  it("only allows pending, unexpired requests to be marked paid", () => {
    expect(
      canMarkPaymentRequestPaid(
        { status: "pending", expiresAt: null },
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toBe(true);

    expect(
      canMarkPaymentRequestPaid(
        { status: "paid", expiresAt: null },
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toBe(false);

    expect(
      canMarkPaymentRequestPaid(
        {
          status: "pending",
          expiresAt: "2025-12-31T23:59:59.000Z",
        },
        new Date("2026-01-01T00:00:00.000Z"),
      ),
    ).toBe(false);
  });

  it("only expires pending requests whose expiration time is in the past", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");

    expect(
      canExpirePaymentRequest(
        { status: "pending", expiresAt: "2025-12-31T23:59:59.000Z" },
        now,
      ),
    ).toBe(true);

    expect(
      canExpirePaymentRequest(
        { status: "pending", expiresAt: "2026-01-01T00:00:01.000Z" },
        now,
      ),
    ).toBe(false);

    expect(
      canExpirePaymentRequest(
        { status: "paid", expiresAt: "2025-12-31T23:59:59.000Z" },
        now,
      ),
    ).toBe(false);
  });
});
