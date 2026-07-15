import { describe, expect, it } from "vitest";

import {
  CHECKOUT_STEPS,
  getCheckoutStatusMessage,
  getCheckoutStepIndex,
  isSignRejectedError,
} from "./checkout-progress";

describe("getCheckoutStepIndex", () => {
  it("maps idle to Review", () => {
    expect(getCheckoutStepIndex("idle")).toBe(0);
    expect(CHECKOUT_STEPS[getCheckoutStepIndex("idle")]).toBe("Review");
  });

  it("maps connecting to Connect", () => {
    expect(getCheckoutStepIndex("connecting")).toBe(1);
  });

  it("maps signing and submitting to Sign", () => {
    expect(getCheckoutStepIndex("signing")).toBe(2);
    expect(getCheckoutStepIndex("submitting")).toBe(2);
  });

  it("maps verifying to Verify", () => {
    expect(getCheckoutStepIndex("verifying")).toBe(3);
  });

  it("maps paid to Done", () => {
    expect(getCheckoutStepIndex("paid")).toBe(4);
  });
});

describe("getCheckoutStatusMessage", () => {
  it("returns user-facing copy for in-flight states", () => {
    expect(getCheckoutStatusMessage("connecting")).toBe("Connecting to Freighter…");
    expect(getCheckoutStatusMessage("signing")).toBe("Confirm in Freighter…");
    expect(getCheckoutStatusMessage("submitting")).toBe("Submitting to Stellar…");
    expect(getCheckoutStatusMessage("verifying")).toBe("Verifying payment…");
  });

  it("returns null for idle and paid", () => {
    expect(getCheckoutStatusMessage("idle")).toBeNull();
    expect(getCheckoutStatusMessage("paid")).toBeNull();
  });
});

describe("isSignRejectedError", () => {
  it("detects user rejection messages", () => {
    expect(isSignRejectedError("The user declined access")).toBe(true);
    expect(isSignRejectedError("User rejected signing")).toBe(true);
    expect(isSignRejectedError("Transaction signing cancelled")).toBe(true);
  });

  it("does not treat other errors as rejection", () => {
    expect(isSignRejectedError("Freighter extension not installed.")).toBe(false);
    expect(isSignRejectedError("Verification failed.")).toBe(false);
  });
});
