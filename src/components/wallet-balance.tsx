"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { Wallet, Copy, Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletBalanceProps {
  onWalletReady?: (data: {
    walletAddress: string;
    userId: string;
    balance: string | null;
    fetchBalance: () => void;
    isCdpMode: boolean;
    label: string;
    chain: string;
    network: string;
  }) => void;
}

export default function WalletBalance({ onWalletReady }: WalletBalanceProps) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [walletLabel, setWalletLabel] = useState<string>("default");
  const [walletChain, setWalletChain] = useState<string>("evm");
  const [walletNetwork, setWalletNetwork] = useState<string>("testnet");
  const [balanceUnavailable, setBalanceUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasExternalWallet = wagmiConnected && !!wagmiAddress;

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setBalanceUnavailable(data.balance === null);
        if (data.address) setWalletAddress(data.address);
        if (data.userId) setUserId(data.userId);
        if (data.label) setWalletLabel(data.label);
        if (data.chain) setWalletChain(data.chain);
        if (data.network) setWalletNetwork(data.network);
      } else if (res.status === 503) {
        setBalanceUnavailable(true);
      }
    } catch {
      // Balance fetch is non-critical; silently retry on next interval
    }
  }, []);

  // Load wallet data — tries session-based API first, falls back to wagmi-based creation
  useEffect(() => {
    let cancelled = false;

    async function loadWallet() {
      setLoading(true);
      setError(null);

      try {
        // First, try to get wallet via authenticated session (works for both CDP and SIWE users)
        const balanceRes = await fetch("/api/wallet/balance", {
          credentials: "include",
        });

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (!cancelled) {
            setWalletAddress(data.address);
            setBalance(data.balance);
            setBalanceUnavailable(data.balance === null);
            setUserId(data.userId || null);
            if (data.label) setWalletLabel(data.label);
            if (data.chain) setWalletChain(data.chain);
            if (data.network) setWalletNetwork(data.network);
            setLoading(false);
          }
          return;
        }

        // Non-ok, non-404: server error or rate limit — show error
        if (balanceRes.status !== 404) {
          if (!cancelled) {
            setError("Could not load wallet — please try again");
            setLoading(false);
          }
          return;
        }

        // If balance returns 404, wallet doesn't exist yet.
        // For wagmi-connected users, create a default CDP hot wallet via the create endpoint.
        if (hasExternalWallet) {
          const createRes = await fetch("/api/wallet/create", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!createRes.ok) {
            throw new Error("Failed to create hot wallet");
          }

          const data = await createRes.json();
          if (!cancelled) {
            setWalletAddress(data.address);
            setUserId(data.userId);
            fetchBalance();
          }
          return;
        }

        // No wallet and no way to create one
        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWallet();

    return () => {
      cancelled = true;
    };
  }, [hasExternalWallet, wagmiAddress, fetchBalance]);

  // Re-fetch when another component signals a wallet switch
  useEffect(() => {
    const handleWalletSwitched = () => {
      setLoading(true);
      setWalletAddress(null);
      setBalance(null);
      // Re-run the full wallet load sequence
      (async () => {
        try {
          const res = await fetch("/api/wallet/balance", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setWalletAddress(data.address);
            setBalance(data.balance);
            setBalanceUnavailable(data.balance === null);
            setUserId(data.userId || null);
            if (data.label) setWalletLabel(data.label);
            if (data.chain) setWalletChain(data.chain);
            if (data.network) setWalletNetwork(data.network);
          }
        } catch {
          // Non-critical
        } finally {
          setLoading(false);
        }
      })();
    };
    window.addEventListener("wallet-switched", handleWalletSwitched);
    return () => window.removeEventListener("wallet-switched", handleWalletSwitched);
  }, []);

  // Refresh balance every 15 seconds
  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => fetchBalance(), 15_000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalance]);

  // Notify parent when wallet is ready
  useEffect(() => {
    if (walletAddress && userId) {
      onWalletReady?.({
        walletAddress,
        userId,
        balance,
        fetchBalance: () => fetchBalance(),
        isCdpMode: !hasExternalWallet,
        label: walletLabel,
        chain: walletChain,
        network: walletNetwork,
      });
    }
  }, [walletAddress, userId, balance, onWalletReady, fetchBalance, hasExternalWallet, walletLabel, walletChain, walletNetwork]);

  async function handleCopy() {
    if (!walletAddress) return;
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!walletAddress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No wallet found.</p>
        </CardContent>
      </Card>
    );
  }

  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {walletLabel}
          <Badge variant="outline" className="text-xs">{walletChain === "solana" ? "Solana" : "Base"}</Badge>
          <Badge variant={walletNetwork === "mainnet" ? "default" : "secondary"} className="text-xs">{walletNetwork}</Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span className="font-mono text-xs">{truncatedAddress}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {!hasExternalWallet && (
            <Badge variant="secondary" className="text-xs">CDP</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">USDC Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight">
              {balanceUnavailable
                ? "Unavailable"
                : balance !== null
                  ? `$${balance}`
                  : "Loading..."}
            </span>
            <Badge variant="secondary">USDC</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
