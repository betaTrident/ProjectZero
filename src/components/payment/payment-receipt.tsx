import { BadgeCheck } from "lucide-react";

import { ExplorerLink } from "@/components/shared/explorer-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type PaymentReceiptProps = {
  amount: string;
  assetCode: string;
  merchantName: string;
  txHash?: string | null;
};

export function PaymentReceipt({ amount, assetCode, merchantName, txHash }: PaymentReceiptProps) {
  return (
    <Card className="border-success/30 bg-success/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <BadgeCheck className="text-success" />
          <div className="flex flex-col gap-1">
            <CardTitle className="text-success">Payment confirmed</CardTitle>
            <CardDescription>Your payment was verified on Stellar Testnet.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-3xl font-semibold tracking-tight">
            {Number(amount).toFixed(2)} {assetCode}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Paid to {merchantName}</p>
        </div>
        {txHash ? (
          <>
            <Separator />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Transaction</p>
              <ExplorerLink hash={txHash} />
            </div>
          </>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Return to merchant — your receipt is on record and the merchant has been notified.
        </p>
      </CardContent>
    </Card>
  );
}
