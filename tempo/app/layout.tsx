import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable}`}>
      <head />
      <body className={"min-h-screen flex flex-col antialiased bg-cream text-ink font-sans"}>{children}</body>
    </html>
  );
}
