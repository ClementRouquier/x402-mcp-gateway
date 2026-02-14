import {
  Zap,
  Shield,
  Globe,
  History,
  MessageSquare,
  Layers,
  Wallet,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Conversational Commerce",
    description:
      "A full chat interface where an AI agent searches products, compares options, and completes purchases — all through natural conversation.",
    icon: MessageSquare,
  },
  {
    title: "CDP-Managed Wallets",
    description:
      "Wallets powered by Coinbase Developer Platform. No seed phrases, no browser extensions — just a managed wallet that signs transactions for you.",
    icon: Wallet,
  },
  {
    title: "x402 Payments",
    description:
      "Native support for the x402 HTTP payment protocol. Your agent can pay any x402-enabled API or service on the open web, far beyond just Bitrefill.",
    icon: Globe,
  },
  {
    title: "Bitrefill Integration",
    description:
      "OAuth-connected access to the full Bitrefill catalog. Browse thousands of gift cards and eSIMs, purchase them, and track orders — all through the agent.",
    icon: Zap,
  },
  {
    title: "WalletConnect (Coming Soon)",
    description:
      "Bring your own web3 wallet via WalletConnect. Connect MetaMask, Rainbow, or any compatible wallet and use your existing tokens to pay.",
    icon: Clock,
  },
  {
    title: "On-Chain Transparency",
    description:
      "Every payment settles on Base L2 in USDC. Sub-cent fees, near-instant confirmation, and full transaction history verifiable on-chain.",
    icon: Layers,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Agentic Commerce
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything an AI agent needs to shop, pay, and transact on your behalf.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, icon: Icon }) => (
            <Card key={title}>
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
