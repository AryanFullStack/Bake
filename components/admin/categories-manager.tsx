"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FolderPlus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Folder,
  ChevronRight,
  Upload,
  X,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  PackagePlus,
  ShoppingBag,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  icon_path?: string | null;
  banner_path?: string | null;
  sort_order: number;
  is_published: boolean;
  is_active?: boolean;
  parent?: { id: string; name: string; slug: string } | null;
}

export function AdminCategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  
  // Image uploads for modal
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (json.success) {
        setCategories(json.categories || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = (parentId: string | null = null) => {
    setEditingCategory({
      name: "",
      slug: "",
      description: "",
      parent_id: parentId,
      icon_path: null,
      banner_path: null,
      sort_order: categories.length + 1,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file: File, type: "icon" | "banner") => {
    if (type === "icon") setUploadingIcon(true);
    else setUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setEditingCategory((prev) => ({
          ...prev,
          [type === "icon" ? "icon_path" : "banner_path"]: json.data.url,
        }));
      } else {
        alert(json.error || "Image upload failed");
      }
    } catch (err) {
      alert("Error uploading image");
    } finally {
      if (type === "icon") setUploadingIcon(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return alert("Category name is required.");

    const isEdit = !!editingCategory.id;
    const url = "/api/admin/categories";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        alert(json.error || "Failed to save category.");
      }
    } catch (err) {
      alert("Save failed.");
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? Subcategories and products will be unassigned.`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchCategories();
      } else {
        alert(json.error || "Delete failed");
      }
    } catch (err) {
      alert("Delete failed");
    }
  };

  const toggleStatus = async (cat: Category) => {
    try {
      const newStatus = !cat.is_published;
      await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, is_published: newStatus }),
      });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const seedDefaultCategories = async () => {
    if (!confirm("Add standard Bake Mart Bazaar category presets (Bakery, Celebration Cakes, Pastries, Cupcakes, Home Décor, Kitchen, Watches, Baskets, Grocery)?")) return;
    setLoading(true);
    const presets = [
      { name: "Bakery", slug: "bakery", description: "Freshly baked cakes, pastries & desserts" },
      { name: "Celebration Cakes", slug: "cakes", description: "Custom & birthday celebration cakes", parent_name: "Bakery" },
      { name: "Pastries", slug: "pastries", description: "Fresh layered pastries & slices", parent_name: "Bakery" },
      { name: "Cupcakes", slug: "cupcakes", description: "Decorated gourmet cupcakes", parent_name: "Bakery" },
      { name: "Brownies & Cookies", slug: "cookies", description: "Fudge brownies & baked cookies", parent_name: "Bakery" },
      { name: "Home Decoration", slug: "home-decor", description: "Vases, wall art & decorative items" },
      { name: "Kitchen Essentials", slug: "kitchen", description: "Utensils, storage & accessories" },
      { name: "Watches", slug: "watches", description: "Classic & modern timepieces" },
      { name: "Baskets & Storage", slug: "baskets", description: "Organise your home beautifully" },
      { name: "Daily Essentials", slug: "daily-essentials", description: "Everyday grocery & household needs" },
    ];

    try {
      for (const preset of presets) {
        await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: preset.name,
            slug: preset.slug,
            description: preset.description,
            is_published: true,
          }),
        });
      }
      fetchCategories();
    } catch {
      alert("Seeding completed");
      fetchCategories();
    }
  };

  // Build hierarchy tree
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-navy/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Category Management</h1>
          <p className="text-sm text-admin-muted">
            Organize parent categories and subcategories across your bakery & e-commerce store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={seedDefaultCategories}
            className="flex items-center gap-1.5 rounded-xl border border-orange/30 bg-orange-light px-3.5 py-2.5 text-xs font-bold text-orange hover:bg-orange hover:text-white transition-all shadow-xs"
          >
            <Sparkles className="h-4 w-4" /> Seed Category Presets
          </button>
          <button
            onClick={() => openCreateModal(null)}
            className="flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-orange-dark"
          >
            <FolderPlus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-line bg-cream/40">
          <RefreshCw className="h-8 w-8 animate-spin text-orange" />
        </div>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((parent) => {
            const subs = getSubcategories(parent.id);
            return (
              <div
                key={parent.id}
                className="rounded-2xl border border-line bg-white p-4.5 shadow-xs"
              >
                {/* Parent Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy/5 pb-3">
                  <div className="flex items-center gap-3">
                    {parent.icon_path ? (
                      <img src={parent.icon_path} alt="" className="h-10 w-10 rounded-lg object-cover bg-cream-deep" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-light text-orange font-bold">
                        <Folder className="h-5 w-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-navy text-base">{parent.name}</h3>
                        <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-extrabold text-navy uppercase tracking-wider">
                          Parent
                        </span>
                        {!parent.is_published && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-admin-muted font-mono font-medium mt-0.5">/{parent.slug}</p>
                    </div>
                  </div>

                  {/* Parent Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products?category_id=${parent.id}`}
                      className="flex items-center gap-1.5 rounded-lg border border-navy/20 bg-white px-2.5 py-1.5 text-xs font-bold text-navy hover:border-orange hover:text-orange transition-colors"
                      title="View products in this category"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-orange" />
                      View Products
                    </Link>
                    <button
                      onClick={() => openCreateModal(parent.id)}
                      className="flex items-center gap-1 rounded-lg bg-orange-light px-2.5 py-1.5 text-xs font-bold text-orange hover:bg-orange hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Subcategory
                    </button>
                    <button
                      onClick={() => toggleStatus(parent)}
                      className="p-1.5 text-navy hover:text-orange transition-colors"
                      title={parent.is_published ? "Hide Category" : "Publish Category"}
                    >
                      {parent.is_published ? <Eye className="h-4 w-4 text-green" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEditModal(parent)}
                      className="p-1.5 text-navy hover:text-orange transition-colors"
                      title="Edit Category"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="p-1.5 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                {subs.length > 0 && (
                  <div className="mt-3 pl-6 space-y-2 border-l-2 border-orange/20">
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl bg-cream/40 p-2.5 hover:bg-orange-light/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <ChevronRight className="h-4 w-4 text-orange" />
                          {sub.icon_path ? (
                            <img src={sub.icon_path} alt="" className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <Folder className="h-4 w-4 text-navy" />
                          )}
                          <span className="text-xs font-bold text-navy">{sub.name}</span>
                          <span className="text-[10px] text-muted font-mono font-medium">/{sub.slug}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products?category_id=${sub.id}`}
                            className="flex items-center gap-1 rounded-md border border-navy/15 bg-white px-2 py-1 text-[11px] font-bold text-navy hover:text-orange transition-colors"
                          >
                            <ShoppingBag className="h-3 w-3 text-orange" />
                            Products
                          </Link>
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1 text-navy hover:text-orange transition-colors"
                            title="Edit Subcategory"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Delete Subcategory"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingCategory && (
        <div className="modal-overlay">
          <form
            onSubmit={handleSave}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-lg font-bold text-navy">
                {editingCategory.id ? "Edit Category" : "Create Category"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-navy mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ""}
                    onChange={(e) =>
                      setEditingCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      }))
                    }
                    placeholder="e.g. Celebration Cakes"
                    className="field-shell"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ""}
                    onChange={(e) => setEditingCategory((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. cakes"
                    className="field-shell font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={editingCategory.parent_id || ""}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, parent_id: e.target.value || null }))}
                  className="field-shell font-semibold cursor-pointer"
                >
                  <option value="">None (Top-level Parent Category)</option>
                  {parentCategories
                    .filter((p) => p.id !== editingCategory.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Short category description for storefront..."
                  className="field-shell"
                />
              </div>

              {/* Icon & Banner Uploads */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-navy mb-1">
                    Category Icon
                  </label>
                  {editingCategory.icon_path ? (
                    <div className="relative h-16 w-full rounded-xl overflow-hidden border border-line bg-cream/30">
                      <img src={editingCategory.icon_path} alt="" className="h-full w-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => setEditingCategory((prev) => ({ ...prev, icon_path: null }))}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingIcon}
                      onClick={() => iconInputRef.current?.click()}
                      className="flex h-16 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cream/40 text-navy hover:border-orange hover:bg-orange-light/20 transition-all"
                    >
                      {uploadingIcon ? <RefreshCw className="h-4 w-4 animate-spin text-orange" /> : <Upload className="h-4 w-4 mb-1 text-orange" />}
                      <span className="text-[10px] font-bold">Upload Icon</span>
                    </button>
                  )}
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "icon")}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">
                    Category Banner
                  </label>
                  {editingCategory.banner_path ? (
                    <div className="relative h-16 w-full rounded-xl overflow-hidden border border-line">
                      <img src={editingCategory.banner_path} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingCategory((prev) => ({ ...prev, banner_path: null }))}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex h-16 w-full flex-col items-center justify-center rounded-xl border border-dashed border-line bg-cream/40 text-navy hover:border-orange hover:bg-orange-light/20 transition-all"
                    >
                      {uploadingBanner ? <RefreshCw className="h-4 w-4 animate-spin text-orange" /> : <ImageIcon className="h-4 w-4 mb-1 text-orange" />}
                      <span className="text-[10px] font-bold">Upload Banner</span>
                    </button>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "banner")}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="button-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary text-xs px-5 py-2"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
