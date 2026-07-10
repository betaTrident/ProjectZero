"use client";

import { useEffect, useMemo, useState } from "react";
import { getNetwork, isConnected, requestAccess, signTransaction } from "@stellar/freighter-api";
import { TransactionBuilder } from "@stellar/stellar-sdk";
import { WalletCards } from "lucide-react";
import QRCode from "react-qr-code";

import { BrandMark } from "@/components/marketing/brand-mark";
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
    <main className="app-surface min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-5 flex items-center justify-between border-b border-border/60 pb-5">
          <BrandMark />
          <Badge variant="outline" className="border-info/30 bg-info/10 text-info">Stellar Testnet</Badge>
        </header>

        {status === "paid" ? (
          <PaymentReceipt amount={paymentRequest.amount} assetCode={paymentRequest.asset_code} merchantName={merchantName} txHash={broadcastHash} invoiceId={paymentRequest.id} paymentLink={paymentLink} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <Card className="app-panel gap-0 py-0">
              <CardHeader className="border-b border-border/60 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs text-muted-foreground">Pay to</p><CardTitle className="mt-1 text-lg">{merchantName}</CardTitle></div>
                  <StatusBadge status={displayStatus} />
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
                <div><p className="text-xs text-muted-foreground">Invoice</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{paymentRequest.title}</h1>{paymentRequest.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{paymentRequest.description}</p> : null}</div>

                <div className="rounded-xl border border-border/70 bg-background/40 p-4 sm:p-5">
                  <p className="text-xs text-muted-foreground">Pay exactly</p>
                  <p className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">{Number(paymentRequest.amount).toFixed(2)} <span className="text-lg text-muted-foreground">{paymentRequest.asset_code}</span></p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs"><span className="text-warning">Pending payment</span><span className="text-muted-foreground">{paymentRequest.expires_at ? `Expires ${new Date(paymentRequest.expires_at).toLocaleString()}` : "No expiration"}</span></div>
                </div>

                <PaymentProgress status={status} />
                {connectedAddress ? <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Connected</span><span className="font-mono">{truncateAddress(connectedAddress)}</span><Badge variant="outline" className="border-info/30 bg-info/10 text-info">Testnet</Badge></div> : null}

                {status === "error" ? (
                  <div role="alert" className={cn("rounded-xl border bg-destructive/5 p-4 text-sm", signRejected ? "border-border" : "border-destructive/35")}>
                    <p className="font-medium">{signRejected ? "Signing cancelled" : broadcastHash ? "Payment submitted but not verified" : "Payment could not be completed"}</p>
                    {errorMsg && !signRejected ? <p className="mt-2 text-muted-foreground">Reason: <code className="font-mono text-xs">{errorMsg}</code></p> : null}
                    <p className="mt-2 text-muted-foreground">{signRejected ? "You can try again when ready." : broadcastHash ? "Contact the merchant with your transaction hash." : "No funds were moved."}</p>
                    {broadcastHash ? <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{broadcastHash}</p> : null}
                    {signRejected ? <Button type="button" variant="outline" className="mt-3" onClick={handleRetry}>Try again</Button> : null}
                  </div>
                ) : null}

                {isBusy && statusMessage ? <div aria-live="polite" className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/6 p-3 text-sm text-muted-foreground"><Spinner />{statusMessage}</div> : null}
                <Button type="button" size="lg" onClick={handlePay} disabled={!canPay || isBusy} className="min-h-12 w-full text-base"><WalletCards /> Pay with Freighter</Button>
                {walletState === "missing" ? <p className="text-center text-sm text-muted-foreground"><a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Install Freighter</a> to pay here, or scan the wallet QR.</p> : null}
                <WalletTrustBlock />

                <Accordion>
                  <AccordionItem value="details" className="rounded-lg border border-border/70 px-3">
                    <AccordionTrigger>Technical details</AccordionTrigger>
                    <AccordionContent><dl className="grid gap-3 pb-2 text-sm"><TechnicalRow label="Memo" value={paymentRequest.memo} /><TechnicalRow label="Destination" value={paymentRequest.stellar_destination} /><TechnicalRow label="Asset" value={paymentRequest.asset_code} /><TechnicalRow label="Network" value="Stellar Testnet" /></dl></AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="app-panel"><CardHeader><CardTitle>Pay with payment link</CardTitle><CardDescription>Scan with a compatible wallet or share this request.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4"><div className="mx-auto w-full max-w-56 rounded-xl bg-[var(--marketing-qr-background)] p-4"><QRCode value={paymentLink} className="h-auto w-full" /></div><p className="break-all rounded-lg border border-border/60 bg-background/40 p-3 font-mono text-xs text-muted-foreground">{paymentLink}</p><CopyPaymentLink paymentLink={paymentLink} /></CardContent></Card>
              {walletState === "missing" ? <Card className="app-panel"><CardHeader><CardTitle>Wallet QR</CardTitle><CardDescription>SEP-7 compatible request.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="mx-auto max-w-56 rounded-xl bg-[var(--marketing-qr-background)] p-4"><QRCode value={sep7Uri} className="h-auto w-full" /></div><p className="break-all font-mono text-xs text-muted-foreground">{sep7Uri}</p></CardContent></Card> : null}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TechnicalRow({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 sm:grid-cols-[7rem_1fr]"><dt className="text-muted-foreground">{label}</dt><dd className="break-all font-mono text-xs">{value}</dd></div>;
}
