import Link from "next/link";
import { BadgeCheck, Check, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  const isRegistration = title.toLowerCase().includes("account");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
      <Card className="app-panel grid w-full max-w-5xl gap-0 overflow-hidden py-0 lg:grid-cols-[1.04fr_0.96fr]">
        <section className="p-6 sm:p-10 lg:p-12">
          <Link href="/" aria-label="Project ZERO home" className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark />
          </Link>
          <div className="mt-12 max-w-md sm:mt-16">
            <Badge variant="outline" className="border-info/30 bg-info/10 text-info">Stellar Testnet</Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
            <div className="mt-8">{children}</div>
            {footer ? <p className="mt-6 text-sm text-muted-foreground">{footer}</p> : null}
          </div>
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/6 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
              {isRegistration
                ? "Project ZERO operates on Stellar Testnet. Add your public receiving address during merchant onboarding."
                : "Your account manages invoices and public settlement records. Customer private keys remain in their wallets."}
            </p>
          </div>
        </section>

        <aside className="relative hidden border-l border-border/60 bg-background/30 p-10 lg:flex lg:items-center lg:justify-center">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--marketing-primary-glow),transparent_58%)] opacity-50" />
          {isRegistration ? <RegistrationPreview /> : <VerifiedPaymentPreview />}
        </aside>
      </Card>
    </main>
  );
}

function VerifiedPaymentPreview() {
  return (
    <Card className="app-panel relative z-10 w-full max-w-sm gap-0 py-0">
      <div className="border-b border-border/60 p-4">
        <Badge className="border-primary/20 bg-primary/10 text-primary"><BadgeCheck /> Verified payment</Badge>
      </div>
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/6 p-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary"><Check className="size-4" /></span>
          <div><p className="text-sm font-medium">Invoice ZERO-1048</p><p className="text-xs text-muted-foreground">Verified on Stellar Testnet</p></div>
        </div>
        <dl className="grid gap-3 text-sm">
          <PreviewRow label="Merchant" value="Sari-Sari ZERO" />
          <PreviewRow label="Item" value="Handmade tote bag" />
          <PreviewRow label="Amount" value="125.00 XLM" mono />
          <PreviewRow label="Status" value="Payment verified" />
        </dl>
        <p className="truncate border-t border-border/60 pt-4 font-mono text-xs text-muted-foreground">b1f7c8e2…a9d34f8b1c7e</p>
      </div>
    </Card>
  );
}

function RegistrationPreview() {
  return (
    <Card className="app-panel relative z-10 w-full max-w-sm gap-0 py-0">
      <div className="flex flex-col items-center p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary shadow-[0_0_28px_var(--marketing-primary-glow)]">
          <WalletCards className="size-7" />
        </span>
        <h2 className="mt-6 text-xl font-medium">Connect your receiving wallet</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">After registration, add your Stellar Testnet public address to begin creating payment requests.</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-primary"><LockKeyhole className="size-4" /> We never request secret keys</div>
      </div>
    </Card>
  );
}

function PreviewRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className={mono ? "font-mono" : undefined}>{value}</dd></div>;
}

export function AuthShellLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="font-medium text-primary hover:underline">{children}</Link>;
}
