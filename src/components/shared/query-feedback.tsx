"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const SUCCESS_MESSAGES: Record<string, string> = {
  "created=payment-request": "Invoice created successfully.",
  "created=merchant": "Merchant profile saved.",
  "created=product": "Product created.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "payment-request-invalid": "Please check the invoice fields and try again.",
  "stellar-destination-required": "Add a Stellar public key before creating invoices.",
  "merchant-profile-required": "Complete your merchant profile first.",
  "product-invalid": "Please check the product fields and try again.",
};

function resolveErrorMessage(error: string) {
  if (ERROR_MESSAGES[error]) {
    return ERROR_MESSAGES[error];
  }

  try {
    return decodeURIComponent(error);
  } catch {
    return error;
  }
}

export function QueryFeedback() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const created = params.get("created");
    const error = params.get("error");

    if (created && SUCCESS_MESSAGES[`created=${created}`]) {
      toast.success(SUCCESS_MESSAGES[`created=${created}`]);
    }

    if (error) {
      toast.error(resolveErrorMessage(error));
    }

    if (created || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("created");
      url.searchParams.delete("error");
      router.replace(url.pathname + url.search);
    }
  }, [params, router]);

  return null;
}
