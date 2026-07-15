import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentRequestCard } from "@/components/payment/payment-request-card";
import { PaymentUnavailable } from "@/components/payment/payment-unavailable";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PaymentPageProps = {
  params: Promise<{
    paymentRequestId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pay invoice",
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { paymentRequestId } = await params;
  const supabase = await createClient();
  const { data: paymentRequest } = await supabase
    .from("payment_requests")
    .select(
      "id, merchant_id, title, description, amount, asset_code, asset_issuer, status, memo, stellar_destination, expires_at",
    )
    .eq("id", paymentRequestId)
    .maybeSingle();

  if (!paymentRequest) {
    notFound();
  }

  if (paymentRequest.status === "expired" || paymentRequest.status === "cancelled") {
    return <PaymentUnavailable status={paymentRequest.status} />;
  }

  if (paymentRequest.status !== "pending" && paymentRequest.status !== "paid") {
    notFound();
  }

  const payableStatus: "pending" | "paid" = paymentRequest.status;

  const [{ data: merchant }, { data: transaction }] = await Promise.all([
    supabase
      .from("merchants")
      .select("business_name")
      .eq("id", paymentRequest.merchant_id)
      .maybeSingle(),
    payableStatus === "paid"
      ? supabase
          .from("transactions")
          .select("stellar_tx_hash")
          .eq("payment_request_id", paymentRequest.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <PaymentRequestCard
      merchantName={merchant?.business_name ?? "Project ZERO merchant"}
      paymentRequest={{
        id: paymentRequest.id,
        title: paymentRequest.title,
        description: paymentRequest.description,
        amount: String(paymentRequest.amount),
        asset_code: paymentRequest.asset_code,
        asset_issuer: paymentRequest.asset_issuer,
        status: payableStatus,
        expires_at: paymentRequest.expires_at,
        memo: paymentRequest.memo,
        stellar_destination: paymentRequest.stellar_destination,
      }}
      paymentLink={buildPaymentLink(
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        paymentRequest.id,
      )}
      initialTxHash={transaction?.stellar_tx_hash ?? null}
    />
  );
}
