import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { BrandMark } from "@/components/marketing/brand-mark";

const footerLinks = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#use-cases", label: "Use cases" },
] as const;

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing-shell flex min-h-full flex-col bg-background text-foreground">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border/60 bg-card/20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div className="max-w-sm space-y-4">
            <BrandMark />
            <p className="text-sm leading-6 text-muted-foreground">
              Credentialless commerce for local merchants, powered by verified settlement on
              Stellar Testnet.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm sm:grid-cols-4">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <p>Project ZERO · Stellar Testnet MVP</p>
            <p>Customer private keys never leave their wallet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
