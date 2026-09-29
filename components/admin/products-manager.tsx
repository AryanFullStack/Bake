"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Eye,
  Layers, MoreVertical, Package, Pencil, Plus, RefreshCw, Search,
  Tag, Trash2, X, XCircle, AlertTriangle, ShieldAlert
} from "lucide-react";
import { formatPKR, publicStorageUrl } from "@/lib/catalog";
import { ProductWizard } from "./product-wizard";
import { PaginationControls } from "@/components/pagination";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  product_type?: "simple" | "variable";
  price: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  featured_image?: string | null;
  status?: "published" | "draft" | "hidden" | "scheduled";
  is_published: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  category_id?: string | null;
  categories?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null | any;
  brands?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null | any;
  product_images?: any[];
  product_variations?: any[];
  product_attributes?: any[];
  updated_at: string;
}

interface AdminProductsManagerProps {
  initialProducts?: ProductRow[];
  initialTotal?: number;
  categories?: any[];
  brands?: any[];
}

function getStatusBadge(p: ProductRow) {
  const s = p.status ?? (p.is_published ? "published" : "draft");
  const map: Record<string, string> = {
    published: "badge-published",
    draft: "badge-draft",
    hidden: "badge-hidden",
    scheduled: "badge-scheduled",
  };
  return { cls: `badge ${map[s] ?? "badge-hidden"}`, label: s.charAt(0).toUpperCase() + s.slice(1) };
}

function StockBar({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0) return <span className="badge badge-soldout">Out of stock</span>;
  const pct = Math.min(100, (qty / Math.max(threshold * 4, 20)) * 100);
  const color = qty <= threshold ? "bg-amber-400" : "bg-green";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-admin-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold ${qty <= threshold ? "text-amber-600" : "text-green-dark"}`}>{qty}</span>
    </div>
  );
}

export function AdminProductsManager({ initialProducts = [], initialTotal = 0, categories = [], brands = [] }: AdminProductsManagerProps) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("category_id") || "";
  const filterParam = searchParams.get("filter") || "";

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(Math.max(1, Math.ceil((initialTotal || initialProducts.length) / 20)));
  const [totalProducts, setTotalProducts] = useState(initialTotal || initialProducts.length);

  // Search input with debounce
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dealsOnlyFilter, setDealsOnlyFilter] = useState(filterParam === "deals");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkStockValue, setBulkStockValue] = useState("");
  const [showStockInput, setShowStockInput] = useState(false);

  // Modals and menus
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [quickEditProduct, setQuickEditProduct] = useState<ProductRow | null>(null);
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        category_id: selectedCategory,
        stock_status: selectedStockStatus,
        status: selectedStatus,
        product_type: "",
      });
      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (json.success) {
        let list = json.products || [];
        if (dealsOnlyFilter) {
          list = list.filter((p: any) => p.sale_price || (Array.isArray(p.product_variations) && p.product_variations.some((v: any) => v.sale_price)));
        }
        setProducts(list);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalProducts(json.pagination?.total ?? list.length);
      } else {
        showToast(json.error || "Failed to load products", "error");
      }
    } catch {
      showToast("Network error fetching products", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedCategory, selectedStockStatus, selectedStatus, dealsOnlyFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedStockStatus, selectedStatus, dealsOnlyFilter]);

  // Clean selection when page or filters change
  useEffect(() => {
    setSelectedIds([]);
    setShowStockInput(false);
  }, [page, searchQuery, selectedCategory, selectedStockStatus, selectedStatus, dealsOnlyFilter]);

  // Handle header checkbox indeterminate state
  const allSelectedOnPage = products.length > 0 && products.every(p => selectedIds.includes(p.id));
  const someSelectedOnPage = products.length > 0 && products.some(p => selectedIds.includes(p.id)) && !allSelectedOnPage;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelectedOnPage;
    }
  }, [someSelectedOnPage]);

  const toggleAllOnPage = () => {
    if (allSelectedOnPage) {
      const pageIds = new Set(products.map(p => p.id));
      setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
    } else {
      const pageIds = products.map(p => p.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectAllStore = () => {
    const pageIds = products.map(p => p.id);
    setSelectedIds(Array.from(new Set(pageIds)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Close 3-dots menus on Escape key
  useEffect(() => {
    if (!activeMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMenu]);

  // Execute Bulk Action (Publish, Draft, Hidden, Stock Update, Delete)
  const executeBulkAction = async (action: string, customStock?: string) => {
    if (!selectedIds.length) return;

    if (action === "delete") {
      const ok = confirm(`Permanently delete ${selectedIds.length} selected product(s)?\n\nThis will remove the products and all their images. This cannot be undone.`);
      if (!ok) return;
    }

    if (action === "stock_update") {
      const stockVal = customStock ?? bulkStockValue;
      if (stockVal === "" || isNaN(Number(stockVal))) {
        alert("Please enter a valid stock quantity number.");
        return;
      }
    }

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          stockValue: customStock ?? bulkStockValue,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || `Bulk action applied to ${selectedIds.length} products`);
        setSelectedIds([]);
        setShowStockInput(false);
        setBulkStockValue("");
        fetchProducts();
      } else {
        showToast(json.error || "Bulk action failed", "error");
      }
    } catch {
      showToast("Network error applying bulk action", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Single Product Delete
  const handleDelete = async (p: ProductRow) => {
    const ok = confirm(`Permanently delete "${p.name}"?\n\nThis will remove the product and all associated images. This cannot be undone.`);
    if (!ok) return;

    setDeletingId(p.id);
    setActiveMenu(null);
    try {
      const res = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSelectedIds(prev => prev.filter(id => id !== p.id));
        showToast(`"${p.name}" deleted permanently`);
        fetchProducts();
      } else {
        showToast(json.error || "Failed to delete product", "error");
      }
    } catch {
      showToast("Network error deleting product", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Single Product Duplicate
  const handleDuplicate = async (p: ProductRow) => {
    setActiveMenu(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`"${p.name}" duplicated as Draft`);
        fetchProducts();
      } else {
        showToast(json.error || "Duplication failed", "error");
      }
    } catch {
      showToast("Network error duplicating product", "error");
    } finally {
      setLoading(false);
    }
  };

  // Quick Edit Save
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    setQuickEditSaving(true);
    try {
      const {
        categories,
        brands,
        product_images,
        product_variations,
        product_attributes,
        created_at,
        updated_at,
        ...payload
      } = quickEditProduct as any;

      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setQuickEditProduct(null);
        showToast("Product updated successfully");
        fetchProducts();
      } else {
        showToast(json.error || "Update failed", "error");
      }
    } catch {
      showToast("Network error updating product", "error");
    } finally {
      setQuickEditSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden relative pb-28">
      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="mt-1 text-sm text-admin-muted">
            {totalProducts} total products across all categories
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsWizardOpen(true); }}
          className="button-primary"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* ── Deals Shortcut Banner ─────────────────────── */}
      {(filterParam === "deals" || dealsOnlyFilter) && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-orange/30 bg-orange/10 p-5 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange text-white shadow-xs">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">Products Currently on Deal</h3>
              <p className="text-xs text-muted">Viewing products with promotional pricing.</p>
            </div>
          </div>
          <Link href="/admin/deals" className="button-primary shrink-0 text-xs px-4 py-2.5">
            Manage Deals &amp; Promotions <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Toolbar & Filters ─────────────────────────── */}
      <div className="mb-4 rounded-2xl border border-admin-border bg-white p-4 shadow-xs">
        {/* Quick-filter tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {[["All", ""], ["Published", "published"], ["Drafts", "draft"], ["Hidden", "hidden"]].map(([label, val]) => (
            <button
              key={val}
              onClick={() => { setSelectedStatus(val); setPage(1); }}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                selectedStatus === val ? "bg-navy text-white shadow-xs" : "text-admin-muted hover:bg-admin-bg hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search box with debounced input and clear button */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search name, SKU, barcode…"
              className="w-full rounded-xl border border-admin-border bg-admin-bg py-2.5 pl-10 pr-9 text-sm font-medium text-navy outline-none transition focus:border-orange focus:bg-white focus:shadow-[0_0_0_3px_rgba(253,118,0,.08)]"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-navy"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
            className="rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-xs font-semibold text-navy outline-none focus:border-orange cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Stock filter */}
          <select
            value={selectedStockStatus}
            onChange={e => { setSelectedStockStatus(e.target.value); setPage(1); }}
            className="rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-xs font-semibold text-navy outline-none focus:border-orange cursor-pointer"
          >
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ 5)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>

          <button
            onClick={fetchProducts}
            className="rounded-xl border border-admin-border bg-white p-2.5 text-admin-muted hover:text-navy transition-colors"
            aria-label="Refresh"
            title="Refresh product list"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-orange" : ""} />
          </button>
        </div>
      </div>

      {/* Backdrop for 3-dots action dropdown */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-30 bg-transparent cursor-default"
          onClick={() => setActiveMenu(null)}
          aria-hidden="true"
        />
      )}

      {/* ── Products Table Container ─────────────────── */}
      <div className="overflow-visible rounded-2xl border border-admin-border bg-white shadow-xs">
        {/* Table Header Active Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange/20 bg-orange/5 px-4 py-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center rounded-lg bg-orange px-2.5 py-1 text-xs font-extrabold text-white">
                {selectedIds.length} Selected
              </span>
              <span className="font-semibold text-navy">
                {selectedIds.length} of {products.length} products on this page
              </span>
              {allSelectedOnPage && totalProducts > products.length && (
                <button
                  onClick={toggleSelectAllStore}
                  className="font-bold text-orange hover:underline ml-1"
                >
                  Select all {totalProducts} products across all pages
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => executeBulkAction("publish")}
                disabled={bulkLoading}
                className="flex items-center gap-1 rounded-lg border border-green-600/30 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors"
              >
                <Check size={12} /> Publish
              </button>
              <button
                onClick={() => executeBulkAction("draft")}
                disabled={bulkLoading}
                className="flex items-center gap-1 rounded-lg border border-admin-border bg-white px-2.5 py-1 text-xs font-bold text-navy hover:bg-admin-bg transition-colors"
              >
                Draft
              </button>
              <button
                onClick={() => setShowStockInput(!showStockInput)}
                className="flex items-center gap-1 rounded-lg border border-admin-border bg-white px-2.5 py-1 text-xs font-bold text-navy hover:bg-admin-bg transition-colors"
              >
                Stock
              </button>
              <button
                onClick={() => executeBulkAction("delete")}
                disabled={bulkLoading}
                className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 size={12} /> Delete ({selectedIds.length})
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-lg p-1 text-admin-muted hover:text-navy ml-1"
                title="Deselect all"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Inline stock input if toggled */}
        {selectedIds.length > 0 && showStockInput && (
          <div className="flex items-center gap-3 border-b border-admin-border bg-admin-bg/80 px-4 py-2 text-xs">
            <span className="font-bold text-navy">Set stock quantity for {selectedIds.length} products:</span>
            <input
              type="number"
              min="0"
              value={bulkStockValue}
              onChange={e => setBulkStockValue(e.target.value)}
              placeholder="e.g. 25"
              className="w-24 rounded-lg border border-admin-border bg-white px-2.5 py-1 text-xs font-bold outline-none focus:border-orange"
            />
            <button
              onClick={() => executeBulkAction("stock_update")}
              disabled={bulkLoading || bulkStockValue === ""}
              className="rounded-lg bg-orange px-3 py-1 font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-50"
            >
              Apply Stock
            </button>
            <button
              onClick={() => setShowStockInput(false)}
              className="text-xs text-admin-muted hover:text-navy"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="overflow-x-auto min-h-[340px] pb-16">
          {loading ? (
            <div className="flex h-64 items-center justify-center gap-3 text-admin-muted">
              <RefreshCw size={20} className="animate-spin-slow text-orange" />
              <span className="text-sm font-semibold">Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
              <Package size={36} className="text-admin-muted/50" />
              <p className="text-sm font-bold text-navy">No products found</p>
              <p className="text-xs text-admin-muted">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-admin-border bg-admin-bg text-xs font-bold uppercase tracking-wider text-admin-muted">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={toggleAllOnPage}
                      aria-label="Select all products on page"
                      className="h-4 w-4 accent-orange cursor-pointer rounded transition"
                    />
                  </th>
                  <th className="p-3">Product</th>
                  <th className="p-3 hidden md:table-cell">Category</th>
                  <th className="p-3 hidden lg:table-cell">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3 hidden md:table-cell">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/50">
                {products.map((p, idx) => {
                  const isSelected = selectedIds.includes(p.id);
                  const { cls: statusCls, label: statusLabel } = getStatusBadge(p);
                  const imgSrc = p.featured_image
                    ? publicStorageUrl(p.featured_image)
                    : p.product_images?.[0]?.storage_path
                      ? publicStorageUrl(p.product_images[0].storage_path)
                      : "/placeholder-bake.svg";
                  const catName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;
                  const isDeleting = deletingId === p.id;
                  const isNearBottom = products.length > 3 && idx >= products.length - 2;

                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors hover:bg-admin-bg/60 ${isSelected ? "bg-orange/5" : ""} ${isDeleting ? "opacity-50 pointer-events-none" : ""} ${activeMenu === p.id ? "relative z-40" : ""}`}
                    >
                      {/* Checkbox column */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          aria-label={`Select ${p.name}`}
                          className="h-4 w-4 accent-orange cursor-pointer rounded transition"
                          onClick={e => e.stopPropagation()}
                        />
                      </td>

                      {/* Product thumbnail + name */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                            <SafeImage src={imgSrc} alt={p.name} fill sizes="44px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate max-w-[220px] text-sm font-bold text-navy" title={p.name}>
                              {p.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.product_type === "variable" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-orange/10 px-1.5 py-0.5 text-[10px] font-extrabold text-orange">
                                  <Layers size={10} />
                                  {Array.isArray(p.product_variations) && p.product_variations.length > 0
                                    ? `${p.product_variations.length} Options`
                                    : "Variable"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-admin-bg px-1.5 py-0.5 text-[10px] font-bold text-admin-muted">
                                  Simple
                                </span>
                              )}
                              {p.is_featured && <span className="text-[10px] font-bold text-orange">★ Featured</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs font-medium text-admin-muted">{catName ?? "—"}</span>
                      </td>

                      {/* SKU */}
                      <td className="p-3 hidden lg:table-cell">
                        <code className="rounded-md bg-admin-bg px-2 py-0.5 text-[11px] font-mono text-admin-muted">{p.sku ?? "—"}</code>
                      </td>

                      {/* Price */}
                      <td className="p-3">
                        <div>
                          {p.product_type === "variable" && Array.isArray(p.product_variations) && p.product_variations.length > 0 ? (
                            <span className="text-xs font-bold text-navy">
                              {(() => {
                                const activeP = p.product_variations.filter((v: any) => v.status !== "inactive").map((v: any) => Number(v.sale_price ?? v.regular_price ?? 0));
                                if (!activeP.length) return formatPKR(p.sale_price ?? p.price);
                                const min = Math.min(...activeP);
                                const max = Math.max(...activeP);
                                return min === max ? formatPKR(min) : `${formatPKR(min)} – ${formatPKR(max)}`;
                              })()}
                            </span>
                          ) : (
                            <>
                              <span className="text-sm font-bold text-navy">{formatPKR(p.sale_price ?? p.price)}</span>
                              {p.sale_price && <span className="block text-[10px] text-muted line-through">{formatPKR(p.price)}</span>}
                            </>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="p-3 hidden md:table-cell">
                        <StockBar qty={p.stock_quantity} threshold={p.low_stock_threshold ?? 5} />
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={statusCls}>{statusLabel}</span>
                      </td>

                      {/* Actions */}
                      <td className={`p-3 text-right ${activeMenu === p.id ? "relative z-40" : ""}`}>
                        <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Direct Quick Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenu(null);
                                setQuickEditProduct(p);
                              }}
                              className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-bg hover:text-navy transition-colors"
                              title="Quick Edit"
                            >
                              <Pencil size={15} />
                            </button>

                            {/* Dropdown Toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent?.stopImmediatePropagation?.();
                                setActiveMenu(prev => (prev === p.id ? null : p.id));
                              }}
                              className={`rounded-lg p-1.5 transition-colors ${
                                activeMenu === p.id
                                  ? "bg-admin-bg text-navy ring-1 ring-admin-border"
                                  : "text-admin-muted hover:bg-admin-bg hover:text-navy"
                              }`}
                              title="More actions"
                              aria-haspopup="true"
                              aria-expanded={activeMenu === p.id}
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>

                          {/* Action Dropdown Menu */}
                          {activeMenu === p.id && (
                            <div
                              onClick={e => e.stopPropagation()}
                              className={`absolute right-0 z-50 w-44 overflow-hidden rounded-xl border border-admin-border bg-white shadow-xl animate-scale-in text-left ${
                                isNearBottom ? "bottom-9" : "top-9"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenu(null);
                                  setEditingProduct(p);
                                  setIsWizardOpen(true);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg transition-colors"
                              >
                                <Pencil size={13} className="text-admin-muted" /> Full Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenu(null);
                                  setQuickEditProduct(p);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg transition-colors"
                              >
                                <Eye size={13} className="text-admin-muted" /> Quick Edit
                              </button>
                              <Link
                                href={`/products/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setActiveMenu(null)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg transition-colors"
                              >
                                <ArrowRight size={13} className="text-admin-muted" /> View on Store
                              </Link>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenu(null);
                                  handleDuplicate(p);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg transition-colors"
                              >
                                <Copy size={13} className="text-admin-muted" /> Duplicate
                              </button>
                              <div className="my-1 border-t border-admin-border" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenu(null);
                                  handleDelete(p);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={13} /> Delete Product
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Floating Bulk Action Bar ────── */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center gap-2.5 rounded-2xl border border-navy/20 bg-navy px-4 py-3 text-white shadow-2xl backdrop-blur-md animate-slide-up max-w-[95vw]">
          <div className="flex items-center gap-2 pr-2.5 border-r border-white/20">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange px-2 text-xs font-black text-white">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-white whitespace-nowrap">Selected</span>
          </div>

          <button
            onClick={() => executeBulkAction("publish")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            title="Publish selected products"
          >
            <Check size={14} className="text-green-400" /> Publish
          </button>

          <button
            onClick={() => executeBulkAction("draft")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            title="Move to Draft"
          >
            Draft
          </button>

          {/* Quick inline stock update */}
          <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-2 py-1">
            <span className="text-[11px] font-semibold text-white/80">Stock:</span>
            <input
              type="number"
              min="0"
              value={bulkStockValue}
              onChange={e => setBulkStockValue(e.target.value)}
              placeholder="Qty"
              className="w-14 rounded-lg bg-white/20 px-1.5 py-0.5 text-xs font-bold text-white outline-none placeholder:text-white/40"
            />
            <button
              onClick={() => executeBulkAction("stock_update")}
              disabled={bulkLoading || bulkStockValue === ""}
              className="rounded-lg bg-orange px-2 py-0.5 text-xs font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-40"
            >
              Apply
            </button>
          </div>

          <button
            onClick={() => executeBulkAction("delete")}
            disabled={bulkLoading}
            className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white transition-colors"
            title="Permanently delete selected products"
          >
            {bulkLoading ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
            Delete ({selectedIds.length})
          </button>

          <button
            onClick={() => setSelectedIds([])}
            className="rounded-lg p-1 text-white/60 hover:text-white transition-colors ml-1"
            title="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────── */}
      <PaginationControls
        currentPage={page}
        pageSize={limit}
        totalItems={totalProducts}
        itemLabel="products"
        onPageChange={setPage}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        className="mt-4"
      />

      {/* ── Product Wizard (Full Edit / Add) ─────────── */}
      {isWizardOpen && (
        <ProductWizard
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => { setIsWizardOpen(false); setEditingProduct(null); }}
          onSaved={() => {
            setIsWizardOpen(false);
            setEditingProduct(null);
            fetchProducts();
            showToast(editingProduct ? "Product updated successfully" : "Product created successfully");
          }}
        />
      )}

      {/* ── Quick Edit Modal ─────────────────────────── */}
      {quickEditProduct && (
        <div className="modal-overlay" onClick={() => !quickEditSaving && setQuickEditProduct(null)}>
          <form
            onSubmit={handleSaveQuickEdit}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-admin-border p-5">
              <div>
                <h2 className="text-base font-bold text-navy">Quick Edit Product</h2>
                <p className="text-xs text-admin-muted truncate max-w-sm mt-0.5">{quickEditProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditProduct(null)}
                disabled={quickEditSaving}
                className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Product Name</label>
                <input
                  required
                  value={quickEditProduct.name}
                  onChange={e => setQuickEditProduct({ ...quickEditProduct, name: e.target.value })}
                  className="field-shell"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">SKU</label>
                  <input
                    value={quickEditProduct.sku || ""}
                    onChange={e => setQuickEditProduct({ ...quickEditProduct, sku: e.target.value })}
                    className="field-shell"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Status</label>
                  <select
                    value={quickEditProduct.status ?? (quickEditProduct.is_published ? "published" : "draft")}
                    onChange={e => setQuickEditProduct({
                      ...quickEditProduct,
                      status: e.target.value as any,
                      is_published: e.target.value === "published"
                    })}
                    className="field-shell"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Regular Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={quickEditProduct.price}
                    onChange={e => setQuickEditProduct({ ...quickEditProduct, price: Number(e.target.value) })}
                    className="field-shell"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Sale Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quickEditProduct.sale_price ?? ""}
                    onChange={e => setQuickEditProduct({
                      ...quickEditProduct,
                      sale_price: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="Optional"
                    className="field-shell"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quickEditProduct.stock_quantity}
                    onChange={e => setQuickEditProduct({ ...quickEditProduct, stock_quantity: Number(e.target.value) })}
                    className="field-shell"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={quickEditProduct.low_stock_threshold ?? 5}
                    onChange={e => setQuickEditProduct({ ...quickEditProduct, low_stock_threshold: Number(e.target.value) })}
                    className="field-shell"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="qe-featured"
                  checked={!!quickEditProduct.is_featured}
                  onChange={e => setQuickEditProduct({ ...quickEditProduct, is_featured: e.target.checked })}
                  className="h-4 w-4 accent-orange cursor-pointer rounded"
                />
                <label htmlFor="qe-featured" className="text-xs font-bold text-navy cursor-pointer">
                  Feature this product on homepage
                </label>
              </div>

              {quickEditProduct.product_type === "variable" && (
                <div className="rounded-xl border border-orange/20 bg-orange/5 p-3 text-xs text-navy flex items-start gap-2">
                  <Layers size={14} className="text-orange mt-0.5 shrink-0" />
                  <span>
                    <strong>Variable Product:</strong> Regular Price and Stock will set the base values. To edit individual variation options, use <strong>Full Edit</strong>.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-admin-border p-5">
              <button
                type="button"
                onClick={() => setQuickEditProduct(null)}
                disabled={quickEditSaving}
                className="button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={quickEditSaving}
                className="button-primary flex items-center gap-1.5"
              >
                {quickEditSaving && <RefreshCw size={14} className="animate-spin" />}
                {quickEditSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Toast Feedback ───────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
