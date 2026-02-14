import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  withdrawFromWallet,
  getUsdcBalance,
  USDC_DECIMALS,
} from "../wallet";
import {
  TEST_WALLET_ADDRESS,
  TEST_CDP_ACCOUNT_NAME,
} from "../../test/helpers/crypto";
import { resetTestDb, seedTestUser } from "../../test/helpers/db";
import { prisma } from "../db";

// Mock viem to avoid real RPC calls
vi.mock("viem", async (importOriginal) => {
  const actual = await importOriginal<typeof import("viem")>();
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: vi.fn(),
    })),
  };
});

// Mock CDP client to avoid real API calls
vi.mock("@/lib/cdp", () => ({
  getCdpClient: vi.fn(() => ({
    evm: {
      getOrCreateAccount: vi.fn(({ name }: { name: string }) =>
        Promise.resolve({
          address: TEST_WALLET_ADDRESS,
          name,
          type: "evm-server" as const,
          signTypedData: vi.fn(),
          signMessage: vi.fn(),
          signTransaction: vi.fn(),
          sign: vi.fn(),
          sendTransaction: vi.fn().mockResolvedValue({
            transactionHash: "0x" + "f".repeat(64),
          }),
        }),
      ),
    },
    solana: {
      getOrCreateAccount: vi.fn(({ name }: { name: string }) =>
        Promise.resolve({
          address: "So1" + "a".repeat(40),
          name,
        }),
      ),
      listTokenBalances: vi.fn().mockResolvedValue([]),
    },
  })),
}));

describe("wallet", () => {
  describe("withdrawFromWallet", () => {
    beforeEach(async () => {
      await resetTestDb();
    });

    afterEach(async () => {
      vi.restoreAllMocks();
    });

    it("should throw for an invalid destination address", async () => {
      await expect(
        withdrawFromWallet("00000000-0000-4000-a000-000000000001", 1.0, "not-an-address"),
      ).rejects.toThrow("Invalid destination address");
    });

    it("should throw for zero or negative amount", async () => {
      const validAddress = "0x" + "1".repeat(40);
      await expect(
        withdrawFromWallet("00000000-0000-4000-a000-000000000001", 0, validAddress),
      ).rejects.toThrow("Amount must be greater than 0");

      await expect(
        withdrawFromWallet("00000000-0000-4000-a000-000000000001", -5, validAddress),
      ).rejects.toThrow("Amount must be greater than 0");
    });

    it("should throw if user has no wallet", async () => {
      // Create a user without a wallet
      await prisma.user.create({
        data: { id: "00000000-0000-4000-a000-000000000099", email: "no-wallet@example.com" },
      });

      const validAddress = "0x" + "1".repeat(40);
      await expect(
        withdrawFromWallet("00000000-0000-4000-a000-000000000099", 1.0, validAddress),
      ).rejects.toThrow("No active wallet found for this user");
    });

    it("should throw if insufficient balance", async () => {
      const { user } = await seedTestUser();

      // Mock getUsdcBalance via the public client readContract
      const { createPublicClient } = await import("viem");
      const mockReadContract = vi.fn().mockResolvedValue(BigInt(500000)); // 0.5 USDC
      vi.mocked(createPublicClient).mockReturnValue({
        readContract: mockReadContract,
      } as any);

      const validAddress = "0x" + "1".repeat(40);
      await expect(
        withdrawFromWallet(user.id, 1.0, validAddress),
      ).rejects.toThrow(/Insufficient balance/);
    });

    it("should submit transfer and log transaction on success", async () => {
      const { user } = await seedTestUser();

      const mockTxHash = "0x" + "f".repeat(64);

      // Mock public client for balance check
      const { createPublicClient } = await import("viem");
      const mockReadContract = vi
        .fn()
        .mockResolvedValue(BigInt(10_000_000)); // 10 USDC
      vi.mocked(createPublicClient).mockReturnValue({
        readContract: mockReadContract,
      } as any);

      const toAddress = "0x" + "2".repeat(40);
      const result = await withdrawFromWallet(user.id, 1.0, toAddress);

      expect(result.txHash).toBe(mockTxHash);

      // Verify transaction was logged in the database
      const tx = await prisma.transaction.findFirst({
        where: { userId: user.id, type: "withdrawal" },
      });
      expect(tx).not.toBeNull();
      expect(tx!.txHash).toBe(mockTxHash);
      expect(tx!.amount).toBe(1.0);
      expect(tx!.endpoint).toBe(`withdrawal:${toAddress}`);
      expect(tx!.status).toBe("completed");
    });
  });
});
