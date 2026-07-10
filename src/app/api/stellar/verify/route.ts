import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getClientFingerprint, isRateLimited } from "@/lib/http/request-rate-limit";
import { verifyPaymentByHash } from "@/lib/stellar/verify-payment";
import { getServiceClient } from "@/lib/supabase/service";

const verifySchema = z.object({
  paymentRequestId: z.string().uuid(),
  stellarTxHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

const RATE_LIMIT_MS = 2_000;

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid request" }, { status: 400 });
  }

  const rateLimitKey = `verify:${parsed.data.paymentRequestId}:${getClientFingerprint(request)}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MS)) {
    return NextResponse.json({ ok: false, reason: "rate limited" }, { status: 429 });
  }

  const supabase = getServiceClient();
  const { data: paymentRequest, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", parsed.data.paymentRequestId)
    .maybeSingle();

  if (error || !paymentRequest) {
    return NextResponse.json({ ok: false, reason: "payment request not found" }, { status: 404 });
  }

  if (paymentRequest.status !== "pending") {
    return NextResponse.json({ ok: false, reason: `already ${paymentRequest.status}` });
  }

  if (paymentRequest.expires_at && new Date(paymentRequest.expires_at) <= new Date()) {
    return NextResponse.json({ ok: false, reason: "expired" });
  }

  const result = await verifyPaymentByHash(parsed.data.stellarTxHash, {
    memo: paymentRequest.memo,
    destination: paymentRequest.stellar_destination,
    amount: String(paymentRequest.amount),
    assetCode: paymentRequest.asset_code,
    assetIssuer: paymentRequest.asset_issuer,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason });
  }

  const { error: settleError } = await supabase.rpc("mark_payment_paid", {
    p_request_id: paymentRequest.id,
    p_tx_hash: parsed.data.stellarTxHash,
    p_payload: {
      stellar_tx_hash: parsed.data.stellarTxHash,
      verified_at: new Date().toISOString(),
      verifier: "horizon",
    },
  });

  if (settleError) {
    return NextResponse.json({ ok: false, reason: "settle failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
