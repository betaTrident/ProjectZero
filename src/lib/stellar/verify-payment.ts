import { getStellarServer } from "./client";

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
  void hash;
  void expected;
  void getStellarServer;

  return { ok: false, reason: "verify pending Phase 2" };
}
