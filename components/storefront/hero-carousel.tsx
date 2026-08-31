"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, Cake, ChevronLeft, ChevronRight,
  Home, ShoppingBag, Sparkles, Star, UtensilsCrossed, Watch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* Floating category chips shown in the hero */
const CATEGORY_CHIPS = [
  { icon: Cake,            label: "Fresh Bakery",      color: "#fd7600" },
  { icon: Home,            label: "Home Décor",         color: "#689733" },
  { icon: UtensilsCrossed, label: "Kitchen",            color: "#3b82f6" },
  { icon: Watch,           label: "Watches",            color: "#8b5cf6" },
  { icon: ShoppingBag,     label: "Daily Essentials",   color: "#14b8a6" },
];

export function HeroCarousel({ banners }: { banners: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(
      () => setCurrentIndex((i) => (i + 1) % banners.length),
      6500
    );
    return () => clearInterval(timer);
  }, [banners.length]);

  const current   = banners[currentIndex];
  const title     = current?.title     ?? "Everything Your\nFamily Needs";
  const body      = current?.body      ?? "Quality bakery, home décor, kitchen & everyday essentials — all in one place. Delivered fresh across Lahore.";
  const ctaHref   = current?.cta_href  ?? "/shop";
  const ctaLabel  = current?.cta_label ?? "Shop All Products";
  const imgSrc    = current?.image_path ?? "/bakery.png";

  return (
    <section className="relative overflow-hidden bg-navy">

      {/* ── Decorative background waves ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Orange glow — top right */}
        <div
          className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #fd7600 0%, transparent 70%)", transform: "translate(30%,-30%)" }}
        />
        {/* Green glow — bottom left */}
        <div
          className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #689733 0%, transparent 70%)", transform: "translate(-30%,30%)" }}
        />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 pattern-navy-dots opacity-50" />
      </div>

      {/* ── Bottom wave into cream ── */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10">
        <svg viewBox="0 0 1440 72" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-14 md:h-20">
          <path d="M0,36 C360,72 720,0 1080,36 C1260,54 1380,18 1440,36 L1440,72 L0,72 Z" fill="#fffaf4" />
        </svg>
      </div>

      <div className="container-shell relative z-10 py-14 md:py-20 lg:py-24 pb-24 md:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">

          {/* ── LEFT: Text content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + "-text"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative z-10"
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-4 py-1.5 text-xs font-bold text-orange mb-6">
                <Sparkles size={13} />
                Bake Mart Bazaar · Lahore, Pakistan
              </div>

              {/* Heading */}
              <h1 className="font-display text-[clamp(2.8rem,5.5vw,5rem)] font-bold leading-[1.02] text-white">
                {title.split("\n").map((line: string, i: number) => (
                  <span key={i}>
                    {i === 1 ? <span className="text-orange">{line}</span> : line}
                    {i === 0 && <br />}
                  </span>
                ))}
              </h1>

              <p className="mt-6 max-w-md text-base leading-7 text-white/65">{body}</p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={ctaHref} className="button-primary text-[15px] px-6">
                  {ctaLabel} <ArrowRight size={17} />
                </Link>
                <Link
                  href="/custom-cake"
                  className="inline-flex items-center gap-2 min-h-[48px] rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-extrabold text-white backdrop-blur-sm transition-all hover:bg-white hover:text-navy"
                >
                  <Cake size={16} /> Custom Cake Studio
                </Link>
              </div>

              {/* Category chips */}
              <div className="mt-10 flex flex-wrap gap-2">
                {CATEGORY_CHIPS.map(({ icon: Icon, label, color }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[11px] font-bold text-white/70 backdrop-blur-sm"
                    style={{ borderColor: `${color}40` }}
                  >
                    <Icon size={12} style={{ color }} />
                    {label}
                  </span>
                ))}
              </div>

              {/* Trust strip */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs font-semibold text-white/50">
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green" /> Baked fresh daily
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange" /> 700+ products
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green" /> Cash on delivery
                </span>
                <span className="flex items-center gap-2">
                  <Star size={11} className="text-orange fill-orange" /> 4.9 rating
                </span>
              </div>

              {/* Carousel dots */}
              {banners.length > 1 && (
                <div className="mt-7 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {banners.map((b: any, index: number) => (
                      <button
                        key={b.id ?? index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-8 bg-orange" : "w-2 bg-white/25"}`}
                        aria-label={`Show banner ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="ml-1 flex gap-1">
                    <button
                      onClick={() => setCurrentIndex((i) => (i === 0 ? banners.length - 1 : i - 1))}
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors"
                      aria-label="Previous"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentIndex((i) => (i + 1) % banners.length)}
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors"
                      aria-label="Next"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── RIGHT: Image with overlays ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex + "-img"}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, delay: 0.06, ease: "easeOut" }}
              className="relative"
            >
              {/* Main image card */}
              <div className="relative aspect-[1.05] overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,.5)] ring-1 ring-white/10">
                <Image
                  src={imgSrc}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[1500ms] hover:scale-[1.03]"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-navy/20 to-transparent" />

                {/* Bottom label */}
                <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-2xl border border-white/30 bg-navy/70 px-4 py-3 backdrop-blur-md">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange text-white shadow-lg">
                    <ShoppingBag size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-white">All in One Place</p>
                    <p className="mt-0.5 text-[11px] text-white/60">Bakery · Home · Kitchen · Watches & more</p>
                  </div>
                </div>
              </div>

              {/* Floating rating card — top right */}
              <div className="absolute -top-4 -right-4 hidden md:flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-3 backdrop-blur-md shadow-xl ring-1 ring-white/10">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-orange text-white">
                  <Star size={16} fill="white" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">4.9 ★</p>
                  <p className="text-[10px] text-white/55">5,000+ happy customers</p>
                </div>
              </div>

              {/* Floating fresh badge — bottom right of image area */}
              <div className="absolute -bottom-4 -right-4 hidden md:flex items-center gap-2 rounded-2xl border border-white/20 bg-green/20 px-3 py-3 backdrop-blur-md shadow-xl ring-1 ring-green/20">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-green text-white">
                  <Cake size={15} />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold text-white">Fresh Bakery Daily</p>
                  <p className="text-[10px] text-white/55">Small-batch, honest ingredients</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </section>
  );
}
