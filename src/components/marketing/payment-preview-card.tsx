import { BadgeCheck, Check, ChevronRight, Copy, LockKeyhole, WalletCards } from "lucide-react";
import QRCode from "react-qr-code";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const invoiceDetails = [
  ["Customer", "Maria's Online Shop"],
  ["Item", "Handmade tote bag"],
  ["Amount", "125.00 XLM"],
  ["Asset", "XLM · Testnet"],
] as const;

export function PaymentPreviewCard() {
  return (
    <div
      aria-label="Illustrative Project ZERO payment preview"
      className="relative mx-auto min-h-[31rem] w-full max-w-[42rem] lg:min-h-[34rem]"
    >
      <div aria-hidden="true" className="absolute inset-[12%_4%_10%_8%] rounded-full bg-primary/10 blur-3xl" />

      <Card className="marketing-panel absolute left-0 top-3 w-[82%] gap-0 overflow-visible py-0 shadow-2xl sm:w-[78%]">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Invoices</span>
            <ChevronRight className="size-3" />
            <span className="font-mono text-foreground">ZERO-1048</span>
          </div>
          <Badge className="border-primary/20 bg-primary/10 text-primary">Payment verified</Badge>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[1fr_0.86fr] sm:p-5">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_var(--marketing-primary-glow)]">
                <Check className="size-5" />
              </span>
              <div>
                <p className="font-medium">Invoice ZERO-1048</p>
                <p className="mt-1 text-xs text-muted-foreground">Verified on Stellar Testnet</p>
              </div>
            </div>

            <dl className="grid gap-3 text-xs">
              {invoiceDetails.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[5.25rem_1fr] gap-3">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={label === "Amount" ? "font-mono font-medium text-foreground" : "text-foreground"}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-border/60 pt-4 text-xs">
              <p className="text-muted-foreground">Settlement reference</p>
              <p className="mt-1 truncate font-mono text-foreground">b1f7c8e2…a9d34f8b1c7e</p>
            </div>
          </div>

          <div className="hidden rounded-lg border border-border/60 bg-background/60 p-3 sm:block">
            <p className="text-xs font-medium">Share payment request</p>
            <div className="mt-3 rounded-md border border-border/60 bg-card/70 p-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-[0.6rem] text-muted-foreground">projectzero/pay/ZERO-1048</p>
                <Copy className="size-3 text-primary" />
              </div>
            </div>
            <div className="mx-auto mt-3 w-fit rounded-lg bg-[var(--marketing-qr-background)] p-2">
              <QRCode value="https://projectzero.example/pay/ZERO-1048" size={88} aria-label="Example payment link QR code" />
            </div>
            <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">Scan to open the Testnet payment page</p>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border/60 bg-muted/20 px-4 py-3 text-[0.65rem] text-muted-foreground sm:grid-cols-3 sm:px-5">
          <span className="flex items-center gap-1.5"><BadgeCheck className="size-3 text-primary" /> Server verified</span>
          <span className="flex items-center gap-1.5"><LockKeyhole className="size-3 text-primary" /> Keys stay in wallet</span>
          <span className="hidden items-center gap-1.5 sm:flex"><WalletCards className="size-3 text-info" /> Stellar Testnet</span>
        </div>
      </Card>

      <Card className="marketing-panel absolute bottom-0 right-0 z-10 w-[48%] min-w-[11.5rem] gap-0 rounded-[1.6rem] border-2 border-border/80 py-0 shadow-2xl sm:w-[39%]">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <BrandMark compact />
          <span className="font-mono text-[0.6rem] text-muted-foreground">9:41</span>
        </div>
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>
            Review payment
          </div>
          <dl className="space-y-2.5 text-[0.65rem]">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">To</dt><dd className="truncate">Sari-Sari ZERO</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Invoice</dt><dd className="font-mono">ZERO-1048</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Network</dt><dd>Testnet</dd></div>
          </dl>
          <div className="rounded-lg border border-border/60 bg-background/60 p-3 text-center">
            <p className="text-[0.6rem] text-muted-foreground">Amount</p>
            <p className="mt-1 font-mono text-xl font-semibold">125.00</p>
            <p className="text-[0.65rem] text-muted-foreground">XLM</p>
          </div>
          <div className="rounded-md border border-primary/20 bg-primary/8 p-2 text-[0.6rem] leading-4 text-muted-foreground">
            You approve this payment inside Freighter.
          </div>
          <div className="flex min-h-9 items-center justify-center rounded-lg bg-primary text-xs font-medium text-primary-foreground shadow-[0_0_18px_var(--marketing-primary-glow)]">
            Authorize payment
          </div>
          <p className="text-center text-[0.55rem] text-muted-foreground">Secured by your Stellar wallet</p>
        </div>
      </Card>
    </div>
  );
}
