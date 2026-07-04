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
  const entropy = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");

  return `ZERO-${prefix}-${entropy}`;
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
