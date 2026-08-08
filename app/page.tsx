import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Cake, Clock3, Leaf, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { getHomeContent } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/product-card";
import { HeroCarousel } from "@/components/storefront/hero-carousel";

export default async function HomePage() {
  const { categories, featured, bestsellers, banners, reviews } = await getHomeContent();
  const signature = bestsellers.length ? bestsellers : featured;
  const newArrivals = featured.slice(4, 8);

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────── */}
      <HeroCarousel banners={banners} />

      {/* ── Category Grid ────────────────────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-10">
          <div>
            <p className="eyebrow">Our specialties</p>
            <h2 className="section-heading mt-2 max-w-xl">Find your kind of sweet.</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-extrabold text-navy hover:text-orange transition-colors group">
            Browse everything <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {categories.length ? (
          <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group min-w-[150px] flex-shrink-0 snap-start md:min-w-0"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="relative aspect-[.88] overflow-hidden rounded-2xl bg-cream-deep shadow-sm transition-all duration-500 group-hover:-translate-y-1 group-hover:shadow-md">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill sizes="(max-width: 768px) 150px, 18vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-sm font-extrabold text-white">{cat.name}</h3>
                  </div>
                </div>
                <p className="mt-2.5 truncate text-[11px] text-muted font-medium">{cat.description ?? "Baked fresh today"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
            Categories will appear here once published in Admin.
          </div>
        )}
      </section>

      {/* ── Bestsellers ──────────────────────────────── */}
      <section className="border-y border-line bg-paper py-16 md:py-24">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end mb-10">
            <div>
              <p className="eyebrow">Most loved this week</p>
              <h2 className="section-heading mt-2">The ones people come back for.</h2>
            </div>
            <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-extrabold text-navy hover:text-orange transition-colors group">
              Shop all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {signature.length ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {signature.slice(0, 4).map((product, i) => (
                <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
              Featured products will appear here once published in Admin.
            </div>
          )}
        </div>
      </section>

      {/* ── New Arrivals Strip (if products exist) ──── */}
      {newArrivals.length > 0 && (
        <section className="container-shell py-16 md:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">Just dropped</p>
              <h2 className="section-heading mt-2">New Arrivals</h2>
            </div>
            <Link href="/shop?sort=newest" className="inline-flex items-center gap-2 text-sm font-extrabold text-navy hover:text-orange group">
              See all new <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {newArrivals.map((product, i) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Custom Cake CTA ──────────────────────────── */}
      <section className="container-shell py-6 md:pb-16">
        <div className="grid overflow-hidden rounded-[28px] bg-navy md:grid-cols-[.95fr_1.05fr]">
          <div className="pattern-navy-dots flex flex-col justify-center p-8 text-white sm:p-12 lg:p-16">
            <span className="eyebrow text-orange mb-4">The Bake Mart cake studio</span>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Your idea,<br />finished in frosting.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              Tell us who you're celebrating. Share your inspiration, and our cake artists will shape a bespoke creation around the moment.
            </p>
            {/* Steps */}
            <div className="mt-7 flex flex-col gap-3">
              {["Describe your vision", "We craft it fresh", "Delivered to your door"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange text-[11px] font-black text-white">{i + 1}</span>
                  {step}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/custom-cake" className="button-primary">
                Start a cake request <ArrowRight size={15} />
              </Link>
              <Link href="/track-custom-cake" className="button-secondary border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy">
                Track a request
              </Link>
            </div>
          </div>
          <div className="relative min-h-[300px] md:min-h-[480px]">
            <Image
              src="https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?auto=format&fit=crop&w=1400&q=90"
              alt="A custom celebration cake"
              fill sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Promise / Trust Badges ───────────────────── */}
      <section className="border-y border-line bg-cream-deep py-14 md:py-20">
        <div className="container-shell">
          <p className="eyebrow text-center mb-10">Why choose Bake Mart</p>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Clock3, title: "Baked in small batches", copy: "We make what we can serve at its best, every single day." },
              { icon: Leaf, title: "Ingredients you can trust", copy: "Real butter, fresh dairy and flavours worth coming back for." },
              { icon: Truck, title: "Delivered with care", copy: "Your order is packed thoughtfully and brought to your door." },
              { icon: ShieldCheck, title: "Freshness guarantee", copy: "Not happy? We'll make it right with a full replacement." },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex flex-col items-center text-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange shadow-sm">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────── */}
      <section className="container-shell py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="eyebrow">Notes from the table</p>
          <h2 className="section-heading mt-2">Good words, shared generously.</h2>
          <div className="mt-4 flex items-center justify-center gap-1 text-orange">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
            <span className="ml-2 text-sm font-bold text-navy">4.9 average rating</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.length ? reviews.map((review: any, i: number) => (
            <article key={review.id} className="card animate-slide-up p-6 transition-all hover:-translate-y-1 hover:shadow-md" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex gap-1 text-orange mb-4">
                {Array.from({ length: review.rating }).map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
              </div>
              <p className="font-display text-lg leading-relaxed text-navy">"{review.body}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white shrink-0">
                  {(review.profiles?.full_name ?? "V").charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-navy">{review.profiles?.full_name ?? "Verified customer"}</p>
                  <p className="text-[10px] text-green font-bold">✓ Verified Purchase</p>
                </div>
              </div>
            </article>
          )) : (
            <div className="col-span-full rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
              Customer reviews will appear here after moderation.
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────── */}
      <section className="bg-navy py-12">
        <div className="container-shell grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { stat: "700+", label: "Products Available" },
            { stat: "4.9★", label: "Average Rating" },
            { stat: "5,000+", label: "Happy Customers" },
            { stat: "Lahore", label: "Same-day Delivery" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center">
              <p className="font-display text-3xl font-black text-orange">{stat}</p>
              <p className="mt-1 text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────── */}
      <section className="container-shell py-16 md:py-20">
        <div className="relative overflow-hidden rounded-[28px] bg-orange-light p-8 sm:p-14">
          <div className="pattern-dots absolute inset-0 opacity-60" />
          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">A good place to begin</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-navy sm:text-4xl max-w-xl">
                Whether it's a Tuesday treat or the big day, we've got something for it.
              </h2>
            </div>
            <Link href="/shop" className="button-primary shrink-0 text-base px-8">
              Explore the bakery <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
