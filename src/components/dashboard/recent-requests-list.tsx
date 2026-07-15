"use client";

import Link from "next/link";
import { ExternalLink, FileText, QrCode } from "lucide-react";
import { useState } from "react";

import { InvoiceQrDialog } from "@/components/dashboard/invoice-qr-dialog";
import { PaymentStatusBadge } from "@/components/dashboard/payment-status-badge";
import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { PaymentRequestStatus } from "@/types/payment";

type RecentRequest = {
  id: string;
  title: string;
  amount: number | string;
  asset_code: string;
  status: PaymentRequestStatus;
  paymentLink: string;
};

type RecentRequestsListProps = {
  requests: RecentRequest[];
};

export function RecentRequestsList({ requests }: RecentRequestsListProps) {
  const [qrState, setQrState] = useState<{ open: boolean; link: string; title: string }>({
    open: false,
    link: "",
    title: "",
  });

  if (!requests.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No payment requests yet"
        description="Create your first invoice to get a shareable payment link."
        action={
          <Link href="/invoices" className={buttonVariants()}>
            Create invoice
          </Link>
        }
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border/60">
        {requests.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">{request.title}</p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {Number(request.amount).toFixed(2)} {request.asset_code}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PaymentStatusBadge paymentRequestId={request.id} initialStatus={request.status} />
              <Link href={request.paymentLink} className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink /> Open</Link>
              <CopyPaymentLink paymentLink={request.paymentLink} />
              <button
                type="button"
                className={buttonVariants({ variant: "outline", size: "sm" })}
                aria-label={`Show QR code for ${request.title}`}
                onClick={() =>
                  setQrState({ open: true, link: request.paymentLink, title: request.title })
                }
              >
                <QrCode data-icon="inline-start" />
                QR
              </button>
            </div>
          </li>
        ))}
      </ul>
      <InvoiceQrDialog
        open={qrState.open}
        onOpenChange={(open) => setQrState((current) => ({ ...current, open }))}
        paymentLink={qrState.link}
        title={qrState.title}
      />
    </>
  );
}
