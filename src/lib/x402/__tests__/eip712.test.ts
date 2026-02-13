import { describe, it, expect, vi } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { TEST_PRIVATE_KEY, TEST_WALLET_ADDRESS, TEST_CDP_ACCOUNT_NAME } from "../../../test/helpers/crypto";

// Mock CDP client — return a signer that delegates to viem's privateKeyToAccount
// so we can verify that signTypedData actually produces correct EIP-712 signatures.
const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
vi.mock("@/lib/cdp", () => ({
  getCdpClient: vi.fn(() => ({
    evm: {
      getOrCreateAccount: vi.fn(() =>
        Promise.resolve({
          address: testAccount.address,
          signTypedData: (args: Parameters<typeof testAccount.signTypedData>[0]) =>
            testAccount.signTypedData(args),
        }),
      ),
    },
  })),
}));

// Import after mocks are set up
const { createCdpEvmSigner, createExactEvmScheme } = await import("../eip712");

describe("createCdpEvmSigner", () => {
  it("creates a signer with the correct address", async () => {
    const signer = await createCdpEvmSigner(TEST_CDP_ACCOUNT_NAME);
    expect(signer.address).toBe(TEST_WALLET_ADDRESS);
  });

  it("signer has signTypedData method", async () => {
    const signer = await createCdpEvmSigner(TEST_CDP_ACCOUNT_NAME);
    expect(typeof signer.signTypedData).toBe("function");
  });

  it("signer can sign EIP-712 typed data", async () => {
    const signer = await createCdpEvmSigner(TEST_CDP_ACCOUNT_NAME);
    const signature = await signer.signTypedData({
      domain: {
        name: "USD Coin",
        version: "2",
        chainId: 84532,
        verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: TEST_WALLET_ADDRESS,
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: BigInt(50000),
        validAfter: BigInt(0),
        validBefore: BigInt(1748736300),
        nonce: "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
    });

    expect(signature).toMatch(/^0x[0-9a-f]+$/);
  });

  it("produces deterministic signatures for the same input", async () => {
    const signer = await createCdpEvmSigner(TEST_CDP_ACCOUNT_NAME);
    const args = {
      domain: {
        name: "USD Coin",
        version: "2",
        chainId: 84532,
        verifyingContract: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      },
      primaryType: "TransferWithAuthorization",
      message: {
        from: TEST_WALLET_ADDRESS,
        to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        value: BigInt(50000),
        validAfter: BigInt(0),
        validBefore: BigInt(1748736300),
        nonce: "0x0000000000000000000000000000000000000000000000000000000000000001",
      },
    };

    const sig1 = await signer.signTypedData(args);
    const sig2 = await signer.signTypedData(args);

    expect(sig1).toBe(sig2);
  });
});

describe("createExactEvmScheme", () => {
  it("creates an ExactEvmScheme instance", async () => {
    const scheme = await createExactEvmScheme(TEST_CDP_ACCOUNT_NAME);
    expect(scheme.scheme).toBe("exact");
  });

  it("scheme has createPaymentPayload method", async () => {
    const scheme = await createExactEvmScheme(TEST_CDP_ACCOUNT_NAME);
    expect(typeof scheme.createPaymentPayload).toBe("function");
  });
});
