const TESTNET_EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/";

export function truncateStellarHash(hash: string) {
  if (hash.length <= 20) {
    return hash;
  }

  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

export function stellarExplorerTxUrl(hash: string) {
  return `${TESTNET_EXPLORER_TX}${hash}`;
}
