"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, UtensilsCrossed } from "lucide-react";

export function HomeKitchenShowcase() {
  return (
    <section className="container-shell py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="eyebrow text-orange">Home & Living</span>
        <h2 className="section-heading mt-2">Make Your Space Better.</h2>
        <p className="mt-3 text-sm text-muted leading-relaxed font-medium">
          Beautiful home décor and practical kitchen essentials selected for everyday living.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Home Decoration Card */}
        <div className="group relative overflow-hidden rounded-[28px] bg-navy text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-8 sm:p-10 shadow-lg">
          <Image
            src="/homeItems.jfif"
            alt="Home Decoration — Vases, wall art, lamps & aesthetic accents"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3">
              <Home size={14} className="text-orange" /> Aesthetic Accents
            </span>
            <h3 className="font-display text-3xl font-bold">Home Decoration</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/75 max-w-md leading-relaxed">
              Vases, wall art, lamps & aesthetic accents
            </p>
            <div className="mt-6">
              <Link
                href="/shop?category=home-decor"
                className="button-primary text-sm px-6 inline-flex items-center gap-2"
              >
                Shop Home <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* Kitchen Essentials Card */}
        <div className="group relative overflow-hidden rounded-[28px] bg-navy text-white min-h-[380px] sm:min-h-[440px] flex flex-col justify-end p-8 sm:p-10 shadow-lg">
          <Image
            src="/kicthens.jpg"
            alt="Kitchen Essentials — Utensils, storage, cookware & useful accessories"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold backdrop-blur-md mb-3">
              <UtensilsCrossed size={14} className="text-green" /> Practical Utility
            </span>
            <h3 className="font-display text-3xl font-bold">Kitchen Essentials</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/75 max-w-md leading-relaxed">
              Utensils, storage, cookware & useful accessories
            </p>
            <div className="mt-6">
              <Link
                href="/shop?category=kitchen"
                className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy text-sm px-6 inline-flex items-center gap-2"
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
