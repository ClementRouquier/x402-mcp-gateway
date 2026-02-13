import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isAddress, createPublicClient, http, formatUnits } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { resetTestDb, seedTestUser } from "@/test/helpers/db";
import {
  TEST_PRIVATE_KEY,
  TEST_WALLET_ADDRESS,
  TEST_CDP_ACCOUNT_NAME,
} from "@/test/helpers/crypto";
import { chainConfig } from "@/lib/chain-config";

describe("E2E: Wallet Operations", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterEach(async () => {
    await resetTestDb();
  });

  describe("Key derivation", () => {
    it("should derive the correct address from the test private key", () => {
      const account = privateKeyToAccount(TEST_PRIVATE_KEY);
      expect(account.address).toBe(TEST_WALLET_ADDRESS);
    });
  });

  describe("Base Sepolia RPC connectivity", () => {
    it("should connect to Base Sepolia and read USDC balanceOf", async () => {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      const USDC_ABI = [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ] as const;

      const balance = await client.readContract({
        address: chainConfig.usdcAddress,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [TEST_WALLET_ADDRESS],
      });

      // Balance is a bigint — the test wallet likely has 0 USDC on Sepolia
      expect(typeof balance).toBe("bigint");
      expect(balance).toBeGreaterThanOrEqual(BigInt(0));

      // Format as human-readable
      const formatted = formatUnits(balance, 6);
      expect(parseFloat(formatted)).toBeGreaterThanOrEqual(0);
    }, 15000); // 15s timeout for RPC call

    it("should use the correct chain config for Base Sepolia", () => {
      expect(chainConfig.chain.id).toBe(84532);
      expect(chainConfig.usdcAddress).toBe(
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      );
      expect(chainConfig.networkString).toBe("eip155:84532");
      expect(chainConfig.explorerUrl).toBe("https://sepolia.basescan.org");
    });

    it("should read USDC contract symbol on Sepolia to verify contract existence", async () => {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http("https://sepolia.base.org"),
      });

      const SYMBOL_ABI = [
        {
          name: "symbol",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "string" }],
        },
      ] as const;

      const symbol = await client.readContract({
        address: chainConfig.usdcAddress,
        abi: SYMBOL_ABI,
        functionName: "symbol",
      });

      expect(symbol).toBe("USDC");
    }, 15000);
  });

  describe("Hot wallet in database", () => {
    it("should seed a user with hot wallet and verify address matches", async () => {
      const { hotWallet } = await seedTestUser();

      expect(hotWallet.address).toBe(TEST_WALLET_ADDRESS);
      expect(isAddress(hotWallet.address)).toBe(true);
      expect(hotWallet.cdpAccountName).toBe(TEST_CDP_ACCOUNT_NAME);
    });
  });
});
