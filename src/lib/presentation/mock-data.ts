import type { PaymentRequestStatus } from "@/types/payment";

export type PresentationInvoice = {
  id: string;
  title: string;
  amount: string;
  asset_code: string;
  status: PaymentRequestStatus;
  expires_at: string | null;
  paymentLink: string;
};

export type PresentationPayment = {
  id: string;
  stellar_tx_hash: string;
  amount: string;
  asset_code: string;
  source_wallet: string;
  verified_at: string;
};

const SOURCE_WALLETS = [
  "GAIRISXKPLOWZBMFRPU5XRGUUX3VMA3ZEWKBM5MSNRU3CHV6P4PYZ74D",
  "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
] as const;

function shiftedIso(now: Date, days: number, hours = 0) {
  const value = new Date(now);
  value.setDate(value.getDate() + days);
  value.setHours(value.getHours() + hours);
  return value.toISOString();
}

export function getPresentationInvoices(appUrl: string, now = new Date()): PresentationInvoice[] {
  const baseUrl = appUrl.replace(/\/$/, "");
  const invoice = (
    id: string,
    title: string,
    amount: string,
    status: PaymentRequestStatus,
    expiresInDays: number,
  ): PresentationInvoice => ({
    id,
    title,
    amount,
    asset_code: "XLM",
    status,
    expires_at: shiftedIso(now, expiresInDays),
    paymentLink: `${baseUrl}/pay/${id}`,
  });

  return [
    invoice("10000000-0000-4000-8000-000000000101", "Weekend Pop-up Order", "85.00", "pending", 2),
    invoice("10000000-0000-4000-8000-000000000102", "Custom Gift Box Order", "68.75", "paid", 5),
    invoice("10000000-0000-4000-8000-000000000103", "Social Shop Order #1048", "24.50", "paid", 3),
    invoice("10000000-0000-4000-8000-000000000104", "Wholesale Restock Deposit", "320.00", "pending", 7),
    invoice("10000000-0000-4000-8000-000000000105", "Market Booth Reservation", "150.00", "expired", -2),
  ];
}

export function getPresentationPayments(now = new Date()): PresentationPayment[] {
  const payment = (
    id: string,
    hashSeed: string,
    amount: string,
    sourceWallet: string,
    daysAgo: number,
    hoursAgo: number,
  ): PresentationPayment => ({
    id,
    stellar_tx_hash: hashSeed.repeat(8),
    amount,
    asset_code: "XLM",
    source_wallet: sourceWallet,
    verified_at: shiftedIso(now, -daysAgo, -hoursAgo),
  });

  return [
    payment("20000000-0000-4000-8000-000000000101", "7f3c2a91", "68.75", SOURCE_WALLETS[0], 0, 2),
    payment("20000000-0000-4000-8000-000000000102", "4d8e1b62", "24.50", SOURCE_WALLETS[1], 2, 5),
    payment("20000000-0000-4000-8000-000000000103", "9a5f0c37", "320.00", SOURCE_WALLETS[0], 6, 1),
    payment("20000000-0000-4000-8000-000000000104", "2c7b6e48", "45.00", SOURCE_WALLETS[1], 13, 4),
    payment("20000000-0000-4000-8000-000000000105", "6e1a9d53", "112.25", SOURCE_WALLETS[0], 31, 3),
  ];
}
