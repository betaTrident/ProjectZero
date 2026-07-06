import { randomBytes } from "node:crypto";

import type { PaymentRequestStatus } from "@/types/payment";

type PayablePaymentRequest = {
  status: PaymentRequestStatus;
  expiresAt: string | null;
};

export function buildPaymentLink(appUrl: string, paymentRequestId: string) {
  return `${appUrl.replace(/\/$/, "")}/pay/${paymentRequestId}`;
}

export function createPaymentMemo(paymentRequestId: string) {
  const prefix = paymentRequestId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const entropy = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();

  return `ZERO-${prefix}-${entropy}`;
}

export function resolvePaymentDestination(
  merchantStellarPublicKey: string | null,
  fallbackStellarPublicKey: string | undefined,
) {
  const destination = merchantStellarPublicKey ?? fallbackStellarPublicKey;

  if (!destination) {
    throw new Error("Merchant Stellar destination is not configured.");
  }

  return destination;
}

export function canMarkPaymentRequestPaid(
  paymentRequest: PayablePaymentRequest,
  now = new Date(),
) {
  if (paymentRequest.status !== "pending") {
    return false;
  }

  if (!paymentRequest.expiresAt) {
    return true;
  }

  return new Date(paymentRequest.expiresAt) > now;
}

export function canExpirePaymentRequest(
  paymentRequest: PayablePaymentRequest,
  now = new Date(),
) {
  return (
    paymentRequest.status === "pending" &&
    paymentRequest.expiresAt !== null &&
    new Date(paymentRequest.expiresAt) < now
  );
}
