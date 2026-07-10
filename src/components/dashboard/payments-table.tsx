import Link from "next/link";

import { ExplorerLink } from "@/components/shared/explorer-link";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { truncateStellarHash } from "@/lib/format/stellar";
import { Wallet } from "lucide-react";

type PaymentRow = {
  id: string;
  stellar_tx_hash: string;
  amount: number | string | null;
  asset_code: string | null;
  source_wallet: string | null;
  verified_at: string;
};

type PaymentsTableProps = {
  transactions: PaymentRow[];
};

export function PaymentsTable({ transactions }: PaymentsTableProps) {
  if (!transactions.length) {
    return (
      <EmptyState
        icon={Wallet}
        title="No verified payments yet"
        description="Share an invoice link to get paid."
        action={
          <Link href="/invoices" className={buttonVariants()}>
            Go to invoices
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-mono text-xl font-semibold">{transaction.amount ? Number(transaction.amount).toFixed(2) : "0.00"} {transaction.asset_code ?? "XLM"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(transaction.verified_at).toLocaleString()}</p></div>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary">Verified</span>
            </div>
            <div className="mt-4 grid gap-2 border-t border-border/60 pt-3 text-xs">
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Transaction</span><ExplorerLink hash={transaction.stellar_tx_hash} /></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Source wallet</span><span className="font-mono text-muted-foreground">{transaction.source_wallet ? truncateStellarHash(transaction.source_wallet) : "Unknown"}</span></div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
        <TableCaption className="sr-only">Verified Stellar payment history</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead>Source wallet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-muted-foreground">
                {new Date(transaction.verified_at).toLocaleString()}
              </TableCell>
              <TableCell>
                {transaction.amount ? Number(transaction.amount).toFixed(2) : "0.00"}
              </TableCell>
              <TableCell>{transaction.asset_code ?? "XLM"}</TableCell>
              <TableCell>
                <ExplorerLink hash={transaction.stellar_tx_hash} />
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {transaction.source_wallet
                  ? truncateStellarHash(transaction.source_wallet)
                  : "Unknown"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </>
  );
}
