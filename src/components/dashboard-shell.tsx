"use client"

import { ChatHeader } from "@/components/chat-header"
import { BitrefillConnect } from "@/components/bitrefill-connect"
import { Toaster } from "@/components/ui/sonner"
import { useState, useEffect, useCallback } from "react"

export function DashboardShell({
  walletAddress,
  children,
}: {
  walletAddress: string | null
  children: React.ReactNode
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  const fetchConnectionStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/bitrefill/status")
      if (res.ok) {
        const data = await res.json()
        setIsConnected(data.connected)
        setEmail(data.email ?? null)
      }
    } catch {
      // Non-critical
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      fetchConnectionStatus()
    }
  }, [walletAddress, fetchConnectionStatus])

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader
        walletAddress={walletAddress}
        isConnected={isConnected}
        email={email}
        onOpenSettings={() => setSettingsOpen(true)}
        onDisconnect={async () => {
          try {
            const res = await fetch("/api/auth/bitrefill/status", { method: "DELETE" })
            if (res.ok) {
              fetchConnectionStatus()
            }
          } catch {
            // Non-critical
          }
        }}
      />
      <main className="flex-1 overflow-hidden">{children}</main>
      <Toaster />
      <BitrefillConnect
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        isConnected={isConnected}
        onStatusChange={fetchConnectionStatus}
      />
    </div>
  )
}
