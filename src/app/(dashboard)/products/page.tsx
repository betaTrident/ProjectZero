import type { Metadata } from "next";

import { ProductsPageContent } from "@/components/dashboard/products-page-content";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
};

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const { data: products } = merchant
    ? await supabase
        .from("products")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return <ProductsPageContent products={products ?? []} />;
}
