"use client";

import { useState, useEffect, useRef } from "react";
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

  // Build hierarchy tree
  const parentCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-900/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-amber-950 dark:text-amber-50">Category Management</h1>
          <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
            Organize parent categories and subcategories across your bakery & e-commerce store.
          </p>
        </div>

        <button
          onClick={() => openCreateModal(null)}
          className="flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-amber-800"
        >
          <FolderPlus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Category List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/20">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-700" />
        </div>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((parent) => {
            const subs = getSubcategories(parent.id);
            return (
              <div
                key={parent.id}
                className="rounded-2xl border border-amber-900/10 bg-white p-4 shadow-sm dark:bg-amber-950/40"
              >
                {/* Parent Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-900/5 pb-3">
                  <div className="flex items-center gap-3">
                    {parent.icon_path ? (
                      <img src={parent.icon_path} alt="" className="h-10 w-10 rounded-lg object-cover bg-amber-100" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                        <Folder className="h-5 w-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-amber-950 dark:text-amber-100">{parent.name}</h3>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Parent
                        </span>
                        {!parent.is_published && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-800/60 dark:text-amber-400/60 font-mono">/{parent.slug}</p>
                    </div>
                  </div>

                  {/* Parent Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCreateModal(parent.id)}
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200"
                    >
                      <Plus className="h-3.5 w-3.5" /> Subcategory
                    </button>
                    <button
                      onClick={() => toggleStatus(parent)}
                      className="p-1.5 text-amber-800 hover:text-amber-950 dark:text-amber-300"
                      title={parent.is_published ? "Hide Category" : "Publish Category"}
                    >
                      {parent.is_published ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEditModal(parent)}
                      className="p-1.5 text-amber-800 hover:text-amber-950 dark:text-amber-300"
                      title="Edit Category"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="p-1.5 text-red-600 hover:text-red-700"
                      title="Delete Category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories List */}
                {subs.length > 0 && (
                  <div className="mt-3 pl-6 space-y-2 border-l-2 border-amber-200 dark:border-amber-800">
                    {subs.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between rounded-xl bg-amber-50/40 p-2.5 dark:bg-amber-900/10 hover:bg-amber-50 transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <ChevronRight className="h-4 w-4 text-amber-500" />
                          {sub.icon_path ? (
                            <img src={sub.icon_path} alt="" className="h-7 w-7 rounded object-cover" />
                          ) : (
                            <Folder className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                          )}
                          <span className="text-xs font-semibold text-amber-950 dark:text-amber-100">{sub.name}</span>
                          <span className="text-[10px] text-amber-800/50 dark:text-amber-400/50 font-mono">/{sub.slug}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(sub)}
                            className="p-1 text-amber-800 hover:text-amber-950 dark:text-amber-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub)}
                            className="p-1 text-red-600 hover:text-red-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-amber-950 dark:border dark:border-amber-800"
          >
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
              <h2 className="text-lg font-bold text-amber-950 dark:text-amber-50">
                {editingCategory.id ? "Edit Category" : "Create Category"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">
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
                    placeholder="e.g. Custom Cakes"
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={editingCategory.slug || ""}
                    onChange={(e) => setEditingCategory((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={editingCategory.parent_id || ""}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, parent_id: e.target.value || null }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs font-semibold text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
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
                <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
                />
              </div>

              {/* Icon & Banner Uploads */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">
                    Category Icon
                  </label>
                  {editingCategory.icon_path ? (
                    <div className="relative h-16 w-full rounded-lg overflow-hidden border border-amber-200">
                      <img src={editingCategory.icon_path} alt="" className="h-full w-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => setEditingCategory((prev) => ({ ...prev, icon_path: null }))}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingIcon}
                      onClick={() => iconInputRef.current?.click()}
                      className="flex h-16 w-full flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100"
                    >
                      {uploadingIcon ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mb-1" />}
                      <span className="text-[10px]">Upload Icon</span>
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
                  <label className="block font-semibold text-amber-950 dark:text-amber-100 mb-1">
                    Category Banner
                  </label>
                  {editingCategory.banner_path ? (
                    <div className="relative h-16 w-full rounded-lg overflow-hidden border border-amber-200">
                      <img src={editingCategory.banner_path} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditingCategory((prev) => ({ ...prev, banner_path: null }))}
                        className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploadingBanner}
                      onClick={() => bannerInputRef.current?.click()}
                      className="flex h-16 w-full flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100"
                    >
                      {uploadingBanner ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4 mb-1" />}
                      <span className="text-[10px]">Upload Banner</span>
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

            <div className="mt-6 flex justify-end gap-3 border-t border-amber-900/10 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-700 px-5 py-2 text-xs font-bold text-white shadow hover:bg-amber-800"
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
