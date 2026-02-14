import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24 bg-muted/50">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to Let Your Agent Shop?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Create a wallet, connect Bitrefill, and start buying with
          conversation.
        </p>
        <div className="mt-10">
          <Button asChild size="lg" className="text-base">
            <Link href="/dashboard">
              Get Started
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
