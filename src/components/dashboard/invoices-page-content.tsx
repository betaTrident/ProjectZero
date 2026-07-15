"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { CreateInvoiceForm } from "@/components/dashboard/create-invoice-form";
import { InvoicesTable } from "@/components/dashboard/invoices-table";
import { PageHeader } from "@/components/layout/page-header";
import { QueryFeedback } from "@/components/shared/query-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { PaymentRequestStatus } from "@/types/payment";

type ProductOption = {
  id: string;
  name: string;
};

type InvoiceRow = {
  id: string;
  title: string;
  amount: number | string;
  asset_code: string;
  status: PaymentRequestStatus;
  expires_at: string | null;
  paymentLink: string;
};

type InvoicesPageContentProps = {
  products: ProductOption[];
  hasDestination: boolean;
  invoices: InvoiceRow[];
  defaultExpiresAt: string;
  presentationMode?: boolean;
};

export function InvoicesPageContent({
  products,
  hasDestination,
  invoices,
  defaultExpiresAt,
  presentationMode = false,
}: InvoicesPageContentProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <QueryFeedback />
      <PageHeader
        title="Invoices"
        description="Create and share payment requests with QR codes and links."
        action={
          <div className="flex items-center gap-2">
            {presentationMode ? <Badge variant="outline">Presentation data</Badge> : null}
            <div className="lg:hidden">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger
                  render={
                    <Button type="button" size="lg" disabled={!hasDestination}>
                      <Plus data-icon="inline-start" />
                      New invoice
                    </Button>
                  }
                />
                <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl border-border bg-popover">
                  <SheetHeader>
                    <SheetTitle>Create invoice</SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-6">
                    <CreateInvoiceForm
                      idPrefix="mobile-invoice"
                      products={products}
                      hasDestination={hasDestination}
                      defaultExpiresAt={defaultExpiresAt}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="app-panel hidden lg:block">
          <CardHeader>
            <CardTitle>Create invoice</CardTitle>
            <CardDescription>Generate a QR code and shareable payment link.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateInvoiceForm
              idPrefix="desktop-invoice"
              products={products}
              hasDestination={hasDestination}
              defaultExpiresAt={defaultExpiresAt}
            />
          </CardContent>
        </Card>

        <Card className="app-panel">
          <CardHeader>
            <CardTitle>All invoices</CardTitle>
            <CardDescription>Pending, paid, and expired payment requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoicesTable invoices={invoices} presentationMode={presentationMode} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
