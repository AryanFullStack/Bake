import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight, Cake, Clock, Heart, Home, Mail, Package,
  ShieldCheck, Sparkles, Truck, UtensilsCrossed, Watch,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Bake Bazaar Mart — your trusted online family and general store based in Karachi, Pakistan, delivering fresh bakery, custom cakes, home décor, kitchen essentials, and everyday products.",
};

const CATEGORIES = [
  { icon: Cake,            label: "Cakes & Fresh Bakery",  desc: "Celebration cakes, pastries, cupcakes & desserts" },
  { icon: Sparkles,        label: "Custom Cakes",          desc: "Personalized event & birthday cake designs" },
  { icon: Heart,           label: "Chocolates & Sweets",   desc: "Cooking chocolate and confectionery treats" },
  { icon: Home,            label: "Home & Decoration",     desc: "Vases, accents & aesthetic living décor" },
  { icon: UtensilsCrossed, label: "Kitchen Essentials",    desc: "Utensils, cookware & functional organizers" },
  { icon: Watch,           label: "Watches & Accessories", desc: "Classic & contemporary timepieces" },
  { icon: Package,         label: "Baskets & Storage",     desc: "Organiser bins, laundry hampers & storage" },
  { icon: ShieldCheck,     label: "Daily Essentials",      desc: "Household necessities and everyday products" },
];

const VALUES = [
  {
    number: "01",
    title: "Curated Variety",
    body: "We combine celebration cakes, artisan bakes, home decoration, practical kitchen tools, and daily essentials under one trusted digital storefront so families can find everything they need in one place.",
  },
  {
    number: "02",
    title: "Freshness & Care",
    body: "Our bakery items and custom cakes are prepared fresh to order in small batches. We take special pride in secure, temperature-conscious packaging so every order arrives in pristine condition.",
  },
  {
    number: "03",
    title: "Customer-First Experience",
    body: "From transparent pricing and simple payment options (Cash on Delivery & Bank Transfer) to responsive customer support, we are dedicated to making online shopping seamless and reliable.",
  },
];

const STORE_HIGHLIGHTS = [
  { stat: "Karachi", label: "Store & Delivery Hub" },
  { stat: "Fresh",   label: "Baked to Order" },
  { stat: "Multi-Category", label: "Family Store Variety" },
  { stat: "Pakistan", label: "Nationwide Online Delivery" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-0">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy py-20 md:py-32">
        <div className="pointer-events-none absolute inset-0 pattern-navy-dots opacity-50" />
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2"
          style={{ background: "radial-gradient(ellipse at right, rgba(253,118,0,.12) 0%, transparent 65%)" }}
        />

        <div className="container-shell relative z-10 grid items-center gap-12 md:grid-cols-2">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white/80 mb-5">
              <Sparkles size={13} className="text-orange" /> ABOUT BAKE BAZAAR MART
            </div>
            <h1 className="font-display text-[clamp(2.6rem,5vw,4.2rem)] font-bold leading-tight text-white">
              More Than a Bakery.{" "}
              <span className="text-orange">Everything Your Family Needs.</span>
            </h1>
            <p className="mt-5 text-base leading-8 text-white/70 max-w-lg">
              Bake Bazaar Mart is an online family and general store based in Karachi, Pakistan.
              We bring fresh bakery favorites, custom celebration cakes, home décor accents,
              kitchen essentials, watches, storage solutions, and daily household needs together
              in one convenient ecommerce store.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                Explore Our Store <ArrowRight size={15} />
              </Link>
              <Link href="/custom-cake" className="button-secondary border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy">
                Custom Cake Studio
              </Link>
            </div>
          </div>

          {/* Highlights grid */}
          <div className="grid grid-cols-2 gap-3">
            {STORE_HIGHLIGHTS.map(({ stat, label }) => (
              <div key={label} className="stat-item">
                <span className="font-display text-2xl sm:text-3xl font-black text-orange">{stat}</span>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Offer ─────────────────────────────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="eyebrow text-orange">Convenience & Product Variety</p>
          <h2 className="section-heading mt-2">What We Offer</h2>
          <p className="mt-4 text-base text-muted max-w-xl mx-auto leading-7 font-medium">
            From handcrafted celebration cakes to everyday kitchen utensils and home organizers,
            Bake Bazaar Mart is designed to make shopping simple, reliable, and delightful.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-2xl bg-white p-5 border border-line shadow-xs hover:-translate-y-1 hover:shadow-md transition-all"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-light text-orange">
                <Icon size={22} />
              </div>
              <div>
                <p className="font-bold text-navy text-sm">{label}</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Our Core Values ─────────────────────────────────────── */}
      <section className="bg-cream-deep py-16 md:py-24">
        <div className="container-shell">
          <div className="text-center mb-12">
            <p className="eyebrow text-orange">Our Approach</p>
            <h2 className="section-heading mt-2">How We Serve You</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUES.map(({ number, title, body }) => (
              <div key={number} className="flex flex-col rounded-[28px] bg-white p-8 border border-line shadow-xs">
                <span className="font-display text-4xl font-extrabold text-orange">{number}</span>
                <h3 className="mt-6 font-display text-2xl font-bold text-navy">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted font-medium">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story & Fulfillment ─────────────────────────────────── */}
      <section className="bg-navy text-white py-16 md:py-24">
        <div className="container-shell grid gap-12 md:grid-cols-2 items-center">
          <div>
            <p className="eyebrow text-orange mb-3">Karachi Hub · Pakistan-Wide Delivery</p>
            <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight">
              An Online Store Built for Real Families.
            </h2>
            <p className="mt-5 text-sm leading-8 text-white/75 max-w-lg">
              Bake Bazaar Mart was created to bridge the gap between fresh celebratory bakery items
              and practical everyday household products. Instead of jumping between multiple stores,
              our customers enjoy a unified shopping experience with honest value and dependable delivery.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              {[
                "Fresh celebration cakes & custom cakes prepared to order",
                "Carefully selected home décor, kitchenware & daily essentials",
                "Fast local delivery across Karachi for bakes and general goods",
                "Nationwide online delivery across all cities in Pakistan",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/85">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange/20 border border-orange/30">
                    <Heart size={11} className="text-orange fill-orange" />
                  </div>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">
                Shop Our Catalog <ArrowRight size={15} />
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
                alt="Celebration cakes from Bake Bazaar Mart"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square overflow-hidden rounded-[20px]">
                <Image
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=85"
                  alt="Home decoration items from Bake Bazaar Mart"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-[20px]">
                <Image
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=85"
                  alt="Kitchen essentials from Bake Bazaar Mart"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Operating Hours & Customer Care ─────────────────── */}
      <section className="bg-cream-deep py-12 md:py-16">
        <div className="container-shell grid gap-8 md:grid-cols-2 items-center">
          <div>
            <p className="eyebrow text-orange mb-3">Service & Support</p>
            <h2 className="section-heading">Store &amp; Support Hours</h2>
            <p className="mt-4 text-sm leading-7 text-muted font-medium">
              Our online storefront is open 24 hours a day, 7 days a week. Our customer support,
              kitchen dispatch, and logistics operations are active during the schedule below.
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
              alt="Bake Bazaar Mart — your online family store"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
            <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-white/30 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-sm">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange text-white">
                <Truck size={15} />
              </span>
              <div>
                <span className="block text-xs font-extrabold text-navy">Delivery Across Karachi & Pakistan</span>
                <span className="mt-0.5 block text-[11px] text-muted">Same-day Karachi &amp; nationwide courier</span>
              </div>
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
            <p className="mt-4 text-white/70 text-sm max-w-xl leading-7">
              Fresh cakes, home décor, kitchen essentials, watches, storage baskets, and daily products — delivered with care to your door.
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
