import {
  Account,
  Asset,
  BASE_FEE,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export type PaymentParams = {
  destination: string;
  amount: string;
  assetCode: string;
  assetIssuer: string | null;
  memo: string;
  networkPassphrase: string;
};

/**
 * Builds an unsigned XDR transaction ready for Freighter `signTransaction`.
 * Asset: pass assetCode="XLM" and assetIssuer=null for native lumens.
 *        pass assetCode="USDC" and assetIssuer=<issuer G-key> for credit assets.
 * Memo: treated as a public correlation key; do not include private data.
 */
export function buildPaymentXDR(params: PaymentParams): string {
  const { destination, amount, assetCode, assetIssuer, memo, networkPassphrase } = params;
  if (memo.length > 28) {
    throw new Error(`Memo exceeds 28-character MEMO_TEXT limit: ${memo.length} characters`);
  }

  const asset =
    assetCode === "XLM" ? Asset.native() : new Asset(assetCode, requireAssetIssuer(assetIssuer));
  const source = new Account(destination, "0");

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount,
      }),
    )
    .addMemo(Memo.text(memo))
    .setTimeout(300)
    .build();

  return tx.toXDR();
}

// Returns a SEP-7 web+stellar: URI for non-Freighter wallet deeplinks.
export function buildSep7Uri(params: PaymentParams & { payLink: string }): string {
  const { destination, amount, assetCode, assetIssuer, memo, networkPassphrase, payLink } = params;
  const url = new URL("web+stellar:pay");

  url.searchParams.set("destination", destination);
  url.searchParams.set("amount", amount);
  url.searchParams.set("asset_code", assetCode === "XLM" ? "native" : assetCode);
  if (assetCode !== "XLM") {
    url.searchParams.set("asset_issuer", requireAssetIssuer(assetIssuer));
  }
  url.searchParams.set("memo", memo);
  url.searchParams.set("memo_type", "MEMO_TEXT");
  url.searchParams.set("network_passphrase", networkPassphrase);
  url.searchParams.set("callback", `url:${payLink}`);

  return url.toString();
}

function requireAssetIssuer(assetIssuer: string | null): string {
  if (!assetIssuer) {
    throw new Error("assetIssuer is required for non-native Stellar assets");
  }

  return assetIssuer;
}
