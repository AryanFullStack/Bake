"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Heart, ShoppingBag, Star, X } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "./cart-provider";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!product || !mounted) return null;

  function handleAddToCart() {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      add(product);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return createPortal(
    <div
      className="modal-overlay animate-fade-in z-[9999]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 sm:p-8 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-navy hover:bg-cream hover:text-orange transition-colors z-10"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="grid gap-6 md:grid-cols-2 items-center">
          {/* Image Gallery Side */}
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-deep">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            {product.badge && (
              <span className="absolute top-3 left-3 badge badge-sale">
                {product.badge}
              </span>
            )}
          </div>

          {/* Product Details Side */}
          <div className="flex flex-col justify-center">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange">
              {product.category}
            </span>

            <h3 className="font-display text-2xl font-bold text-navy mt-1">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <div className="flex text-orange">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < Math.round(product.rating || 5) ? "fill-current" : "fill-none"}
                  />
                ))}
              </div>
              <span className="font-bold text-navy">{product.rating || 5.0}</span>
              <span>({product.reviews || 12} reviews)</span>
            </div>

            {/* Pricing */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-2xl font-extrabold text-navy">
                {formatPKR(product.salePrice || product.price)}
              </span>
              {product.salePrice && (
                <span className="text-sm font-semibold text-muted line-through">
                  {formatPKR(product.price)}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-3">
              {product.description || "High quality product from Bake Mart Bazaar."}
            </p>

            {/* Quantity Controls */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs font-bold text-navy">Quantity:</span>
              <div className="flex items-center rounded-xl border border-line bg-cream/40">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-sm font-bold text-navy hover:text-orange"
                >
                  -
                </button>
                <span className="px-2 text-xs font-extrabold text-navy">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-sm font-bold text-navy hover:text-orange"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="button-primary flex-1 py-3 text-xs"
              >
                {added ? (
                  <>
                    <Check size={16} /> Added to Basket!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Basket
                  </>
                )}
              </button>
              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="button-secondary px-4 py-3 text-xs"
              >
                Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
