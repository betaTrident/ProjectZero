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
      "id, merchant_id, title, description, amount, asset_code, status, memo, stellar_destination, expires_at",
    )
    .eq("id", paymentRequestId)
    .maybeSingle();

  if (!paymentRequest) {
    notFound();
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("business_name")
    .eq("id", paymentRequest.merchant_id)
    .maybeSingle();

  return (
    <PaymentRequestCard
      merchantName={merchant?.business_name ?? "Project ZERO merchant"}
      title={paymentRequest.title}
      description={paymentRequest.description}
      amount={Number(paymentRequest.amount)}
      assetCode={paymentRequest.asset_code}
      status={paymentRequest.status}
      expiresAt={paymentRequest.expires_at}
      memo={paymentRequest.memo}
      stellarDestination={paymentRequest.stellar_destination}
      paymentLink={buildPaymentLink(
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        paymentRequest.id,
      )}
    />
  );
}
