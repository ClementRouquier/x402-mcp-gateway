"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { chainConfig, getChainConfigForNetwork, type WalletNetwork } from "@/lib/chain-config";

interface WithdrawWalletFormProps {
  userId: string;
  balance: string | null;
  onWithdrawn?: () => void;
  manualAddress?: boolean;
  network?: WalletNetwork;
}

export default function WithdrawWalletForm({
  userId,
  balance,
  onWithdrawn,
  manualAddress = false,
  network,
}: WithdrawWalletFormProps) {
  const activeChainConfig = network ? getChainConfigForNetwork(network) : chainConfig;
  const { address: wagmiAddress } = useAccount();
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const destinationAddress = manualAddress ? toAddress : wagmiAddress;

  function handleMax() {
    if (balance) {
      setAmount(balance);
    }
  }

  async function handleWithdraw() {
    if (!amount || parseFloat(amount) <= 0 || !destinationAddress) return;

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          toAddress: destinationAddress,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed");
      }

      setTxHash(data.txHash);
      setAmount("");
      if (manualAddress) setToAddress("");
      onWithdrawn?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  }

  if (!manualAddress && !wagmiAddress) return null;

  const truncatedDest = destinationAddress
    ? `${destinationAddress.slice(0, 6)}...${destinationAddress.slice(-4)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5" />
          Withdraw
        </CardTitle>
        {!manualAddress && truncatedDest && (
          <CardDescription>
            To: <span className="font-mono">{truncatedDest}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {manualAddress && (
          <div className="space-y-2">
            <Label htmlFor="withdraw-to">Destination address</Label>
            <Input
              id="withdraw-to"
              type="text"
              placeholder="0x..."
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              disabled={loading}
              className="font-mono"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
          <div className="flex gap-2">
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMax}
              disabled={!balance || balance === "0"}
              className="shrink-0"
            >
              Max
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive">
            {error.length > 100 ? error.slice(0, 100) + "..." : error}
          </p>
        )}
        {txHash && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Withdrawn successfully!
            </p>
            <a
              href={`${activeChainConfig.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-700 underline dark:text-green-300"
            >
              View on BaseScan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleWithdraw}
          disabled={loading || !amount || parseFloat(amount) <= 0 || !destinationAddress}
          className="w-full"
        >
          {loading ? "Withdrawing..." : "Withdraw"}
        </Button>
      </CardFooter>
    </Card>
  );
}
