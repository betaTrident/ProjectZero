import { FileQuestion, Mail } from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function PaymentNotFound() {
  return (
    <main className="app-surface flex min-h-screen flex-col bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-border/60 pb-5"><BrandMark /><Badge variant="outline" className="border-info/30 bg-info/10 text-info">Stellar Testnet</Badge></header>
      <div className="flex flex-1 items-center justify-center py-10">
        <Card className="app-panel w-full max-w-lg gap-0 py-0 text-center">
          <div className="border-b border-border/60 px-6 py-9"><span className="mx-auto flex size-16 items-center justify-center rounded-full border border-border bg-muted/30 text-muted-foreground"><FileQuestion className="size-8" /></span><h1 className="mt-5 text-2xl font-semibold">Invoice unavailable</h1><p className="mt-2 text-sm text-muted-foreground">We could not find this invoice or it may no longer be available.</p></div>
          <div className="p-6"><p className="text-sm leading-6 text-muted-foreground">Check the payment link and try again. If the issue continues, contact the merchant.</p><div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-background/35 p-3 text-sm text-muted-foreground"><Mail className="size-4" /> Contact the merchant for help</div></div>
        </Card>
      </div>
    </main>
  );
}
