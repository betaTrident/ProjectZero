import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExplorerLink } from "./explorer-link";

describe("ExplorerLink", () => {
  it("renders a truncated hash linking to Stellar Expert testnet", () => {
    const hash = "a".repeat(32) + "b".repeat(32);
    const html = renderToStaticMarkup(<ExplorerLink hash={hash} />);

    expect(html).toContain("stellar.expert/explorer/testnet/tx/");
    expect(html).toContain(`${"a".repeat(8)}…${"b".repeat(8)}`);
    expect(html).toContain('target="_blank"');
  });
});
