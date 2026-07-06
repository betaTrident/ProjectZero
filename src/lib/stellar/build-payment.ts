export type PaymentParams = {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
  memo: string;
  networkPassphrase: string;
};

// Returns a base64-encoded XDR ready for Freighter `signTransaction`.
export function buildPaymentXDR(params: PaymentParams): string {
  void params;
  throw new Error("not implemented");
}

// Returns a SEP-7 web+stellar: URI for non-Freighter wallet deeplinks.
export function buildSep7Uri(params: PaymentParams & { payLink: string }): string {
  void params;
  throw new Error("not implemented");
}
