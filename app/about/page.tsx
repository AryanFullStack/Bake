import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Award, Cake, Clock, Heart, Home, Package,
  ShieldCheck, Sparkles, Star, Truck, UtensilsCrossed, Watch,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Bake Mart Bazaar is Lahore's favourite family marketplace — fresh bakery, home décor, kitchen essentials, watches and everyday products all in one place.",
};

const CATEGORIES = [
  { icon: Cake,            label: "Freshly Baked Goods",  desc: "Cakes, pastries, brownies & more" },
  { icon: Home,            label: "Home Decoration",       desc: "Beautiful things for your space" },
  { icon: UtensilsCrossed, label: "Kitchen Essentials",    desc: "Everyday cooking & storage" },
  { icon: Watch,           label: "Watches",               desc: "Classic & modern timepieces" },
  { icon: Package,         label: "Baskets & Storage",     desc: "Organise beautifully" },
  { icon: ShieldCheck,     label: "Daily Essentials",      desc: "Grocery & everyday needs" },
];

const VALUES = [
  {
    number: "01",
    title: "Quality You Can Feel",
    body: "Every single product on Bake Mart Bazaar — whether it's a chocolate cake, a decorative vase or a kitchen storage set — is selected for quality, durability and genuine value.",
  },
  {
    number: "02",
    title: "Fresh From Our Kitchen",
    body: "Our bakery operates in small batches, prepared fresh every day. We bake to order so your celebration cake, pastry or brownie reaches you at its very best.",
  },
  {
    number: "03",
    title: "One Store, Everything",
    body: "We believe Pakistani families shouldn't need five different apps. We've brought bakery, home essentials, kitchen goods, watches and daily products under one roof — online.",
  },
];

const STATS = [
  { val: "700+",   label: "Products" },
  { val: "5,000+", label: "Happy Customers" },
  { val: "4.9★",   label: "Average Rating" },
  { val: "6",      label: "Categories" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-0">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy py-20 md:py-32">
        {/* Subtle dots */}
        <div className="pointer-events-none absolute inset-0 pattern-navy-dots opacity-50" />
        {/* Orange glow */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
          style={{ background: "radial-gradient(ellipse at right, rgba(253,118,0,.12) 0%, transparent 65%)" }}
        />

        <div className="container-shell relative z-10 grid items-center gap-12 md:grid-cols-2">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/80 mb-5">
              <Sparkles size={13} className="text-orange" /> OUR STORY
            </div>
            <h1 className="font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-tight text-white">
              More Than a Bakery.{" "}
              <span className="text-orange">Everything Your Family Needs.</span>
            </h1>
            <p className="mt-5 text-base leading-8 text-white/70 max-w-lg">
              Bake Mart Bazaar started with a passion for freshly baked goods — and grew into something
              much bigger. Today we bring bakery favourites, home décor, kitchen essentials, watches,
              baskets and everyday products together in one convenient online store.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                Shop Everything <ArrowRight size={15} />
              </Link>
              <Link href="/custom-cake" className="button-secondary border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy">
                Custom Cake Studio
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ val, label }) => (
              <div key={label} className="stat-item">
                <span className="font-display text-3xl font-black text-orange">{val}</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Sell ─────────────────────────────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="eyebrow">Everything in one place</p>
          <h2 className="section-heading mt-2">Six Categories, One Store</h2>
          <p className="mt-4 text-base text-muted max-w-xl mx-auto leading-7">
            From freshly baked cakes to beautifully curated home décor — Bake Mart Bazaar is your
            complete family marketplace in Lahore.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-line shadow-xs hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-light text-orange">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-bold text-navy">{label}</p>
                <p className="mt-0.5 text-xs text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Values ─────────────────────────────────────── */}
      <section className="bg-cream-deep py-16 md:py-24">
        <div className="container-shell">
          <div className="text-center mb-12">
            <p className="eyebrow">What we stand for</p>
            <h2 className="section-heading mt-2">Our Three Principles</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ number, title, body }) => (
              <div key={number} className="flex flex-col rounded-[28px] bg-white p-8 border border-line shadow-xs">
                <span className="font-display text-5xl font-extrabold text-orange">{number}</span>
                <h3 className="mt-8 font-display text-2xl font-bold text-navy">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story Banner ─────────────────────────────────────── */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="container-shell grid gap-12 md:grid-cols-2 items-center">
          <div>
            <p className="eyebrow text-orange mb-3">Our Lahore Roots</p>
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight">
              Built for Pakistani Families, Delivered With Care.
            </h2>
            <p className="mt-5 text-sm leading-8 text-white/70 max-w-lg">
              We know Pakistani families need quality, convenience and affordability — all at once.
              Bake Mart Bazaar was built from the ground up to serve Lahore's families: fresh bakery
              items for celebrations, home essentials for everyday living, and daily-use products for
              the whole household.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              {[
                "Fresh bakery prepared in small batches every day",
                "Products carefully selected for quality and value",
                "Same-day delivery available across Lahore",
                "Trusted by over 5,000 families and counting",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange/20 border border-orange/30">
                    <Heart size={11} className="text-orange fill-orange" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                Shop Now <ArrowRight size={15} />
              </Link>
              <Link href="/custom-cake" className="button-secondary border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy">
                Custom Cake Studio
              </Link>
            </div>
          </div>

          {/* Image collage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[0.8] overflow-hidden rounded-[20px]">
              <Image
                src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=85"
                alt="Fresh cakes from Bake Mart Bazaar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-[20px]">
                <Image
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=85"
                  alt="Home decoration products"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-[20px]">
                <Image
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=85"
                  alt="Kitchen essentials"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Us Cards ─────────────────────────────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="eyebrow">Why shop with us</p>
          <h2 className="section-heading mt-2">Why Lahore Loves Bake Mart</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Award,   title: "Quality First",       copy: "Every product is hand-picked for quality and value — whether it's a cake or a kitchen accessory." },
            { icon: Cake,    title: "Fresh Bakery Daily",  copy: "Baked fresh in small batches every morning. Real ingredients, real care, real flavour." },
            { icon: Star,    title: "Great Prices",        copy: "Premium-feeling products at prices designed for Pakistani families. Honest value, always." },
            { icon: Truck,   title: "Fast Delivery",       copy: "Same-day delivery available across Lahore. Your order, carefully packed and delivered to your door." },
          ].map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center gap-4 p-7 rounded-2xl bg-white border border-line shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="feature-icon-ring">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Operating Hours ─────────────────────────────────── */}
      <section className="bg-cream-deep py-12 md:py-16">
        <div className="container-shell grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="eyebrow mb-3">We're always open</p>
            <h2 className="section-heading">Store &amp; Delivery Hours</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              Our online store never closes, but our kitchen and delivery team operate during the hours
              below. Orders placed outside delivery hours are fulfilled the following morning.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {[
                { day: "Monday – Friday",  hours: "9:00 AM – 10:00 PM" },
                { day: "Saturday",         hours: "8:00 AM – 11:00 PM" },
                { day: "Sunday",           hours: "9:00 AM – 9:00 PM" },
              ].map(({ day, hours }) => (
                <div key={day} className="flex items-center justify-between rounded-xl bg-white px-5 py-3 border border-line shadow-xs">
                  <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <Clock size={15} className="text-orange" /> {day}
                  </span>
                  <span className="text-sm font-bold text-green">{hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-[1.2] overflow-hidden rounded-[28px] shadow-lg">
            <Image
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=85"
              alt="Bake Mart Bazaar — your everyday store"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-white/30 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-sm">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange text-white">
                <ShieldCheck size={15} />
              </span>
              <span>
                <span className="block text-xs font-extrabold text-navy">Delivery Across Lahore</span>
                <span className="mt-0.5 block text-[11px] text-muted">Same-day &amp; next-day available</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="container-shell py-16">
        <div className="overflow-hidden rounded-[28px] bg-navy relative">
          <div className="pointer-events-none absolute inset-0 pattern-navy-dots opacity-50" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(253,118,0,.1) 0%, transparent 70%)" }}
          />
          <div className="relative z-10 flex flex-col items-center py-14 px-8 text-center">
            <p className="eyebrow text-orange">Start shopping today</p>
            <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold text-white max-w-2xl leading-tight">
              Everything Your Family Needs — All in One Place.
            </h2>
            <p className="mt-4 text-white/65 text-sm max-w-xl leading-7">
              700+ products across 6 categories. Fresh bakery, beautiful home finds, kitchen essentials,
              watches, baskets and daily products — delivered to your door in Lahore.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/shop" className="button-primary text-base px-8">
                Shop All Products <ArrowRight size={16} />
              </Link>
              <Link href="/custom-cake" className="button-secondary border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy">
                Custom Cake Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
