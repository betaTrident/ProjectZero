import { vi } from "vitest";

vi.mock("@stellar/freighter-api", () => ({
  isConnected: vi.fn().mockResolvedValue({ isConnected: true, error: undefined }),
  requestAccess: vi.fn().mockResolvedValue({ address: "GBUYER...", error: undefined }),
  getNetwork: vi.fn().mockResolvedValue({
    network: "TESTNET",
    networkPassphrase: "Test SDF Network ; September 2015",
    error: undefined,
  }),
  signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "mocked-xdr", error: undefined }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
}));
