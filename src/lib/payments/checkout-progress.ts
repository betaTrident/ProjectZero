export type CheckoutFlowStatus =
  | "idle"
  | "connecting"
  | "signing"
  | "submitting"
  | "verifying"
  | "paid"
  | "error";

export const CHECKOUT_STEPS = ["Review", "Connect", "Sign", "Verify", "Done"] as const;

export type CheckoutStep = (typeof CHECKOUT_STEPS)[number];

export function getCheckoutStepIndex(status: CheckoutFlowStatus): number {
  switch (status) {
    case "idle":
      return 0;
    case "connecting":
      return 1;
    case "signing":
    case "submitting":
      return 2;
    case "verifying":
      return 3;
    case "paid":
      return 4;
    case "error":
      return -1;
    default:
      return 0;
  }
}

export function getCheckoutStatusMessage(status: CheckoutFlowStatus): string | null {
  switch (status) {
    case "connecting":
      return "Connecting to Freighter…";
    case "signing":
      return "Confirm in Freighter…";
    case "submitting":
      return "Submitting to Stellar…";
    case "verifying":
      return "Verifying payment…";
    default:
      return null;
  }
}

export function isSignRejectedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("declined") ||
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("canceled")
  );
}
