import { BadgeCheck, ExternalLink } from "lucide-react";
import QRCode from "react-qr-code";

import { ExplorerLink } from "@/components/shared/explorer-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PaymentReceiptProps = {
  amount: string;
  assetCode: string;
  merchantName: string;
  txHash?: string | null;
  invoiceId?: string;
  paymentLink?: string;
};

export function PaymentReceipt({ amount, assetCode, merchantName, txHash, invoiceId, paymentLink }: PaymentReceiptProps) {
  return (
    <Card className="app-panel mx-auto w-full max-w-2xl gap-0 overflow-visible py-0">
      <div className="flex flex-col items-center border-b border-border/60 px-5 py-8 text-center sm:px-8">
        <span className="flex size-16 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary shadow-[0_0_30px_var(--marketing-primary-glow)]"><BadgeCheck className="size-8" /></span>
        <h1 className="mt-5 text-2xl font-semibold sm:text-3xl">Payment verified</h1>
        <p className="mt-2 text-sm text-muted-foreground">Payment confirmed and verified on Stellar Testnet.</p>
      </div>
      <div className="space-y-5 p-5 sm:p-8">
        <dl className="divide-y divide-border/60 text-sm">
          <ReceiptRow label="Merchant" value={merchantName} />
          {invoiceId ? <ReceiptRow label="Invoice" value={invoiceId} mono /> : null}
          <ReceiptRow label="Amount" value={`${Number(amount).toFixed(2)} ${assetCode}`} mono strong />
          <ReceiptRow label="Asset" value={`${assetCode} on Stellar Testnet`} />
          {txHash ? <div className="flex items-center justify-between gap-4 py-4"><dt className="text-muted-foreground">Transaction</dt><dd><ExplorerLink hash={txHash} /></dd></div> : null}
        </dl>

        {paymentLink ? (
          <div className="grid items-center gap-5 border-t border-dashed border-border pt-6 sm:grid-cols-[8rem_1fr]">
            <div className="mx-auto rounded-lg bg-[var(--marketing-qr-background)] p-2 sm:mx-0"><QRCode value={paymentLink} size={112} /></div>
            <div><p className="font-medium">Need a copy?</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Scan the QR code or open the payment page to revisit these details.</p><Button render={<a href={paymentLink} />} variant="outline" className="mt-4"><ExternalLink /> View payment page</Button></div>
          </div>
        ) : null}

        <p className="border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">Return to merchant — your verified receipt is on record.</p>
      </div>
    </Card>
  );
}

function ReceiptRow({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-4 py-4 first:pt-0"><dt className="text-muted-foreground">{label}</dt><dd className={`${mono ? "font-mono " : ""}${strong ? "text-lg font-semibold" : ""}`}>{value}</dd></div>;
}
