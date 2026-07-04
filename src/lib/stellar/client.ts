import { Horizon } from "@stellar/stellar-sdk";

import { STELLAR_TESTNET_HORIZON_URL } from "@/constants/stellar";

let server: Horizon.Server | null = null;

export function getStellarServer() {
  server ??= new Horizon.Server(
    process.env.STELLAR_HORIZON_URL ?? STELLAR_TESTNET_HORIZON_URL,
  );

  return server;
}
