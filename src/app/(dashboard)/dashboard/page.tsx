import Link from "next/link";

import { MerchantOnboardingForm } from "@/components/dashboard/merchant-onboarding-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
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

  const [{ data: requests }, { data: products }, { data: transactions }] = await Promise.all([
    supabase
      .from("payment_requests")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("products").select("*").eq("merchant_id", merchant.id).limit(5),
    supabase
      .from("transactions")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const pendingCount = requests?.filter((request) => request.status === "pending").length ?? 0;
  const paidCount = requests?.filter((request) => request.status === "paid").length ?? 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-semibold tracking-tight">{merchant.business_name}</h1>
        </div>
        <Link href="/invoices" className={buttonVariants()}>
          Create invoice
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Pending requests</CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Paid requests</CardDescription>
            <CardTitle className="text-3xl">{paidCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Products</CardDescription>
            <CardTitle className="text-3xl">{products?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent payment requests</CardTitle>
          <CardDescription>Share links are public, but status updates remain server-only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests?.length ? (
            requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium">{request.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {buildPaymentLink(appUrl, request.id)}
                  </p>
                </div>
                <Badge variant={request.status === "paid" ? "default" : "secondary"}>
                  {request.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No payment requests yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions?.length ? (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <p key={transaction.id} className="break-all font-mono text-sm">
                  {transaction.stellar_tx_hash}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Verified Stellar transactions appear here in Phase 3.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
