"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, Check, ChevronLeft, ChevronRight, Heart, Info, Minus, Package,
  Plus, RotateCcw, Share2, ShieldCheck, Sparkles, Star, Truck, X, Zap, ZoomIn,
} from "lucide-react";
import type { Product, ProductAttribute, ProductVariation } from "@/lib/types";
import { formatPKR } from "@/lib/catalog";
import { resolveProductGallery } from "@/lib/gallery-resolver";
import { useCart } from "./cart-provider";
import { ProductReviewsSection } from "./product-reviews-section";
import { DealsCountdown } from "./deals-countdown";

type Tab = "description" | "specifications" | "ingredients" | "care" | "delivery" | "returns" | "reviews" | "faqs";

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

export function ProductDetailClient({ product, reviews, faqs = [] }: { product: Product; reviews: any[]; faqs?: any[] }) {
  const { add } = useCart();
  const variations = useMemo(() => product.variations ?? [], [product]);

  const attributes = useMemo(() => {
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

  const [selection, setSelection] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("description");
  const [addedToast, setAddedToast] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const hasPreselectedRef = useRef<string | null>(null);

  // Pre-select first active variation on load (only once per product)
  useEffect(() => {
    if (product?.id && hasPreselectedRef.current !== product.id) {
      if (variations.length > 0 && attributes.length > 0) {
        hasPreselectedRef.current = product.id;
        const firstActive = variations.find((v) => v.status === "active" && v.attributes);
        if (firstActive && firstActive.attributes) {
          const initialSel: Record<string, string> = {};
          for (const attr of attributes) {
            const matchingKey = Object.keys(firstActive.attributes).find(
              (k) => normalizeKey(k) === normalizeKey(attr.slug) || normalizeKey(k) === normalizeKey(attr.name)
            );
            if (matchingKey) {
              initialSel[attr.slug] = normalizeKey(String(firstActive.attributes[matchingKey]));
            }
          }
          if (Object.keys(initialSel).length > 0) {
            setSelection(initialSel);
          }
        }
      }
    }
  }, [product?.id, variations, attributes]);

  const activeVariation = useMemo(() => {
    if (!variations.length || Object.keys(selection).length !== attributes.length) return null;
    return variations.find((variation) => variation.status === "active" && variationMatches(selection, variation)) ?? null;
  }, [attributes.length, selection, variations]);

  const compatibleVariations = useCallback((attributeSlug: string, value: string) => variations.some((variation) => {
    if (variation.status !== "active") return false;
    const nextSelection = { ...selection, [attributeSlug]: value };
    return variationMatches(nextSelection, variation);
  }), [selection, variations]);

  const activeImages = useMemo(() => {
    return resolveProductGallery(product, selection);
  }, [product, selection]);

  const activePrice = activeVariation?.regularPrice ?? product.price;
  const activeSalePrice = activeVariation?.salePrice ?? product.salePrice;
  const activeStock = activeVariation ? activeVariation.stockQuantity : product.stock;
  const activeSku = activeVariation?.sku ?? product.sku;
  const activeTitle = activeVariation?.title || product.name;
  const activeDescription = activeVariation?.description || product.description;
  const hasRequiredSelection = !variations.length || Object.keys(selection).length === attributes.length;
  const isOutOfStock = hasRequiredSelection && activeStock < 1;
  const isLowStock = !isOutOfStock && hasRequiredSelection && activeStock <= (activeVariation?.lowStockThreshold ?? product.lowStockThreshold ?? 5);
  const priceRange = useMemo(() => {
    if (!variations.length) return null;
    const prices = variations.filter((variation) => variation.status === "active").map((variation) => variation.salePrice ?? variation.regularPrice);
    if (!prices.length) return null;
    const min = Math.min(...prices); const max = Math.max(...prices);
    return min === max ? formatPKR(min) : `${formatPKR(min)} – ${formatPKR(max)}`;
  }, [variations]);

  useEffect(() => { setActiveImage(0); }, [activeImages]);
  useEffect(() => { setQuantity(1); }, [activeVariation?.id]);
  useEffect(() => {
    const el = thumbsRef.current?.children[activeImage] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeImage]);

  const prevImage = useCallback(() => setActiveImage((index) => (index - 1 + activeImages.length) % activeImages.length), [activeImages.length]);
  const nextImage = useCallback(() => setActiveImage((index) => (index + 1) % activeImages.length), [activeImages.length]);

  async function toggleWishlist() {
    try {
      const response = await fetch("/api/wishlist", { method: saved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product_id: product.id }) });
      if (response.ok) setSaved((current) => !current);
    } catch { setSaved((current) => !current); }
  }

  function addSelectedToCart(e?: React.MouseEvent) {
    if (attributes.length > 0) {
      const missingAttribute = attributes.find((attr) => !selection[attr.slug]);
      if (missingAttribute) {
        if (e) e.preventDefault();
        setValidationError(`Please select a ${missingAttribute.name} before adding this product to your cart.`);
        return false;
      }
    }

    if (variations.length > 0 && !activeVariation) {
      if (e) e.preventDefault();
      setValidationError("Selected combination is unavailable. Please choose another option.");
      return false;
    }

    if (isOutOfStock) {
      if (e) e.preventDefault();
      setValidationError("Selected product option is currently out of stock.");
      return false;
    }

    setValidationError(null);

    const variationAttrValues = activeVariation?.attributes
      ? Object.entries(activeVariation.attributes)
          .map(([attrSlug, valSlug]) => {
            const attrObj = attributes.find((a) => a.slug === attrSlug || a.name.toLowerCase() === attrSlug.toLowerCase());
            return attrObj ? attributeLabel(attrObj, valSlug) : valSlug;
          })
          .join(" · ")
      : undefined;

    const item = activeVariation ? {
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
    } : product;

    add(item, quantity);
    setAddedToast(true);
    window.setTimeout(() => setAddedToast(false), 2400);
    return true;
  }

  const avgRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : product.rating ?? 0;
  const discountPercent = activeSalePrice && activePrice > activeSalePrice ? Math.round(((activePrice - activeSalePrice) / activePrice) * 100) : null;
  const tabs: { id: Tab; label: string }[] = [
    { id: "description", label: "Description" }, { id: "specifications", label: "Specifications" },
    { id: "ingredients", label: "Ingredients" }, { id: "care", label: "Care" }, { id: "delivery", label: "Delivery" },
    { id: "returns", label: "Returns" }, { id: "reviews", label: `Reviews (${reviews.length})` }, { id: "faqs", label: "FAQs" },
  ];

  return (
    <div className="mt-8 md:mt-12">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)] lg:gap-16">
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="group relative aspect-square overflow-hidden rounded-[28px] border border-line/60 bg-cream-deep shadow-md" onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)} onTouchEnd={(event) => { if (touchStartX == null) return; const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 40) delta < 0 ? nextImage() : prevImage(); setTouchStartX(null); }} onClick={() => setZoomOpen(true)}>
            <SafeImage src={activeImages[activeImage] ?? product.image} alt={activeTitle} fill sizes="(max-width: 1024px) 100vw, 52vw" priority className="object-cover transition-opacity duration-300" />
            {discountPercent ? <span className="badge badge-sale absolute left-4 top-4 px-3 py-1.5 text-sm">{discountPercent}% OFF</span> : null}
            <div className="glass absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-navy opacity-0 transition-opacity group-hover:opacity-100"><ZoomIn size={13} /> Zoom</div>
            {activeImages.length > 1 ? <><button aria-label="Previous image" onClick={(event) => { event.stopPropagation(); prevImage(); }} className="glass absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-navy opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><ChevronLeft size={18} /></button><button aria-label="Next image" onClick={(event) => { event.stopPropagation(); nextImage(); }} className="glass absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2.5 text-navy opacity-0 shadow-sm transition-opacity group-hover:opacity-100"><ChevronRight size={18} /></button></> : null}
          </div>
          {activeImages.length > 1 ? <div ref={thumbsRef} className="flex gap-2.5 overflow-x-auto pb-1">{activeImages.map((image, index) => <button key={`${image}-${index}`} aria-label={`View image ${index + 1}`} onClick={() => setActiveImage(index)} className={`relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${index === activeImage ? "border-orange shadow-md" : "border-line/60 hover:border-orange/50"}`}><SafeImage src={image} alt={`${activeTitle} view ${index + 1}`} width={150} height={150} quality={70} sizes="72px" className="object-cover" /></button>)}</div> : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4"><p className="eyebrow">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p><button onClick={toggleWishlist} aria-label="Save product" className={`rounded-full border p-3 transition ${saved ? "border-orange bg-orange/10 text-orange" : "border-line bg-white text-navy hover:border-orange hover:text-orange"}`}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button></div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-navy sm:text-5xl">{activeTitle}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3"><span className="flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange/10 px-3 py-1.5 text-xs font-bold text-navy"><Star size={13} fill="currentColor" className="text-orange" /> {avgRating ? avgRating.toFixed(1) : "New"}</span><button onClick={() => setActiveTab("reviews")} className="text-xs font-bold text-muted hover:text-orange">{reviews.length} reviews</button><span className="text-line">•</span>{!hasRequiredSelection ? <span className="text-xs font-bold text-amber-600">Select options to check availability</span> : isOutOfStock ? <span className="text-xs font-bold text-red-500">Out of stock</span> : isLowStock ? <span className="text-xs font-bold text-amber-600">Only {activeStock} left</span> : <span className="flex items-center gap-1.5 text-xs font-bold text-green"><ShieldCheck size={13} /> In stock</span>}</div>

          {/* Price & Special Deal Block */}
          {activeSalePrice ? (
            <div className="mt-6 rounded-2xl border border-orange/40 bg-orange/10 p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange/20 pb-3 mb-3">
                <span className="badge badge-sale flex items-center gap-1 shadow-xs">
                  <Zap size={12} className="fill-current" /> Special Deal
                </span>
                <DealsCountdown
                  targetDate={(activeVariation as any)?.dealInfo?.endAt ?? (product as any)?.dealInfo?.endAt}
                  label="Deal ends in"
                  compact
                />
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold text-navy">
                  {!hasRequiredSelection && priceRange ? `From ${priceRange}` : formatPKR(activeSalePrice)}
                </span>
                <span className="text-lg font-medium text-muted line-through">
                  {formatPKR(activePrice)}
                </span>
                {discountPercent ? (
                  <span className="rounded-full bg-green/15 px-2.5 py-0.5 text-xs font-black text-green-dark">
                    Save {discountPercent}% ({formatPKR(activePrice - activeSalePrice)})
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs text-muted">Taxes included · Free delivery on orders over Rs. 3,000</p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-line/70 bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold text-navy">
                  {!hasRequiredSelection && priceRange ? `From ${priceRange}` : formatPKR(activePrice)}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted">Taxes included · Free delivery on orders over Rs. 3,000</p>
            </div>
          )}

          {attributes.length > 0 ? (
            <div className="mt-6 grid gap-5">
              <div className="flex items-center justify-between border-b border-line/60 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-muted">Product Options</span>
                {Object.keys(selection).length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setSelection({}); setValidationError(null); }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline"
                  >
                    <RotateCcw size={12} /> Clear all selections
                  </button>
                )}
              </div>

              {attributes.map((attribute) => (
                <div key={attribute.slug}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-navy">{attribute.name}</span>
                    {selection[attribute.slug] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange">
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
                      <span className="text-xs font-semibold text-amber-600">Choose option *</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {attribute.values
                      .filter((value) => value.isActive !== false)
                      .map((value) => {
                        const selected = selection[attribute.slug] === value.slug;
                        const available = compatibleVariations(attribute.slug, value.slug);
                        const imageSwatch = (value as any).swatchImage;

                        const handleOptionClick = () => {
                          setValidationError(null);
                          setSelection((current) => {
                            if (current[attribute.slug] === value.slug) {
                              const next = { ...current };
                              delete next[attribute.slug];
                              return next;
                            }
                            return { ...current, [attribute.slug]: value.slug };
                          });
                        };

                        if (attribute.displayType === "radio") {
                          return (
                            <button
                              key={value.slug}
                              disabled={!available}
                              onClick={handleOptionClick}
                              className={`relative flex items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 text-xs font-bold transition ${
                                selected
                                  ? "border-orange bg-orange/10 text-orange shadow-xs"
                                  : "border-line bg-white text-navy hover:border-orange/50"
                              } ${!available ? "cursor-not-allowed opacity-35 line-through" : ""}`}
                            >
                              <span
                                className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                                  selected ? "border-orange bg-orange text-white" : "border-line"
                                }`}
                              >
                                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                              {value.label}
                            </button>
                          );
                        }

                        return (
                          <button
                            key={value.slug}
                            disabled={!available}
                            onClick={handleOptionClick}
                            className={`relative flex min-h-11 items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-bold transition ${
                              selected
                                ? "border-orange bg-orange/10 text-orange shadow-xs"
                                : "border-line bg-white text-navy hover:border-orange/60"
                            } ${!available ? "cursor-not-allowed opacity-35 line-through" : ""}`}
                          >
                            {attribute.displayType === "color" ? (
                              <span
                                className="h-5 w-5 rounded-full border border-black/15 shadow-xs"
                                style={{ backgroundColor: (value as any).swatchColor ?? "#e6ddd0" }}
                                title={value.label}
                              />
                            ) : attribute.displayType === "image" && imageSwatch ? (
                              <span className="relative h-6 w-6 overflow-hidden rounded-md border border-line">
                                <SafeImage src={imageSwatch} alt="" fill sizes="24px" className="object-cover" />
                              </span>
                            ) : null}
                            {value.label}
                            {selected ? <Check size={14} strokeWidth={3} /> : null}
                            {!available ? (
                              <span className="absolute inset-x-1/2 top-1/2 h-px w-7 -translate-x-1/2 rotate-45 bg-red-400" />
                            ) : null}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <p className="mt-6 text-[15px] font-medium leading-relaxed text-muted">{activeDescription}</p>

          {validationError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-xs flex items-center gap-2">
              <Info size={16} className="shrink-0 text-red-600" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex items-center rounded-2xl border-2 border-line bg-white px-2 shadow-xs">
                <button disabled={isOutOfStock || quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))} className="p-3 text-navy disabled:opacity-30" aria-label="Decrease quantity"><Minus size={15} /></button>
                <span className="w-8 text-center font-extrabold text-navy">{quantity}</span>
                <button disabled={isOutOfStock || (hasRequiredSelection && quantity >= activeStock)} onClick={() => setQuantity((current) => Math.min(activeStock, current + 1))} className="p-3 text-navy disabled:opacity-30" aria-label="Increase quantity"><Plus size={15} /></button>
              </div>
              <button onClick={(e) => addSelectedToCart(e)} className="button-primary flex-1">
                {addedToast ? <><Check size={17} /> Added to basket</> : <><Plus size={17} /> Add to basket</>}
              </button>
              <button onClick={() => navigator.share?.({ title: activeTitle, url: window.location.href })} className="button-secondary px-3" aria-label="Share product"><Share2 size={17} /></button>
            </div>
            <Link
              href="/checkout"
              onClick={(e) => {
                const ok = addSelectedToCart(e);
                if (!ok) e.preventDefault();
              }}
              className="button-secondary w-full"
            >
              <Sparkles size={15} /> Buy now · Express checkout <ArrowRight size={15} />
            </Link>
          </div>
          {addedToast ? <div className="mt-3 flex items-center gap-3 rounded-xl border border-green/25 bg-green-light p-3.5 text-xs font-bold text-green"><Check size={15} /> Added {quantity} × {activeTitle}<Link href="/cart" className="ml-auto underline">View basket →</Link></div> : null}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-line/60 pt-6">{[{ icon: Truck, label: "Same-day delivery", sub: "Order before 1 PM" }, { icon: ShieldCheck, label: "Secure checkout", sub: "SSL encrypted" }, { icon: RotateCcw, label: "Easy returns", sub: "Within 24 hours" }].map(({ icon: Icon, label, sub }) => <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-cream-deep/60 p-3 text-center"><Icon size={18} className="text-orange" /><span className="text-[11px] font-bold leading-tight text-navy">{label}</span><span className="text-[10px] text-muted">{sub}</span></div>)}</div><p className="mt-4 flex items-center gap-2 text-xs text-muted"><Package size={12} /><strong className="text-navy">SKU:</strong> {activeSku ?? "Assigned after selection"}</p>
        </div>
      </div>

      <section className="mt-16 rounded-3xl border border-line/60 bg-white p-5 shadow-xs sm:p-8"><div className="flex gap-6 overflow-x-auto border-b border-line">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative whitespace-nowrap pb-4 text-sm font-bold ${activeTab === tab.id ? "text-orange after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-orange" : "text-muted hover:text-navy"}`}>{tab.label}</button>)}</div><div className="mt-7 max-w-3xl text-sm font-medium leading-relaxed text-muted">{activeTab === "description" && <p>{activeDescription}</p>}{activeTab === "specifications" && <div className="grid gap-2">{Object.entries(activeVariation?.specifications ?? product.specifications ?? {}).map(([key, value]) => <div key={key} className="flex justify-between gap-6 border-b border-line/60 py-2"><span className="font-bold text-navy">{key}</span><span>{String(value)}</span></div>)}</div>}{activeTab === "ingredients" && <p>{product.ingredients || "Ingredients information will be available soon."}</p>}{activeTab === "care" && <p>{product.careInstructions || "Care instructions will be available soon."}</p>}{activeTab === "delivery" && <p>{product.deliveryInformation || "Same-day delivery is available across Lahore for orders placed before 1:00 PM."}</p>}{activeTab === "returns" && <p>{product.returnPolicy || "Contact our support team within 24 hours of delivery for return assistance."}</p>}{activeTab === "reviews" && <ProductReviewsSection product={product} reviews={reviews} />}{activeTab === "faqs" && <div className="grid gap-3">{faqs.length ? faqs.map((faq) => <details key={faq.id} className="rounded-xl border border-line/70 p-4"><summary className="cursor-pointer font-bold text-navy">{faq.question}</summary><p className="mt-3">{faq.answer}</p></details>) : <p>Frequently asked questions will be available soon.</p>}</div>}</div></section>

      {zoomOpen ? <div className="modal-overlay" onClick={() => setZoomOpen(false)}><div className="relative w-full max-w-4xl" onClick={(event) => event.stopPropagation()}><button onClick={() => setZoomOpen(false)} className="absolute -top-12 right-0 rounded-full bg-white/20 p-2 text-white" aria-label="Close zoom"><X size={20} /></button><div className="relative aspect-square w-full overflow-hidden rounded-3xl"><SafeImage src={activeImages[activeImage] ?? product.image} alt={activeTitle} fill sizes="90vw" className="object-contain" /></div></div></div> : null}
    </div>
  );

}
