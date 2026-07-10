"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#security", label: "Security" },
  { href: "#use-cases", label: "Use cases" },
] as const;

export function MobileMarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Open navigation"
            className="border-border/70 bg-card/70 md:hidden"
          >
            <Menu />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[min(22rem,88vw)] border-border bg-background/98">
        <SheetHeader className="border-b border-border/60 px-5 py-5">
          <SheetTitle className="sr-only">Project ZERO navigation</SheetTitle>
          <BrandMark />
        </SheetHeader>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-5 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-3 border-t border-border/60 p-5">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11")}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ size: "lg" }), "min-h-11")}
          >
            Start accepting payments
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
