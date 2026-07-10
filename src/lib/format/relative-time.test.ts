import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./relative-time";

describe("formatRelativeTime", () => {
  it("returns a human-readable relative time string", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(twoHoursAgo);
    expect(result).toMatch(/hour/i);
  });
});
