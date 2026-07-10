import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getClientFingerprint, isRateLimited } from "@/lib/http/request-rate-limit";

const RATE_LIMIT_MS = 2_000;

export async function GET(request: NextRequest) {
  const paymentRequestId =
    request.nextUrl.searchParams.get("id") ?? request.nextUrl.searchParams.get("payment_request_id");

  if (!paymentRequestId) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const rateLimitKey = `status:${paymentRequestId}:${getClientFingerprint(request)}`;
  if (isRateLimited(rateLimitKey, RATE_LIMIT_MS)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_requests")
    .select("id, status, paid_at")
    .eq("id", paymentRequestId)
    .single();

  if (error) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    paid_at: data.paid_at,
    paidAt: data.paid_at,
  });
}
