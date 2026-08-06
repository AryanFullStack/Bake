import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { CartProvider } from "@/components/storefront/cart-provider";
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

export const metadata: Metadata = {
  title: {
    default: "Bake Mart Bazaar | Premium Small-Batch Bakery",
    template: "%s | Bake Mart Bazaar",
  },
  description: "Artisan cakes, flaky morning bakes, hand-crafted cupcakes and custom celebration cakes delivered fresh across Pakistan.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/logomainficonocns-01.png",
    shortcut: "/logomainficonocns-01.png",
    apple: "/logomainficonocns-01.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased bg-cream text-ink font-sans">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
