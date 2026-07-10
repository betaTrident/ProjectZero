import { SiteHeader } from "@/components/layout/site-header";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
