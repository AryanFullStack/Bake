import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { CartProvider } from "@/components/storefront/cart-provider";
import { LenisProvider } from "@/components/storefront/lenis-provider";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

import {
  JsonLd,
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildLocalBusinessSchema,
} from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: {
    default: "Bake Bazaar Mart | Cakes, Home Décor, Kitchen & Everyday Essentials",
    template: "%s | Bake Bazaar Mart",
  },
  description: "Bake Bazaar Mart is your trusted online family and general store based in Karachi, Pakistan, offering fast local delivery in Karachi and nationwide online delivery across Pakistan. Shop cakes, custom cakes, home decoration, kitchen essentials, watches, and everyday products.",
  keywords: [
    "Bake Bazaar Mart",
    "online store Karachi",
    "cakes Karachi",
    "custom cakes Karachi",
    "bakery Pakistan",
    "home decoration",
    "kitchen essentials",
    "watches",
    "daily essentials",
    "baskets and storage",
    "chocolates and sweets",
    "online shopping Pakistan"
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://bakebazaarmart.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bake Bazaar Mart | Cakes, Home Décor, Kitchen & Everyday Essentials",
    description: "Your trusted online family and general store in Karachi, Pakistan. Fresh cakes & bakery, custom cakes, home décor, kitchen essentials, watches & daily products delivered across Karachi and nationwide.",
    url: "https://bakebazaarmart.com",
    siteName: "Bake Bazaar Mart",
    locale: "en_PK",
    type: "website",
    images: [
      {
        url: "/homeDisktop.webp",
        width: 1200,
        height: 630,
        alt: "Bake Bazaar Mart — Cakes, Home Décor & Everyday Essentials",
      },
      {
        url: "/logobake-01.png",
        width: 600,
        height: 315,
        alt: "Bake Bazaar Mart Official Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bake Bazaar Mart | Cakes, Home Décor, Kitchen & Everyday Essentials",
    description: "Online family store in Karachi, Pakistan. Fresh bakery, custom cakes, home décor, kitchen essentials, watches & everyday essentials delivered across Pakistan.",
    images: ["/homeDisktop.webp"],
  },
  icons: {
    icon: "/logomainficonocns-01.png",
    shortcut: "/logomainficonocns-01.png",
    apple: "/logomainficonocns-01.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = buildOrganizationSchema();
  const webSiteSchema = buildWebSiteSchema();
  const localBusinessSchema = buildLocalBusinessSchema();

  return (
    <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${manrope.variable}`}>
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
        <JsonLd data={localBusinessSchema} />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased bg-cream text-ink font-sans">
        <LenisProvider>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
