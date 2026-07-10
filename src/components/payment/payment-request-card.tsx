"use client";

import { useEffect, useMemo, useState } from "react";
import { getNetwork, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import QRCode from "react-qr-code";

import { CopyPaymentLink } from "@/components/payment/copy-payment-link";
import { PaymentProgress } from "@/components/payment/payment-progress";
import { PaymentReceipt } from "@/components/payment/payment-receipt";
import { WalletTrustBlock } from "@/components/payment/wallet-trust-block";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { STELLAR_TESTNET_PASSPHRASE } from "@/constants/stellar";
import {
  getCheckoutStatusMessage,
  isSignRejectedError,
  type CheckoutFlowStatus,
} from "@/lib/payments/checkout-progress";
import { buildPaymentXDR, buildSep7Uri } from "@/lib/stellar/build-payment";
import { cn } from "@/lib/utils";

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
  initialTxHash?: string | null;
};

type WalletState = "unknown" | "missing" | "available";

function truncateAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function PaymentRequestCard({
  merchantName,
  paymentRequest,
  paymentLink,
  initialTxHash = null,
}: PaymentRequestCardProps) {
  const [status, setStatus] = useState<CheckoutFlowStatus>(
    paymentRequest.status === "paid" ? "paid" : "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signRejected, setSignRejected] = useState(false);
  const [broadcastHash, setBroadcastHash] = useState<string | null>(initialTxHash);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletState, setWalletState] = useState<WalletState>("unknown");

  const isBusy = ["connecting", "signing", "submitting", "verifying"].includes(status);
  const canPay = paymentRequest.status === "pending" && status !== "paid";
  const statusMessage = getCheckoutStatusMessage(status);

  const sep7Uri = useMemo(
    () =>
      buildSep7Uri({
        destination: paymentRequest.stellar_destination,
        amount: paymentRequest.amount,
        assetCode: paymentRequest.asset_code,
        assetIssuer: paymentRequest.asset_issuer,
        memo: paymentRequest.memo,
        networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
        payLink: paymentLink,
      }),
    [paymentLink, paymentRequest],
  );

  useEffect(() => {
    let mounted = true;

    isConnected()
      .then((result) => {
        if (mounted) {
          setWalletState(result.error ? "missing" : "available");
        }
      })
      .catch(() => {
        if (mounted) {
          setWalletState("missing");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handlePay() {
    if (!canPay || isBusy) {
      return;
    }

    try {
      setErrorMsg(null);
      setSignRejected(false);
      setBroadcastHash(null);
      setStatus("connecting");

      const connected = await isConnected();
      if (connected.error) {
        throw new Error("Freighter extension not installed.");
      }
      if (!connected.isConnected) {
        throw new Error("Freighter extension not installed.");
      }

      const access = await requestAccess();
      if (access.error) {
        throw new Error(access.error.message);
      }

      setConnectedAddress(access.address);

      const network = await getNetwork();
      if (network.error) {
        throw new Error(network.error.message);
      }
      if (network.networkPassphrase !== STELLAR_TESTNET_PASSPHRASE) {
        throw new Error("Switch Freighter to Stellar Testnet before paying.");
      }

      setStatus("signing");
      const xdr = await buildPaymentXDR({
        sourcePublicKey: access.address,
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
      setBroadcastHash(result.hash);

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
      const message = err instanceof Error ? err.message : "Unknown wallet error.";
      setErrorMsg(message);
      setSignRejected(isSignRejectedError(message));
      setStatus("error");
    }
  }

  function handleRetry() {
    setErrorMsg(null);
    setSignRejected(false);
    setStatus("idle");
  }

  const displayStatus = status === "paid" ? "paid" : paymentRequest.status;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{paymentRequest.title}</CardTitle>
                <CardDescription>{merchantName}</CardDescription>
              </div>
              <StatusBadge status={displayStatus} />
            </div>
            <PaymentProgress status={status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {status === "paid" ? (
              <PaymentReceipt
                amount={paymentRequest.amount}
                assetCode={paymentRequest.asset_code}
                merchantName={merchantName}
                txHash={broadcastHash}
              />
            ) : (
              <>
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

                <Accordion>
                  <AccordionItem value="details">
                    <AccordionTrigger className="text-sm font-medium">
                      Payment details
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-3 rounded-lg border border-border p-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Memo</p>
                          <p className="font-mono">{paymentRequest.memo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Destination</p>
                          <p className="break-all font-mono">
                            {paymentRequest.stellar_destination}
                          </p>
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {connectedAddress ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Connected</span>
                    <span className="font-mono">{truncateAddress(connectedAddress)}</span>
                    <Badge variant="outline" className="border-info/40 bg-info/10 text-info-foreground">
                      Stellar Testnet
                    </Badge>
                  </div>
                ) : null}

                {status === "error" ? (
                  <div
                    role="alert"
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm",
                      signRejected ? "border-border" : "border-destructive/30",
                    )}
                  >
                    <p className="font-medium">
                      {signRejected
                        ? "Signing cancelled"
                        : broadcastHash
                          ? "Payment submitted but not verified"
                          : "Payment could not be completed"}
                    </p>
                    {errorMsg && !signRejected ? (
                      <p className="mt-1 text-muted-foreground">
                        Reason: <code>{errorMsg}</code>
                      </p>
                    ) : null}
                    <p className="mt-1 text-muted-foreground">
                      {signRejected
                        ? "You can try again when ready."
                        : broadcastHash
                          ? "Payment was submitted but could not be verified. Contact the merchant with your transaction hash."
                          : "No funds were moved."}
                    </p>
                    {broadcastHash ? (
                      <p className="mt-2 font-mono text-xs text-muted-foreground">{broadcastHash}</p>
                    ) : null}
                    {signRejected ? (
                      <Button type="button" variant="outline" className="mt-3" onClick={handleRetry}>
                        Try again
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {isBusy && statusMessage ? (
                  <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    {statusMessage}
                  </div>
                ) : null}

                <WalletTrustBlock />

                <Button type="button" onClick={handlePay} disabled={!canPay || isBusy} className="min-h-11">
                  Pay with Freighter
                </Button>

                {walletState === "missing" ? (
                  <p className="text-center text-sm text-muted-foreground">
                    <a
                      href="https://freighter.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-4"
                    >
                      Install Freighter
                    </a>{" "}
                    to pay from this browser, or scan the wallet QR below.
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment link</CardTitle>
            <CardDescription>Scan or share this request.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-lg bg-white p-4">
              <QRCode value={paymentLink} className="h-auto w-full" />
            </div>
            <p className="break-all font-mono text-xs text-muted-foreground">{paymentLink}</p>
            <CopyPaymentLink paymentLink={paymentLink} />
          </CardContent>
        </Card>

        {walletState === "missing" ? (
          <Card className="md:col-start-2">
            <CardHeader>
              <CardTitle>Wallet QR</CardTitle>
              <CardDescription>SEP-7 compatible payment request.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg bg-white p-4">
                <QRCode value={sep7Uri} className="h-auto w-full" />
              </div>
              <p className="break-all font-mono text-xs text-muted-foreground">{sep7Uri}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
