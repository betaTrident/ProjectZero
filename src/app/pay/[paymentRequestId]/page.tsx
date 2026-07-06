import { notFound } from "next/navigation";

import { PaymentRequestCard } from "@/components/payment/payment-request-card";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PaymentPageProps = {
  params: Promise<{
    paymentRequestId: string;
  }>;
};

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

  if (!paymentRequest || (paymentRequest.status !== "pending" && paymentRequest.status !== "paid")) {
    notFound();
  }

  const payableStatus: "pending" | "paid" = paymentRequest.status;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("business_name")
    .eq("id", paymentRequest.merchant_id)
    .maybeSingle();

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
    />
  );
}
