import { FileX2 } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentRequestStatus } from "@/types/payment";

type PaymentUnavailableProps = {
  status: Extract<PaymentRequestStatus, "expired" | "cancelled">;
};

export function PaymentUnavailable({ status }: PaymentUnavailableProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <FileX2 className="text-muted-foreground" />
              <CardTitle>Invoice unavailable</CardTitle>
              <CardDescription>This invoice is no longer available.</CardDescription>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {status === "expired"
              ? "This payment request has expired. Ask the merchant for a new invoice link."
              : "This payment request was cancelled. Contact the merchant if you still need to pay."}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
