"use client";

import { RouteErrorFallback } from "@/components/shared/route-error-fallback";

type PaymentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PaymentError({ error, reset }: PaymentErrorProps) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Checkout unavailable"
      description="We could not load this payment request. If you have a valid link, try again in a moment."
    />
  );
}
