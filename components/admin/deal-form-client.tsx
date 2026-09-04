"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Eye,
  Layers, Plus, RefreshCw, Search, Sparkles, Tag, Trash2, X,
  XCircle, AlertTriangle, Layers3, Check, DollarSign, Percent,
} from "lucide-react";
import { formatPKR, publicStorageUrl, slugify } from "@/lib/catalog";
import type { Deal, DealProduct, DealType } from "@/lib/types";

interface DealFormClientProps {
  initialDeal?: Deal | null;
  allProducts?: any[];
  allCategories?: any[];
  activeDeals?: Deal[];
}

export function DealFormClient({
  initialDeal,
  allProducts = [],
  allCategories = [],
  activeDeals = [],
}: DealFormClientProps) {
  const router = useRouter();
  const isEditing = Boolean(initialDeal?.id);

  // Form State
  const [name, setName] = useState(initialDeal?.name || "");
  const [slug, setSlug] = useState(initialDeal?.slug || "");
  const [description, setDescription] = useState(initialDeal?.description || "");
  const [shortDescription, setShortDescription] = useState(initialDeal?.short_description || "");
  const [dealType, setDealType] = useState<DealType>(initialDeal?.deal_type || "percentage");
  const [discountValue, setDiscountValue] = useState<number | "">(initialDeal?.discount_value ?? 20);
  const [badgeText, setBadgeText] = useState(initialDeal?.badge_text || "🔥 Limited Offer");
  const [bannerImage, setBannerImage] = useState(initialDeal?.banner_image || "");
  const [mobileBannerImage, setMobileBannerImage] = useState(initialDeal?.mobile_banner_image || "");
  const [priority, setPriority] = useState<number>(initialDeal?.priority ?? 1);
  const [isActive, setIsActive] = useState<boolean>(initialDeal?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialDeal?.is_featured ?? false);

  // Date & Time Scheduling Default
  const defaultStart = initialDeal?.start_at
    ? new Date(initialDeal.start_at).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);
  const defaultEnd = initialDeal?.end_at
    ? new Date(initialDeal.end_at).toISOString().slice(0, 16)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);

  // Optional Deal Limits
  const [maxQtyCustomer, setMaxQtyCustomer] = useState<number | "">(initialDeal?.max_quantity_per_customer ?? "");
  const [totalQuantity, setTotalQuantity] = useState<number | "">(initialDeal?.total_quantity ?? "");
  const [minQuantity, setMinQuantity] = useState<number | "">(initialDeal?.min_quantity ?? "");
  const [minCartAmount, setMinCartAmount] = useState<number | "">(initialDeal?.min_cart_amount ?? "");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | "">(initialDeal?.max_discount_amount ?? "");

  // Selected Products on Deal
  const [selectedDealProducts, setSelectedDealProducts] = useState<
    Array<{
      product_id: string;
      variation_id?: string | null;
      custom_deal_price?: number | null;
      productName: string;
      variationName?: string;
      regularPrice: number;
      image?: string;
      category?: string;
    }>
  >(() => {
    if (!initialDeal?.deal_products) return [];
    return initialDeal.deal_products.map((dp: any) => {
      const p = allProducts.find((item) => item.id === dp.product_id) || dp.products;
      let varObj = null;
      if (dp.variation_id && p?.product_variations) {
        varObj = p.product_variations.find((v: any) => v.id === dp.variation_id) || dp.product_variations;
      }
      return {
        product_id: dp.product_id,
        variation_id: dp.variation_id || null,
        custom_deal_price: dp.custom_deal_price != null ? Number(dp.custom_deal_price) : null,
        productName: p?.name || "Selected Product",
        variationName: varObj?.name || (varObj?.attributes ? Object.values(varObj.attributes).join(" / ") : undefined),
        regularPrice: varObj ? Number(varObj.regular_price ?? varObj.price ?? 0) : Number(p?.price ?? 0),
        image: varObj?.featured_image || p?.featured_image || p?.image,
        category: p?.categories?.name || p?.category,
      };
    });
  });

  // Selector Modal & Preview Mode States
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [searchModalQuery, setSearchModalQuery] = useState("");
  const [modalCategory, setModalCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  // Products List State with API Fallback
  const [productsList, setProductsList] = useState<any[]>(allProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      setProductsList(allProducts);
    }
  }, [allProducts]);

  const fetchCatalogProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/deals/products");
      const json = await res.json();
      if (json.success && Array.isArray(json.products)) {
        setProductsList(json.products);
      }
    } catch (err) {
      console.error("Failed to fetch catalog products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if ((productsList.length === 0 || isSelectorOpen) && !loadingProducts && productsList.length === 0) {
      fetchCatalogProducts();
    }
  }, [isSelectorOpen, productsList.length, loadingProducts]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Auto-generate slug from name if not editing
  useEffect(() => {
    if (!isEditing && name) {
      setSlug(slugify(name));
    }
  }, [name, isEditing]);

  // Check if product is in another active/scheduled deal
  const getExistingProductDealWarning = (productId: string, variationId?: string | null) => {
    for (const deal of activeDeals) {
      if (isEditing && deal.id === initialDeal?.id) continue;
      const match = deal.deal_products?.find(
        (dp) => dp.product_id === productId && (!dp.variation_id || dp.variation_id === variationId)
      );
      if (match) {
        return `Already included in active deal: "${deal.name}" (Priority ${deal.priority})`;
      }
    }
    return null;
  };

  // Calculate live preview price for a product/variation
  const calculatePreviewPrice = (regularPrice: number, customDealPrice?: number | null) => {
    if (dealType === "percentage") {
      const pct = Math.min(100, Math.max(0, Number(discountValue || 0)));
      let discount = (regularPrice * pct) / 100;
      if (maxDiscountAmount && Number(maxDiscountAmount) > 0) {
        discount = Math.min(discount, Number(maxDiscountAmount));
      }
      const dealP = Math.max(0, regularPrice - discount);
      return { dealPrice: dealP, discountAmount: regularPrice - dealP };
    }
    if (dealType === "fixed") {
      const discount = Math.max(0, Number(discountValue || 0));
      const dealP = Math.max(0, regularPrice - discount);
      return { dealPrice: dealP, discountAmount: regularPrice - dealP };
    }
    if (dealType === "sale_price") {
      const dealP = customDealPrice != null ? customDealPrice : Math.max(0, Number(discountValue || 0));
      return { dealPrice: dealP, discountAmount: Math.max(0, regularPrice - dealP) };
    }
    const pct = Math.min(100, Math.max(0, Number(discountValue || 25)));
    const dealP = regularPrice * (1 - pct / 100);
    return { dealPrice: Math.round(dealP), discountAmount: Math.round(regularPrice - dealP) };
  };

  // Product Selection Handlers
  const addProductToDeal = (p: any, variation?: any) => {
    const varId = variation?.id || null;
    const exists = selectedDealProducts.some(
      (item) => item.product_id === p.id && item.variation_id === varId
    );
    if (exists) return;

    const regPrice = variation ? Number(variation.regular_price ?? variation.price ?? p.price) : Number(p.price);
    const varName = variation?.name || (variation?.attributes ? Object.values(variation.attributes).join(" / ") : undefined);

    setSelectedDealProducts((prev) => [
      ...prev,
      {
        product_id: p.id,
        variation_id: varId,
        custom_deal_price: dealType === "sale_price" ? regPrice * 0.8 : null,
        productName: p.name,
        variationName: varName,
        regularPrice: regPrice,
        image: variation?.featured_image || p.featured_image || p.image,
        category: p.categories?.name || p.category,
      },
    ]);
  };

  const removeProductFromDeal = (productId: string, variationId?: string | null) => {
    setSelectedDealProducts((prev) =>
      prev.filter((item) => !(item.product_id === productId && item.variation_id === variationId))
    );
  };

  const handleSelectAllFiltered = (filtered: any[]) => {
    filtered.forEach((p) => {
      if (p.product_type === "variable" && Array.isArray(p.product_variations) && p.product_variations.length > 0) {
        p.product_variations.forEach((v: any) => addProductToDeal(p, v));
      } else {
        addProductToDeal(p);
      }
    });
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startAt || !endAt) {
      showToast("Please fill in deal name and schedule dates.", "error");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      showToast("End date/time must be after start date/time.", "error");
      return;
    }
    if (selectedDealProducts.length === 0) {
      showToast("Please add at least one product to this deal.", "error");
      return;
    }

    setSubmitting(true);

    const payload = {
      name,
      slug,
      description,
      short_description: shortDescription,
      deal_type: dealType,
      discount_value: Number(discountValue || 0),
      badge_text: badgeText,
      banner_image: bannerImage || null,
      mobile_banner_image: mobileBannerImage || null,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      priority: Number(priority || 1),
      is_active: isActive,
      is_featured: isFeatured,
      max_quantity_per_customer: maxQtyCustomer ? Number(maxQtyCustomer) : null,
      total_quantity: totalQuantity ? Number(totalQuantity) : null,
      min_quantity: minQuantity ? Number(minQuantity) : null,
      min_cart_amount: minCartAmount ? Number(minCartAmount) : null,
      max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      deal_products: selectedDealProducts.map((item) => ({
        product_id: item.product_id,
        variation_id: item.variation_id || null,
        custom_deal_price: item.custom_deal_price != null ? Number(item.custom_deal_price) : null,
      })),
    };

    try {
      const url = isEditing && initialDeal ? `/api/admin/deals/${initialDeal.id}` : `/api/admin/deals`;
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        showToast(isEditing ? "Deal updated successfully!" : "Deal scheduled & created successfully!");
        setTimeout(() => router.push("/admin/deals"), 1000);
      } else {
        showToast(json.error || "Failed to save deal.", "error");
      }
    } catch {
      showToast("Network error saving deal.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products for selection modal
  const filteredModalProducts = productsList.filter((p) => {
    if (searchModalQuery) {
      const q = searchModalQuery.toLowerCase();
      const mName = p.name?.toLowerCase().includes(q);
      const mSku = p.sku?.toLowerCase().includes(q);
      const mVarSku = p.product_variations?.some((v: any) => v.sku?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q));
      if (!mName && !mSku && !mVarSku) return false;
    }
    if (modalCategory) {
      const catObj = Array.isArray(p.categories) ? p.categories[0] : p.categories;
      const matchId = p.category_id === modalCategory || p.subcategory_id === modalCategory || catObj?.id === modalCategory;
      const matchSlug = catObj?.slug === modalCategory;
      const matchName = catObj?.name?.toLowerCase() === modalCategory.toLowerCase();
      if (!matchId && !matchSlug && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
      {/* ── Header ────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-admin-border/60 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deals"
            className="rounded-xl border border-admin-border bg-white p-2.5 text-admin-muted hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">
              {isEditing && initialDeal ? `Edit Deal: ${initialDeal.name}` : "Create New Promotion Deal"}
            </h1>
            <p className="text-xs text-admin-muted mt-0.5">
              Set up promotion details, discount rules, time windows, and select target products.
            </p>
          </div>
        </div>

        {/* View Toggle (Edit vs Customer Preview) */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-admin-border shadow-xs">
          <button
            type="button"
            onClick={() => setPreviewMode("edit")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              previewMode === "edit" ? "bg-navy text-white shadow-xs" : "text-admin-muted hover:text-navy"
            }`}
          >
            <Tag size={13} /> Edit Campaign
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("preview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              previewMode === "preview" ? "bg-orange text-white shadow-xs" : "text-admin-muted hover:text-navy"
            }`}
          >
            <Eye size={13} /> Customer Preview Mode
          </button>
        </div>
      </div>

      {/* ── CUSTOMER PREVIEW MODE ─────────────────────── */}
      {previewMode === "preview" ? (
        <div className="space-y-8 animate-fade-in">
          <div className="rounded-2xl border border-orange/30 bg-orange/10 p-4 text-xs text-navy flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <Eye className="text-orange" size={16} /> Customer Storefront Live Preview
            </span>
            <span className="text-[11px] text-muted">Previewing live layout rendering for "{name || 'Untitled Deal'}"</span>
          </div>

          {/* 1. Public Deal Page Hero Mockup */}
          <div className="rounded-3xl border border-navy/20 bg-navy text-white p-8 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="deal-badge mb-3 inline-block">{badgeText || "🔥 Special Deal"}</span>
              <h2 className="font-display text-3xl font-extrabold text-white">{name || "Weekend Mega Sale"}</h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80">{shortDescription || "Limited-time offer on selected bakery favourites."}</p>
              
              <div className="mt-6 flex items-center gap-4">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                  <span className="text-[10px] uppercase font-bold text-white/60 block mb-1">Deal Ends In</span>
                  <div className="flex items-center gap-2 text-orange font-mono font-black text-lg">
                    <span>01</span>:<span>14</span>:<span>35</span>:<span>22</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-orange/40 bg-orange/20 p-3">
                  <span className="text-[10px] uppercase font-bold text-white/70 block mb-1">Discount</span>
                  <span className="font-black text-orange text-lg">
                    {dealType === "percentage" ? `${discountValue}% OFF` : dealType === "fixed" ? `${formatPKR(discountValue)} OFF` : "Deal Price"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Customer Product Cards Mockup */}
          <div>
            <h3 className="text-sm font-bold text-navy mb-4">Storefront Product Cards Preview ({selectedDealProducts.length} Items)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedDealProducts.map((item) => {
                const { dealPrice, discountAmount } = calculatePreviewPrice(item.regularPrice, item.custom_deal_price);
                const pct = item.regularPrice > 0 ? Math.round((discountAmount / item.regularPrice) * 100) : 0;
                return (
                  <div key={item.product_id + (item.variation_id || "")} className="card p-3 border border-line bg-white shadow-xs">
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-cream-deep mb-3">
                      <Image
                        src={item.image ? publicStorageUrl(item.image) : "/placeholder-bake.svg"}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-orange px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                        -{pct}%
                      </span>
                    </div>
                    <p className="text-xs font-bold text-navy truncate">{item.productName}</p>
                    {item.variationName && <p className="text-[10px] text-muted truncate">{item.variationName}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-navy">{formatPKR(dealPrice)}</span>
                        <span className="block text-[10px] text-muted line-through">{formatPKR(item.regularPrice)}</span>
                      </div>
                      <span className="rounded-full bg-green/15 px-2 py-0.5 text-[9.5px] font-extrabold text-green-dark">
                        Save {formatPKR(discountAmount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── EDIT CAMPAIGN FORM ────────────────────────── */
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Information */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-admin-border pb-3">
              <Tag size={16} className="text-orange" /> Basic Campaign Details
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Deal Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekend Mega Sale, Eid Special"
                  className="field-shell"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Deal Slug *</label>
                <input
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="e.g. weekend-mega-sale"
                  className="field-shell font-mono"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Badge Text (Display Label)</label>
                <input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. 🔥 20% OFF, Flash Sale"
                  className="field-shell"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Deal Priority (1 = Highest)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="field-shell"
                />
                <p className="mt-1 text-[10.5px] text-admin-muted">
                  If a product is assigned to multiple active deals, the deal with priority 1 applies.
                </p>
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-navy">Short Description</label>
              <textarea
                rows={2}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief promotional copy shown on deal cards and banners..."
                className="field-shell"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Banner Image URL / Storage Path</label>
                <input
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="product-images/... or /uploads/..."
                  className="field-shell"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Mobile Banner Image (Optional)</label>
                <input
                  value={mobileBannerImage}
                  onChange={(e) => setMobileBannerImage(e.target.value)}
                  placeholder="Mobile visual storage path..."
                  className="field-shell"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 accent-orange rounded"
                />
                Active (Enable deal display on storefront)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 accent-orange rounded"
                />
                Mark as Featured Deal (Showcase on Homepage Hero)
              </label>
            </div>
          </div>

          {/* Section 2: Discount Type & Calculation */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-admin-border pb-3">
              <Percent size={16} className="text-orange" /> Discount Rules &amp; Type
            </h2>

            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { type: "percentage", label: "Percentage Discount", note: "e.g. 20% OFF regular price" },
                { type: "fixed", label: "Fixed Amount Discount", note: "e.g. Rs 500 OFF regular price" },
                { type: "sale_price", label: "Special Sale Price", note: "Define explicit deal prices" },
                { type: "buy_x_get_y", label: "Buy X Get Y", note: "Promotional quantity offer" },
              ].map(({ type, label, note }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDealType(type as DealType)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    dealType === type
                      ? "border-orange bg-orange/10 ring-2 ring-orange/20"
                      : "border-admin-border bg-white hover:border-orange/40"
                  }`}
                >
                  <span className="text-xs font-extrabold text-navy">{label}</span>
                  <span className="text-[10.5px] text-admin-muted mt-1 leading-tight">{note}</span>
                </button>
              ))}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">
                  {dealType === "percentage"
                    ? "Discount Percentage (%)"
                    : dealType === "fixed"
                    ? "Fixed Discount Amount (PKR)"
                    : dealType === "sale_price"
                    ? "Default Sale Price (PKR)"
                    : "Discount Value"}
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 20"
                  className="field-shell"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Maximum Discount Amount Cap (Optional PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Limit maximum discount per item..."
                  className="field-shell"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Schedule Start & End */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-navy flex items-center gap-2 border-b border-admin-border pb-3">
              <Calendar size={16} className="text-orange" /> Deal Schedule &amp; Timing
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Start Date &amp; Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="field-shell"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">End Date &amp; Time *</label>
                <input
                  required
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="field-shell"
                />
              </div>
            </div>

            <p className="text-[11px] text-admin-muted bg-admin-bg p-3 rounded-xl border border-admin-border">
              ⏱ The storefront countdown timer will count down to the exact <strong>End Date &amp; Time</strong>. When expired, normal product pricing will automatically resume.
            </p>
          </div>

          {/* Section 4: Product Selection & Pricing Preview Table */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-admin-border pb-3">
              <div>
                <h2 className="text-base font-bold text-navy flex items-center gap-2">
                  <Layers size={16} className="text-orange" /> Included Products &amp; Variations ({selectedDealProducts.length})
                </h2>
                <p className="text-xs text-admin-muted mt-0.5">Select products or specific variations to include in this deal.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="button-primary text-xs px-4 py-2 shrink-0"
              >
                <Plus size={14} /> Add Products
              </button>
            </div>

            {selectedDealProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-admin-border p-8 text-center bg-admin-bg/40">
                <Layers className="mx-auto text-admin-muted/40 mb-2" size={32} />
                <p className="text-xs font-bold text-navy">No products added to this deal yet</p>
                <p className="text-[11px] text-admin-muted mt-1">Click "Add Products" above to open the searchable product catalog selector.</p>
                <button
                  type="button"
                  onClick={() => setIsSelectorOpen(true)}
                  className="button-secondary mt-3 text-xs px-4 py-2"
                >
                  Browse Catalog &amp; Variations
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-admin-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-admin-border bg-admin-bg font-bold uppercase tracking-wider text-admin-muted">
                    <tr>
                      <th className="p-3">Product / Option</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Regular Price</th>
                      <th className="p-3">Deal Price</th>
                      <th className="p-3">Savings</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/50">
                    {selectedDealProducts.map((item, idx) => {
                      const warning = getExistingProductDealWarning(item.product_id, item.variation_id);
                      const { dealPrice, discountAmount } = calculatePreviewPrice(item.regularPrice, item.custom_deal_price);

                      return (
                        <tr key={item.product_id + (item.variation_id || "") + idx} className="hover:bg-admin-bg/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                                <Image
                                  src={item.image ? publicStorageUrl(item.image) : "/placeholder-bake.svg"}
                                  alt={item.productName}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-navy">{item.productName}</p>
                                {item.variationName && (
                                  <span className="inline-block text-[10.5px] font-semibold text-orange bg-orange/10 px-1.5 py-0.5 rounded">
                                    Option: {item.variationName}
                                  </span>
                                )}
                                {warning && (
                                  <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                                    <AlertTriangle size={11} /> {warning}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-3 font-medium text-admin-muted">{item.category || "—"}</td>

                          <td className="p-3 font-bold text-navy">{formatPKR(item.regularPrice)}</td>

                          <td className="p-3">
                            {dealType === "sale_price" ? (
                              <input
                                type="number"
                                min={0}
                                value={item.custom_deal_price ?? dealPrice}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setSelectedDealProducts((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, custom_deal_price: val } : it))
                                  );
                                }}
                                className="w-24 rounded-lg border border-admin-border px-2 py-1 text-xs font-bold text-orange outline-none"
                              />
                            ) : (
                              <span className="font-black text-orange">{formatPKR(dealPrice)}</span>
                            )}
                          </td>

                          <td className="p-3">
                            <span className="rounded-full bg-green/15 px-2 py-0.5 text-[10.5px] font-extrabold text-green-dark">
                              Save {formatPKR(discountAmount)}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => removeProductFromDeal(item.product_id, item.variation_id)}
                              className="text-red-500 hover:text-red-700 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Save & Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-admin-border">
            <Link href="/admin/deals" className="button-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={submitting} className="button-primary px-8">
              {submitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving...
                </>
              ) : isEditing ? (
                "Save Deal Changes"
              ) : (
                "Schedule & Publish Deal"
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── SEARCHABLE PRODUCT SELECTOR MODAL ────────────────── */}
      {isSelectorOpen && (
        <div className="modal-overlay" onClick={() => setIsSelectorOpen(false)}>
          <div
            className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-admin-border p-5 bg-admin-bg">
              <div>
                <h3 className="text-base font-bold text-navy">Add Products to Deal</h3>
                <p className="text-xs text-admin-muted">Search products or variations to include in promotion.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="rounded-lg p-1.5 text-admin-muted hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filters bar */}
            <div className="p-4 border-b border-admin-border flex flex-wrap gap-3 bg-white">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
                <input
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  placeholder="Search product name or SKU..."
                  className="w-full rounded-xl border border-admin-border py-2 pl-9 pr-3 text-xs outline-none focus:border-orange"
                />
              </div>

              <select
                value={modalCategory}
                onChange={(e) => setModalCategory(e.target.value)}
                className="rounded-xl border border-admin-border px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {allCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleSelectAllFiltered(filteredModalProducts)}
                className="rounded-xl border border-orange/30 bg-orange/10 px-3 py-2 text-xs font-bold text-orange hover:bg-orange hover:text-white transition-colors"
              >
                Select All Filtered ({filteredModalProducts.length})
              </button>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-admin-border/40">
              {loadingProducts ? (
                <div className="p-8 text-center text-xs font-bold text-navy flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-orange" /> Loading catalog products...
                </div>
              ) : filteredModalProducts.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs font-bold text-admin-muted">No products matched search criteria.</p>
                  {(searchModalQuery || modalCategory) && (
                    <button
                      type="button"
                      onClick={() => { setSearchModalQuery(""); setModalCategory(""); }}
                      className="text-[11px] font-bold text-orange hover:underline"
                    >
                      Clear search filters
                    </button>
                  )}
                </div>
              ) : (
                filteredModalProducts.map((p) => {
                  const isVariable = p.product_type === "variable" && Array.isArray(p.product_variations) && p.product_variations.length > 0;
                  const isAddedEntire = selectedDealProducts.some((item) => item.product_id === p.id && !item.variation_id);

                  return (
                    <div key={p.id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                            <Image
                              src={p.featured_image ? publicStorageUrl(p.featured_image) : "/placeholder-bake.svg"}
                              alt={p.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-navy">{p.name}</p>
                            <span className="text-[10px] text-admin-muted font-mono">{p.sku}</span>
                          </div>
                        </div>

                        {!isVariable && (
                          <button
                            type="button"
                            onClick={() => addProductToDeal(p)}
                            disabled={isAddedEntire}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              isAddedEntire
                                ? "bg-green/15 text-green-dark"
                                : "bg-orange text-white hover:bg-orange-dark shadow-xs"
                            }`}
                          >
                            {isAddedEntire ? "Added" : "+ Add Product"}
                          </button>
                        )}
                      </div>

                      {/* Variable Options */}
                      {isVariable && (
                        <div className="mt-2.5 ml-13 pl-3 border-l-2 border-orange/30 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-navy flex items-center gap-1">
                              <Layers3 size={12} className="text-orange" /> Variations available:
                            </span>
                            <button
                              type="button"
                              onClick={() => addProductToDeal(p)}
                              disabled={isAddedEntire}
                              className="text-[10.5px] font-bold text-orange hover:underline"
                            >
                              {isAddedEntire ? "Entire Product Added" : "+ Add Entire Product"}
                            </button>
                          </div>

                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {p.product_variations.map((v: any) => {
                              const isAddedVar = selectedDealProducts.some(
                                (item) => item.product_id === p.id && item.variation_id === v.id
                              );
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => addProductToDeal(p, v)}
                                  disabled={isAddedVar}
                                  className={`flex items-center justify-between p-2 rounded-lg border text-left text-[11px] transition-all ${
                                    isAddedVar
                                      ? "border-green/30 bg-green/10 text-green-dark"
                                      : "border-admin-border bg-admin-bg/50 hover:border-orange/40 hover:bg-white"
                                  }`}
                                >
                                  <span className="font-bold truncate max-w-[140px]">
                                    {v.name || (v.attributes ? Object.values(v.attributes).join(" / ") : "Variation")}
                                  </span>
                                  <span className="font-extrabold text-navy">{formatPKR(v.regular_price ?? v.price)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-admin-border bg-admin-bg flex justify-end">
              <button
                type="button"
                onClick={() => setIsSelectorOpen(false)}
                className="button-primary text-xs px-6 py-2"
              >
                Done Selecting ({selectedDealProducts.length} Items)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notification ─────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
