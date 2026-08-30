"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, UtensilsCrossed, Sparkles } from "lucide-react";

export function HomeKitchenShowcase() {
  return (
    <section className="container-shell py-14 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
        <span className="eyebrow text-orange">Home & Living</span>
        <h2 className="section-heading mt-2">Make Your Space Better.</h2>
        <p className="mt-3 text-xs sm:text-sm text-muted leading-relaxed font-medium">
          Beautiful home décor and practical kitchen essentials curated for modern living.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* ── 1. Home Decoration Card ── */}
        <div className="group relative overflow-hidden rounded-3xl bg-navy text-white min-h-[420px] sm:min-h-[480px] flex flex-col justify-end p-6 sm:p-10 shadow-lg border border-line/40">
          {/* Desktop Image (≥768px) */}
          <div className="hidden md:block absolute inset-0 w-full h-full">
            <Image
              src="/homeDisktop.png"
              alt="Home Decoration — Vases, wall art, lamps & aesthetic accents"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="50vw"
            />
          </div>

          {/* Mobile Image (<768px) — /HomeM.png */}
          <div className="md:hidden absolute inset-0 w-full h-full">
            <Image
              src="/HomeM.png"
              alt="Home Decoration — Mobile visual"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              sizes="100vw"
            />
          </div>

          {/* Dark Overlay gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-transparent pointer-events-none" />

          {/* Text Container with Mobile Glass Backdrop */}
          <div className="relative z-10 rounded-2xl max-md:bg-navy/70 max-md:backdrop-blur-md max-md:p-5 max-md:border max-md:border-white/10 max-md:text-center max-md:flex max-md:flex-col max-md:items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3 text-white border border-white/20">
              <Home size={13} className="text-orange" /> Aesthetic Accents
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">Home Decoration</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-md leading-relaxed font-normal">
              Vases, lamps, living room accents & stylish home details.
            </p>
            <div className="mt-5">
              <Link
                href="/shop?category=home-decor"
                className="button-primary text-xs sm:text-sm px-6 inline-flex items-center gap-2"
              >
                Shop Home Décor <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 2. Kitchen Essentials Card ── */}
        <div className="group relative overflow-hidden rounded-3xl bg-navy text-white min-h-[420px] sm:min-h-[480px] flex flex-col justify-end p-6 sm:p-10 shadow-lg border border-line/40">
          <div className="absolute inset-0 w-full h-full">
            <Image
              src="/kicthens.jpg"
              alt="Kitchen Essentials — Utensils, storage, cookware & useful accessories"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Dark Overlay gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/50 to-transparent pointer-events-none" />

          {/* Text Container with Mobile Glass Backdrop */}
          <div className="relative z-10 rounded-2xl max-md:bg-navy/70 max-md:backdrop-blur-md max-md:p-5 max-md:border max-md:border-white/10 max-md:text-center max-md:flex max-md:flex-col max-md:items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3 text-white border border-white/20">
              <UtensilsCrossed size={13} className="text-green" /> Practical Utility
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">Kitchen Essentials</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-md leading-relaxed font-normal">
              Utensils, storage containers, cookware & everyday kitchen tools.
            </p>
            <div className="mt-5">
              <Link
                href="/shop?category=kitchen"
                className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy text-xs sm:text-sm px-6 inline-flex items-center gap-2"
              >
                Shop Kitchen <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

