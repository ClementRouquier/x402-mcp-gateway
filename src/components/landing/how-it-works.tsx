import { Wallet, Settings, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    step: 1,
    title: "Create Your Wallet",
    description:
      "A CDP-managed wallet is created for you on Base. Fund it with USDC and you're ready to transact — no browser extensions, no seed phrases.",
    icon: Wallet,
  },
  {
    step: 2,
    title: "Link Bitrefill",
    description:
      "Connect your Bitrefill account via OAuth. The agent can browse the full catalog, check your order history, and purchase gift cards and eSIMs on your behalf.",
    icon: Settings,
  },
  {
    step: 3,
    title: "Chat & Pay",
    description:
      "Tell the AI what you need. It searches products, handles checkout, and pays via x402 — all in one conversation. Payments work across any x402-enabled service, not just Bitrefill.",
    icon: Zap,
  },
];

export function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From zero to agentic commerce in three steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <Card key={step} className="relative">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
                  {step}
                </div>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="size-5 text-muted-foreground" />
                  {title}
                </CardTitle>
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
