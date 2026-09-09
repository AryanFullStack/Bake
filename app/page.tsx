import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Award, Cake, CheckCircle2, Heart, Home, Mail,
  Package, ShieldCheck, ShoppingBag, ShoppingBasket, Star,
  Truck, UtensilsCrossed, Watch, Wheat, Sparkles, Zap,
} from "lucide-react";
import { getHomeContent } from "@/lib/storefront";
import { calculateProductDealPrice } from "@/lib/deals";
import { publicStorageUrl } from "@/lib/catalog";
import { ProductCard } from "@/components/storefront/product-card";
import { MultiCategoryHero } from "@/components/storefront/multi-category-hero";
import { HomeKitchenShowcase } from "@/components/storefront/home-kitchen-showcase";
import { DealsCountdown } from "@/components/storefront/deals-countdown";
import { BAKERY_BLUR } from "@/lib/image-placeholders";
import type { Product } from "@/lib/types";

/* ── Stars helper ─────────────────────────────────────────── */
function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <div className="flex gap-0.5 text-orange">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} className={i < Math.round(rating) ? "fill-current" : "fill-none"} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export default async function HomePage() {
  const { categories, featured, bestsellers, reviews, activeDeals = [], featuredDeal } = await getHomeContent();

  /* ── Real DB products only ────────────────────────────── */
  const allDbProducts = [...bestsellers, ...featured];

  // Deduplicate by id
  const seen = new Set<string>();
  const uniqueProducts: Product[] = [];
  for (const p of allDbProducts) {
    if (!seen.has(p.id)) { seen.add(p.id); uniqueProducts.push(p); }
  }

  // Most Loved — up to 6 bestsellers/featured
  const mostLoved: Product[] = uniqueProducts.slice(0, 6);
  const mostLovedIds = new Set(mostLoved.map((p) => p.id));

  // Collect all deal products from products list and active deals
  const dealProductsMap = new Map<string, Product>();

  for (const p of uniqueProducts) {
    if (p.salePrice || p.dealInfo?.isOnDeal) {
      dealProductsMap.set(p.id, p);
    }
  }

  for (const deal of activeDeals) {
    if (deal.deal_products) {
      for (const dp of deal.deal_products) {
        if (dp.products) {
          const prodObj = dp.products as any;
          if (!dealProductsMap.has(prodObj.id)) {
            const varObj = dp.product_variations as any;
            const regPrice = Number(prodObj.price ?? 0);
            const actualRegPrice = varObj ? Number(varObj.regular_price ?? varObj.price ?? regPrice) : regPrice;

            const dealCalc = calculateProductDealPrice({
              productId: prodObj.id,
              variationId: varObj?.id || null,
              regularPrice: actualRegPrice,
              activeDeals,
            });

            const effectiveSaleP = dealCalc.isOnDeal
              ? dealCalc.dealPrice
              : dp.custom_deal_price
              ? Number(dp.custom_deal_price)
              : null;

            const rawImg = varObj?.featured_image || prodObj.featured_image;

            dealProductsMap.set(prodObj.id, {
              id: prodObj.id,
              name: varObj ? `${prodObj.name} (${varObj.name || Object.values(varObj.attributes || {}).join(" / ")})` : prodObj.name,
              slug: prodObj.slug || prodObj.id,
              category: prodObj.categories?.name || "Bake Mart",
              description: prodObj.description || deal.short_description || "Special Deal Offer",
              price: actualRegPrice,
              salePrice: effectiveSaleP,
              image: rawImg ? publicStorageUrl(rawImg) : "/placeholder-bake.svg",
              stock: varObj?.stock_quantity ?? prodObj.stock_quantity ?? 10,
              isPublished: true,
              productType: prodObj.product_type || "simple",
              dealInfo: dealCalc,
            } as any);
          }
        }
      }
    }
  }

  const displayDealProducts: Product[] = Array.from(dealProductsMap.values());
  const dealIds = new Set(displayDealProducts.map((p) => p.id));

  // New Arrivals — remaining products
  const newArrivals: Product[] = uniqueProducts
    .filter((p) => !mostLovedIds.has(p.id) && !dealIds.has(p.id))
    .slice(0, 4);

  /* ── DB categories for the category grid ─────────────── */
  const categoryIconMap: Record<string, React.ElementType> = {
    bakery: Cake,
    cakes: Cake,
    "home-decor": Home,
    kitchen: UtensilsCrossed,
    watches: Watch,
    baskets: ShoppingBasket,
    "daily-essentials": Wheat,
  };

  const categoryDefaultImages: Record<string, string> = {
    bakery: "/bakery.webp",
    cakes: "/celebration-cakes.webp",
    "celebration-cakes": "/celebration-cakes.webp",
    baskets: "/baskets.webp",
    "baskets-storage": "/baskets.webp",
    watches: "/WD.webp",
    kitchen: "/kicthens.webp",
    "home-decor": "/homeDisktop.webp",
    "daily-essentials": "/homeItems.webp",
  };

  // Use only top-level (parent) categories from DB, max 6
  const shopCategories = categories
    .filter((c) => !c.parent_id)
    .slice(0, 6);

  return (
    <div className="overflow-x-clip">

      {/* ── Hero Section ────────────────────────────────────── */}
      <MultiCategoryHero />

      {/* ── Shop by Category — hide if no DB categories ─────── */}
      {shopCategories.length > 0 && (
        <section id="categories" className="container-shell py-12 md:py-20">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-8">
            <div>
              <p className="eyebrow text-orange">Shop What You Need</p>
              <h2 className="section-heading mt-1.5">
                Explore everyday essentials,<br className="hidden sm:block" />
                treats and home favourites.
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
            >
              Browse everything <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile horizontal scroll container / Desktop grid */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 sm:grid sm:grid-cols-3 lg:grid-cols-6 scrollbar-thin">
            {shopCategories.map((cat) => {
              const Icon = categoryIconMap[cat.slug] ?? ShoppingBag;
              const catImg = (cat.image && cat.image !== "/placeholder-bake.svg" && !cat.image.includes("unsplash"))
                ? cat.image
                : (categoryDefaultImages[cat.slug] || categoryDefaultImages[cat.name.toLowerCase()] || "/bakery.png");
              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="group shrink-0 w-[165px] sm:w-auto rounded-2xl border border-line bg-white p-3 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-orange/30 hover:shadow-md flex flex-col items-center justify-between"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream-deep">
                    <Image
                      src={catImg}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 165px, (max-width: 1024px) 33vw, 18vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-2.5 left-2.5 grid h-7 w-7 place-items-center rounded-lg bg-white/90 shadow-xs backdrop-blur-xs">
                      <Icon size={14} className="text-navy" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xs font-extrabold text-navy group-hover:text-orange transition-colors truncate">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="mt-0.5 text-[10.5px] text-muted truncate">{cat.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Bakery + Custom Cake Studio Signature Split Layout ─── */}
      <section className="relative overflow-hidden bg-navy text-white py-16 md:py-24">
        {/* Organic curved shape backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-[450px] w-[450px] rounded-full bg-orange/15 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-[450px] w-[450px] rounded-full bg-green/15 blur-3xl" />
        </div>

        <div className="container-shell relative z-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 items-stretch">
            
            {/* Left — Bakery Card with Image */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 backdrop-blur-md overflow-hidden shadow-xl hover:border-white/25 transition-all">
              <div>
                {/* Bakery Image Banner */}
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-2xl mb-6 shadow-md bg-navy-dark">
                  <Image
                    src="/cake.webp"
                    alt="Freshly baked cakes and pastries"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    placeholder="blur"
                    blurDataURL={BAKERY_BLUR}
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-navy/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    <Cake size={13} className="text-orange" /> Small Batch Baking
                  </span>
                </div>

                <span className="eyebrow text-orange">Fresh Bakery</span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight text-white">
                  Freshly Baked Daily.
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/75">
                  Fresh cakes, pastries, cupcakes and desserts prepared in small batches.
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-2">
                  {[
                    "Fresh Daily prepared in small batches",
                    "Small Batch Baking with honest ingredients",
                    "Real Butter & rich Pakistani flavours",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/85">
                      <CheckCircle2 size={15} className="text-green shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10">
                <Link href="/shop?category=bakery" className="button-primary text-xs sm:text-sm px-6 w-full justify-center">
                  Shop Fresh Bakery <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Right — Custom Cake Studio Card with Image */}
            <div className="flex flex-col justify-between rounded-3xl border border-orange/30 bg-orange/10 p-6 sm:p-8 backdrop-blur-md overflow-hidden shadow-xl hover:border-orange/50 transition-all">
              <div>
                {/* Custom Cake Image Banner (Desktop: /custoemcake2.webp, Mobile: /CakeM.webp) */}
                <div className="relative aspect-[1.6] w-full overflow-hidden rounded-2xl mb-6 shadow-md bg-navy-dark">
                  {/* Desktop Image (≥768px) */}
                  <div className="hidden md:block absolute inset-0 w-full h-full">
                    <Image
                      src="/custoemcake2.webp"
                      alt="Custom celebration cake finished in frosting"
                      fill
                      sizes="50vw"
                      placeholder="blur"
                      blurDataURL={BAKERY_BLUR}
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  {/* Mobile Image (<768px) — /CakeM.webp */}
                  <div className="md:hidden absolute inset-0 w-full h-full">
                    <Image
                      src="/CakeM.webp"
                      alt="Custom celebration cake mobile visual"
                      fill
                      sizes="100vw"
                      placeholder="blur"
                      blurDataURL={BAKERY_BLUR}
                      className="object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                    <Sparkles size={13} /> Custom Decorator Studio
                  </span>
                </div>

                <span className="eyebrow text-white">Custom Cake Studio</span>
                <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight text-orange">
                  Finished in Frosting.
                </h2>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/75">
                  Tell us your celebration idea and our cake decorators will bring it to life.
                </p>

                {/* Highlights */}
                <div className="mt-5 space-y-2">
                  {[
                    "Made to Order for birthdays & events",
                    "Custom Designs tailored to your vision",
                    "Reference Image Upload for exact details",
                    "Custom Delivery Date scheduled for your party",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-semibold text-white/85">
                      <CheckCircle2 size={15} className="text-orange shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-orange/20 flex flex-wrap items-center gap-3">
                <Link href="/custom-cake" className="button-primary text-xs sm:text-sm px-5 flex-1 justify-center">
                  Custom Cake Studio
                </Link>
                <Link
                  href="/track-custom-cake"
                  className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy text-xs sm:text-sm px-4"
                >
                  Track Cake Order
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Most Loved This Week — hide if DB has no products ─── */}
      {mostLoved.length > 0 && (
        <section className="container-shell py-16 md:py-20">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-10">
            <div>
              <p className="eyebrow text-orange">Most Loved This Week</p>
              <h2 className="section-heading mt-1.5">
                Products Our Customers<br />Keep Coming Back For.
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
            >
              Shop All <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
            {mostLoved.map((product, i) => (
              <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Limited-Time Deals — hide if no DB active deals or deal products ───── */}
      {(activeDeals.length > 0 || displayDealProducts.length > 0) && (
        <section className="relative overflow-hidden bg-navy text-white py-16 md:py-20">
          {/* Ambient background glow */}
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute right-0 top-0 h-[450px] w-[450px] rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, #fd7600 0%, transparent 70%)" }}
            />
          </div>

          <div className="container-shell relative z-10 space-y-10">
            {/* Featured Promotional Banner (If set by Admin) */}
            {featuredDeal ? (
              <div className="rounded-3xl border border-orange/40 bg-orange/10 p-6 sm:p-10 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                  <span className="deal-badge mb-3 inline-block">
                    {featuredDeal.badge_text || "🔥 Featured Deal"}
                  </span>
                  <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    {featuredDeal.name}
                  </h3>
                  {featuredDeal.short_description && (
                    <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                      {featuredDeal.short_description}
                    </p>
                  )}
                  <div className="mt-5 flex items-center gap-3">
                    <Link
                      href={`/deals/${featuredDeal.slug}`}
                      className="button-primary text-xs sm:text-sm px-6 py-2.5 shadow-md"
                    >
                      Shop Featured Deal <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
                <DealsCountdown targetDate={featuredDeal.end_at} label="Featured Deal Ends In" />
              </div>
            ) : (
              /* Section Header when no featured deal banner */
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <span className="deal-badge mb-3 inline-block">🔥 Today's Best Deals</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    Hand-picked offers — refreshed regularly.
                  </h2>
                </div>
                {activeDeals[0] && (
                  <DealsCountdown targetDate={activeDeals[0].end_at} label="Offer Ends In" />
                )}
              </div>
            )}

            {/* Deal Products Grid */}
            {displayDealProducts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
                  <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-orange flex items-center gap-2">
                    <Zap size={14} className="fill-current" /> Products Currently On Deal
                  </h3>
                  <span className="text-xs font-bold text-white/60">{displayDealProducts.length} Items Available</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
                  {displayDealProducts.slice(0, 8).map((product, i) => (
                    <div key={product.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View All Deals CTA */}
            <div className="text-center pt-2">
              <Link
                href={activeDeals[0] ? `/deals/${activeDeals[0].slug}` : "/shop?sale=1"}
                className="button-secondary border-white/30 bg-white/10 text-white hover:bg-white hover:text-navy inline-flex items-center gap-2 text-xs sm:text-sm px-8 py-3"
              >
                View All Active Deals <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Home & Living ─────────────────────────────────────── */}
      <HomeKitchenShowcase />

      {/* ── New Arrivals — hide if no remaining DB products ───── */}
      {newArrivals.length > 0 && (
        <section className="container-shell py-16 md:py-20 border-t border-line/60">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end mb-10">
            <div>
              <p className="eyebrow text-orange">Just Dropped</p>
              <h2 className="section-heading mt-1.5">New Arrivals</h2>
              <p className="mt-1 text-xs sm:text-sm text-muted">Fresh products added to Bake Mart Bazaar.</p>
            </div>
            <Link
              href="/shop?sort=newest"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-navy hover:text-orange transition-colors group shrink-0"
            >
              View All New Arrivals <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-4">
            {newArrivals.map((product, i) => (
              <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Why Bake Mart Bazaar? (4 Trust Pillars) ────────────── */}
      <section className="container-shell py-16 md:py-20 bg-paper/60 rounded-3xl my-8">
        <div className="text-center mb-12">
          <p className="eyebrow text-orange">Why Choose Us</p>
          <h2 className="section-heading mt-1.5">Why Bake Mart Bazaar?</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Award,
              title: "Quality Products",
              copy: "Carefully selected for everyday needs.",
            },
            {
              icon: Cake,
              title: "Fresh Bakery",
              copy: "Freshly prepared with quality ingredients.",
            },
            {
              icon: Package,
              title: "Great Prices",
              copy: "Quality products at competitive prices.",
            },
            {
              icon: Truck,
              title: "Fast Delivery",
              copy: "Safe delivery across Lahore.",
            },
          ].map(({ icon: Icon, title, copy }) => (
            <div
              key={title}
              className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white border border-line/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="feature-icon-ring">
                <Icon size={24} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-navy">{title}</h3>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust Statistics Strip ─────────────────────────────── */}
      <section className="bg-navy py-12 text-white">
        <div className="container-shell grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { stat: "700+", label: "Products" },
            { stat: "5,000+", label: "Happy Customers" },
            { stat: "4.9★", label: "Average Rating" },
            { stat: "Lahore", label: "Same-Day Delivery" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center p-4">
              <p className="font-display text-3xl sm:text-4xl font-black text-orange">{stat}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Customer Reviews — hide if no DB reviews ───────────── */}
      {reviews.length > 0 && (
        <section className="container-shell py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center mb-10">
            <p className="eyebrow text-orange">Customer Reviews</p>
            <h2 className="section-heading mt-1.5">Loved by Families Across Lahore</h2>
            <div className="mt-3 flex items-center justify-center gap-1 text-orange">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
              <span className="ml-2 text-xs font-bold text-navy">4.9 average rating</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {reviews.slice(0, 3).map((review: any, i: number) => {
              const name = review.profiles?.full_name ?? review.reviewer_name ?? review.guest_name ?? "Verified Customer";
              const body = review.body;
              const product = review.products?.name ?? "Bake Mart Product";
              const rating = review.rating ?? 5;
              return (
                <article key={name + i} className="card p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform">
                  <div>
                    <Stars rating={rating} />
                    <p className="mt-3 text-sm leading-relaxed text-navy font-medium">"{body}"</p>
                  </div>
                  <div className="mt-6 border-t border-line/60 pt-4">
                    <p className="text-[11px] font-bold text-orange truncate">Purchased: {product}</p>
                    <div className="mt-3 flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-navy text-xs font-bold text-white shrink-0">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-navy">{name}</p>
                        <p className="text-[10px] text-green font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Verified Purchase
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── More Than a Bakery (Brand Story) ─────────────────── */}
      <section className="py-16 md:py-24 bg-cream-deep/60">
        <div className="container-shell">
          <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-[1.15] overflow-hidden rounded-[28px] shadow-lg">
              <Image
                src="/cakechake.webp"
                alt="Bake Mart Bazaar — More than a bakery"
                fill
                placeholder="blur"
                blurDataURL={BAKERY_BLUR}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Content */}
            <div>
              <p className="eyebrow text-orange">Our Story</p>
              <h2 className="section-heading mt-2">More Than a Bakery.</h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted font-normal">
                Bake Mart Bazaar brings bakery favourites, home décor, kitchen essentials, watches, baskets, daily-use products and more together in one convenient online store.
              </p>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-muted font-normal">
                One store for celebrations, everyday needs and everything in between.
              </p>

              <div className="mt-8">
                <Link href="/about" className="button-primary text-xs sm:text-sm px-6">
                  Discover Our Story <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ──────────────────────────────────────────── */}
      <section className="bg-navy py-14 text-white">
        <div className="container-shell">
          <div className="mx-auto max-w-xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white/90 mb-4">
              <Mail size={13} className="text-orange" /> Stay connected
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Stay in the Loop
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              New products, seasonal offers &amp; exclusive deals.
            </p>

            <form className="mt-6 mx-auto flex max-w-md flex-col gap-2.5 sm:flex-row">
              <input
                required
                type="email"
                placeholder="Your email address"
                id="newsletter-email"
                className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/40 focus:border-orange transition-colors"
              />
              <button
                type="submit"
                className="button-primary shrink-0 text-xs py-2.5 px-6"
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}

export const dynamic = "force-dynamic";
