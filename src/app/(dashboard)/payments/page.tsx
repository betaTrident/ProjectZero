import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeCheck, CalendarDays, Layers3, Radio } from "lucide-react";

import { PaymentsTable } from "@/components/dashboard/payments-table";
import { PageHeader } from "@/components/layout/page-header";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const rows = transactions ?? [];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonthCount = rows.filter((transaction) => new Date(transaction.verified_at) >= monthStart).length;
  const assetCount = new Set(rows.map((transaction) => transaction.asset_code ?? "XLM")).size;
  const latestVerifiedAt = rows[0]?.verified_at;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Suspense fallback={null}>
        <QueryFeedback />
      </Suspense>

      <PageHeader
        title="Payments"
        description="Verified Stellar transactions linked to your invoices."
        action={<Badge variant="outline" className="border-info/30 bg-info/10 text-info"><Radio /> Stellar Testnet</Badge>}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Verified payments" value={String(rows.length)} icon={BadgeCheck} />
        <SummaryCard label="This month" value={String(thisMonthCount)} icon={CalendarDays} />
        <SummaryCard label="Assets represented" value={String(assetCount)} icon={Layers3} />
        <SummaryCard label="Latest settlement" value={latestVerifiedAt ? new Date(latestVerifiedAt).toLocaleDateString() : "—"} icon={Radio} />
      </section>

      <Card className="app-panel">
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Settlements appear here after on-chain verification succeeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable transactions={rows} />
        </CardContent>
      </Card>
    </main>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BadgeCheck }) {
  return (
    <Card className="app-panel gap-0 py-0">
      <CardHeader><div className="flex items-center justify-between gap-2"><CardDescription>{label}</CardDescription><Icon className="size-4 text-primary" /></div><CardTitle className="font-mono text-2xl sm:text-3xl">{value}</CardTitle></CardHeader>
    </Card>
  );
}
