"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Hero Scene Configuration
   ───────────────────────────────────────────────────────────── */
interface HeroScene {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  mobileImg: string;
  desktopImg: string;
  alt: string;
  mobileObjPos: string;
  desktopObjPos: string;
}

const SCENES: HeroScene[] = [
  /* ── 1. HOME & DÉCOR ── */
  {
    id: "home",
    eyebrow: "Home & Décor",
    title: "Beautiful Spaces",
    subtitle: "Curated home accents & décor that bring warmth to every corner.",
    cta: "Explore Home",
    href: "/shop?category=home-decor",
    mobileImg: "/HomeM.png",
    desktopImg: "/homeDisktop.png",
    alt: "Warm cosy living room interior with wooden shelves and décor",
    mobileObjPos: "center center",
    desktopObjPos: "center center",
  },

  /* ── 2. CAKES & BAKERY ── */
  {
    id: "cakes",
    eyebrow: "Fresh Bakery",
    title: "Made to Celebrate",
    subtitle: "Artisan cakes & fresh treats handcrafted for every special moment.",
    cta: "Shop Cakes",
    href: "/shop?category=bakery",
    mobileImg: "/CakeM.png",
    desktopImg: "/CakeD.png",
    alt: "Beautiful white celebration cake framed on a red velvet stand",
    mobileObjPos: "center 65%",
    desktopObjPos: "right center",
  },

  /* ── 3. WATCHES & ACCESSORIES ── */
  {
    id: "watches",
    eyebrow: "Watches & Accessories",
    title: "Timeless Style",
    subtitle: "Precision timepieces designed with luxury and everyday elegance.",
    cta: "Shop Watches",
    href: "/shop?category=watches",
    mobileImg: "/WM.jpeg",
    desktopImg: "/WD.jpeg",
    alt: "Luxury watch surrounded by rich burgundy silk backdrop",
    mobileObjPos: "center center",
    desktopObjPos: "center center",
  },
];

export function MultiCategoryHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  /* Scroll setup for stacked slide-over effect */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  /*
   * Stacked Scroll Push Transforms:
   * Scene 0 (Home) stays fixed at base layer (y: 0%).
   * Scene 1 (Cakes) slides up over Home from 100% -> 0% between 0.08 and 0.45.
   * Scene 2 (Watches) slides up over Cakes from 100% -> 0% between 0.55 and 0.90.
   */
  const scene2Y = useTransform(
    scrollYProgress,
    [0, 0.08, 0.45, 1],
    ["100%", "100%", "0%", "0%"]
  );
  const scene3Y = useTransform(
    scrollYProgress,
    [0, 0.55, 0.9, 1],
    ["100%", "100%", "0%", "0%"]
  );

  /* Subtle image parallax */
  const img1Scale = useTransform(scrollYProgress, [0, 0.45], [1, 1.05]);
  const img2Scale = useTransform(scrollYProgress, [0.08, 0.9], [1, 1.05]);
  const img3Scale = useTransform(scrollYProgress, [0.55, 1], [1, 1.04]);

  /* Track active scene */
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v < 0.35) setActiveScene(0);
    else if (v < 0.72) setActiveScene(1);
    else setActiveScene(2);
  });

  const sceneTransforms = [
    { y: "0%" as const, scale: img1Scale, zIndex: 10 },
    { y: scene2Y, scale: img2Scale, zIndex: 20 },
    { y: scene3Y, scale: img3Scale, zIndex: 30 },
  ];

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-navy-dark"
      style={{ height: "270vh" }}
      aria-label="Hero Banners"
    >
      {/* Sticky Fullscreen Hero Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {SCENES.map((scene, idx) => {
          const { y, scale, zIndex } = sceneTransforms[idx];
          const isActive = activeScene === idx;

          return (
            <motion.div
              key={scene.id}
              style={{
                y: prefersReducedMotion ? "0%" : y,
                zIndex,
                willChange: "transform",
                pointerEvents: isActive ? "auto" : "none",
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* ─────────────────────────────────────────────────────────────
                 FULL-BLEED FULLSCREEN HERO IMAGE (Zero padding/margins on any screen)
                 ───────────────────────────────────────────────────────────── */}
              <div className="relative w-full h-full overflow-hidden bg-navy-dark flex items-center justify-center">
                {/* Mobile Image (<768px): Full width & height object-cover */}
                <motion.div
                  style={{ scale: prefersReducedMotion ? 1 : scale }}
                  className="md:hidden absolute inset-0 w-full h-full"
                >
                  <img
                    src={scene.mobileImg}
                    alt={scene.alt}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-full object-cover select-none"
                    style={{ objectPosition: scene.mobileObjPos }}
                  />
                </motion.div>

                {/* Desktop Image (≥768px): Full width & height object-cover */}
                <motion.div
                  style={{ scale: prefersReducedMotion ? 1 : scale }}
                  className="hidden md:block absolute inset-0 w-full h-full"
                >
                  <img
                    src={scene.desktopImg}
                    alt={scene.alt}
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                    className="w-full h-full object-cover select-none"
                    style={{ objectPosition: scene.desktopObjPos }}
                  />
                </motion.div>

                {/* Dark Vignette Overlay for Crisp Centered Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/55 pointer-events-none" />

                {/* ─────────────────────────────────────────────────────────────
                   CENTERED EDITORIAL TYPOGRAPHY & CTA (Vertically & Horizontally Centered)
                   ───────────────────────────────────────────────────────────── */}
                <div className="relative z-20 w-full max-w-[640px] px-6 text-center flex flex-col items-center justify-center">
                  {/* Category Eyebrow Badge */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-4 py-1.5 backdrop-blur-md mb-3 shadow-md"
                  >
                    <Sparkles size={13} className="text-orange" />
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-white">
                      {scene.eyebrow}
                    </span>
                  </motion.div>

                  {/* Main Title */}
                  <motion.h1
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] drop-shadow-xl"
                  >
                    {scene.title}
                  </motion.h1>

                  {/* Supporting Subtitle */}
                  <motion.p
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ duration: 0.45, delay: 0.16 }}
                    className="mt-2.5 sm:mt-3 text-xs sm:text-base text-white/90 font-medium leading-relaxed max-w-[440px] drop-shadow-md"
                  >
                    {scene.subtitle}
                  </motion.p>

                  {/* CTA Button */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: 0.24 }}
                    className="mt-5 sm:mt-6"
                  >
                    <Link
                      href={scene.href}
                      tabIndex={isActive ? 0 : -1}
                      className="group inline-flex items-center gap-2.5 rounded-xl bg-orange hover:bg-orange-dark px-6 py-3 sm:px-8 sm:py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0"
                    >
                      {scene.cta}
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* ── Active Banner Indicator Pills (Bottom Center) ── */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-white/20 bg-black/40 px-4 py-2.5 backdrop-blur-md shadow-xl"
          aria-label="Banner pagination"
        >
          {SCENES.map((scene, idx) => {
            const active = activeScene === idx;
            return (
              <div key={scene.id} className="flex items-center gap-2">
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    active ? "w-7 h-2.5 bg-orange" : "w-2.5 h-2.5 bg-white/40"
                  }`}
                />
                {active && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-white whitespace-nowrap hidden sm:inline-block"
                  >
                    {scene.eyebrow}
                  </motion.span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
