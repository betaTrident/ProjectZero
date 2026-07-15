import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createPaymentMemo, resolvePaymentDestination } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";
import { paymentRequestSchema } from "@/lib/validation/payment-request.schema";

async function getAuthenticatedMerchant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, merchant: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, stellar_public_key")
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return {
      supabase,
      merchant: null,
      response: NextResponse.json({ error: "Merchant profile required" }, { status: 403 }),
    };
  }

  return { supabase, merchant, response: null };
}

export async function GET() {
  const { supabase, merchant, response } = await getAuthenticatedMerchant();

  if (response || !merchant) {
    return response;
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ paymentRequests: data });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = paymentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment request" }, { status: 422 });
  }

  const { supabase, merchant, response } = await getAuthenticatedMerchant();

  if (response || !merchant) {
    return response;
  }

  const id = randomUUID();
  let stellarDestination: string;
  try {
    stellarDestination = resolvePaymentDestination(
      merchant.stellar_public_key,
      process.env.PROJECT_ZERO_TREASURY_PUBLIC_KEY,
    );
  } catch {
    return NextResponse.json({ error: "Merchant Stellar destination is not configured" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      id,
      merchant_id: merchant.id,
      product_id: parsed.data.productId ?? null,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      amount: parsed.data.amount,
      asset_code: parsed.data.assetCode,
      asset_issuer: parsed.data.assetCode === "XLM" ? null : (parsed.data.assetIssuer ?? null),
      stellar_destination: stellarDestination,
      memo: createPaymentMemo(id),
      expires_at: parsed.data.expiresAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ paymentRequest: data }, { status: 201 });
}
