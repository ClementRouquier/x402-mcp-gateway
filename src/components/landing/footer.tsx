import Link from "next/link";
import { Github } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/brand-logo";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <BrandLogo size="sm" />
            <p className="mt-1 text-sm text-muted-foreground">
              Agentic UI for headless commerce
            </p>
          </div>

          <nav aria-label="Footer" className="flex items-center gap-6">
            <Link
              href="https://github.com/Bitrefill/x402-mcp-gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="size-4" />
              GitHub
            </Link>
            <Link
              href="https://github.com/Bitrefill/x402-mcp-gateway#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </nav>
        </div>

        <Separator className="my-8" />

        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bitrefill Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
