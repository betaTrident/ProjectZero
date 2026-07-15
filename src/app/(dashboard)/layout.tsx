import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("business_name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AppShell
      merchantName={merchant?.business_name}
      merchantSlug={merchant?.slug}
      accountLabel={user.email}
    >
      {children}
    </AppShell>
  );
}
