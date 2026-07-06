import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const rateMap = new Map<string, number>();
const RATE_LIMIT_MS = 2_000;

export async function GET(request: NextRequest) {
  const paymentRequestId =
    request.nextUrl.searchParams.get("id") ?? request.nextUrl.searchParams.get("payment_request_id");

  if (!paymentRequestId) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const now = Date.now();
  pruneRateMap(now);

  const rateLimitKey = `${paymentRequestId}:${getClientFingerprint(request)}`;
  const lastRequest = rateMap.get(rateLimitKey) ?? 0;
  if (now - lastRequest < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  rateMap.set(rateLimitKey, now);

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

function pruneRateMap(now: number) {
  for (const [rateLimitKey, lastRequest] of rateMap.entries()) {
    if (now - lastRequest >= RATE_LIMIT_MS) {
      rateMap.delete(rateLimitKey);
    }
  }
}

function getClientFingerprint(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}
