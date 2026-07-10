"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/shared/status-badge";
import type { PaymentRequestStatus } from "@/types/payment";

type PaymentStatusBadgeProps = {
  paymentRequestId: string;
  initialStatus: PaymentRequestStatus;
  pollMs?: number;
};

export function PaymentStatusBadge({
  paymentRequestId,
  initialStatus,
  pollMs = 5000,
}: PaymentStatusBadgeProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status !== "pending") {
      return;
    }

    const controller = new AbortController();
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/stellar/status?id=${paymentRequestId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          status?: PaymentRequestStatus;
        };
        if (payload.status && payload.status !== status) {
          setStatus(payload.status);
          router.refresh();
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Payment status polling failed", error);
        }
      }
    }, pollMs);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [paymentRequestId, pollMs, router, status]);

  return <StatusBadge status={status} />;
}
