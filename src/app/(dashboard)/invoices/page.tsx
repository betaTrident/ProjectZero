import type { Metadata } from "next";

import { InvoicesPageContent } from "@/components/dashboard/invoices-page-content";
import { defaultExpiresAtLocal } from "@/lib/format/datetime-local";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, stellar_public_key")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const [{ data: requests }, { data: products }] = merchant
    ? await Promise.all([
        supabase
          .from("payment_requests")
          .select("*")
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name")
          .eq("merchant_id", merchant.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const hasDestination = Boolean(
    merchant?.stellar_public_key ?? process.env.PROJECT_ZERO_TREASURY_PUBLIC_KEY,
  );

  const invoices =
    requests?.map((request) => ({
      id: request.id,
      title: request.title,
      amount: request.amount,
      asset_code: request.asset_code,
      status: request.status,
      expires_at: request.expires_at,
      paymentLink: buildPaymentLink(appUrl, request.id),
    })) ?? [];

  return (
    <InvoicesPageContent
      products={products ?? []}
      hasDestination={hasDestination}
      invoices={invoices}
      defaultExpiresAt={defaultExpiresAtLocal()}
    />
  );
}
