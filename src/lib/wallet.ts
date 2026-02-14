import {
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
  isAddress,
} from "viem";
import { prisma } from "@/lib/db";
import { chainConfig, getChainConfigForNetwork, getSolanaNetworkId } from "@/lib/chain-config";
import type { WalletNetwork } from "@/lib/chain-config";
import { getCdpClient } from "@/lib/cdp";
import type { WalletModel as Wallet } from "@/generated/prisma/models";

const USDC_DECIMALS = 6;

const USDC_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export async function createCdpWallet(
  userId: string,
  label: string = "default",
  chain: string = "evm",
): Promise<{
  address: string;
  cdpAccountName: string;
}> {
  const cdp = getCdpClient();
  // CDP account names must be 2-36 alphanumeric+hyphen chars.
  // UUIDs contain hyphens and are 36 chars — strip hyphens and truncate.
  const sanitized = userId.replace(/-/g, "");
  // Backward compat: "default" label keeps original name format
  const cdpAccountName = label === "default"
    ? `x402-${sanitized}`.slice(0, 36)
    : `x402-${sanitized}-${label}`.slice(0, 36);

  if (chain === "solana") {
    const account = await cdp.solana.getOrCreateAccount({ name: cdpAccountName });
    return {
      address: account.address,
      cdpAccountName,
    };
  }

  const account = await cdp.evm.getOrCreateAccount({ name: cdpAccountName });
  return {
    address: account.address,
    cdpAccountName,
  };
}

export async function getCdpAccount(cdpAccountName: string) {
  const cdp = getCdpClient();
  return cdp.evm.getOrCreateAccount({ name: cdpAccountName });
}

function getPublicClient(network?: WalletNetwork) {
  const config = network ? getChainConfigForNetwork(network) : chainConfig;
  const rpcUrl = process.env.RPC_URL;
  return createPublicClient({
    chain: config.chain,
    transport: http(rpcUrl),
  });
}

/**
 * Returns true if the error is from the RPC returning 429 (over rate limit).
 */
export function isRpcRateLimitError(error: unknown): boolean {
  let e: unknown = error;
  while (e) {
    const err = e as { status?: number; message?: string; cause?: unknown };
    if (err.status === 429 || (err.message && err.message.includes("over rate limit"))) {
      return true;
    }
    e = err.cause;
  }
  return false;
}

/**
 * Get the user's active wallet, or null if none is set.
 */
export async function getActiveWallet(userId: string): Promise<Wallet | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { activeWallet: true },
  });
  return user?.activeWallet ?? null;
}

export async function getUsdcBalance(address: string, network?: WalletNetwork): Promise<string> {
  const config = network ? getChainConfigForNetwork(network) : chainConfig;
  const client = getPublicClient(network);
  const balance = await client.readContract({
    address: config.usdcAddress,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
  return formatUnits(balance, USDC_DECIMALS);
}

export async function getSolanaUsdcBalance(address: string, network?: WalletNetwork): Promise<string> {
  const cdp = getCdpClient();
  const solNetwork = network ? getSolanaNetworkId(network) : getSolanaNetworkId("testnet");
  const result = await cdp.solana.listTokenBalances({
    address,
    network: solNetwork as any,
  });
  // CDP SDK returns an object with a `balances` array or array directly depending on version
  const balances = Array.isArray(result) ? result : (result as any).balances ?? [];
  const usdc = balances.find(
    (b: any) => b.token?.symbol === "USDC",
  );
  if (!usdc) return "0.000000";
  return formatUnits(BigInt(usdc.amount.amount), usdc.amount.decimals);
}

/**
 * Get USDC balance for a wallet, choosing the right method based on chain.
 */
export async function getWalletBalance(address: string, chain: string, network?: WalletNetwork): Promise<string> {
  if (chain === "solana") {
    return getSolanaUsdcBalance(address, network);
  }
  return getUsdcBalance(address, network);
}

export async function withdrawFromWallet(
  userId: string,
  amount: number,
  toAddress: string,
): Promise<{ txHash: string }> {
  if (!isAddress(toAddress)) {
    throw new Error("Invalid destination address");
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Look up the user's active wallet
  const wallet = await getActiveWallet(userId);
  if (!wallet) {
    throw new Error("No active wallet found for this user");
  }
  if (wallet.type !== "cdp" || !wallet.cdpAccountName) {
    throw new Error("Withdrawals are only supported from CDP-managed wallets");
  }
  if (wallet.chain !== "evm") {
    throw new Error("Withdrawals are only supported from EVM wallets");
  }

  // Check balance
  const walletNetwork = (wallet as any).network as WalletNetwork | undefined;
  const balance = await getUsdcBalance(wallet.address, walletNetwork);
  if (parseFloat(balance) < amount) {
    throw new Error(
      `Insufficient balance: ${balance} USDC available, ${amount} requested`,
    );
  }

  // Use CDP account for signing the ERC-20 transfer
  const config = walletNetwork ? getChainConfigForNetwork(walletNetwork) : chainConfig;
  const cdpAccount = await getCdpAccount(wallet.cdpAccountName);
  const txHash = await cdpAccount.sendTransaction({
    to: config.usdcAddress,
    data: encodeFunctionData(toAddress as `0x${string}`, parseUnits(String(amount), USDC_DECIMALS)),
  });

  // Log withdrawal transaction
  await prisma.transaction.create({
    data: {
      amount,
      endpoint: `withdrawal:${toAddress}`,
      txHash: typeof txHash === "string" ? txHash : txHash.transactionHash,
      network: config.chain.name.toLowerCase(),
      status: "completed",
      type: "withdrawal",
      userId,
    },
  });

  return { txHash: typeof txHash === "string" ? txHash : txHash.transactionHash };
}

/**
 * Sync all CDP accounts into the database for the given user.
 * Paginates through EVM and Solana accounts and upserts wallet records
 * for both testnet and mainnet networks.
 */
export async function syncCdpWallets(userId: string): Promise<void> {
  const cdp = getCdpClient();

  // Paginate through all EVM accounts
  let evmPage = await cdp.evm.listAccounts({ pageSize: 100 });
  while (true) {
    for (const account of evmPage.accounts) {
      const label = account.name;
      for (const network of ["testnet", "mainnet"] as const) {
        await prisma.wallet.upsert({
          where: { userId_label_chain_network: { userId, label, chain: "evm", network } },
          create: { address: account.address, cdpAccountName: account.name, type: "cdp", label, chain: "evm", network, userId },
          update: { address: account.address, cdpAccountName: account.name },
        });
      }
    }
    if (!evmPage.nextPageToken) break;
    evmPage = await cdp.evm.listAccounts({ pageSize: 100, pageToken: evmPage.nextPageToken });
  }

  // Paginate through all Solana accounts
  let solPage = await cdp.solana.listAccounts({ pageSize: 100 });
  while (true) {
    for (const account of solPage.accounts) {
      const label = account.name;
      for (const network of ["testnet", "mainnet"] as const) {
        await prisma.wallet.upsert({
          where: { userId_label_chain_network: { userId, label, chain: "solana", network } },
          create: { address: account.address, cdpAccountName: account.name, type: "cdp", label, chain: "solana", network, userId },
          update: { address: account.address, cdpAccountName: account.name },
        });
      }
    }
    if (!solPage.nextPageToken) break;
    solPage = await cdp.solana.listAccounts({ pageSize: 100, pageToken: solPage.nextPageToken });
  }
}

/**
 * Encode ERC-20 transfer(address,uint256) function call data.
 */
function encodeFunctionData(to: `0x${string}`, amount: bigint): `0x${string}` {
  // transfer(address,uint256) selector: 0xa9059cbb
  const selector = "a9059cbb";
  const paddedTo = to.slice(2).toLowerCase().padStart(64, "0");
  const paddedAmount = amount.toString(16).padStart(64, "0");
  return `0x${selector}${paddedTo}${paddedAmount}`;
}

export { USDC_DECIMALS };
