"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function HeroCarousel({ banners }: { banners: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex((index) => (index + 1) % banners.length), 6500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const current = banners[currentIndex];
  const title = current?.title ?? "Made for the moments worth gathering for.";
  const body = current?.body ?? "Small-batch cakes, buttery pastries and thoughtful sweet things, baked fresh in Lahore.";

  return <section className="overflow-hidden border-b border-line bg-cream py-8 md:py-14 lg:py-20">
    <div className="container-shell grid items-center gap-9 lg:grid-cols-[.86fr_1.14fr] lg:gap-16">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: "easeOut" }} className="relative z-10 py-3 lg:py-8">
        <div className="eyebrow inline-flex items-center gap-2"><Sparkles size={13} /> Bake Mart Bazaar · Lahore</div>
        <h1 className="mt-5 max-w-xl font-display text-[clamp(2.8rem,6vw,5.6rem)] font-bold leading-[.98] text-navy">{title}</h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-muted md:text-lg">{body}</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href={current?.cta_href ?? "/shop"} className="button-primary">{current?.cta_label ?? "Shop the bakery"}<ArrowRight size={17} /></Link><Link href="/custom-cake" className="button-secondary">Custom cake studio</Link></div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5 text-xs font-bold text-navy"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green" /> Baked fresh daily</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green" /> Cash on delivery</span></div>
        {banners.length > 1 && <div className="mt-8 flex items-center gap-3"><div className="flex gap-1.5">{banners.map((banner, index) => <button key={banner.id ?? index} onClick={() => setCurrentIndex(index)} className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-9 bg-orange" : "w-2 bg-line"}`} aria-label={`Show banner ${index + 1}`} />)}</div><div className="ml-2 flex gap-1"><button onClick={() => setCurrentIndex((index) => (index === 0 ? banners.length - 1 : index - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-navy hover:border-orange hover:text-orange" aria-label="Previous banner"><ChevronLeft size={15} /></button><button onClick={() => setCurrentIndex((index) => (index + 1) % banners.length)} className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-navy hover:border-orange hover:text-orange" aria-label="Next banner"><ChevronRight size={15} /></button></div></div>}
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .08, ease: "easeOut" }} className="relative aspect-[1.08] overflow-hidden rounded-[22px] bg-cream-deep shadow-[0_22px_55px_rgba(6,33,54,.15)] lg:rounded-[30px]">
        <Image src={current?.image_path ?? "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=90"} alt={title} fill priority className="object-cover transition-transform duration-[1400ms] hover:scale-[1.025]" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
        <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-white/40 bg-white/90 px-3 py-3 shadow-xl backdrop-blur-sm"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange text-white"><Leaf size={17} /></span><span><span className="block text-xs font-extrabold text-navy">The fresh-bake promise</span><span className="mt-0.5 block text-[11px] text-muted">Prepared in small batches</span></span></div>
      </motion.div>
    </div>
  </section>;
}
