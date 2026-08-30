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
              <Image src="/logobake-01.png" alt="Bake Mart Bazaar" width={200} height={55} className="h-11 w-auto object-contain" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
              Your complete family store — fresh bakery, home décor, kitchen essentials & everyday products. All delivered to your door in Lahore.
            </p>
            <div className="mt-6 grid gap-2.5 text-xs font-semibold text-white/70">
              <span className="flex items-center gap-2">
                <MapPin size={14} className="text-orange shrink-0" /> Lahore, Pakistan
              </span>
              <a href="tel:03211234567" className="flex items-center gap-2 hover:text-orange transition-colors">
                <Phone size={14} className="text-orange shrink-0" /> 0321-1234567
              </a>
              <a href="mailto:hello@bakemartbazaar.pk" className="flex items-center gap-2 hover:text-orange transition-colors">
                <Mail size={14} className="text-orange shrink-0" /> hello@bakemartbazaar.pk
              </a>
            </div>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mr-1">Follow us</p>
              <a
                href="https://instagram.com/bakemartbazaar"
                target="_blank" rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-orange hover:text-orange hover:bg-white/5"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://facebook.com/bakemartbazaar"
                target="_blank" rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-orange hover:text-orange hover:bg-white/5"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://wa.me/923211234567"
                target="_blank" rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/60 transition-all hover:border-orange hover:text-orange hover:bg-white/5"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Shop column */}
          <FooterColumn
            title="Shop"
            links={[
              ["Shop All",           "/shop"],
              ["Bakery",             "/shop?category=bakery"],
              ["Home Decoration",    "/shop?category=home-decor"],
              ["Kitchen Items",      "/shop?category=kitchen"],
              ["Watches",            "/shop?category=watches"],
              ["Baskets & Storage",  "/shop?category=baskets"],
              ["Daily Essentials",   "/shop?category=daily-essentials"],
              ["Sale Items",         "/shop?sale=1"],
            ]}
          />

          {/* Customer Care column */}
          <FooterColumn
            title="Customer Care"
            links={[
              ["Track Order",           "/track-order"],
              ["Delivery Information",  "/shipping-delivery"],
              ["Return Policy",         "/refund-cancellation"],
              ["Refund & Cancellation", "/refund-cancellation"],
              ["FAQs",                  "/faq"],
              ["Contact Us",            "/contact"],
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
                  ["Admin Portal",       "/admin"],
                ] as [string, string][]).map(([label, href]) => (
                  <Link key={href} href={href} className="transition-colors hover:text-orange">{label}</Link>
                ))}
              </div>
            </div>

            {/* Newsletter mini */}
            <div>
              <p className="eyebrow text-orange">Stay in the Loop</p>
              <p className="mt-2 text-xs leading-5 text-white/60">
                New products, seasonal offers & exclusive deals.
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
        <p>© 2026 Bake Mart Bazaar · Made with <Heart size={12} className="inline fill-orange text-orange" /> in Lahore, Pakistan</p>

        <div className="flex flex-wrap items-center gap-4">
          {/* Payment methods */}
          <div className="flex items-center gap-2">
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">Cash on Delivery</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">Bank Transfer</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60">JazzCash</span>
          </div>
          <Link href="/admin" className="text-white/20 hover:text-white transition-colors">Admin</Link>
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
