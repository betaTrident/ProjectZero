import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentUnavailable } from "./payment-unavailable";

describe("PaymentUnavailable", () => {
  it("shows friendly copy for expired invoices", () => {
    const html = renderToStaticMarkup(<PaymentUnavailable status="expired" />);

    expect(html).toContain("This invoice is no longer available");
    expect(html).toContain("expired");
  });

  it("shows friendly copy for cancelled invoices", () => {
    const html = renderToStaticMarkup(<PaymentUnavailable status="cancelled" />);

    expect(html).toContain("This invoice is no longer available");
    expect(html).toContain("cancelled");
  });
});
