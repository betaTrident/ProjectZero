import type { Metadata } from "next";
import { Suspense } from "react";

import { PaymentsTable } from "@/components/dashboard/payments-table";
import { PageHeader } from "@/components/layout/page-header";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const { data: transactions } = merchant
    ? await supabase
        .from("transactions")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <Suspense fallback={null}>
        <QueryFeedback />
      </Suspense>

      <PageHeader
        title="Payments"
        description="Verified Stellar transactions linked to your invoices."
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Settlements appear here after on-chain verification succeeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable transactions={transactions ?? []} />
        </CardContent>
      </Card>
    </main>
  );
}
