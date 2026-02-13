import {
  createPublicClient,
  http,
  formatUnits,
  parseUnits,
  isAddress,
} from "viem";
import { prisma } from "@/lib/db";
import { chainConfig } from "@/lib/chain-config";
import { getCdpClient } from "@/lib/cdp";

const USDC_ADDRESS = chainConfig.usdcAddress;
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

export async function createCdpWallet(userId: string): Promise<{
  address: string;
  cdpAccountName: string;
}> {
  const cdp = getCdpClient();
  const cdpAccountName = `x402-${userId}`;
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

function getPublicClient() {
  const rpcUrl = process.env.RPC_URL;
  return createPublicClient({
    chain: chainConfig.chain,
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

export async function getUsdcBalance(address: string): Promise<string> {
  const client = getPublicClient();
  const balance = await client.readContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
  return formatUnits(balance, USDC_DECIMALS);
}

export async function withdrawFromHotWallet(
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

  // Look up the user's hot wallet
  const hotWallet = await prisma.hotWallet.findUnique({
    where: { userId },
  });
  if (!hotWallet) {
    throw new Error("No hot wallet found for this user");
  }

  // Check balance
  const balance = await getUsdcBalance(hotWallet.address);
  if (parseFloat(balance) < amount) {
    throw new Error(
      `Insufficient balance: ${balance} USDC available, ${amount} requested`,
    );
  }

  // Use CDP account for signing the ERC-20 transfer
  const cdpAccount = await getCdpAccount(hotWallet.cdpAccountName);
  const txHash = await cdpAccount.sendTransaction({
    to: USDC_ADDRESS,
    data: encodeFunctionData(toAddress as `0x${string}`, parseUnits(String(amount), USDC_DECIMALS)),
  });

  // Log withdrawal transaction
  await prisma.transaction.create({
    data: {
      amount,
      endpoint: `withdrawal:${toAddress}`,
      txHash: typeof txHash === "string" ? txHash : txHash.transactionHash,
      network: chainConfig.chain.name.toLowerCase(),
      status: "completed",
      type: "withdrawal",
      userId,
    },
  });

  return { txHash: typeof txHash === "string" ? txHash : txHash.transactionHash };
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

export { USDC_ADDRESS, USDC_DECIMALS };
