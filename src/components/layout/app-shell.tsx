"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, LogOut, Menu, WalletCards } from "lucide-react";
import { useState } from "react";

import { logout } from "@/actions/auth";
import { BrandMark } from "@/components/marketing/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payments", label: "Payments", icon: WalletCards },
] as const;

type AppShellProps = {
  children: React.ReactNode;
  merchantName?: string | null;
  merchantSlug?: string | null;
  accountLabel?: string | null;
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Merchant navigation" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-lg border border-transparent px-3 text-sm transition-colors",
              isActive
                ? "border-primary/25 bg-primary/12 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MerchantSummary({ merchantName, merchantSlug }: Pick<AppShellProps, "merchantName" | "merchantSlug">) {
  return (
    <div className="rounded-xl border border-sidebar-border bg-background/35 p-3">
      <p className="truncate text-sm font-medium">{merchantName ?? "Merchant setup"}</p>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-info shadow-[0_0_8px_var(--marketing-primary-glow)]" />
        Stellar Testnet
      </div>
      {merchantSlug ? <p className="mt-2 truncate font-mono text-[0.65rem] text-muted-foreground">{merchantSlug}</p> : null}
    </div>
  );
}

function ShellNavigation({
  merchantName,
  merchantSlug,
  accountLabel,
  onNavigate,
}: Omit<AppShellProps, "children"> & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <Link href="/dashboard" onClick={onNavigate} aria-label="Project ZERO dashboard" className="w-fit rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <BrandMark />
      </Link>
      <MerchantSummary merchantName={merchantName} merchantSlug={merchantSlug} />
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-sidebar-border bg-background/25 p-3">
          <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Account</p>
          <p className="mt-1 truncate font-mono text-xs">{accountLabel ?? "Authenticated merchant"}</p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" className="min-h-10 w-full justify-start border-sidebar-border bg-transparent">
            <LogOut /> Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ children, merchantName, merchantSlug, accountLabel }: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-surface min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" aria-label="Project ZERO dashboard"><BrandMark /></Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden border-info/30 bg-info/10 text-info sm:flex">Testnet</Badge>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button type="button" variant="outline" size="icon-lg" aria-label="Open navigation" className="border-border/70 bg-card/70">
                    <Menu />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[min(19rem,88vw)] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
                <SheetHeader><SheetTitle className="sr-only">Merchant navigation</SheetTitle></SheetHeader>
                <div className="h-full p-5">
                  <ShellNavigation
                    merchantName={merchantName}
                    merchantSlug={merchantSlug}
                    accountLabel={accountLabel}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex w-full">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-sidebar-border bg-sidebar p-5 text-sidebar-foreground md:block">
          <ShellNavigation merchantName={merchantName} merchantSlug={merchantSlug} accountLabel={accountLabel} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
