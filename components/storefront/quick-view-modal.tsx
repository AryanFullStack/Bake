"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Info, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Star, X } from "lucide-react";
import type { Product, ProductAttribute, ProductVariation } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { resolveProductGallery } from "@/lib/gallery-resolver";
import { useCart } from "./cart-provider";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

function normalizeKey(str: string) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
}

function variationMatches(selection: Record<string, string>, variation: ProductVariation) {
  if (!variation.attributes) return false;
  const varAttrs = variation.attributes;
  const varKeys = Object.keys(varAttrs);

  return Object.entries(selection).every(([selKey, selVal]) => {
    const normSelKey = normalizeKey(selKey);
    const normSelVal = normalizeKey(selVal);

    const matchingKey = varKeys.find((k) => normalizeKey(k) === normSelKey);
    if (!matchingKey) return false;

    const varVal = String(varAttrs[matchingKey]);
    return normalizeKey(varVal) === normSelVal || varVal === selVal;
  });
}

function attributeLabel(attribute: ProductAttribute, value: string) {
  const normVal = normalizeKey(value);
  const matched = attribute.values.find(
    (option) => normalizeKey(option.slug) === normVal || normalizeKey(option.label) === normVal
  );
  return matched?.label ?? value;
}

export function QuickViewModal({ product: initialProduct, onClose }: QuickViewModalProps) {
  const { add } = useCart();
  const [fullProduct, setFullProduct] = useState<Product | null>(initialProduct);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Sync initial product and fetch full details if attributes/variations are missing
  useEffect(() => {
    setMounted(true);
    setFullProduct(initialProduct);
    setSelection({});
    setValidationError(null);
    setQuantity(1);
    setActiveImage(0);

    if (initialProduct && initialProduct.productType === "variable") {
      if (!initialProduct.attributes?.length || !initialProduct.variations?.length) {
        setLoadingDetails(true);
        fetch(`/api/products/quick-view?id=${initialProduct.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.product) {
              setFullProduct(data.product);
            }
          })
          .catch((err) => console.error("Error loading product variations", err))
          .finally(() => setLoadingDetails(false));
      }
    }

    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialProduct, onClose]);

  const product = fullProduct ?? initialProduct;

  const variations = useMemo(() => product?.variations ?? [], [product]);

  const attributes = useMemo(() => {
    if (!product) return [];
    if (product.attributes?.length) return product.attributes;

    const attrMap = new Map<string, Set<string>>();
    for (const v of variations) {
      if (!v.attributes) continue;
      for (const [k, val] of Object.entries(v.attributes)) {
        if (!val) continue;
        const normKey = k.trim();
        if (!attrMap.has(normKey)) {
          attrMap.set(normKey, new Set());
        }
        attrMap.get(normKey)!.add(String(val).trim());
      }
    }

    return Array.from(attrMap.entries()).map(([name, valuesSet], index) => {
      const slug = normalizeKey(name);
      return {
        id: `attr-${index}`,
        name: name,
        slug: slug,
        displayType: name.toLowerCase().includes("color") ? ("color" as const) : ("button" as const),
        values: Array.from(valuesSet).map((val) => ({
          label: val,
          slug: normalizeKey(val),
          isActive: true,
        })),
      };
    });
  }, [product, variations]);



  const activeVariation = useMemo(() => {
    if (!variations.length || Object.keys(selection).length !== attributes.length) return null;
    return variations.find((v) => v.status === "active" && variationMatches(selection, v)) ?? null;
  }, [attributes.length, selection, variations]);

  const compatibleVariations = useCallback(
    (attributeSlug: string, valueSlug: string) =>
      variations.some((variation) => {
        if (variation.status !== "active") return false;
        const nextSelection = { ...selection, [attributeSlug]: valueSlug };
        return variationMatches(nextSelection, variation);
      }),
    [selection, variations]
  );

  const activeImages = useMemo(() => {
    if (!product) return [];
    return resolveProductGallery(product, selection);
  }, [product, selection]);

  const activePrice = activeVariation?.regularPrice ?? product?.price ?? 0;
  const activeSalePrice = activeVariation?.salePrice ?? product?.salePrice;
  const activeStock = activeVariation ? activeVariation.stockQuantity : product?.stock ?? 0;
  const activeSku = activeVariation?.sku ?? product?.sku;
  const activeTitle = activeVariation?.title || product?.name || "Product";
  const activeDescription = activeVariation?.description || product?.description;
  const hasRequiredSelection = !variations.length || Object.keys(selection).length === attributes.length;
  const isOutOfStock = hasRequiredSelection && activeStock < 1;

  const priceRange = useMemo(() => {
    if (!variations.length) return null;
    const prices = variations.filter((v) => v.status === "active").map((v) => v.salePrice ?? v.regularPrice);
    if (!prices.length) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatPKR(min) : `${formatPKR(min)} – ${formatPKR(max)}`;
  }, [variations]);

  if (!product || !mounted) return null;

  function handleAddToCart() {
    if (!product) return;

    if (attributes.length > 0) {
      const missingAttribute = attributes.find((attr) => !selection[attr.slug]);
      if (missingAttribute) {
        setValidationError(`Please select a ${missingAttribute.name} before adding this product to your cart.`);
        return;
      }
    }

    if (variations.length > 0 && !activeVariation) {
      setValidationError("Selected combination is unavailable. Please select another option.");
      return;
    }

    if (isOutOfStock) {
      setValidationError("Selected option is currently out of stock.");
      return;
    }

    setValidationError(null);

    const variationAttrValues = activeVariation?.attributes
      ? Object.entries(activeVariation.attributes)
          .map(([attrKey, valVal]) => {
            const attrObj = attributes.find(
              (a) => normalizeKey(a.slug) === normalizeKey(attrKey) || normalizeKey(a.name) === normalizeKey(attrKey)
            );
            return attrObj ? attributeLabel(attrObj, String(valVal)) : String(valVal);
          })
          .join(" · ")
      : undefined;

    const item = activeVariation
      ? {
          ...product,
          name: product.name,
          variationTitle: activeTitle !== product.name ? activeTitle : variationAttrValues || activeTitle,
          description: activeDescription,
          price: activeVariation.regularPrice,
          salePrice: activeVariation.salePrice,
          sku: activeVariation.sku ?? product.sku,
          image: activeImages[0] ?? product.image,
          variationId: activeVariation.id,
          variationAttributes: activeVariation.attributes,
        }
      : product;

    add(item as any, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2400);
  }

  return createPortal(
    <div className="modal-overlay animate-fade-in z-[9999]" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-navy hover:bg-cream hover:text-orange transition-colors z-20 shadow-xs"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] items-start">
          {/* Gallery Side */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-deep border border-line">
              <SafeImage
                src={activeImages[activeImage] ?? product.image}
                alt={activeTitle}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
              {activeImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((idx) => (idx - 1 + activeImages.length) % activeImages.length)}
                    className="glass absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-navy shadow-sm"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveImage((idx) => (idx + 1) % activeImages.length)}
                    className="glass absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-navy shadow-sm"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>

            {activeImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    onClick={() => setActiveImage(index)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      index === activeImage ? "border-orange shadow-xs" : "border-line/60 hover:border-orange/50"
                    }`}
                  >
                    <SafeImage src={img} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Option Selector Side */}
          <div className="flex flex-col">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange">
              {product.category}
            </span>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mt-1 leading-snug">
              {activeTitle}
            </h2>

            {/* Rating & Stock */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-bold text-navy">
                <Star size={13} fill="currentColor" className="text-orange" />
                {product.rating ? product.rating.toFixed(1) : "New"}
                {product.reviews > 0 && <span className="text-muted font-normal">({product.reviews})</span>}
              </span>
              <span className="text-line">•</span>
              {!hasRequiredSelection ? (
                <span className="font-semibold text-amber-600">Select options to check availability</span>
              ) : isOutOfStock ? (
                <span className="font-bold text-red-500">Out of stock</span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-green">
                  <ShieldCheck size={13} /> In stock ({activeStock})
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-4 rounded-2xl border border-line/70 bg-cream/30 p-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-extrabold text-navy">
                  {!hasRequiredSelection && priceRange ? `From ${priceRange}` : formatPKR(activeSalePrice ?? activePrice)}
                </span>
                {hasRequiredSelection && activeSalePrice && (
                  <span className="text-sm font-semibold text-muted line-through">
                    {formatPKR(activePrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Loading Indicator */}
            {loadingDetails && (
              <div className="mt-3 text-xs font-bold text-orange animate-pulse">
                Loading product options & variations...
              </div>
            )}

            {/* Attributes List */}
            {attributes.length > 0 && (
              <div className="mt-5 grid gap-4 border-t border-line/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
                    Select Product Options:
                  </span>
                  {Object.keys(selection).length > 0 && (
                    <button
                      type="button"
                      onClick={() => { setSelection({}); setValidationError(null); }}
                      className="text-[11px] font-bold text-orange hover:underline flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Clear
                    </button>
                  )}
                </div>

                {attributes.map((attribute) => (
                  <div key={attribute.slug}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">{attribute.name}</span>
                      {selection[attribute.slug] ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-orange">
                            {attributeLabel(attribute, selection[attribute.slug])}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelection((current) => {
                                const next = { ...current };
                                delete next[attribute.slug];
                                return next;
                              });
                              setValidationError(null);
                            }}
                            className="text-[10px] font-semibold text-muted hover:text-red-500"
                          >
                            (Deselect)
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600">Choose option *</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {attribute.values
                        .filter((v) => v.isActive !== false)
                        .map((value) => {
                          const selected =
                            normalizeKey(selection[attribute.slug]) === normalizeKey(value.slug) ||
                            normalizeKey(selection[attribute.slug]) === normalizeKey(value.label);

                          const available = compatibleVariations(attribute.slug, value.slug);

                          const handleClick = () => {
                            setValidationError(null);
                            setSelection((current) => {
                              if (normalizeKey(current[attribute.slug]) === normalizeKey(value.slug)) {
                                const next = { ...current };
                                delete next[attribute.slug];
                                return next;
                              }
                              return { ...current, [attribute.slug]: value.slug };
                            });
                          };

                          return (
                            <button
                              key={value.slug}
                              type="button"
                              disabled={!available && variations.length > 0}
                              onClick={handleClick}
                              className={`relative flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition ${
                                selected
                                  ? "border-orange bg-orange/10 text-orange shadow-xs ring-1 ring-orange/30"
                                  : "border-line bg-white text-navy hover:border-orange/50"
                              } ${!available && variations.length > 0 ? "cursor-not-allowed opacity-35 line-through" : ""}`}
                            >
                              {attribute.displayType === "color" && (
                                <span
                                  className="h-4 w-4 rounded-full border border-black/15 shadow-xs"
                                  style={{ backgroundColor: (value as any).swatchColor ?? "#e6ddd0" }}
                                />
                              )}
                              <span>{value.label}</span>
                              {selected && <Check size={13} strokeWidth={3} />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Validation Error Alert */}
            {validationError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 shadow-xs flex items-center gap-2">
                <Info size={15} className="shrink-0 text-red-600" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Quantity Controls */}
            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs font-bold text-navy">Qty:</span>
              <div className="flex items-center rounded-xl border border-line bg-cream/40 px-1">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2 text-navy hover:text-orange disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-extrabold text-navy">{quantity}</span>
                <button
                  type="button"
                  disabled={hasRequiredSelection && quantity >= activeStock}
                  onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                  className="p-2 text-navy hover:text-orange disabled:opacity-30"
                >
                  <Plus size={14} />
                </button>
              </div>
              {activeSku && (
                <span className="ml-auto text-[11px] font-mono text-muted">SKU: {activeSku}</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="button-primary flex-1 py-3 text-xs font-extrabold"
                >
                  {addedToast ? (
                    <>
                      <Check size={16} /> Added to Basket
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} /> Add to Basket
                    </>
                  )}
                </button>
              </div>

              <Link
                href={`/products/${product.slug}`}
                onClick={onClose}
                className="button-secondary text-center py-2.5 text-xs font-bold w-full"
              >
                View Full Specifications & Reviews →
              </Link>
            </div>

            {addedToast && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-green/25 bg-green-light p-3 text-xs font-bold text-green">
                <Check size={15} /> Added {quantity} × {activeTitle}
                <Link href="/cart" onClick={onClose} className="ml-auto underline">
                  View Basket →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
