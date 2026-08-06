"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

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
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "rating">("featured");
  const [mobileFilters, setMobileFilters] = useState(false);

  // Filter & Sort Logic
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchQuery =
        !query ||
        `${p.name} ${p.category} ${(p.tags ?? []).join(" ")} ${p.description ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchCategory = category === "All" || p.category === category;
      const matchSale = !saleOnly || Boolean(p.salePrice);
      return matchQuery && matchCategory && matchSale;
    });

    if (sortBy === "price_asc") {
      result = [...result].sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    } else if (sortBy === "price_desc") {
      result = [...result].sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    } else if (sortBy === "rating") {
      result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return result;
  }, [products, query, category, saleOnly, sortBy]);

  const filterPanel = (
    <FilterPanel
      categories={categories}
      category={category}
      setCategory={setCategory}
      saleOnly={saleOnly}
      setSaleOnly={setSaleOnly}
      products={products}
    />
  );

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Page Header Header & Meta */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end border-b border-line/70 pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange">
            Fresh From Our Kitchen
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-bold text-navy">
            Shop Bakery Counter
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted font-medium">
            Explore small-batch cakes, flaky morning pastries, fudgy brownies, cupcakes and sweet boxes ready for delivery.
          </p>
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setMobileFilters(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-line bg-white px-5 py-3 text-sm font-extrabold text-navy shadow-xs md:hidden"
        >
          <SlidersHorizontal size={18} />
          <span>Filters & Categories ({filtered.length})</span>
        </button>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Desktop Sidebar Filter Panel */}
        <aside className="hidden md:block sticky top-28 h-fit rounded-[24px] bg-white p-6 border border-line/80 shadow-xs">
          {filterPanel}
        </aside>

        {/* Main Products Grid & Search Bar */}
        <section className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 border border-line/80 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search cakes, cookies..."
                className="w-full rounded-xl border border-line bg-cream/50 py-2.5 pl-10 pr-8 text-sm outline-none transition focus:border-orange focus:bg-white"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <span className="text-xs font-semibold text-muted shrink-0">
                {filtered.length} bakes found
              </span>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={15} className="text-muted shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="rounded-xl border border-line bg-cream/50 px-3 py-2 text-xs font-bold text-navy outline-none focus:border-orange cursor-pointer"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filters Chips */}
          {(query || category !== "All" || saleOnly) && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-orange/5 p-3 border border-orange/15 text-xs">
              <span className="font-bold text-navy mr-1">Active filters:</span>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-bold text-orange shadow-xs border border-orange/20 hover:bg-orange hover:text-white transition-colors"
                >
                  Query: “{query}” <X size={12} />
                </button>
              )}
              {category !== "All" && (
                <button
                  onClick={() => setCategory("All")}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-bold text-orange shadow-xs border border-orange/20 hover:bg-orange hover:text-white transition-colors"
                >
                  Category: {category} <X size={12} />
                </button>
              )}
              {saleOnly && (
                <button
                  onClick={() => setSaleOnly(false)}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-bold text-orange shadow-xs border border-orange/20 hover:bg-orange hover:text-white transition-colors"
                >
                  Deals Only <X size={12} />
                </button>
              )}
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setSaleOnly(false);
                }}
                className="ml-auto font-bold text-navy underline hover:text-orange text-xs"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>

          {/* Empty Search State */}
          {filtered.length === 0 && (
            <div className="rounded-[28px] bg-white p-12 text-center border border-line/80 shadow-xs my-6">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-orange/10 text-orange">
                <Search size={28} />
              </div>
              <h3 className="mt-4 font-display text-2xl font-bold text-navy">
                No matching bakes found
              </h3>
              <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
                Try searching for a different cake flavor, clear your filter selection, or browse all bakes.
              </p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("All");
                  setSaleOnly(false);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-dark transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filter Drawer Modal */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-xs animate-fade-in"
            onClick={() => setMobileFilters(false)}
            aria-label="Close filters drawer"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-cream p-6 shadow-2xl animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 font-display text-2xl font-bold text-navy">
                <SlidersHorizontal size={22} className="text-orange" />
                <span>Filter Bakes</span>
              </div>
              <button
                onClick={() => setMobileFilters(false)}
                className="rounded-full bg-white p-2 text-navy border border-line"
              >
                <X size={18} />
              </button>
            </div>

            {filterPanel}

            <button
              onClick={() => setMobileFilters(false)}
              className="mt-8 w-full rounded-2xl bg-orange py-4 text-sm font-bold text-white shadow-lg"
            >
              Show {filtered.length} Bakes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  categories,
  category,
  setCategory,
  saleOnly,
  setSaleOnly,
  products,
}: {
  categories: Category[];
  category: string;
  setCategory: (v: string) => void;
  saleOnly: boolean;
  setSaleOnly: (v: boolean) => void;
  products: Product[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-muted">
          <Filter size={14} className="text-orange" /> Categories
        </div>
        <div className="mt-4 flex flex-col gap-1.5 text-sm font-semibold text-navy">
          <button
            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
              category === "All"
                ? "bg-navy text-white font-bold shadow-xs"
                : "hover:bg-orange/10 hover:text-orange"
            }`}
            onClick={() => setCategory("All")}
          >
            <span>All Bakes</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${category === "All" ? "bg-orange text-white" : "bg-cream-deep text-muted"}`}>
              {products.length}
            </span>
          </button>

          {categories.map((item) => {
            const count = products.filter((p) => p.category === item.name).length;
            return (
              <button
                key={item.slug}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
                  category === item.name
                    ? "bg-navy text-white font-bold shadow-xs"
                    : "hover:bg-orange/10 hover:text-orange"
                }`}
                onClick={() => setCategory(item.name)}
              >
                <span>{item.name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    category === item.name ? "bg-orange text-white" : "bg-cream-deep text-muted"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line/80 pt-5">
        <label className="flex items-center gap-3 text-sm font-semibold text-navy cursor-pointer">
          <input
            type="checkbox"
            checked={saleOnly}
            onChange={(e) => setSaleOnly(e.target.checked)}
            className="h-4 w-4 rounded accent-orange cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-orange" /> Special Deals Only
          </span>
        </label>
      </div>
    </div>
  );
}
