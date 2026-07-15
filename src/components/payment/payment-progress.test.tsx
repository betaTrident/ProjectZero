import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PaymentProgress } from "./payment-progress";

describe("PaymentProgress", () => {
  it("highlights the Connect step when connecting", () => {
    const html = renderToStaticMarkup(<PaymentProgress status="connecting" />);

    expect(html).toContain("Review");
    expect(html).toContain("Connect");
    expect(html).toContain("Sign");
    expect(html).toContain("Verify");
    expect(html).toContain("Done");
    expect(html).toContain('aria-current="step"');
  });

  it("highlights Done when paid", () => {
    const html = renderToStaticMarkup(<PaymentProgress status="paid" />);
    expect(html).toContain("Done");
  });
});
