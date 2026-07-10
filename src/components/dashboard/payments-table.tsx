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
    <div className="overflow-x-auto">
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
  );
}
