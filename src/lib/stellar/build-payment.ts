import {
  DEFAULT_ASSET_CODE,
  STELLAR_TESTNET_NETWORK,
  STELLAR_TESTNET_PASSPHRASE,
} from "@/constants/stellar";

export type BuildPaymentInput = {
  destination: string;
  amount: string;
  assetCode?: string;
  memo: string;
};

export function describeTestnetPayment(input: BuildPaymentInput) {
  return {
    network: STELLAR_TESTNET_NETWORK,
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
    assetCode: input.assetCode ?? DEFAULT_ASSET_CODE,
    destination: input.destination,
    amount: input.amount,
    memo: input.memo,
  };
}
