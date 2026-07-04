import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const { data: transactions } = merchant
    ? await supabase
        .from("transactions")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
          <CardDescription>Verified Stellar transactions and hashes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction hash</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Verified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.length ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="max-w-[280px] truncate font-mono">
                      {transaction.stellar_tx_hash}
                    </TableCell>
                    <TableCell>
                      {transaction.amount ? Number(transaction.amount).toFixed(2) : "0.00"}{" "}
                      {transaction.asset_code ?? "XLM"}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate font-mono">
                      {transaction.source_wallet ?? "Unknown"}
                    </TableCell>
                    <TableCell>{new Date(transaction.verified_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No verified payments yet. Phase 3 adds Stellar verification writes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
