import { describe, expect, it } from "vitest";

import { productSchema } from "./product.schema";

describe("productSchema", () => {
  it("normalizes price, active flag, and XLM asset code", () => {
    const parsed = productSchema.parse({
      name: " Starter pack ",
      price: "25",
    });

    expect(parsed.name).toBe("Starter pack");
    expect(parsed.price).toBe(25);
    expect(parsed.assetCode).toBe("XLM");
    expect(parsed.isActive).toBe(true);
  });
});
