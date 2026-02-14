import { Lock, FileCheck, ShieldCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const securityFeatures = [
  {
    title: "CDP-Managed Key Security",
    description:
      "Private keys are managed by Coinbase Developer Platform — never exposed to the browser or stored locally.",
    icon: Lock,
  },
  {
    title: "EIP-3009 Gasless Transfers",
    description:
      "Payments use EIP-3009 TransferWithAuthorization — gasless USDC transfers signed off-chain via EIP-712 typed data.",
    icon: FileCheck,
  },
  {
    title: "Scoped Agent Permissions",
    description:
      "The AI agent only has access to the tools and APIs you explicitly connect. Bitrefill OAuth scopes limit what it can do.",
    icon: ShieldCheck,
  },
  {
    title: "On-Chain Verification",
    description:
      "Every USDC payment settles on Base and is verifiable on-chain via BaseScan.",
    icon: ExternalLink,
  },
];

export function Security() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for Security
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Enterprise-grade security at every layer of the payment flow.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {securityFeatures.map(({ title, description, icon: Icon }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          <Badge variant="outline">x402 Protocol</Badge>
          <Badge variant="outline">CDP SDK</Badge>
          <Badge variant="outline">USDC on Base</Badge>
          <Badge variant="outline">EIP-3009</Badge>
          <Badge variant="outline">Bitrefill OAuth</Badge>
          <Badge variant="outline">WalletConnect (Soon)</Badge>
        </div>
      </div>
    </section>
  );
}
