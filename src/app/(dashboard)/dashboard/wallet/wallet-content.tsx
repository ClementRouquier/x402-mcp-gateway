"use client";

import { useState, useCallback, useEffect } from "react";
import { Link2, Sun } from "lucide-react";
import WalletBalance from "@/components/wallet-balance";
import FundWalletForm from "@/components/fund-wallet-form";
import DepositAddress from "@/components/deposit-address";
import WithdrawWalletForm from "@/components/withdraw-wallet-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WalletData {
  walletAddress: string;
  userId: string;
  balance: string | null;
  fetchBalance: () => void;
  isCdpMode: boolean;
  label: string;
  chain: string;
  network: string;
}

interface WalletListItem {
  id: string;
  label: string;
  chain: string;
  network: string;
  address: string;
  balance: string;
  isActive: boolean;
}

function ChainIcon({ chain }: { chain: string }) {
  if (chain === "solana") {
    return <Sun className="size-4" />;
  }
  return <Link2 className="size-4" />;
}

export default function WalletContent({ userId }: { userId: string }) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [walletVersion, setWalletVersion] = useState(0);
  const [allWallets, setAllWallets] = useState<WalletListItem[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleWalletReady = useCallback((data: WalletData) => {
    setWalletData(data);
  }, []);

  const fetchAllWallets = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/list", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAllWallets(data.wallets);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingWallets(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWallets();
  }, [fetchAllWallets]);

  useEffect(() => {
    const handler = () => {
      fetchAllWallets();
      setWalletVersion((v) => v + 1);
    };
    window.addEventListener("wallet-switched", handler);
    return () => window.removeEventListener("wallet-switched", handler);
  }, [fetchAllWallets]);

  const handleSwitchWallet = useCallback(async (walletId: string) => {
    setSwitchingId(walletId);
    try {
      const res = await fetch("/api/wallet/switch", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });
      if (res.ok) {
        await fetchAllWallets();
        setWalletVersion((v) => v + 1);
        window.dispatchEvent(new Event("wallet-switched"));
      }
    } catch {
      // Non-critical
    } finally {
      setSwitchingId(null);
    }
  }, [fetchAllWallets]);

  return (
    <div className="flex flex-col gap-6">
      <WalletBalance key={walletVersion} onWalletReady={handleWalletReady} />

      {walletData && (
        <div className="grid gap-6 md:grid-cols-2">
          {walletData.isCdpMode ? (
            <DepositAddress address={walletData.walletAddress} chain={walletData.chain} />
          ) : (
            <FundWalletForm
              walletAddress={walletData.walletAddress}
              onFunded={walletData.fetchBalance}
              network={walletData.network as "testnet" | "mainnet"}
            />
          )}
          <WithdrawWalletForm
            userId={walletData.userId}
            balance={walletData.balance}
            onWithdrawn={walletData.fetchBalance}
            manualAddress={walletData.isCdpMode}
            network={walletData.network as "testnet" | "mainnet"}
          />
        </div>
      )}

      {/* All Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingWallets ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : allWallets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No wallets yet.</p>
          ) : (
            <div className="space-y-2">
              {allWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  disabled={wallet.isActive || switchingId === wallet.id}
                  onClick={() => handleSwitchWallet(wallet.id)}
                  className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/50 disabled:opacity-100 disabled:cursor-default"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChainIcon chain={wallet.chain} />
                    <span className="text-sm font-medium truncate">{wallet.label}</span>
                    <Badge variant={wallet.network === "mainnet" ? "outline" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {wallet.network}
                    </Badge>
                    {wallet.isActive && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">active</Badge>
                    )}
                  </div>
                  <span className="text-sm font-mono tabular-nums">
                    {switchingId === wallet.id ? (
                      <span className="text-muted-foreground text-xs">Switching...</span>
                    ) : (
                      <>${wallet.balance} <span className="text-muted-foreground text-xs">USDC</span></>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
