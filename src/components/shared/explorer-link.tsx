import { stellarExplorerTxUrl, truncateStellarHash } from "@/lib/format/stellar";
import { cn } from "@/lib/utils";

type ExplorerLinkProps = {
  hash: string;
  className?: string;
};

export function ExplorerLink({ hash, className }: ExplorerLinkProps) {
  return (
    <a
      href={stellarExplorerTxUrl(hash)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("font-mono text-xs text-info hover:underline", className)}
    >
      {truncateStellarHash(hash)}
    </a>
  );
}
