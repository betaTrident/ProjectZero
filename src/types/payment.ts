export type PaymentRequestStatus = "pending" | "paid" | "expired" | "cancelled";

export type PaymentRequestSummary = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  assetCode: string;
  status: PaymentRequestStatus;
  paymentUrl: string;
  expiresAt: string | null;
};

export type StellarTransactionSummary = {
  hash: string;
  sourceWallet: string | null;
  destinationWallet: string;
  amount: number;
  assetCode: string;
  verifiedAt: string;
};
