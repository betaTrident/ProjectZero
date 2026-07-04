"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { merchantSchema } from "@/lib/validation/merchant.schema";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createMerchantProfile(formData: FormData) {
  const parsed = merchantSchema.safeParse({
    businessName: formValue(formData, "businessName"),
    slug: formValue(formData, "slug"),
    stellarPublicKey: formValue(formData, "stellarPublicKey"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=merchant-profile-invalid");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.businessName);
  const { error } = await supabase.from("merchants").upsert(
    {
      user_id: user.id,
      business_name: parsed.data.businessName,
      slug,
      stellar_public_key: parsed.data.stellarPublicKey ?? null,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?created=merchant");
}
