import { ExplorerLink } from "@/components/shared/explorer-link";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { Wallet } from "lucide-react";

type RecentTransaction = {
  id: string;
  stellar_tx_hash: string;
  amount: number | string | null;
  asset_code: string | null;
  verified_at: string;
};

type RecentPaymentsListProps = {
  transactions: RecentTransaction[];
};

export function RecentPaymentsList({ transactions }: RecentPaymentsListProps) {
  if (!transactions.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="No verified payments yet"
        description="Verified payments appear here after customers complete checkout."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {transactions.map((transaction) => (
        <li
          key={transaction.id}
          className="flex flex-col gap-1 rounded-lg border border-border/60 p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-mono text-sm">
              {transaction.amount ? Number(transaction.amount).toFixed(2) : "0.00"}{" "}
              {transaction.asset_code ?? "XLM"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(transaction.verified_at)}
            </p>
          </div>
          <ExplorerLink hash={transaction.stellar_tx_hash} />
        </li>
      ))}
    </ul>
  );
}
