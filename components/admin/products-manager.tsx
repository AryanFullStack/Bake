"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Check, ChevronLeft, ChevronRight, Copy, Eye, Filter, Layers,
  MoreVertical, Package, Pencil, Plus, RefreshCw, Search, Trash2, X, XCircle,
} from "lucide-react";
import { formatPKR, publicStorageUrl } from "@/lib/catalog";
import { ProductWizard } from "./product-wizard";

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
  updated_at: string;
}

interface AdminProductsManagerProps {
  initialProducts?: ProductRow[];
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

export function AdminProductsManager({ initialProducts = [], categories = [], brands = [] }: AdminProductsManagerProps) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("category_id") || "";

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(catParam);
  const [selectedStockStatus, setSelectedStockStatus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkStockValue, setBulkStockValue] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [quickEditProduct, setQuickEditProduct] = useState<ProductRow | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), search: searchQuery, category_id: selectedCategory, stock_status: selectedStockStatus, status: selectedStatus, product_type: "" });
      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
        setTotalPages(json.pagination.totalPages || 1);
        setTotalProducts(json.pagination.total || 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, limit, searchQuery, selectedCategory, selectedStockStatus, selectedStatus]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleBulk = async () => {
    if (!selectedIds.length || !bulkAction) return;
    const res = await fetch("/api/admin/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: bulkAction, ids: selectedIds, stockValue: bulkStockValue }) });
    const json = await res.json();
    if (json.success) { setSelectedIds([]); setBulkAction(""); fetchProducts(); showToast(`Bulk action applied to ${selectedIds.length} products`); }
    else showToast(json.error || "Bulk action failed", "error");
  };

  const handleDuplicate = async (p: ProductRow) => {
    const res = await fetch("/api/admin/products/duplicate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id }) });
    const json = await res.json();
    if (json.success) { fetchProducts(); showToast(`"${p.name}" duplicated`); }
    else showToast("Duplication failed", "error");
    setActiveMenu(null);
  };

  const handleDelete = async (p: ProductRow) => {
    if (!confirm(`Delete "${p.name}" permanently?`)) return;
    const res = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) { fetchProducts(); showToast(`"${p.name}" deleted`, "error"); }
    else showToast("Delete failed", "error");
    setActiveMenu(null);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    const res = await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(quickEditProduct) });
    const json = await res.json();
    if (json.success) { setQuickEditProduct(null); fetchProducts(); showToast("Product updated"); }
    else showToast("Update failed", "error");
  };

  const toggleAll = () => setSelectedIds(selectedIds.length === products.length ? [] : products.map(p => p.id));
  const toggleOne = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  return (
    <div className="min-h-screen bg-admin-bg p-6 md:p-8">
      {/* ── Header ──────────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="mt-1 text-sm text-admin-muted">{totalProducts} total products across all categories</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsWizardOpen(true); }}
          className="button-primary"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="mb-4 rounded-2xl border border-admin-border bg-white p-4 shadow-xs">
        {/* Quick-filter tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {[["All", ""], ["Published", "published"], ["Drafts", "draft"], ["Hidden", "hidden"]].map(([label, val]) => (
            <button
              key={val}
              onClick={() => { setSelectedStatus(val); setPage(1); }}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${selectedStatus === val ? "bg-navy text-white" : "text-admin-muted hover:bg-admin-bg hover:text-navy"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search name, SKU, barcode…"
              className="w-full rounded-xl border border-admin-border bg-admin-bg py-2.5 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-orange focus:bg-white focus:shadow-[0_0_0_3px_rgba(253,118,0,.08)]"
            />
          </div>

          {/* Category filter */}
          <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }} className="rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-xs font-semibold text-navy outline-none focus:border-orange cursor-pointer">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Stock filter */}
          <select value={selectedStockStatus} onChange={e => { setSelectedStockStatus(e.target.value); setPage(1); }} className="rounded-xl border border-admin-border bg-admin-bg px-3 py-2.5 text-xs font-semibold text-navy outline-none focus:border-orange cursor-pointer">
            <option value="">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button onClick={fetchProducts} className="rounded-xl border border-admin-border bg-white p-2.5 text-admin-muted hover:text-navy transition-colors" aria-label="Refresh">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange/20 bg-orange/5 p-3 animate-slide-up">
            <span className="text-xs font-bold text-navy">{selectedIds.length} selected</span>
            <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="rounded-lg border border-admin-border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none">
              <option value="">Bulk action…</option>
              <option value="publish">Publish</option>
              <option value="draft">Move to Draft</option>
              <option value="stock_update">Update Stock</option>
              <option value="delete">Delete</option>
            </select>
            {bulkAction === "stock_update" && (
              <input type="number" value={bulkStockValue} onChange={e => setBulkStockValue(e.target.value)} placeholder="New qty" className="w-24 rounded-lg border border-admin-border bg-white px-2.5 py-1.5 text-xs font-bold outline-none" />
            )}
            <button onClick={handleBulk} className="rounded-lg bg-orange px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-dark transition-colors">Apply</button>
            <button onClick={() => { setSelectedIds([]); setBulkAction(""); }} className="ml-auto text-admin-muted hover:text-navy"><X size={14} /></button>
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-admin-border bg-white shadow-xs">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-admin-muted">
            <RefreshCw size={20} className="animate-spin-slow text-orange" />
            <span className="text-sm font-semibold">Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
            <Package size={36} className="text-admin-muted/50" />
            <p className="text-sm font-bold text-navy">No products found</p>
            <p className="text-xs text-admin-muted">Try adjusting your filters or add a new product.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b border-admin-border bg-admin-bg text-xs font-bold uppercase tracking-wider text-admin-muted">
              <tr>
                <th className="p-3 w-10">
                  <input type="checkbox" checked={selectedIds.length === products.length && products.length > 0} onChange={toggleAll} className="h-4 w-4 accent-orange cursor-pointer rounded" />
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
              {products.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const { cls: statusCls, label: statusLabel } = getStatusBadge(p);
                const imgSrc = p.featured_image
                  ? publicStorageUrl(p.featured_image)
                  : p.product_images?.[0]?.storage_path
                    ? publicStorageUrl(p.product_images[0].storage_path)
                    : "/placeholder-bake.svg";
                const catName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name;

                return (
                  <tr key={p.id} className={`transition-colors hover:bg-admin-bg/60 ${isSelected ? "bg-orange/3" : ""}`} onClick={() => setActiveMenu(null)}>
                    <td className="p-3">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleOne(p.id)} className="h-4 w-4 accent-orange cursor-pointer rounded" onClick={e => e.stopPropagation()} />
                    </td>

                    {/* Product name + thumbnail */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                          <Image src={imgSrc} alt={p.name} fill sizes="44px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate max-w-[200px] text-sm font-bold text-navy">{p.name}</p>
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

                    <td className="p-3 hidden md:table-cell">
                      <span className="text-xs font-medium text-admin-muted">{catName ?? "—"}</span>
                    </td>

                    <td className="p-3 hidden lg:table-cell">
                      <code className="rounded-md bg-admin-bg px-2 py-0.5 text-[11px] font-mono text-admin-muted">{p.sku ?? "—"}</code>
                    </td>

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

                    <td className="p-3 hidden md:table-cell">
                      <StockBar qty={p.stock_quantity} threshold={p.low_stock_threshold ?? 5} />
                    </td>

                    <td className="p-3">
                      <span className={statusCls}>{statusLabel}</span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === p.id ? null : p.id)}
                          className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-bg hover:text-navy transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenu === p.id && (
                          <div className="absolute right-0 top-8 z-50 w-44 overflow-hidden rounded-xl border border-admin-border bg-white shadow-lg animate-scale-in">
                            <button onClick={() => { setEditingProduct(p); setIsWizardOpen(true); setActiveMenu(null); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg">
                              <Pencil size={13} className="text-admin-muted" /> Edit Product
                            </button>
                            <button onClick={() => { setQuickEditProduct(p); setActiveMenu(null); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg">
                              <Eye size={13} className="text-admin-muted" /> Quick Edit
                            </button>
                            <button onClick={() => handleDuplicate(p)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg">
                              <Copy size={13} className="text-admin-muted" /> Duplicate
                            </button>
                            <div className="my-1 border-t border-admin-border" />
                            <button onClick={() => handleDelete(p)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                              <Trash2 size={13} /> Delete
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

      {/* ── Pagination ───────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-admin-muted">Page {page} of {totalPages} · {totalProducts} products</span>
          <div className="flex items-center gap-1.5">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-admin-border p-2 text-admin-muted hover:border-orange hover:text-orange disabled:opacity-30 transition-colors">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button key={pg} onClick={() => setPage(pg)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${pg === page ? "bg-orange text-white shadow-sm" : "border border-admin-border text-admin-muted hover:border-orange hover:text-orange"}`}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-admin-border p-2 text-admin-muted hover:border-orange hover:text-orange disabled:opacity-30 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Product Wizard ───────────────────────────── */}
      {isWizardOpen && (
        <ProductWizard
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => { setIsWizardOpen(false); setEditingProduct(null); }}
          onSaved={() => { setIsWizardOpen(false); setEditingProduct(null); fetchProducts(); showToast(editingProduct ? "Product updated" : "Product created"); }}
        />
      )}

      {/* ── Quick Edit Modal ─────────────────────────── */}
      {quickEditProduct && (
        <div className="modal-overlay" onClick={() => setQuickEditProduct(null)}>
          <form onSubmit={handleSaveQuickEdit} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-admin-border p-5">
              <h2 className="text-base font-bold text-navy">Quick Edit: <span className="text-orange">{quickEditProduct.name}</span></h2>
              <button type="button" onClick={() => setQuickEditProduct(null)} className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg"><XCircle size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-navy">Product Name</label>
                <input value={quickEditProduct.name} onChange={e => setQuickEditProduct({ ...quickEditProduct, name: e.target.value })} className="field-shell" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Regular Price (PKR)</label>
                  <input type="number" value={quickEditProduct.price} onChange={e => setQuickEditProduct({ ...quickEditProduct, price: Number(e.target.value) })} className="field-shell" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Sale Price (PKR)</label>
                  <input type="number" value={quickEditProduct.sale_price || ""} onChange={e => setQuickEditProduct({ ...quickEditProduct, sale_price: e.target.value ? Number(e.target.value) : null })} className="field-shell" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Stock Quantity</label>
                  <input type="number" value={quickEditProduct.stock_quantity} onChange={e => setQuickEditProduct({ ...quickEditProduct, stock_quantity: Number(e.target.value) })} className="field-shell" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-navy">Status</label>
                  <select value={quickEditProduct.status ?? (quickEditProduct.is_published ? "published" : "draft")} onChange={e => setQuickEditProduct({ ...quickEditProduct, status: e.target.value as any, is_published: e.target.value === "published" })} className="field-shell">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-admin-border p-5">
              <button type="button" onClick={() => setQuickEditProduct(null)} className="button-secondary">Cancel</button>
              <button type="submit" className="button-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <XCircle size={16} /> : <Check size={16} strokeWidth={3} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
