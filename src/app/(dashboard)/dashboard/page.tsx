import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig, Clock3, Package, Plus, TimerOff } from "lucide-react";
import { Suspense } from "react";

import { MerchantOnboardingForm } from "@/components/dashboard/merchant-onboarding-form";
import { RecentPaymentsList } from "@/components/dashboard/recent-payments-list";
import { RecentRequestsList } from "@/components/dashboard/recent-requests-list";
import { PageHeader } from "@/components/layout/page-header";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
};

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  if (!merchant) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={null}>
          <QueryFeedback />
        </Suspense>
        <MerchantOnboardingForm
          defaultBusinessName={
            typeof user?.user_metadata.business_name === "string"
              ? user.user_metadata.business_name
              : ""
          }
        />
      </main>
    );
  }

  const monthStart = startOfMonth();

  const [
    { count: pendingCount },
    { count: paidCount },
    { count: expiredCount },
    { count: productCount },
    { data: requests },
    { data: transactions },
  ] = await Promise.all([
    supabase
      .from("payment_requests")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("status", "pending"),
    supabase
      .from("payment_requests")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("status", "paid"),
    supabase
      .from("payment_requests")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("status", "expired")
      .gte("updated_at", monthStart),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("is_active", true),
    supabase
      .from("payment_requests")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("transactions")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const recentRequests =
    requests?.map((request) => ({
      id: request.id,
      title: request.title,
      amount: request.amount,
      asset_code: request.asset_code,
      status: request.status,
      paymentLink: buildPaymentLink(appUrl, request.id),
    })) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Suspense fallback={null}>
        <QueryFeedback />
      </Suspense>

      <PageHeader
        title={`Welcome back, ${merchant.business_name}`}
        description="Track invoices, share payment links, and monitor verified settlements."
        action={
          <Link href="/invoices" className={buttonVariants({ size: "lg" })}>
            <Plus data-icon="inline-start" /> Create invoice
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card className="app-panel gap-0 py-0">
          <CardHeader>
            <div className="flex items-center justify-between"><CardDescription>Pending requests</CardDescription><Clock3 className="size-4 text-warning" /></div>
            <CardTitle className="font-mono text-3xl">{pendingCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="app-panel gap-0 py-0">
          <CardHeader>
            <div className="flex items-center justify-between"><CardDescription>Paid requests</CardDescription><CircleCheckBig className="size-4 text-primary" /></div>
            <CardTitle className="font-mono text-3xl">{paidCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="app-panel gap-0 py-0">
          <CardHeader>
            <div className="flex items-center justify-between"><CardDescription>Expired this month</CardDescription><TimerOff className="size-4 text-destructive" /></div>
            <CardTitle className="font-mono text-3xl">{expiredCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="app-panel gap-0 py-0">
          <CardHeader>
            <div className="flex items-center justify-between"><CardDescription>Active products</CardDescription><Package className="size-4 text-primary" /></div>
            <CardTitle className="font-mono text-3xl">{productCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="app-panel">
          <CardHeader>
            <CardTitle>Recent payment requests</CardTitle>
            <CardDescription>Share links publicly; status updates remain server-verified.</CardDescription>
          </CardHeader>
          <CardContent><RecentRequestsList requests={recentRequests} /></CardContent>
        </Card>

        <Card className="app-panel">
          <CardHeader>
            <CardTitle>Recent verified payments</CardTitle>
            <CardDescription>On-chain settlements matched to your invoices.</CardDescription>
          </CardHeader>
          <CardContent><RecentPaymentsList transactions={transactions ?? []} /></CardContent>
        </Card>
      </section>
    </main>
  );
}
