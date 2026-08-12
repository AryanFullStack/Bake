"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "framer-motion";

interface HeroScene {
  id: string;
  num: string;
  title: string;
  category: string;
  href: string;
  desktopImg: string;
  mobileImg: string;
  alt: string;
}

const HERO_SCENES: HeroScene[] = [
  {
    id: "home-decor",
    num: "01",
    title: "Home Decor",
    category: "Home Decoration",
    href: "/shop?category=home-decor",
    desktopImg: "/dacoredisktop.jpeg",
    mobileImg: "/decoreMobile.jpeg",
    alt: "Bake Mart Bazaar - Home Decor",
  },
  {
    id: "watches",
    num: "02",
    title: "Timeless Watches",
    category: "Watches Collection",
    href: "/shop?category=watches",
    desktopImg: "/watchlaptop.jpeg",
    mobileImg: "/watchsMobile (1).jpeg",
    alt: "Bake Mart Bazaar - Timeless Watches",
  },
  {
    id: "cakes",
    num: "03",
    title: "Delicious Cakes",
    category: "Fresh Bakery",
    href: "/shop?category=bakery",
    desktopImg: "/cakedisktop.jpeg",
    mobileImg: "/cakemobile.jpeg",
    alt: "Bake Mart Bazaar - Delicious Cakes",
  },
];

export function MultiCategoryHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scene 1: Home Decor (Hold 0 -> 0.22, Transition 0.22 -> 0.35)
  const scene1Opacity = useTransform(scrollYProgress, [0, 0.22, 0.35], [1, 1, 0]);
  const scene1Scale = useTransform(scrollYProgress, [0, 0.22, 0.35], [1, 1.02, 1.08]);

  // Scene 2: Timeless Watches (Enters 0.22 -> 0.35, Hold 0.35 -> 0.55, Transition 0.55 -> 0.68)
  const scene2Opacity = useTransform(scrollYProgress, [0.22, 0.35, 0.55, 0.68], [0, 1, 1, 0]);
  const scene2Scale = useTransform(scrollYProgress, [0.22, 0.35, 0.55, 0.68], [1.06, 1.0, 1.02, 1.08]);

  // Scene 3: Delicious Cakes (Enters 0.55 -> 0.68, Hold 0.68 -> 1.0)
  const scene3Opacity = useTransform(scrollYProgress, [0.55, 0.68, 1.0], [0, 1, 1]);
  const scene3Scale = useTransform(scrollYProgress, [0.55, 0.68, 1.0], [1.06, 1.0, 1.02]);

  // Update active scene based on scroll progress
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.33) {
      setActiveScene(0);
    } else if (latest < 0.65) {
      setActiveScene(1);
    } else {
      setActiveScene(2);
    }
  });

  const sceneTransforms = [
    { opacity: scene1Opacity, scale: scene1Scale },
    { opacity: scene2Opacity, scale: scene2Scale },
    { opacity: scene3Opacity, scale: scene3Scale },
  ];

  return (
    <section ref={containerRef} className="relative w-full h-[300vh] bg-navy text-white">
      {/* Sticky Hero Container pinned to viewport */}
      <div className="sticky top-0 h-[100vh] h-[100dvh] w-full overflow-hidden flex items-center justify-center">
        
        {/* Render Layered Scenes */}
        {HERO_SCENES.map((scene, idx) => {
          const { opacity, scale } = sceneTransforms[idx];
          const isCurrentActive = activeScene === idx;
          return (
            <motion.div
              key={scene.id}
              style={{
                opacity: shouldReduceMotion ? (isCurrentActive ? 1 : 0) : opacity,
                scale: shouldReduceMotion ? 1 : scale,
                willChange: "transform, opacity",
                pointerEvents: isCurrentActive ? "auto" : "none",
              }}
              initial={idx === 0 ? { opacity: 0, scale: 1.03 } : false}
              animate={idx === 0 && isLoaded ? { opacity: 1, scale: 1 } : undefined}
              transition={idx === 0 ? { duration: 0.9, ease: "easeOut" } : undefined}
              className="absolute inset-0 w-full h-full"
            >
              <Link href={scene.href} className="block w-full h-full cursor-pointer group" title={`Shop ${scene.title}`}>
                <picture className="block w-full h-full">
                  <source media="(max-width: 767px)" srcSet={scene.mobileImg} />
                  <img
                    src={scene.desktopImg}
                    alt={scene.alt}
                    className="w-full h-full object-cover object-center select-none transition-transform duration-700 group-hover:scale-[1.02]"
                    loading={idx === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </picture>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}



