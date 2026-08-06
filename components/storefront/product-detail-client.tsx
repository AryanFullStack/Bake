"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Heart,
  Info,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "./cart-provider";

export function ProductDetailClient({
  product,
  reviews,
}: {
  product: Product;
  reviews: any[];
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "delivery">("details");
  const [addedToast, setAddedToast] = useState(false);
  const [selectedImage, setSelectedImage] = useState(product.image);

  useEffect(() => {
    void fetch("/api/recently-viewed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id }),
    });
  }, [product.id]);

  async function toggleWishlist() {
    try {
      const response = await fetch("/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: product.id }),
      });
      if (response.ok) setSaved(!saved);
    } catch {
      setSaved(!saved);
    }
  }

  function handleAddToCart() {
    if (product.stock > 0) {
      for (let i = 0; i < quantity; i++) {
        add(product);
      }
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2000);
    }
  }

  // Calculate discount percentage
  const discountPercent =
    product.salePrice && product.price > product.salePrice
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : null;

  return (
    <div className="container-shell py-8 md:py-14">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-muted mb-8">
        <Link href="/" className="hover:text-orange transition-colors">
          Home
        </Link>
        <ChevronRight size={14} />
        <Link href="/shop" className="hover:text-orange transition-colors">
          Shop
        </Link>
        <ChevronRight size={14} />
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-orange transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span className="text-navy font-bold line-clamp-1">{product.name}</span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid gap-10 md:grid-cols-2 lg:gap-16 items-start">
        {/* Left Column: Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-[32px] bg-cream-deep border border-line/80 shadow-md">
            <Image
              src={selectedImage || product.image}
              alt={product.name}
              width={1000}
              height={1000}
              priority
              className="h-full w-full object-cover"
            />

            {discountPercent && (
              <span className="absolute left-4 top-4 rounded-full bg-orange px-3 py-1 text-xs font-extrabold text-white shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div className="flex flex-col justify-center">
          {/* Category & Brand */}
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-orange">
            <span>{product.category}</span>
            <span className="text-line">•</span>
            <span className="text-navy/70">{product.brand ?? "Bake Mart Signature"}</span>
          </div>

          {/* Product Title */}
          <h1 className="mt-3 font-display text-4xl sm:text-5xl font-bold leading-tight text-navy">
            {product.name}
          </h1>

          {/* Ratings & Stock Status */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold">
            <div className="flex items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1 text-navy border border-orange/20">
              <Star size={15} fill="currentColor" className="text-orange" />
              <span className="font-bold">{product.rating ? product.rating.toFixed(1) : "New"}</span>
            </div>
            <span className="text-muted">({reviews.length} verified customer reviews)</span>
            <span className="text-line">•</span>
            {product.stock > 0 ? (
              <span className="flex items-center gap-1.5 text-green font-bold">
                <ShieldCheck size={16} /> Fresh & available ({product.stock} in stock)
              </span>
            ) : (
              <span className="text-red-500 font-bold">Currently Sold Out</span>
            )}
          </div>

          {/* Price Box */}
          <div className="mt-6 flex items-baseline gap-3 rounded-2xl bg-white p-5 border border-line/80 shadow-xs">
            <span className="font-display text-4xl font-extrabold text-navy">
              {formatPKR(product.salePrice ?? product.price)}
            </span>
            {product.salePrice && (
              <span className="text-lg text-muted line-through font-medium">
                {formatPKR(product.price)}
              </span>
            )}
            <span className="ml-auto text-xs font-semibold text-muted">Taxes included</span>
          </div>

          {/* Short Description */}
          <p className="mt-6 text-base leading-relaxed text-muted font-medium">
            {product.description}
          </p>

          {/* Quantity Selector & Action Buttons */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex gap-3">
              {/* Quantity Picker */}
              <div className="flex items-center rounded-2xl border-2 border-line bg-white px-2 shadow-xs">
                <button
                  disabled={product.stock < 1 || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 text-navy hover:text-orange disabled:opacity-30"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-extrabold text-navy text-base">
                  {quantity}
                </span>
                <button
                  disabled={product.stock < 1 || quantity >= product.stock}
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 text-navy hover:text-orange disabled:opacity-30"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                disabled={product.stock < 1}
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange px-6 py-4 text-base font-extrabold text-white shadow-xl shadow-orange/25 transition-all hover:bg-orange-dark hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{addedToast ? "Added to Basket!" : "Add to Basket"}</span>
                {addedToast ? <Check size={18} /> : <Plus size={18} />}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                className={`grid h-14 w-14 place-items-center rounded-2xl border-2 transition-all shadow-xs ${
                  saved
                    ? "border-orange bg-orange/10 text-orange"
                    : "border-line bg-white text-navy hover:border-orange hover:text-orange"
                }`}
                aria-label="Save product to wishlist"
              >
                <Heart size={20} fill={saved ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Buy Now Direct Button */}
            <Link
              href="/checkout"
              onClick={() => add(product)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-orange bg-white py-4 text-sm font-extrabold text-orange transition-all hover:bg-orange hover:text-white shadow-md active:scale-[0.98]"
            >
              <Sparkles size={16} />
              Buy Now with Express Checkout
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Added to Basket Toast Notice */}
          {addedToast && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-green/10 p-3.5 border border-green/20 text-xs font-bold text-green animate-fade-in">
              <Check size={16} />
              <span>Added {quantity} × {product.name} to your basket.</span>
              <Link href="/cart" className="ml-auto underline font-extrabold hover:text-green-dark">
                View Basket →
              </Link>
            </div>
          )}

          {/* Delivery & SKU Meta */}
          <div className="mt-8 grid gap-3 border-t border-line/80 pt-6 text-xs text-muted font-medium">
            <p className="flex items-center gap-2">
              <strong className="text-navy">SKU:</strong> {product.sku ?? "BMB-PROD-001"}
            </p>
            <p className="flex items-center gap-2">
              <Truck size={14} className="text-orange" />
              <span>
                <strong className="text-navy font-bold">Delivery:</strong> Same-day delivery available for Lahore orders placed before 1:00 PM.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Accordion / Tabs Section */}
      <section className="mt-16 rounded-[32px] bg-white p-6 sm:p-10 border border-line/80 shadow-xs">
        <div className="flex border-b border-line gap-6 text-sm font-bold text-navy">
          <button
            onClick={() => setActiveTab("details")}
            className={`pb-4 transition-colors relative ${
              activeTab === "details" ? "text-orange border-b-2 border-orange" : "text-muted hover:text-navy"
            }`}
          >
            Product Description
          </button>
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`pb-4 transition-colors relative ${
              activeTab === "ingredients" ? "text-orange border-b-2 border-orange" : "text-muted hover:text-navy"
            }`}
          >
            Ingredients & Allergens
          </button>
          <button
            onClick={() => setActiveTab("delivery")}
            className={`pb-4 transition-colors relative ${
              activeTab === "delivery" ? "text-orange border-b-2 border-orange" : "text-muted hover:text-navy"
            }`}
          >
            Delivery & Storage Instructions
          </button>
        </div>

        <div className="mt-6 text-sm leading-relaxed text-muted font-medium">
          {activeTab === "details" && (
            <div className="grid gap-3">
              <p>{product.description}</p>
              <p>
                All Bake Mart Bazaar products are small-batch artisan creations prepared fresh in our Lahore bakery using authentic traditional recipes and premium imported ingredients.
              </p>
            </div>
          )}

          {activeTab === "ingredients" && (
            <div className="grid gap-3">
              <p>
                <strong className="text-navy">Ingredients:</strong> Pure butter, unbleached flour, fresh farm eggs, Belgian cocoa, organic cane sugar, natural vanilla extract, and sea salt.
              </p>
              <p className="text-orange font-bold">
                <Info size={14} className="inline mr-1" /> Allergen Notice: Contains Dairy, Eggs, and Gluten. Prepared in a facility that handles nuts and pistachios.
              </p>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="grid gap-3">
              <p>
                <strong className="text-navy font-bold">Storage:</strong> Store in a cool, dry place or refrigerate upon delivery. Best enjoyed within 3 days.
              </p>
              <p>
                <strong className="text-navy font-bold">Delivery Packaging:</strong> Transported in temperature-controlled boxes to ensure optimal shape and texture upon arrival.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="mt-16">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange">
              Verified Customer Reviews
            </p>
            <h2 className="mt-1 font-display text-3xl font-bold text-navy">
              Customer Feedback ({reviews.length})
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {reviews.length ? (
            reviews.map((review: any) => (
              <article key={review.id} className="rounded-2xl bg-white p-6 border border-line/80 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 text-orange">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-xs text-muted font-medium">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-navy/90 font-medium">
                  “{review.body}”
                </p>
                <p className="mt-4 text-xs font-bold text-muted">
                  — {review.profiles?.full_name ?? "Verified Customer"}
                </p>
              </article>
            ))
          ) : (
            <p className="col-span-full rounded-2xl bg-white p-8 text-center text-sm text-muted border border-line/80">
              No approved reviews yet for this bake. Customers can leave a review after receiving their order.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
