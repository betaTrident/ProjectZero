import { getStellarServer } from "./client";

type HorizonPaymentRecord = {
  type?: string;
  to?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
};

export type VerifyExpected = {
  memo: string;
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
};

export type VerifyResult = { ok: boolean; reason?: string };

export async function verifyPaymentByHash(
  hash: string,
  expected: VerifyExpected,
): Promise<VerifyResult> {
  const server = getStellarServer();
  const tx = await server.transactions().transaction(hash).call();

  if (tx.memo !== expected.memo) {
    return { ok: false, reason: "memo" };
  }

  const payments = await server.payments().forTransaction(hash).call();
  const payment = payments.records.find(
    (record: HorizonPaymentRecord) => record.type === "payment",
  ) as HorizonPaymentRecord | undefined;

  if (!payment) {
    return { ok: false, reason: "no payment operation found" };
  }

  if (payment.to !== expected.destination) {
    return { ok: false, reason: "destination" };
  }

  if (normalizeStellarAmount(payment.amount) !== normalizeStellarAmount(expected.amount)) {
    return { ok: false, reason: "amount" };
  }

  if (expected.assetCode === "XLM") {
    return payment.asset_type === "native" ? { ok: true } : { ok: false, reason: "asset" };
  }

  if (
    payment.asset_code !== expected.assetCode ||
    payment.asset_issuer !== expected.assetIssuer
  ) {
    return { ok: false, reason: "asset" };
  }

  return { ok: true };
}

function normalizeStellarAmount(amount: string | undefined) {
  if (!amount) {
    return null;
  }

  const [whole, fraction = ""] = amount.split(".");
  return `${whole}.${fraction.padEnd(7, "0").slice(0, 7)}`;
}
