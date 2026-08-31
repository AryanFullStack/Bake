"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ArrowUpDown, ChevronDown, Filter, LayoutGrid, List, Search, SlidersHorizontal, Sparkles, Tag, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard, ProductCardSkeleton } from "./product-card";

type SortKey = "featured" | "price_asc" | "price_desc" | "rating" | "newest";

export function isProductInCategory(productCategory: string, targetCategory: string, categories: Category[]): boolean {
  if (targetCategory === "All") return true;
  if (productCategory === targetCategory) return true;

  if (targetCategory === "Bakery") {
    const bakerySubcategories = [
      "Bakery",
      "Celebration Cakes",
      "Pastries",
      "Cupcakes",
      "Brownies",
      "Cookies",
      "Brownies & Cookies",
      "Desserts",
    ];
    if (bakerySubcategories.includes(productCategory)) return true;

    const targetObj = categories.find((c) => c.name === "Bakery" || c.slug === "bakery");
    const prodObj = categories.find((c) => c.name === productCategory);
    if (targetObj && prodObj && prodObj.parent_id === targetObj.id) return true;
  }

  const targetObj = categories.find((c) => c.name === targetCategory);
  if (targetObj) {
    const prodObj = categories.find((c) => c.name === productCategory);
    if (prodObj && prodObj.parent_id === targetObj.id) return true;
  }

  return false;
}

export function ShopBrowser({
  categories,
  products,
  initialCategory,
  initialQuery,
  initialSaleOnly,
}: {
  categories: Category[];
  products: Product[];
  initialCategory: string;
  initialQuery: string;
  initialSaleOnly: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [saleOnly, setSaleOnly] = useState(initialSaleOnly);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Sticky toolbar detection
  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { threshold: 1, rootMargin: "-65px 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filtered = useMemo(() => {
    let result = products.filter(p => {
      const q = query.toLowerCase();
      const matchQuery = !query || `${p.name} ${p.category} ${(p.tags ?? []).join(" ")} ${p.description ?? ""}`.toLowerCase().includes(q);
      const matchCategory = isProductInCategory(p.category, category, categories);
      const matchSale = !saleOnly || Boolean(p.salePrice);
      return matchQuery && matchCategory && matchSale;
    });
    if (sortBy === "price_asc") result = [...result].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    else if (sortBy === "rating") result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sortBy === "newest") result = [...result].slice();
    return result;
  }, [products, query, category, saleOnly, sortBy, categories]);

  const activeFilterCount = [query, category !== "All" && category, saleOnly].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="container-shell pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end border-b border-line/60 pb-8">
          <div>
            <p className="eyebrow">Fresh From Our Kitchen</p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-navy">
              Shop Bakery Counter
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted font-medium">
              Small-batch cakes, flaky pastries, fudgy brownies, cupcakes and sweet gift boxes — ready for delivery.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="hidden md:flex items-center gap-1 rounded-xl border border-line bg-white p-1 shadow-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 transition-colors ${viewMode === "grid" ? "bg-navy text-white" : "text-muted hover:text-navy"}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 transition-colors ${viewMode === "list" ? "bg-navy text-white" : "text-muted hover:text-navy"}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFilters(true)}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-line bg-white px-4 py-2.5 text-sm font-extrabold text-navy shadow-xs md:hidden"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Controls Bar ──────────────────────── */}
      <div
        ref={toolbarRef}
        className={`sticky top-[64px] sm:top-[76px] z-30 transition-all duration-300 ${
          toolbarStuck
            ? "border-b border-line/80 bg-cream/95 shadow-sm backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="container-shell py-3">
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-line/70 bg-white p-3 shadow-xs transition-all duration-300 ${toolbarStuck ? "rounded-none border-0 bg-transparent shadow-none p-0" : ""}`}>
            {/* Search */}
            <div className="relative flex-1 sm:max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search cakes, cookies, gifts…"
                className="w-full rounded-xl border border-line bg-cream/60 py-2.5 pl-10 pr-8 text-sm outline-none transition focus:border-orange focus:bg-white focus:shadow-[0_0_0_3px_rgba(253,118,0,.1)] placeholder:text-muted/70"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <span className="text-xs font-semibold text-muted shrink-0">
                {isLoading ? "Loading…" : `${filtered.length} products`}
              </span>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortKey)}
                className="rounded-xl border border-line bg-cream/60 px-3 py-2 text-xs font-bold text-navy outline-none focus:border-orange cursor-pointer appearance-none pr-8 pl-3"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236d777d' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {query && (
                <button onClick={() => setQuery("")} className="inline-flex items-center gap-1.5 rounded-full bg-orange/10 border border-orange/25 px-3 py-1 text-[11px] font-bold text-orange hover:bg-orange hover:text-white transition-colors">
                  <Search size={10} /> "{query}" <X size={10} />
                </button>
              )}
              {category !== "All" && (
                <button onClick={() => setCategory("All")} className="inline-flex items-center gap-1.5 rounded-full bg-navy/8 border border-navy/15 px-3 py-1 text-[11px] font-bold text-navy hover:bg-navy hover:text-white transition-colors">
                  <Tag size={10} /> {category} <X size={10} />
                </button>
              )}
              {saleOnly && (
                <button onClick={() => setSaleOnly(false)} className="inline-flex items-center gap-1.5 rounded-full bg-green-light border border-green/25 px-3 py-1 text-[11px] font-bold text-green-dark hover:bg-green hover:text-white transition-colors">
                  <Sparkles size={10} /> Deals only <X size={10} />
                </button>
              )}
              <button onClick={() => { setQuery(""); setCategory("All"); setSaleOnly(false); }} className="text-[11px] font-bold text-muted hover:text-orange underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="container-shell py-6 md:py-8">
        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="hidden md:flex md:flex-col gap-4 sticky top-[136px] h-fit">
            <div className="rounded-2xl bg-white p-5 border border-line/70 shadow-xs">
              <FilterPanel categories={categories} category={category} setCategory={setCategory} saleOnly={saleOnly} setSaleOnly={setSaleOnly} products={products} />
            </div>
          </aside>

          {/* Grid */}
          <section className="flex flex-col gap-6">
            {isLoading ? (
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState onReset={() => { setQuery(""); setCategory("All"); setSaleOnly(false); }} />
            ) : (
              <div className={`grid gap-4 animate-fade-in ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
                {filtered.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-cream p-6 shadow-2xl animate-slide-up">
            <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 font-display text-xl font-bold text-navy">
                <SlidersHorizontal size={20} className="text-orange" /> Filter Bakes
              </div>
              <button onClick={() => setMobileFilters(false)} className="rounded-full border border-line bg-white p-2 text-navy hover:text-orange">
                <X size={16} />
              </button>
            </div>
            <FilterPanel categories={categories} category={category} setCategory={setCategory} saleOnly={saleOnly} setSaleOnly={setSaleOnly} products={products} />
            <button onClick={() => setMobileFilters(false)} className="mt-6 w-full rounded-2xl bg-orange py-4 text-sm font-bold text-white shadow-lg hover:bg-orange-dark transition-colors">
              Show {filtered.length} Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({ categories, category, setCategory, saleOnly, setSaleOnly, products }: {
  categories: Category[];
  category: string;
  setCategory: (v: string) => void;
  saleOnly: boolean;
  setSaleOnly: (v: boolean) => void;
  products: Product[];
}) {
  const [catOpen, setCatOpen] = useState(true);

  const uniqueCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter(c => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, [categories]);

  const items = useMemo(() => {
    const list = [{ name: "All", count: products.length }];
    for (const c of uniqueCategories) {
      const count = products.filter(p => isProductInCategory(p.category, c.name, categories)).length;
      list.push({ name: c.name, count });
    }
    return list;
  }, [products, uniqueCategories, categories]);

  return (
    <div className="flex flex-col gap-5">
      {/* Categories section */}
      <div>
        <button onClick={() => setCatOpen(o => !o)} className="flex w-full items-center justify-between text-xs font-extrabold uppercase tracking-wider text-muted mb-3">
          <span className="flex items-center gap-2"><Filter size={13} className="text-orange" /> Categories</span>
          <ChevronDown size={14} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} />
        </button>
        {catOpen && (
          <div className="flex flex-col gap-1 text-sm font-semibold text-navy">
            {items.map(item => (
              <button
                key={item.name}
                onClick={() => setCategory(item.name)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                  category === item.name ? "bg-navy text-white shadow-xs font-bold" : "hover:bg-orange/8 hover:text-orange"
                }`}
              >
                <span>{item.name === "All" ? "All Products" : item.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${category === item.name ? "bg-orange/80 text-white" : "bg-cream-deep text-muted"}`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-line/70 pt-4">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-muted">Offers</p>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-orange/8 transition-colors">
          <div className={`relative h-5 w-9 rounded-full transition-colors ${saleOnly ? "bg-orange" : "bg-line"}`}>
            <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${saleOnly ? "translate-x-4" : ""}`} />
          </div>
          <input type="checkbox" checked={saleOnly} onChange={e => setSaleOnly(e.target.checked)} className="sr-only" />
          <span className="flex items-center gap-1.5 text-sm font-semibold text-navy"><Sparkles size={14} className="text-orange" /> Deals & Sale Only</span>
        </label>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white p-16 text-center shadow-xs animate-fade-in">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-orange/10 text-orange">
        <Search size={28} />
      </div>
      <h3 className="font-display text-2xl font-bold text-navy">No matching bakes found</h3>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Try a different keyword, remove some filters, or browse everything we bake fresh daily.
      </p>
      <button onClick={onReset} className="mt-6 button-primary">
        <X size={15} /> Reset Filters
      </button>
    </div>
  );
}
