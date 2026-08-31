"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, Sparkles, ChevronDown } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Hero Scene Configuration
   ───────────────────────────────────────────────────────────── */
interface HeroScene {
  id: string;
  num: string;
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
    num: "01",
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
    num: "02",
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
    num: "03",
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

  /* Scroll setup with spring physics for butter-smooth momentum transitions */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 28,
    restDelta: 0.0001,
  });

  /*
   * 3D Stacked Deck Scroll Transformations:
   * Total section height: 340vh
   * Scene 0: Fixed at base (y: 0%). Scales down 1.0 -> 0.94 as Scene 1 enters.
   * Scene 1: Slides up 100% -> 0% between 0.12 and 0.42. Scales down 1.0 -> 0.94 as Scene 2 enters.
   * Scene 2: Slides up 100% -> 0% between 0.58 and 0.88.
   */

  // Slide translation transforms
  const scene1Y = useTransform(
    smoothProgress,
    [0, 0.12, 0.42, 1],
    ["100%", "100%", "0%", "0%"]
  );
  const scene2Y = useTransform(
    smoothProgress,
    [0, 0.58, 0.88, 1],
    ["100%", "100%", "0%", "0%"]
  );

  // Depth scaling for underlying deck layers
  const scene0Scale = useTransform(smoothProgress, [0.15, 0.42], [1, 0.94]);
  const scene0Dim = useTransform(smoothProgress, [0.15, 0.42], [0, 0.55]);

  const scene1Scale = useTransform(smoothProgress, [0.58, 0.88], [1, 0.94]);
  const scene1Dim = useTransform(smoothProgress, [0.58, 0.88], [0, 0.55]);

  // Subtle background image parallax zoom
  const img0Zoom = useTransform(smoothProgress, [0, 0.42], [1, 1.06]);
  const img1Zoom = useTransform(smoothProgress, [0.12, 0.88], [1, 1.06]);
  const img2Zoom = useTransform(smoothProgress, [0.58, 1], [1, 1.05]);

  // Progress fill calculations for indicator bars
  const progress0 = useTransform(smoothProgress, [0, 0.35], [0, 1]);
  const progress1 = useTransform(smoothProgress, [0.12, 0.70], [0, 1]);
  const progress2 = useTransform(smoothProgress, [0.58, 1.0], [0, 1]);

  // Track active scene state cleanly
  useMotionValueEvent(smoothProgress, "change", (v) => {
    if (v < 0.35) setActiveScene(0);
    else if (v < 0.70) setActiveScene(1);
    else setActiveScene(2);
  });

  /* Smooth scroll to specific target scene ratio */
  const scrollToScene = (index: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const containerTop = rect.top + scrollTop;
    const scrollableHeight = container.clientHeight - window.innerHeight;

    const targets = [0, 0.48, 0.94];
    const targetScroll = containerTop + targets[index] * scrollableHeight;

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  const sceneTransforms = [
    {
      y: "0%" as const,
      deckScale: scene0Scale,
      dimOpacity: scene0Dim,
      imgScale: img0Zoom,
      zIndex: 10,
    },
    {
      y: scene1Y,
      deckScale: scene1Scale,
      dimOpacity: scene1Dim,
      imgScale: img1Zoom,
      zIndex: 20,
    },
    {
      y: scene2Y,
      deckScale: 1 as const,
      dimOpacity: 0 as const,
      imgScale: img2Zoom,
      zIndex: 30,
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-navy-dark"
      style={{ height: "340vh" }}
      aria-label="Hero Banners"
    >
      {/* Sticky Fullscreen Hero Viewport (h-[100dvh] prevents mobile address bar reflow) */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-black">
        {SCENES.map((scene, idx) => {
          const { y, deckScale, dimOpacity, imgScale, zIndex } = sceneTransforms[idx];
          const isActive = activeScene === idx;

          return (
            <motion.div
              key={scene.id}
              style={{
                y: prefersReducedMotion ? "0%" : y,
                scale: prefersReducedMotion ? 1 : deckScale,
                zIndex,
                willChange: "transform",
                pointerEvents: isActive ? "auto" : "none",
              }}
              className="absolute inset-0 w-full h-full transform-gpu origin-bottom shadow-2xl transition-shadow duration-300"
            >
              {/* Card Container */}
              <div className="relative w-full h-full overflow-hidden bg-navy-dark flex items-center justify-center">
                {/* Mobile Image (<768px) */}
                <motion.div
                  style={{ scale: prefersReducedMotion ? 1 : imgScale }}
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

                {/* Desktop Image (≥768px) */}
                <motion.div
                  style={{ scale: prefersReducedMotion ? 1 : imgScale }}
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

                {/* Dark Vignette Overlay for Typography Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/55 pointer-events-none" />

                {/* 3D Depth Dimming Overlay when covered by upper card */}
                <motion.div
                  style={{ opacity: dimOpacity }}
                  className="absolute inset-0 bg-black pointer-events-none z-10 transition-opacity duration-150"
                />

                {/* Editorial Typography & Centered CTA */}
                <div className="relative z-20 w-full max-w-[640px] px-6 text-center flex flex-col items-center justify-center">
                  {/* Eyebrow Badge */}
                  <motion.div
                    initial={prefersReducedMotion ? false : { opacity: 0, y: -10 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-4 py-1.5 backdrop-blur-md mb-3.5 shadow-lg"
                  >
                    <Sparkles size={13} className="text-orange" />
                    <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.2em] text-white">
                      {scene.eyebrow}
                    </span>
                  </motion.div>

                  {/* Main Title */}
                  <motion.h1
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="font-display font-black text-3.5xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] drop-shadow-xl"
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
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
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

        {/* ── Interactive Progress & Scene Navigation Dock ── */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 rounded-full border border-white/20 bg-black/55 px-4 py-2.5 backdrop-blur-xl shadow-2xl"
          aria-label="Hero Scene Pagination"
        >
          {SCENES.map((scene, idx) => {
            const active = activeScene === idx;
            const sceneProgress = idx === 0 ? progress0 : idx === 1 ? progress1 : progress2;

            return (
              <button
                key={scene.id}
                onClick={() => scrollToScene(idx)}
                className={`group relative flex items-center gap-2 px-2.5 py-1 rounded-full transition-all duration-300 ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
                title={`Go to ${scene.eyebrow}`}
              >
                {/* Scene Number */}
                <span
                  className={`text-[11px] font-black transition-colors duration-300 ${
                    active ? "text-orange" : "text-white/60 group-hover:text-white"
                  }`}
                >
                  {scene.num}
                </span>

                {/* Progress Bar Track & Dynamic Fill */}
                <div className="relative w-7 sm:w-10 h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-orange rounded-full"
                    style={{
                      width: "100%",
                      scaleX: sceneProgress,
                      transformOrigin: "left center",
                    }}
                  />
                </div>

                {/* Active Category Label on Larger Screens */}
                {active && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-extrabold uppercase tracking-widest text-white whitespace-nowrap hidden lg:inline-block pr-1"
                  >
                    {scene.eyebrow}
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Animated Scroll Down Prompt Widget ── */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-6 right-6 z-40 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/15 backdrop-blur-md pointer-events-none"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Scroll to explore
          </span>
          <ChevronDown size={14} className="text-orange" />
        </motion.div>
      </div>
    </section>
  );
}
