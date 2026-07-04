import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

type PaymentRequestRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: PaymentRequestRouteContext,
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: "Merchant profile required" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .eq("merchant_id", merchant.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  }

  return NextResponse.json({ paymentRequest: data });
}
