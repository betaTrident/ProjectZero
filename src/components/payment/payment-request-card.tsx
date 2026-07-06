"use client";

import { useState } from "react";
import { getNetwork, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import QRCode from "react-qr-code";

import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { STELLAR_TESTNET_PASSPHRASE } from "@/constants/stellar";
import { buildPaymentXDR } from "@/lib/stellar/build-payment";

type PaymentRequestCardProps = {
  merchantName: string;
  paymentRequest: {
    id: string;
    title: string;
    description: string | null;
    amount: string;
    asset_code: string;
    asset_issuer: string | null;
    status: "pending" | "paid" | "expired";
    expires_at: string | null;
    memo: string;
    stellar_destination: string;
  };
  paymentLink: string;
};

type PaymentStatus = "idle" | "connecting" | "signing" | "submitting" | "verifying" | "paid" | "error";

export function PaymentRequestCard({
  merchantName,
  paymentRequest,
  paymentLink,
}: PaymentRequestCardProps) {
  const [status, setStatus] = useState<PaymentStatus>(
    paymentRequest.status === "paid" ? "paid" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isBusy = ["connecting", "signing", "submitting", "verifying"].includes(status);
  const canPay = paymentRequest.status === "pending" && status !== "paid";

  async function handlePay() {
    if (!canPay || isBusy) {
      return;
    }

    try {
      setErrorMsg(null);
      setStatus("connecting");

      const connected = await isConnected();
      if (connected.error) {
        throw new Error(connected.error.message);
      }
      if (!connected.isConnected) {
        throw new Error("Freighter extension not installed.");
      }

      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message);
      }

      const network = await getNetwork();
      if (network.error) {
        throw new Error(network.error.message);
      }
      if (network.networkPassphrase !== STELLAR_TESTNET_PASSPHRASE) {
        throw new Error("Switch Freighter to Stellar Testnet before paying.");
      }

      setStatus("signing");
      const xdr = buildPaymentXDR({
        destination: paymentRequest.stellar_destination,
        amount: paymentRequest.amount,
        assetCode: paymentRequest.asset_code,
        assetIssuer: paymentRequest.asset_issuer,
        memo: paymentRequest.memo,
        networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
      });
      const signed = await signTransaction(xdr, {
        address: access.address,
        networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
      });
      if (signed.error) {
        throw new Error(signed.error.message);
      }

      setStatus("submitting");
      const server = (await import("@/lib/stellar/client")).getStellarServer();
      const tx = TransactionBuilder.fromXDR(signed.signedTxXdr, STELLAR_TESTNET_PASSPHRASE);
      const result = await server.submitTransaction(tx);

      setStatus("verifying");
      const res = await fetch("/api/stellar/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentRequestId: paymentRequest.id,
          stellarTxHash: result.hash,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; reason?: string };

      if (!res.ok || !json.ok) {
        throw new Error(json.reason ?? "Verification failed.");
      }

      setStatus("paid");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown wallet error.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{paymentRequest.title}</CardTitle>
                <CardDescription>{merchantName}</CardDescription>
              </div>
              <Badge variant={status === "paid" ? "default" : "secondary"}>
                {status === "paid" ? "paid" : paymentRequest.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-4xl font-semibold tracking-tight">
                {Number(paymentRequest.amount).toFixed(2)} {paymentRequest.asset_code}
              </p>
              {paymentRequest.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {paymentRequest.description}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-lg border border-border p-4 text-sm">
              <div>
                <p className="text-muted-foreground">Memo</p>
                <p className="font-mono">{paymentRequest.memo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="break-all font-mono">{paymentRequest.stellar_destination}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p>
                  {paymentRequest.expires_at
                    ? new Date(paymentRequest.expires_at).toLocaleString()
                    : "No expiration"}
                </p>
              </div>
            </div>

            {status === "paid" ? (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Payment confirmed on-chain.
              </p>
            ) : null}
            {status === "error" ? (
              <div role="alert" className="rounded-md border border-destructive/30 px-3 py-2 text-sm">
                <p className="font-medium">Payment could not be verified.</p>
                {errorMsg ? (
                  <p className="mt-1 text-muted-foreground">
                    Reason: <code>{errorMsg}</code>
                  </p>
                ) : null}
                <p className="mt-1 text-muted-foreground">
                  Your funds have not been moved if signing was rejected.
                </p>
              </div>
            ) : null}
            {isBusy ? (
              <p className="text-sm text-muted-foreground">{formatStatus(status)}...</p>
            ) : null}
            <Button type="button" onClick={handlePay} disabled={!canPay || isBusy}>
              Pay with Freighter
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment link</CardTitle>
            <CardDescription>Scan or share this request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-white p-4">
              <QRCode value={paymentLink} className="h-auto w-full" />
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{paymentLink}</p>
            <CopyPaymentLink paymentLink={paymentLink} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatStatus(status: PaymentStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
