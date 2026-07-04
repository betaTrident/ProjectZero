import Link from "next/link";

import { createPaymentRequest } from "@/actions/payment-requests";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { buildPaymentLink } from "@/lib/payments/payment-request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, stellar_public_key")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const [{ data: requests }, { data: products }] = merchant
    ? await Promise.all([
        supabase
          .from("payment_requests")
          .select("*")
          .eq("merchant_id", merchant.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("products")
          .select("id, name")
          .eq("merchant_id", merchant.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const destination = merchant?.stellar_public_key ?? process.env.PROJECT_ZERO_TREASURY_PUBLIC_KEY ?? "";

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Create invoice</CardTitle>
          <CardDescription>Generate a QR code and shareable payment link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createPaymentRequest} className="space-y-4">
            <input type="hidden" name="stellarDestination" value={destination} />
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assetCode">Asset</Label>
                <Input id="assetCode" name="assetCode" defaultValue="XLM" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="productId">Product</Label>
              <select
                id="productId"
                name="productId"
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">No product</option>
                {products?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires at</Label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" />
            </div>
            <Button type="submit" disabled={!destination}>
              Create invoice
            </Button>
            {!destination ? (
              <p className="text-xs text-muted-foreground">
                Add a merchant Stellar public key before creating invoices.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Pending, paid, expired, and cancelled payment requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.length ? (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.title}</TableCell>
                    <TableCell>
                      {Number(request.amount).toFixed(2)} {request.asset_code}
                    </TableCell>
                    <TableCell>
                      <Badge variant={request.status === "paid" ? "default" : "secondary"}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={buildPaymentLink(appUrl, request.id)}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No invoices yet.
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
