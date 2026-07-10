"use client";

import QRCode from "react-qr-code";

import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InvoiceQrDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentLink: string;
  title: string;
};

export function InvoiceQrDialog({ open, onOpenChange, paymentLink, title }: InvoiceQrDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-panel border-border bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share invoice</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mx-auto w-fit rounded-lg bg-[var(--marketing-qr-background)] p-4">
          <QRCode value={paymentLink} size={200} />
        </div>
        <CopyPaymentLink paymentLink={paymentLink} />
      </DialogContent>
    </Dialog>
  );
}
