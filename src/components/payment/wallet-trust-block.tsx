import { LockKeyhole, Shield, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WalletTrustBlockProps = {
  className?: string;
};

const trustItems = [
  { text: "We never hold your keys", icon: LockKeyhole },
  { text: "We never request your seed phrase", icon: Shield },
  { text: "You authorize through Freighter", icon: WalletCards },
] as const;

export function WalletTrustBlock({ className }: WalletTrustBlockProps) {
  return (
    <div className={cn("rounded-xl border border-primary/25 bg-primary/6 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium"><Shield className="size-4 text-primary" /> Secure connection</p>
        <Badge variant="outline" className="border-info/30 bg-info/10 text-info">Powered by Stellar Testnet</Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {trustItems.map((item) => {
          const Icon = item.icon;
          return <div key={item.text} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"><Icon className="size-3" /></span>{item.text}</div>;
        })}
      </div>
    </div>
  );
}
