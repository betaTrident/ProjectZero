"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validation/product.schema";

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
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error || !merchant) {
    redirect("/dashboard?error=merchant-profile-required");
  }

  return { supabase, merchantId: merchant.id };
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formValue(formData, "name"),
    description: formValue(formData, "description"),
    price: formValue(formData, "price"),
    assetCode: formValue(formData, "assetCode") || "XLM",
    imageUrl: formValue(formData, "imageUrl"),
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    redirect("/products?error=product-invalid");
  }

  const { supabase, merchantId } = await requireMerchantId();
  const { error } = await supabase.from("products").insert({
    merchant_id: merchantId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    asset_code: parsed.data.assetCode,
    image_url: parsed.data.imageUrl ?? null,
    is_active: parsed.data.isActive,
  });

  if (error) {
    redirect(`/products?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/products");
  redirect("/products?created=product");
}
