import { privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

/**
 * A known private key for testing. NEVER use on mainnet.
 * This is a deterministic key derived from a test seed.
 */
export const TEST_PRIVATE_KEY: Hex =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/**
 * The wallet address derived from TEST_PRIVATE_KEY.
 */
export const TEST_WALLET_ADDRESS =
  privateKeyToAccount(TEST_PRIVATE_KEY).address;

/**
 * A test CDP account name for use in fixtures.
 */
export const TEST_CDP_ACCOUNT_NAME = "x402-00000000-0000-4000-a000-000000000001";
