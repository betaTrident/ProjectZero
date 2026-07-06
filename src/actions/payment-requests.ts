"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPaymentMemo, resolvePaymentDestination } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";
import { paymentRequestSchema } from "@/lib/validation/payment-request.schema";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireMerchantId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select("id, stellar_public_key")
    .eq("user_id", user.id)
    .single();

  if (error || !merchant) {
    redirect("/dashboard?error=merchant-profile-required");
  }

  return { supabase, merchant };
}

export async function createPaymentRequest(formData: FormData) {
  const parsed = paymentRequestSchema.safeParse({
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    amount: formValue(formData, "amount"),
    assetCode: formValue(formData, "assetCode") || "XLM",
    assetIssuer: formValue(formData, "assetIssuer") || undefined,
    productId: formValue(formData, "productId") || undefined,
    expiresAt: formValue(formData, "expiresAt")
      ? new Date(formValue(formData, "expiresAt")).toISOString()
      : undefined,
  });

  if (!parsed.success) {
    redirect("/invoices?error=payment-request-invalid");
  }

  const { supabase, merchant } = await requireMerchantId();
  const id = randomUUID();
  let stellarDestination: string;
  try {
    stellarDestination = resolvePaymentDestination(
      merchant.stellar_public_key,
      process.env.PROJECT_ZERO_TREASURY_PUBLIC_KEY,
    );
  } catch {
    redirect("/invoices?error=stellar-destination-required");
  }

  const { error } = await supabase.from("payment_requests").insert({
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
  });

  if (error) {
    redirect(`/invoices?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  redirect("/invoices?created=payment-request");
}
