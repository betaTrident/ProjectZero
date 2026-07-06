import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const verifySchema = z.object({
  paymentRequestId: z.string().uuid(),
  stellarTxHash: z.string().regex(/^[a-fA-F0-9]{64}$/),
});

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: paymentRequest, error } = await supabase
    .from("payment_requests")
    .select("id, status, expires_at")
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

  return NextResponse.json({ ok: false, reason: "verify pending Phase 2" }, { status: 202 });
}
