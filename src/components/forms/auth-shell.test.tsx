import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("renders title, description, and children instead of a placeholder", () => {
    const html = renderToStaticMarkup(
      <AuthShell title="Merchant login" description="Access your dashboard.">
        <form>
          <button type="submit">Sign in</button>
        </form>
      </AuthShell>,
    );

    expect(html).toContain("Merchant login");
    expect(html).toContain("Access your dashboard.");
    expect(html).toContain("Sign in");
    expect(html).not.toContain("placeholder");
    expect(html).not.toContain("Phase 1");
  });
});
