"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Cake, CheckCircle2, Home, ShieldCheck, ShoppingBag, ShoppingBasket, Sparkles, Star, UtensilsCrossed, Watch, Wheat } from "lucide-react";
import { motion } from "framer-motion";

const HERO_PRODUCT_ITEMS = [
  {
    category: "Bakery",
    title: "Fresh Cakes & Pastries",
    image: "/cake.jpg",
    href: "/shop?category=bakery",
    accent: "text-orange",
  },
  {
    category: "Home Décor",
    title: "Vases & Accents",
    image: "/homeItems.jfif",
    href: "/shop?category=home-decor",
    accent: "text-green",
  },
  {
    category: "Kitchen",
    title: "Utensils & Storage",
    image: "/kicthens.jpg",
    href: "/shop?category=kitchen",
    accent: "text-blue-400",
  },
  {
    category: "Watches",
    title: "Classic Timepieces",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=watches",
    accent: "text-purple-300",
  },
  {
    category: "Baskets",
    title: "Storage Baskets",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=baskets",
    accent: "text-amber-400",
  },
  {
    category: "Daily Essentials",
    title: "Everyday Needs",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    href: "/shop?category=daily-essentials",
    accent: "text-teal-300",
  },
];

export function MultiCategoryHero() {
  return (
    <section className="relative overflow-hidden bg-navy pt-8 pb-20 md:py-16 lg:py-20 text-white">
      {/* Dynamic Background Glows & Organic Shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -right-20 -top-20 h-[550px] w-[550px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #fd7600 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 h-[450px] w-[450px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #689733 0%, transparent 70%)" }}
        />
        <div className="absolute inset-0 pattern-navy-dots opacity-40" />
      </div>

      <div className="container-shell relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          
          {/* Left Column: Headline & Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="lg:col-span-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-xs font-bold text-orange mb-6 shadow-sm">
              <Sparkles size={14} />
              Everything Under One Roof · Lahore, Pakistan
            </div>

            <h1 className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-bold leading-[1.06] tracking-tight">
              Everything Your<br />
              <span className="text-orange">Family Needs.</span>
            </h1>

            <p className="mt-5 max-w-lg text-sm sm:text-base leading-7 text-white/75 font-normal">
              From freshly baked treats to kitchen essentials, home décor and everyday products — quality products, all in one place.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link href="/shop" className="button-primary text-sm sm:text-base px-7 py-3.5 shadow-lg shadow-orange/30">
                Shop All Products <ArrowRight size={17} />
              </Link>
              <a href="#categories" className="button-secondary border-white/20 bg-white/10 text-white hover:bg-white hover:text-navy text-sm sm:text-base">
                Explore Categories
              </a>
            </div>

            {/* Trust Line */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs font-semibold text-white/65">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green shrink-0" />
                700+ Products
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-orange shrink-0" />
                Quality You Can Trust
              </span>
              <span className="flex items-center gap-2">
                <Star size={15} className="text-amber fill-amber shrink-0" />
                Delivery Across Lahore
              </span>
            </div>
          </motion.div>

          {/* Right Column: Multi-Category Product Visual Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-6 relative"
          >
            {/* Grid Composition showing all 6 store product categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
              {HERO_PRODUCT_ITEMS.map((item, idx) => (
                <Link
                  key={item.category}
                  href={item.href}
                  className="group relative aspect-[1.05] overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-md backdrop-blur-xs transition-transform duration-300 hover:-translate-y-1 hover:border-orange/50"
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-108"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${item.accent}`}>
                      {item.category}
                    </span>
                    <h3 className="text-[11px] font-bold text-white leading-tight truncate mt-0.5">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            {/* Floating Central Trust Badge */}
            <div className="mt-4 rounded-2xl border border-white/20 bg-navy/90 px-4 py-2.5 shadow-xl backdrop-blur-md text-center">
              <span className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-orange">
                <ShoppingBag size={14} /> Complete Store Under One Roof
              </span>
              <span className="text-[10px] font-medium text-white/70 block mt-0.5">Bakery · Home Décor · Kitchen · Watches · Baskets · Daily Essentials</span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Smooth Wave Transition into Cream Surface */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10">
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8 md:h-12">
          <path d="M0,24 C360,48 720,0 1080,24 C1260,36 1380,12 1440,24 L1440,48 L0,48 Z" fill="#fffaf4" />
        </svg>
      </div>
    </section>
  );
}
