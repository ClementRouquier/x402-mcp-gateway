import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Security } from "@/components/landing/security";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Bitrefill Platform — Shop with Crypto, Powered by AI",
  description:
    "Browse gift cards, buy eSIMs, and manage purchases through an AI shopping assistant. Pay with crypto on Base.",
  openGraph: {
    title: "Bitrefill Platform — Shop with Crypto, Powered by AI",
    description:
      "Browse gift cards, buy eSIMs, and manage purchases through an AI shopping assistant. Pay with crypto on Base.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bitrefill Platform — Shop with Crypto, Powered by AI",
    description:
      "Browse gift cards, buy eSIMs, and manage purchases through an AI shopping assistant. Pay with crypto on Base.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bitrefill Platform",
  description:
    "AI-powered shopping platform for gift cards and eSIMs with crypto payments on Base.",
  applicationCategory: "ShoppingApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to use. Pay only for the products you buy.",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <Features />
      <Security />
      <CtaSection />
      <Footer />
    </>
  );
}
