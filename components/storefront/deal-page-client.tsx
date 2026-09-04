"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Sparkles, Tag, ShoppingBag } from "lucide-react";
import { DealsCountdown } from "@/components/storefront/deals-countdown";
import { ProductCard } from "@/components/storefront/product-card";
import { formatPKR, publicStorageUrl } from "@/lib/catalog";
import type { Deal } from "@/lib/types";

interface DealPageClientProps {
  deal: Deal;
}

export function DealPageClient({ deal }: DealPageClientProps) {
  const isExpired = deal.status === "expired" || new Date(deal.end_at) <= new Date();
  const isPaused = deal.status === "paused" || !deal.is_active;
  const isScheduled = deal.status === "scheduled" || new Date(deal.start_at) > new Date();

  const bannerSrc = deal.banner_image
    ? publicStorageUrl(deal.banner_image)
    : "/placeholder-bake.svg";
  const mobileBannerSrc = deal.mobile_banner_image
    ? publicStorageUrl(deal.mobile_banner_image)
    : bannerSrc;

  // Extract products from deal_products
  const products = (deal.deal_products ?? [])
    .map((dp: any) => {
      const p = dp.products;
      if (!p) return null;
      const variation = dp.product_variations;
      const regPrice = variation ? Number(variation.regular_price ?? variation.price) : Number(p.price ?? 0);
      let dealPrice = regPrice;

      if (deal.deal_type === "percentage") {
        dealPrice = regPrice * (1 - Number(deal.discount_value) / 100);
      } else if (deal.deal_type === "fixed") {
        dealPrice = Math.max(0, regPrice - Number(deal.discount_value));
      } else if (deal.deal_type === "sale_price") {
        dealPrice = dp.custom_deal_price != null ? Number(dp.custom_deal_price) : Number(deal.discount_value);
      }

      dealPrice = Math.round(Math.max(0, dealPrice));

      return {
        id: p.id,
        name: variation ? `${p.name} (${variation.name || Object.values(variation.attributes || {}).join(" / ")})` : p.name,
        slug: p.slug,
        category: p.categories?.name || "Bake Mart",
        description: p.description || deal.short_description || "Special Deal Offer",
        price: regPrice,
        salePrice: dealPrice < regPrice ? dealPrice : null,
        image: variation?.featured_image ? publicStorageUrl(variation.featured_image) : (p.featured_image ? publicStorageUrl(p.featured_image) : "/placeholder-bake.svg"),
        stock: variation ? variation.stock_quantity : p.stock_quantity,
        isPublished: true,
        productType: p.product_type || "simple",
      };
    })
    .filter(Boolean);

  return (
    <div className="min-h-screen pb-20">
      {/* ── Breadcrumb & Back Link ──────────────────── */}
      <div className="container-shell py-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-orange transition-colors"
        >
          <ArrowLeft size={14} /> Back to Shop
        </Link>
      </div>

      {/* ── Hero Promotional Banner ─────────────────── */}
      <section className="container-shell mb-12">
        <div className="relative overflow-hidden rounded-3xl bg-navy text-white shadow-2xl">
          {/* Desktop & Mobile Banner Background */}
          <div className="absolute inset-0 z-0 opacity-40">
            <picture>
              <source media="(max-width: 768px)" srcSet={mobileBannerSrc} />
              <Image
                src={bannerSrc}
                alt={deal.name}
                fill
                priority
                className="object-cover object-center"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-transparent" />
          </div>

          <div className="relative z-10 p-6 sm:p-10 md:p-14 max-w-3xl">
            {deal.badge_text && (
              <span className="deal-badge mb-4 inline-block shadow-md">{deal.badge_text}</span>
            )}

            <h1 className="font-display text-3xl sm:text-5xl font-black text-white leading-tight">
              {deal.name}
            </h1>

            {deal.short_description && (
              <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                {deal.short_description}
              </p>
            )}

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-white/15 pt-6">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-orange block mb-1">
                  Discount Details
                </span>
                <p className="font-display text-2xl font-black text-white">
                  {deal.deal_type === "percentage"
                    ? `UP TO ${deal.discount_value}% OFF`
                    : deal.deal_type === "fixed"
                    ? `SAVE ${formatPKR(deal.discount_value)}`
                    : "SPECIAL PROMOTIONAL PRICE"}
                </p>
              </div>

              {!isExpired && !isPaused && !isScheduled && (
                <DealsCountdown targetDate={deal.end_at} label="Limited-Time Offer Ends In" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Status Notifications (Expired/Scheduled/Paused) ── */}
      {isExpired && (
        <section className="container-shell mb-10">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <Clock size={32} className="mx-auto text-red-500 mb-2" />
            <h2 className="font-display text-xl font-bold text-navy">This deal has ended.</h2>
            <p className="text-xs text-muted mt-1">
              The promotional window for {deal.name} has expired. Browse our main shop for current prices and special offers.
            </p>
            <Link href="/shop" className="button-primary inline-flex mt-4 text-xs px-6 py-2.5">
              Browse All Shop Products <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {isScheduled && (
        <section className="container-shell mb-10">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center">
            <Clock size={32} className="mx-auto text-blue-600 mb-2" />
            <h2 className="font-display text-xl font-bold text-navy">Deal Starts Soon!</h2>
            <p className="text-xs text-muted mt-1">
              This promotion starts on {new Date(deal.start_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" })}.
            </p>
          </div>
        </section>
      )}

      {/* ── Deal Products Grid ──────────────────────── */}
      <section className="container-shell">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <p className="eyebrow text-orange">Special Promotion</p>
            <h2 className="section-heading mt-1">Products Included in Deal</h2>
          </div>
          <span className="text-xs font-bold text-muted">{products.length} Items Available</span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white p-12 text-center">
            <ShoppingBag className="mx-auto text-muted/40 mb-3" size={36} />
            <p className="text-sm font-bold text-navy">No products currently listed for this deal.</p>
            <Link href="/shop" className="button-secondary inline-flex mt-4 text-xs">
              Explore Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
