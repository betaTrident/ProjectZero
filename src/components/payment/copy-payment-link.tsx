"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type CopyPaymentLinkProps = {
  paymentLink: string;
};

export function CopyPaymentLink({ paymentLink }: CopyPaymentLinkProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button type="button" variant="outline" onClick={copyLink}>
      <Copy aria-hidden="true" />
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
