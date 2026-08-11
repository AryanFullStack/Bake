"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import { Check, Eye, Heart, Plus, ShoppingBag, Star, Zap } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "./cart-provider";
import { QuickViewModal } from "./quick-view-modal";

/* ── Product Card Skeleton ──────────────────────────────────── */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] bg-white border border-line/60">
      <div className="skeleton aspect-[.92] w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex justify-between mt-2">
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-5 w-16 rounded" />
        </div>
        {/* small image strip skeleton */}
        <div className="flex gap-1.5 mt-1">
          {[0,1,2].map(i => <div key={i} className="skeleton h-12 w-12 rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}

/* ── Main Product Card ──────────────────────────────────────── */
export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  // Build de-duped image list: primary first, then gallery extras
  const allImages: string[] = (() => {
    const seen = new Set<string>();
    const imgs: string[] = [];
    for (const src of [product.image, ...(product.images ?? [])]) {
      if (src && !seen.has(src)) { seen.add(src); imgs.push(src); }
    }
    return imgs;
  })();
  const hasMultiple = allImages.length > 1;

  const discount = product.salePrice && product.price > product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : null;

  const isNew = !discount && !product.bestseller;
  const isOutOfStock = product.stock < 1;

  const toggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const res = await fetch("/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (res.ok) setSaved(s => !s);
    } catch { setSaved(s => !s); }
  }, [saved, product.id]);

  const addToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isOutOfStock) return;
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }, [add, product, isOutOfStock]);

  return (
    <article
      className="group relative flex min-w-0 flex-col overflow-hidden border border-line/70 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(6,33,54,.13)] hover:border-orange/25"
      style={{ borderRadius: "var(--radius-card)" }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* ── Image area ───────────────────────────────── */}
      <div className="relative aspect-[.92] overflow-hidden bg-cream-deep">
        <Link href={`/products/${product.slug}`} className="block h-full" tabIndex={-1}>
          {/* Primary image */}
          <Image
            src={allImages[0]}
            alt={product.name}
            width={800} height={860}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
              hovering && hasMultiple ? "opacity-0 scale-[1.05]" : "opacity-100 scale-100"
            }`}
          />
          {/* Secondary (hover) image */}
          {hasMultiple && (
            <Image
              src={allImages[1]}
              alt={`${product.name} – alternate view`}
              width={800} height={860}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                hovering ? "opacity-100 scale-[1.04]" : "opacity-0 scale-100"
              }`}
            />
          )}
        </Link>

        {/* Badge stack — top-left */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-10">
          {discount && <span className="badge badge-sale">{discount}% off</span>}
          {product.bestseller && !discount && <span className="badge badge-bestseller">Bestseller</span>}
          {isNew && !discount && !product.bestseller && <span className="badge badge-new">New</span>}
          {isOutOfStock && <span className="badge badge-soldout">Sold out</span>}
        </div>

        {/* Wishlist — top-right */}
        <button
          onClick={toggleWishlist}
          className={`absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full shadow-sm transition-all duration-200 ${
            saved
              ? "bg-orange text-white shadow-orange"
              : "bg-white/90 text-navy hover:bg-white hover:text-orange"
          }`}
          aria-label={`${saved ? "Remove from" : "Add to"} wishlist`}
        >
          <Heart size={15} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
        </button>

        {/* Quick-add cart & Quick view — bottom-right, slides up on hover */}
        <div className={`absolute bottom-3 right-3 z-10 flex gap-2 transition-all duration-300 ${hovering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              setQuickViewOpen(true);
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-navy shadow-sm hover:bg-white hover:text-orange transition-colors"
            aria-label="Quick View"
            title="Quick View"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={addToCart}
            disabled={isOutOfStock}
            className={`grid h-9 w-9 place-items-center rounded-full text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? "bg-green scale-110" : "bg-orange hover:bg-orange-dark hover:scale-105"
            }`}
            aria-label={`Add ${product.name} to basket`}
          >
            {added ? <Check size={15} strokeWidth={3} /> : <Plus size={16} />}
          </button>
        </div>
      </div>
      {quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}

      {/* ── Info area ────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Category + Rating row */}
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] font-extrabold uppercase tracking-[.14em] text-orange">
            {product.category}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-navy">
            <Star size={11} fill="currentColor" className="text-orange" />
            {product.rating ? product.rating.toFixed(1) : "New"}
            {product.reviews > 0 && (
              <span className="text-muted font-normal">({product.reviews})</span>
            )}
          </span>
        </div>

        {/* Product name */}
        <Link href={`/products/${product.slug}`} className="mt-2 block">
          <h3 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-navy transition-colors group-hover:text-orange">
            {product.name}
          </h3>
        </Link>

        {/* Options & Swatches preview */}
        {product.productType === "variable" && product.variations && product.variations.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-muted">
            <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[10px] font-bold text-navy">
              {product.variations.length} options available
            </span>
            {/* Color swatch dots preview if color attribute exists */}
            {product.attributes?.find(a => a.displayType === "color")?.values.slice(0, 4).map(v => (
              <span
                key={v.slug}
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: v.swatchColor || "#ccc" }}
                title={v.label}
              />
            ))}
          </div>
        )}

        {/* Stock status */}
        <p className="mt-1.5 text-[11px] font-semibold">
          {isOutOfStock ? (
            <span className="text-red-500">Currently unavailable</span>
          ) : product.stock <= (product.lowStockThreshold ?? 5) ? (
            <span className="text-amber-600">Only {product.stock} left</span>
          ) : (
            <span className="text-green">In stock</span>
          )}
        </p>

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line/60 pt-3 mt-3">
          <div>
            <span className="block text-[15px] font-extrabold text-navy">
              {product.priceRange ? (
                product.priceRange.includes("–") ? (
                  <span className="text-xs font-bold text-navy">{product.priceRange}</span>
                ) : (
                  formatPKR(product.salePrice ?? product.price)
                )
              ) : (
                formatPKR(product.salePrice ?? product.price)
              )}
            </span>
            {product.salePrice && !product.priceRange?.includes("–") && (
              <span className="text-[11px] font-medium text-muted line-through">
                {formatPKR(product.price)}
              </span>
            )}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-3 py-1.5 text-[11px] font-extrabold text-navy hover:bg-orange hover:text-white transition-all duration-200"
          >
            <ShoppingBag size={11} /> {product.productType === "variable" ? "Options" : "View"}
          </Link>
        </div>
      </div>
    </article>
  );
}
