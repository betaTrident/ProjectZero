import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  CreditCard,
  QrCode,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_NAME, APP_TAGLINE } from "@/constants/app";

const features = [
  {
    title: "Create invoice",
    description: "Merchants create payment requests with amount, memo, and expiration.",
    icon: CreditCard,
  },
  {
    title: "Generate QR/payment link",
    description: "Each request gets a shareable link and QR-ready customer page.",
    icon: QrCode,
  },
  {
    title: "Pay with Stellar wallet",
    description: "Customers authorize payment from their own Testnet wallet.",
    icon: WalletCards,
  },
  {
    title: "Automatic verification",
    description: "The server verifies transactions before marking requests paid.",
    icon: ShieldCheck,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="mx-auto grid min-h-[82vh] w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="max-w-3xl space-y-5">
            <Badge variant="secondary" className="w-fit">
              Stellar Testnet MVP
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Credentialless commerce for MSMEs and social sellers.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Project ZERO helps merchants create invoices and product payment
              pages, share QR links, accept Stellar wallet payments, and update
              payment status only after server-side verification.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Start merchant setup
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              View dashboard shell
            </Link>
          </div>
        </div>

        <Card className="border-primary/20 bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-lg">Payment request preview</CardTitle>
              <Badge>Pending</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Merchant</p>
                  <p className="font-medium">Sari-Sari ZERO</p>
                </div>
                <p className="font-mono text-2xl font-semibold">125.00 XLM</p>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-4" />
                  Expires in 30 minutes
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BadgeCheck className="size-4" />
                  Unique memo required
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
              <div className="grid aspect-square grid-cols-5 gap-1 rounded-lg border border-border bg-white p-3">
                {Array.from({ length: 25 }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      index % 2 === 0 || index % 7 === 0
                        ? "rounded-sm bg-zinc-950"
                        : "rounded-sm bg-zinc-200"
                    }
                  />
                ))}
              </div>
              <div className="flex flex-col justify-center gap-3">
                <p className="text-sm font-medium">Shareable payment link</p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  http://localhost:3000/pay/pr_testnet_123
                </p>
                <p className="text-sm text-muted-foreground">
                  In Phase 3, this page connects Freighter and submits the
                  transaction hash for server verification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="border-t border-border bg-card/35 px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} size="sm">
              <CardHeader>
                <feature.icon className="size-5 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
