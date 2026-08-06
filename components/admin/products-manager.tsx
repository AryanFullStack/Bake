"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { formatPKR } from "@/lib/catalog";

type Row = any;

export function AdminProductsManager({
  initialProducts,
  categories,
  brands,
}: {
  initialProducts: Row[];
  categories: Row[];
  brands: Row[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<Row | null>(null);
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const base: any = Object.fromEntries(form.entries());
    base.tags = String(base.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    base.is_published = form.get("is_published") === "true";
    base.is_featured = form.get("is_featured") === "true";
    base.is_bestseller = form.get("is_bestseller") === "true";
    base.sale_price = base.sale_price || null;
    base.category_id = base.category_id || null;
    base.brand_id = base.brand_id || null;

    const response = editing?.id
      ? await fetch("/api/admin/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, id: editing.id }),
        })
      : await fetch("/api/admin/products", { method: "POST", body: form });

    if (!response.ok) {
      alert((await response.json()).error ?? "Could not save product");
      return;
    }
    window.location.reload();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this product? This action cannot be undone.")) return;
    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setProducts(products.filter((p) => p.id !== id));
  }

  async function toggle(product: Row) {
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description ?? "",
        price: product.price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        low_stock_threshold: product.low_stock_threshold,
        category_id: product.category_id,
        brand_id: product.brand_id,
        tags: product.tags ?? [],
        is_published: !product.is_published,
        is_featured: product.is_featured,
        is_bestseller: product.is_bestseller,
        seo_title: product.seo_title ?? "",
        seo_description: product.seo_description ?? "",
      }),
    });
    window.location.reload();
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange">
            Inventory & Catalog
          </p>
          <h1 className="mt-1 font-display text-4xl font-bold text-navy">Products</h1>
          <p className="mt-1 text-sm text-muted font-medium">
            {products.length} products loaded from Supabase database.
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 rounded-2xl bg-orange px-5 py-3 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {editing && (
        <ProductForm
          product={editing}
          categories={categories}
          brands={brands}
          onClose={() => setEditing(null)}
          onSubmit={save}
        />
      )}

      {!editing && (
        <div className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs">
          <div className="flex flex-wrap gap-3 border-b border-line pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full rounded-xl border border-line bg-cream/50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted font-bold">
                <tr>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Price</th>
                  <th className="pb-3">Stock Level</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {visible.map((p: Row) => (
                  <tr key={p.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-4 font-bold text-navy">{p.name}</td>
                    <td className="py-4 font-mono text-xs text-muted">{p.sku}</td>
                    <td className="py-4 text-muted font-medium">{p.categories?.name ?? "—"}</td>
                    <td className="py-4 font-extrabold text-navy">
                      {formatPKR(p.sale_price ?? p.price)}
                    </td>
                    <td
                      className={`py-4 font-extrabold ${
                        p.stock_quantity <= p.low_stock_threshold ? "text-orange" : "text-green"
                      }`}
                    >
                      {p.stock_quantity} in stock
                    </td>
                    <td className="py-4">
                      <button
                        onClick={() => toggle(p)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                          p.is_published ? "bg-green/10 text-green" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.is_published ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="mr-3 text-muted hover:text-orange transition-colors"
                        aria-label="Edit product"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="text-muted hover:text-red-500 transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <p className="p-8 text-center text-sm text-muted">No products match your query.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  brands,
  onClose,
  onSubmit,
}: {
  product: any;
  categories: any[];
  brands: any[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-md">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h2 className="font-display text-2xl font-bold text-navy">
          {product.id ? "Edit Product Details" : "Add New Bakery Product"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-cream p-2 text-muted hover:text-navy"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field name="name" label="Product Name" defaultValue={product.name} required />
        <Field name="slug" label="URL Slug" defaultValue={product.slug} required />
        <Field name="sku" label="SKU Code" defaultValue={product.sku} required />
        <Field name="price" label="Regular Price (PKR)" type="number" defaultValue={product.price} required />
        <Field name="sale_price" label="Sale Price (Optional)" type="number" defaultValue={product.sale_price ?? ""} />
        <Field
          name="stock_quantity"
          label="Stock Quantity"
          type="number"
          defaultValue={product.stock_quantity ?? 0}
          required
        />
        <Field
          name="low_stock_threshold"
          label="Low Stock Warning Limit"
          type="number"
          defaultValue={product.low_stock_threshold ?? 5}
          required
        />
        <label className="block text-xs font-bold uppercase tracking-wider text-navy">
          Category
          <select
            name="category_id"
            defaultValue={product.category_id ?? ""}
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none"
          >
            <option value="">Uncategorised</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-bold uppercase tracking-wider text-navy">
          Brand
          <select
            name="brand_id"
            defaultValue={product.brand_id ?? ""}
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none"
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <TextArea name="description" label="Product Description" defaultValue={product.description} />
      <Field name="tags" label="Tags (Comma Separated)" defaultValue={(product.tags ?? []).join(", ")} />

      <div className="mt-6 flex flex-wrap gap-6 text-sm font-bold text-navy">
        <Check name="is_published" label="Published (Show on Storefront)" checked={product.is_published} />
        <Check name="is_featured" label="Featured Product" checked={product.is_featured} />
        <Check name="is_bestseller" label="Bestseller Tag" checked={product.is_bestseller} />
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-cream/40 p-5 text-sm font-bold text-navy hover:border-orange hover:bg-orange/5 transition-all">
        <Upload size={20} className="text-orange" /> Upload Product Photos
        <input type="file" name="images" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" />
      </label>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-line px-6 py-3.5 text-sm font-bold text-navy hover:bg-cream transition-colors"
        >
          Cancel
        </button>
        <button className="rounded-2xl bg-orange px-8 py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all">
          Save Product
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
      {label} {required && <span className="text-orange">*</span>}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
      />
    </label>
  );
}

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-navy">
      {label}
      <textarea
        name={name}
        rows={3}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
      />
    </label>
  );
}

function Check({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" name={name} value="true" defaultChecked={checked} className="h-4 w-4 accent-orange cursor-pointer" />
      <span>{label}</span>
    </label>
  );
}
