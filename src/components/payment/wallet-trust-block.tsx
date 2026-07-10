import { Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WalletTrustBlockProps = {
  className?: string;
};

export function WalletTrustBlock({ className }: WalletTrustBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Secure connection</p>
          <p className="text-sm text-muted-foreground">We never hold your keys.</p>
        </div>
      </div>
      <Badge variant="outline" className="w-fit border-info/40 bg-info/10 text-info-foreground">
        Powered by Stellar Testnet
      </Badge>
    </div>
  );
}
