import { Ban, Clock3, Mail } from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PaymentRequestStatus } from "@/types/payment";

type PaymentUnavailableProps = {
  status: Extract<PaymentRequestStatus, "expired" | "cancelled">;
};

export function PaymentUnavailable({ status }: PaymentUnavailableProps) {
  const expired = status === "expired";
  const Icon = expired ? Clock3 : Ban;

  return (
    <main className="app-surface flex min-h-screen flex-col bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-border/60 pb-5">
        <BrandMark />
        <Badge variant="outline" className="border-info/30 bg-info/10 text-info">Stellar Testnet</Badge>
      </header>
      <div className="flex flex-1 items-center justify-center py-10">
        <Card className="app-panel w-full max-w-lg gap-0 py-0">
          <div className="flex flex-col items-center border-b border-border/60 px-6 py-9 text-center">
            <span className={`flex size-16 items-center justify-center rounded-full border ${expired ? "border-warning/50 bg-warning/10 text-warning" : "border-destructive/50 bg-destructive/10 text-destructive"}`}><Icon className="size-8" /></span>
            <StatusBadge status={status} className="mt-5" />
            <h1 className="mt-4 text-2xl font-semibold">Invoice {status}</h1>
            <p className="mt-2 text-sm text-muted-foreground">This invoice is no longer available for payment.</p>
          </div>
          <div className="p-6">
            <p className="text-center text-sm leading-6 text-muted-foreground">{expired ? "This payment request has expired. Ask the merchant for a new invoice link." : "This payment request was cancelled. Contact the merchant if you still need to pay."}</p>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-background/35 p-3 text-sm text-muted-foreground"><Mail className="size-4" /> Contact the merchant for help</div>
          </div>
        </Card>
      </div>
    </main>
  );
}
