import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("links to the landing sections, login, and registration", () => {
    const html = renderToStaticMarkup(<SiteHeader />);

    expect(html).toContain('href="/"');
    expect(html).toContain('href="#product"');
    expect(html).toContain('href="#how-it-works"');
    expect(html).toContain('href="#security"');
    expect(html).toContain('href="#use-cases"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/register"');
    expect(html).toContain("Project ZERO");
    expect(html).toContain("Sign in");
    expect(html).toContain("Start accepting payments");
    expect(html).toContain("Open navigation");
  });
});
