"use client";

import Link from "next/link";
import { ExternalLink, FileText, QrCode } from "lucide-react";
import { useState } from "react";

import { InvoiceQrDialog } from "@/components/dashboard/invoice-qr-dialog";
import { PaymentStatusBadge } from "@/components/dashboard/payment-status-badge";
import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PaymentRequestStatus } from "@/types/payment";

type InvoiceRow = {
  id: string;
  title: string;
  amount: number | string;
  asset_code: string;
  status: PaymentRequestStatus;
  expires_at: string | null;
  paymentLink: string;
};

type InvoicesTableProps = {
  invoices: InvoiceRow[];
  presentationMode?: boolean;
};

function formatExpiresAt(expiresAt: string | null) {
  if (!expiresAt) {
    return "No expiry";
  }

  return new Date(expiresAt).toLocaleString();
}

export function InvoicesTable({ invoices, presentationMode = false }: InvoicesTableProps) {
  const [qrState, setQrState] = useState<{ open: boolean; link: string; title: string }>({
    open: false,
    link: "",
    title: "",
  });

  if (!invoices.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description="Create an invoice to generate a shareable payment link and QR code."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="truncate font-medium">{invoice.title}</h3><p className="mt-1 truncate font-mono text-[0.65rem] text-muted-foreground">{invoice.id}</p></div>
              <PaymentStatusBadge paymentRequestId={invoice.id} initialStatus={invoice.status} pollingDisabled={presentationMode} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3">
              <div><p className="font-mono text-lg font-semibold">{Number(invoice.amount).toFixed(2)} {invoice.asset_code}</p><p className="mt-1 text-xs text-muted-foreground">Expires {formatExpiresAt(invoice.expires_at)}</p></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
              <Link href={invoice.paymentLink} className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink /> Open</Link>
              <CopyPaymentLink paymentLink={invoice.paymentLink} />
              <Button type="button" variant="outline" size="sm" onClick={() => setQrState({ open: true, link: invoice.paymentLink, title: invoice.title })}><QrCode /> QR</Button>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableCaption className="sr-only">Merchant invoices with status and share actions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.title}</TableCell>
                <TableCell>
                  {Number(invoice.amount).toFixed(2)} {invoice.asset_code}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge paymentRequestId={invoice.id} initialStatus={invoice.status} pollingDisabled={presentationMode} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatExpiresAt(invoice.expires_at)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      href={invoice.paymentLink}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Open
                    </Link>
                    <CopyPaymentLink paymentLink={invoice.paymentLink} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Show QR code for ${invoice.title}`}
                      onClick={() =>
                        setQrState({
                          open: true,
                          link: invoice.paymentLink,
                          title: invoice.title,
                        })
                      }
                    >
                      <QrCode data-icon="inline-start" />
                      QR
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <InvoiceQrDialog
        open={qrState.open}
        onOpenChange={(open) => setQrState((current) => ({ ...current, open }))}
        paymentLink={qrState.link}
        title={qrState.title}
      />
    </>
  );
}
