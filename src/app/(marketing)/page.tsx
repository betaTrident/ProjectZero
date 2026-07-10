import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  FileText,
  Link2,
  LockKeyhole,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  WalletCards,
} from "lucide-react";

import { PaymentPreviewCard } from "@/components/marketing/payment-preview-card";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verified payments for local merchants",
  description:
    "Create invoices, share payment links or QR codes, and accept server-verified XLM payments on Stellar Testnet.",
};

const trustItems = [
  { title: "Customer keys stay in their wallet", icon: LockKeyhole },
  { title: "Automatic payment confirmation", icon: BadgeCheck },
  { title: "Built for invoices, links, and QR", icon: Link2 },
  { title: "Server-verified on Stellar Testnet", icon: ShieldCheck },
] as const;

const flowSteps = [
  {
    step: "01",
    title: "Create",
    description: "Set an amount, item, unique memo, and expiration for a new payment request.",
    label: "Merchant action",
    icon: FileText,
  },
  {
    step: "02",
    title: "Share",
    description: "Send the payment link or QR code through chat, social media, email, or in person.",
    label: "Merchant action",
    icon: QrCode,
  },
  {
    step: "03",
    title: "Get paid",
    description: "The customer approves in Freighter; Project ZERO verifies settlement before updating the invoice.",
    label: "Server verified",
    icon: WalletCards,
  },
] as const;

const useCases = [
  {
    title: "Social sellers",
    description: "Share a payment link in the same conversation where you close the sale.",
    icon: ShoppingBag,
  },
  {
    title: "Local shops",
    description: "Display a QR code for a specific order and see when settlement is verified.",
    icon: Store,
  },
  {
    title: "Freelancers",
    description: "Issue a clear payment request with an amount, memo, and expiration.",
    icon: BriefcaseBusiness,
  },
] as const;

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative">
        <div aria-hidden="true" className="marketing-hero-glow absolute inset-x-0 top-0 h-[42rem]" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-primary/25 bg-primary/8 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-primary">
              Credentialless commerce on Stellar
            </Badge>
            <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-[3.65rem] lg:leading-[1.05]">
              Accept <span className="text-primary">verified payments</span> without storing customer payment details.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Create an invoice or payment link, share it with your customer, and get automatic
              confirmation after they approve the payment in their Stellar wallet.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 px-5 shadow-[0_0_28px_var(--marketing-primary-glow)]",
                )}
              >
                Start accepting payments
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link href="#how-it-works" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 border-border/70 bg-card/40 px-5")}>
                See how it works
                <ChevronRight data-icon="inline-end" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"><Store className="size-4" /></span>
                <span><strong className="block font-medium text-foreground">Merchant</strong><span className="text-muted-foreground">Creates and shares</span></span>
              </div>
              <ArrowRight className="size-4 text-primary" />
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"><CircleUserRound className="size-4" /></span>
                <span><strong className="block font-medium text-foreground">Customer</strong><span className="text-muted-foreground">Approves in wallet</span></span>
              </div>
            </div>
          </div>

          <PaymentPreviewCard />
        </div>
      </section>

      <section aria-label="Product trust highlights" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-xl border border-border/70 bg-card/45 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => (
            <div key={item.title} className={cn("flex min-h-20 items-center gap-3 px-5 py-4", index > 0 && "border-t border-border/60 sm:border-l", index === 2 && "sm:border-l-0 lg:border-l")}>
              <item.icon className="size-5 shrink-0 text-primary" />
              <p className="text-sm leading-5">{item.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="scroll-mt-24 border-y border-border/60 bg-card/15 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="The product"
            title="From payment request to verified settlement."
            description="A focused merchant workflow for creating, sharing, and tracking Stellar Testnet payments without manual screenshot reconciliation."
          />
          <div className="mt-10"><ProductShowcase /></div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How it works"
            title="Simple. Secure. Credentialless."
            description="Three clear steps for merchants and customers, with server verification handling the final confirmation."
            centered
          />
          <div className="relative mt-10 grid gap-4 lg:grid-cols-3">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-1/2 hidden h-px bg-border lg:block" />
            {flowSteps.map((step) => (
              <Card key={step.title} className="marketing-panel relative gap-0 py-0">
                <CardHeader className="p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/8 text-primary"><step.icon className="size-5" /></span>
                    <span className="font-mono text-xs text-muted-foreground">{step.step}</span>
                  </div>
                  <CardTitle className="mt-5 text-xl text-primary">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <p className="min-h-18 text-sm leading-6 text-muted-foreground">{step.description}</p>
                  <Badge variant="outline" className="mt-4 border-primary/20 bg-primary/8 text-primary">{step.label}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 border-y border-border/60 bg-card/15 py-20 sm:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
          <div>
            <Badge variant="outline" className="border-primary/25 bg-primary/8 font-mono text-primary">SECURITY MODEL</Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Your store never handles the customer&apos;s private keys.</h2>
            <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
              Customers authorize each payment inside Freighter. Project ZERO verifies the public
              on-chain settlement against the invoice before marking it paid.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              {["No card numbers or reusable payment credentials", "Every payment is tied to one invoice", "Amount, destination, asset, and memo are checked server-side"].map((item) => (
                <p key={item} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span className="text-muted-foreground">{item}</span></p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              [Store, "Merchant", "Creates invoice"],
              [CircleUserRound, "Customer", "Approves in Freighter"],
              [WalletCards, "Stellar", "Settles on Testnet"],
              [ShieldCheck, "Project ZERO", "Verifies on-chain"],
              [FileCheck2, "Invoice", "Marked as paid"],
            ].map(([Icon, title, description], index) => {
              const FlowIcon = Icon as typeof Store;
              return (
                <Card key={title as string} className={cn("marketing-panel gap-0 py-0", index === 4 && "col-span-2 sm:col-span-1")}>
                  <div className="flex h-full min-h-40 flex-col items-center justify-center p-3 text-center">
                    <span className={cn("flex size-11 items-center justify-center rounded-full border bg-background", index >= 3 ? "border-primary/40 text-primary shadow-[0_0_20px_var(--marketing-primary-glow)]" : "border-border text-muted-foreground")}>
                      <FlowIcon className="size-5" />
                    </span>
                    <p className="mt-4 text-xs font-medium">{title as string}</p>
                    <p className="mt-1 text-[0.65rem] leading-4 text-muted-foreground">{description as string}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="use-cases" className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Use cases"
            title="Built for the way small merchants already sell."
            description="Project ZERO adds a verifiable payment step without forcing merchants to replace the channels where they find customers."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {useCases.map((item) => (
              <Card key={item.title} className="marketing-panel gap-0 py-0">
                <div className="p-5 sm:p-6">
                  <item.icon className="size-6 text-primary" />
                  <h3 className="mt-5 text-lg font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/35 bg-primary/8 px-5 py-8 sm:px-8 sm:py-10">
          <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-semibold sm:text-2xl">Create your first verified payment request.</p>
              <p className="mt-2 text-sm text-muted-foreground">Set up an invoice, share the link, and let Project ZERO confirm settlement.</p>
            </div>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "min-h-11 shrink-0 px-5")}>
              Start accepting payments <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", centered && "mx-auto text-center")}>
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}
