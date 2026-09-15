"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight, Facebook, Heart, Instagram, Mail, MapPin, MessageCircle, Phone, ShieldCheck,
} from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="mt-12 md:mt-20 bg-navy pb-28 pt-14 text-white md:pb-12 md:pt-16">
      <div className="container-shell border-b border-white/10 pb-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8">

          {/* Brand column */}
          <div>
            <Link href="/" className="inline-block rounded-xl bg-white p-2.5 shadow-md transition-transform hover:scale-[1.02]">
              <Image src="/logobake-01.png" alt="Bake Bazaar Mart" width={200} height={55} className="h-11 w-auto object-contain" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
              Your complete online family store — fresh bakery, custom cakes, home décor, kitchen essentials, watches & everyday products. Delivered across Karachi and nationwide all over Pakistan.
            </p>
            <div className="mt-6 grid gap-2.5 text-xs font-semibold text-white/70">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-orange shrink-0" /> Karachi, Pakistan
              </span>
              <a href="mailto:info@bakebazaarmart.com" className="flex items-center gap-2 hover:text-orange transition-colors">
                <Mail size={14} className="text-orange shrink-0" /> info@bakebazaarmart.com
              </a>
            </div>

            {/* Support and connection */}
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:border-orange hover:text-orange transition-colors"
              >
                <Mail size={13} className="text-orange" /> Contact Support
              </Link>
              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:border-orange hover:text-orange transition-colors"
              >
                Track Order
              </Link>
            </div>
          </div>

          {/* Shop column */}
          <FooterColumn
            title="Shop"
            links={[
              ["Shop All",              "/shop"],
              ["Bakery / Cakes",        "/shop?category=bakery"],
              ["Custom Cakes",          "/custom-cake"],
              ["Chocolates & Sweets",   "/shop?category=cooking-chocolate"],
              ["Home Decoration",       "/shop?category=home-decor"],
              ["Kitchen Essentials",    "/shop?category=kitchen"],
              ["Watches & Accessories", "/shop?category=watches"],
              ["Baskets & Storage",     "/shop?category=baskets"],
              ["Daily Essentials",      "/shop?category=daily-essentials"],
            ]}
          />

          {/* Customer Care column */}
          <FooterColumn
            title="Customer Care"
            links={[
              ["Track Order",            "/track-order"],
              ["Track Custom Cake",      "/track-custom-cake"],
              ["Delivery Information",   "/shipping-delivery"],
              ["Return & Refund Policy", "/refund-cancellation"],
              ["FAQs",                   "/faq"],
              ["Contact Us",             "/contact"],
            ]}
          />

          {/* Company + Newsletter */}
          <div>
            <div className="mb-7">
              <p className="eyebrow text-orange">Company</p>
              <div className="mt-4 grid gap-3 text-sm font-semibold text-white/70">
                {([
                  ["About Us",           "/about"],
                  ["Our Story",          "/about#story"],
                  ["Custom Cake Studio", "/custom-cake"],
                  ["Delivery & Coverage", "/shipping-delivery"],
                  ["Return & Refund Policy", "/refund-cancellation"],
                ] as [string, string][]).map(([label, href]) => (
                  <Link key={href} href={href} className="transition-colors hover:text-orange">{label}</Link>
                ))}
              </div>
            </div>

            {/* Newsletter mini */}
            <div>
              <p className="eyebrow text-orange">Stay in the Loop</p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                New products, seasonal bakes & exclusive offers.
              </p>
              <form className="mt-4 flex gap-2">
                <input
                  required
                  type="email"
                  placeholder="Your email address"
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/40 focus:border-orange transition-colors"
                />
                <button
                  type="submit"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-orange text-white hover:bg-orange-dark transition-colors"
                  aria-label="Subscribe to newsletter"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
                <ShieldCheck size={12} className="text-green" /> No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="container-shell flex flex-col gap-4 pt-6 text-[11px] text-white/40 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Bake Bazaar Mart · Karachi, Pakistan</p>

        <div className="flex flex-wrap items-center gap-4">
          {/* Payment methods */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">Cash on Delivery</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">Bank Transfer</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">JazzCash</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow text-orange">{title}</p>
      <div className="mt-4 grid gap-3 text-sm font-semibold text-white/70">
        {links.map(([label, href]) => (
          <Link key={href + label} href={href} className="transition-colors hover:text-orange">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
