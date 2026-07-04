export type VerifyPaymentResult =
  | { ok: true; transactionHash: string }
  | { ok: false; reason: string };

export async function verifyPaymentByHash(): Promise<VerifyPaymentResult> {
  return {
    ok: false,
    reason: "Stellar server-side verification is implemented in Phase 3.",
  };
}
