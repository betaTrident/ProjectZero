import { describe, expect, it } from "vitest";

import { getPresentationInvoices, getPresentationPayments } from "@/lib/presentation/mock-data";

const NOW = new Date("2026-07-15T12:00:00.000Z");

describe("presentation mock data", () => {
  it("builds a realistic mix of local invoice states", () => {
    const invoices = getPresentationInvoices("http://localhost:3000/", NOW);

    expect(invoices).toHaveLength(5);
    expect(invoices.map((invoice) => invoice.status)).toEqual([
      "pending",
      "paid",
      "paid",
      "pending",
      "expired",
    ]);
    expect(invoices[0].paymentLink).toBe(
      "http://localhost:3000/pay/10000000-0000-4000-8000-000000000101",
    );
  });

  it("builds non-production transaction references in newest-first order", () => {
    const payments = getPresentationPayments(NOW);

    expect(payments).toHaveLength(5);
    expect(payments.every((payment) => /^[a-f0-9]{64}$/.test(payment.stellar_tx_hash))).toBe(true);
    expect(
      payments.every((payment, index) =>
        index === 0
          ? true
          : new Date(payments[index - 1].verified_at) > new Date(payment.verified_at),
      ),
    ).toBe(true);
  });
});
