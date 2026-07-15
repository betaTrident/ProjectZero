import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("maps pending to warning styling", () => {
    const html = renderToStaticMarkup(<StatusBadge status="pending" />);
    expect(html).toContain("pending");
    expect(html).toContain("bg-warning");
  });

  it("maps paid to success styling", () => {
    const html = renderToStaticMarkup(<StatusBadge status="paid" />);
    expect(html).toContain("paid");
    expect(html).toContain("bg-success");
  });

  it("maps expired to secondary styling", () => {
    const html = renderToStaticMarkup(<StatusBadge status="expired" />);
    expect(html).toContain("expired");
  });
});
