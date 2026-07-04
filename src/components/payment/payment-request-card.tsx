import QRCode from "react-qr-code";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import type { PaymentRequestStatus } from "@/types/payment";

type PaymentRequestCardProps = {
  merchantName: string;
  title: string;
  description: string | null;
  amount: number;
  assetCode: string;
  status: PaymentRequestStatus;
  expiresAt: string | null;
  memo: string;
  stellarDestination: string;
  paymentLink: string;
};

export function PaymentRequestCard({
  merchantName,
  title,
  description,
  amount,
  assetCode,
  status,
  expiresAt,
  memo,
  stellarDestination,
  paymentLink,
}: PaymentRequestCardProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{merchantName}</CardDescription>
              </div>
              <Badge variant={status === "paid" ? "default" : "secondary"}>{status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-4xl font-semibold tracking-tight">
                {amount.toFixed(2)} {assetCode}
              </p>
              {description ? (
                <p className="mt-3 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-lg border border-border p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Memo</p>
                <p className="font-mono">{memo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="break-all font-mono">{stellarDestination}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p>{expiresAt ? new Date(expiresAt).toLocaleString() : "No expiration"}</p>
              </div>
            </div>
            <Button type="button" disabled>
              Pay with Stellar Testnet
            </Button>
            <p className="text-xs text-muted-foreground">
              Wallet signing and server-side Stellar verification are implemented in Phase 3.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment link</CardTitle>
            <CardDescription>Scan or share this request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white p-4">
              <QRCode value={paymentLink} className="h-auto w-full" />
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{paymentLink}</p>
            <CopyPaymentLink paymentLink={paymentLink} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
