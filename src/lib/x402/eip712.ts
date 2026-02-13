/**
 * EVM signer utilities for x402 payments.
 *
 * Uses @x402/evm's ExactEvmScheme which handles both EIP-3009 (USDC gasless)
 * and Permit2 (any ERC-20) signing. We provide a thin adapter to create
 * SDK-compatible signers from CDP managed accounts.
 */
import { getCdpClient } from "@/lib/cdp";
import { ExactEvmScheme } from "@x402/evm";
import type { ClientEvmSigner } from "@x402/evm";

/**
 * Create an SDK-compatible ClientEvmSigner from a CDP managed account.
 *
 * CDP's `EvmServerAccount` is structurally compatible with `ClientEvmSigner`
 * — both have `address` and `signTypedData()`.
 */
export async function createCdpEvmSigner(cdpAccountName: string): Promise<ClientEvmSigner> {
  const cdp = getCdpClient();
  const account = await cdp.evm.getOrCreateAccount({ name: cdpAccountName });
  return account;
}

/**
 * Create an ExactEvmScheme instance from a CDP managed account.
 *
 * The scheme handles both EIP-3009 (USDC) and Permit2 (generic ERC-20)
 * based on the `extra.assetTransferMethod` in payment requirements.
 */
export async function createExactEvmScheme(cdpAccountName: string): Promise<ExactEvmScheme> {
  const signer = await createCdpEvmSigner(cdpAccountName);
  return new ExactEvmScheme(signer);
}

// Re-export SDK types for convenience
export { ExactEvmScheme };
export { authorizationTypes } from "@x402/evm";
