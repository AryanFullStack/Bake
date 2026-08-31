"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Folder,
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileImage,
  HardDrive,
  X,
  Plus,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  Edit3,
  Save,
  Activity,
  Layers,
} from "lucide-react";
import { ALLOWED_FOLDERS } from "@/lib/media/constants";
import Link from "next/link";

interface MediaItem {
  id: string;
  filename: string;
  original_filename?: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  extension: string;
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  title?: string;
  folder: string;
  media_type: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  usages: {
    entityType: string;
    title: string;
    detail?: string;
    link?: string;
    entityId?: string;
    productId?: string;
  }[];
}

interface StatsData {
  totalFiles: number;
  totalSizeBytes: number;
  folders: Record<string, number>;
  counts: {
    products: number;
    categories: number;
    brands: number;
    banners: number;
    unused: number;
  };
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [selectedMediaType, setSelectedMediaType] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<string>("all"); // 'all' | 'used' | 'unused'
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Upload modal & state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>("products");
  const [uploadingFiles, setUploadingFiles] = useState<
    { file: File; progress: number; status: "pending" | "uploading" | "done" | "error"; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail Inspector Drawer / Modal
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [editAltText, setEditAltText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editFolder, setEditFolder] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Delete Safety confirmation modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Storage Health Modal
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Replace image state
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = selectedFolder !== "all" ? `&folder=${selectedFolder}` : "";
      const mediaTypeParam = selectedMediaType !== "all" ? `&mediaType=${selectedMediaType}` : "";
      const usageParam = usageFilter !== "all" ? `&usageFilter=${usageFilter}` : "";
      const sortParam = `&sort=${sortOrder}`;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";

      const res = await fetch(
        `/api/media/list?limit=100${folderParam}${mediaTypeParam}${usageParam}${sortParam}${searchParam}`
      );
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
        setStats(json.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, selectedMediaType, usageFilter, sortOrder, searchQuery]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const openInspector = (item: MediaItem) => {
    setSelectedItem(item);
    setEditAltText(item.alt_text || "");
    setEditTitle(item.title || item.filename);
    setEditFolder(item.folder);
  };

  const handleSaveMetadata = async () => {
    if (!selectedItem) return;
    setIsSavingMeta(true);
    try {
      const res = await fetch("/api/media/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          path: selectedItem.storage_path,
          altText: editAltText,
          title: editTitle,
          folder: editFolder,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedItem((prev) =>
          prev
            ? {
                ...prev,
                alt_text: editAltText,
                title: editTitle,
                folder: editFolder,
              }
            : null
        );
        fetchMedia();
      } else {
        alert(json.error || "Failed to update metadata.");
      }
    } catch (err) {
      alert("Error updating metadata.");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    const fullUrl = url.startsWith("http") ? url : window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Upload handler
  const processFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newUploadState = fileArray.map((f) => ({
      file: f,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadState]);

    for (const fileObj of fileArray) {
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("folder", uploadFolder);

      setUploadingFiles((prev) =>
        prev.map((item) => (item.file === fileObj ? { ...item, status: "uploading", progress: 40 } : item))
      );

      try {
        const res = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (json.success) {
          setUploadingFiles((prev) =>
            prev.map((item) => (item.file === fileObj ? { ...item, status: "done", progress: 100 } : item))
          );
        } else {
          setUploadingFiles((prev) =>
            prev.map((item) =>
              item.file === fileObj ? { ...item, status: "error", error: json.error || "Upload failed" } : item
            )
          );
        }
      } catch (err: any) {
        setUploadingFiles((prev) =>
          prev.map((item) =>
            item.file === fileObj ? { ...item, status: "error", error: err.message || "Network error" } : item
          )
        );
      }
    }

    fetchMedia();
  };

  const handleDelete = async (item: MediaItem, force: boolean = false) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.public_url || item.storage_path,
          forceRemoveReferences: force,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.storage_path !== item.storage_path));
        setDeleteConfirmItem(null);
        if (selectedItem?.storage_path === item.storage_path) {
          setSelectedItem(null);
        }
        fetchMedia();
      } else {
        setDeleteError(json.error || "Failed to delete image.");
      }
    } catch (err) {
      setDeleteError("Error communicating with server.");
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchHealthReport = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/media/health");
      const json = await res.json();
      if (json.success) {
        setHealthData(json.data);
      }
    } catch (err) {
      console.error("Failed health check:", err);
    } finally {
      setLoadingHealth(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
      {/* Header & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-navy/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Central Media Library</h1>
          <p className="text-sm text-admin-muted">
            Hostinger VPS persistent WebP image manager with database reference resolution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsHealthOpen(true);
              fetchHealthReport();
            }}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-xs transition hover:border-orange hover:text-orange"
          >
            <Activity className="h-4 w-4 text-orange" />
            Storage Health
          </button>

          <button
            onClick={() => fetchMedia()}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-semibold text-navy shadow-xs transition hover:border-orange hover:text-orange"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange" : ""}`} />
            Sync & Refresh
          </button>

          <button onClick={() => setIsUploadOpen(true)} className="button-primary">
            <Upload className="h-4 w-4" />
            Upload Media
          </button>
        </div>
      </div>

      {/* Storage Dashboard Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs flex items-center gap-3">
            <div className="rounded-lg bg-orange-light p-2.5 text-orange shrink-0">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Total Media</p>
              <p className="text-lg font-extrabold text-navy">{stats.totalFiles} Files</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs flex items-center gap-3">
            <div className="rounded-lg bg-green-light p-2.5 text-green shrink-0">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">VPS Disk Storage</p>
              <p className="text-lg font-extrabold text-navy">{formatBytes(stats.totalSizeBytes)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs flex items-center gap-3">
            <div className="rounded-lg bg-orange-light p-2.5 text-orange shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Products</p>
              <p className="text-lg font-extrabold text-navy">{stats.counts?.products || 0} Images</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs flex items-center gap-3">
            <div className="rounded-lg bg-cream-deep p-2.5 text-navy shrink-0">
              <Folder className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Categories & Brands</p>
              <p className="text-lg font-extrabold text-navy">
                {(stats.counts?.categories || 0) + (stats.counts?.brands || 0)} Images
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-3.5 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="rounded-lg bg-admin-bg p-2.5 text-admin-muted shrink-0">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-admin-muted">Unused Images</p>
              <p className="text-lg font-extrabold text-navy">{stats.counts?.unused || 0} Files</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Multi-Filter Bar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-line shadow-xs">
        {/* Top filter row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Folders scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
            <button
              onClick={() => setSelectedFolder("all")}
              className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                selectedFolder === "all"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-admin-bg text-admin-muted hover:bg-orange-light hover:text-orange"
              }`}
            >
              All Folders
            </button>
            {ALLOWED_FOLDERS.map((f) => {
              const count = stats?.folders?.[f] || 0;
              return (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`whitespace-nowrap rounded-lg px-3 py-1 text-xs font-bold transition-all flex items-center gap-1.5 ${
                    selectedFolder === f
                      ? "bg-navy text-white shadow-xs"
                      : "bg-admin-bg text-admin-muted hover:bg-orange-light hover:text-orange"
                  }`}
                >
                  <span>{f}</span>
                  <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-line bg-admin-bg p-1 shrink-0 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 transition ${
                viewMode === "grid"
                  ? "bg-white text-orange shadow-xs font-bold"
                  : "text-admin-muted hover:text-navy"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1 transition ${
                viewMode === "list"
                  ? "bg-white text-orange shadow-xs font-bold"
                  : "text-admin-muted hover:text-navy"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-line/60">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, filename, alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-shell pl-9 pr-3 py-1.5 text-xs"
            />
          </div>

          {/* Media Type Filter */}
          <select
            value={selectedMediaType}
            onChange={(e) => setSelectedMediaType(e.target.value)}
            className="field-shell text-xs py-1.5 font-semibold capitalize"
          >
            <option value="all">All Media Types</option>
            <option value="product">Products</option>
            <option value="category">Categories</option>
            <option value="brand">Brands</option>
            <option value="banner">Banners</option>
            <option value="blog">Blog</option>
            <option value="custom-cake">Custom Cakes</option>
            <option value="user">User Avatars</option>
            <option value="gallery">General Gallery</option>
          </select>

          {/* Usage Filter */}
          <select
            value={usageFilter}
            onChange={(e) => setUsageFilter(e.target.value)}
            className="field-shell text-xs py-1.5 font-semibold"
          >
            <option value="all">All Usage States</option>
            <option value="used">Used Images Only</option>
            <option value="unused">Unused Images Only</option>
          </select>

          {/* Sorting */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="field-shell text-xs py-1.5 font-semibold"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="largest">Sort: File Size (Largest)</option>
            <option value="smallest">Sort: File Size (Smallest)</option>
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="name_desc">Sort: Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream/30">
          <RefreshCw className="h-8 w-8 animate-spin text-orange" />
          <p className="mt-2 text-xs font-bold text-navy">Retrieving media & resolving database usages...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white text-center p-6 shadow-xs">
          <FileImage className="h-12 w-12 text-admin-muted/40 mb-2" />
          <h3 className="text-base font-bold text-navy">No media found</h3>
          <p className="text-xs text-admin-muted max-w-sm mt-1">
            {searchQuery || selectedFolder !== "all" || usageFilter !== "all"
              ? "No images matched your active search or filter criteria. Try clearing filters."
              : "Upload images to populate your persistent Hostinger VPS media library."}
          </p>
          <button onClick={() => setIsUploadOpen(true)} className="button-primary mt-4 text-xs py-2 px-4">
            <Plus className="h-4 w-4" />
            Upload First Image
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.storage_path}
              className="group relative flex flex-col rounded-2xl border border-line bg-white shadow-xs transition hover:shadow-md hover:border-orange/40 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square w-full bg-cream-deep overflow-hidden">
                <img
                  src={item.public_url}
                  alt={item.title || item.filename}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlays & Quick Actions */}
                <div className="absolute inset-0 bg-navy/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                  <button
                    onClick={() => openInspector(item)}
                    className="rounded-lg bg-white p-2 text-navy hover:bg-orange hover:text-white transition-colors"
                    title="Inspect & View Usages"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.public_url)}
                    className="rounded-lg bg-white p-2 text-navy hover:bg-orange hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === item.public_url ? (
                      <Check className="h-4 w-4 text-green" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirmItem(item);
                      setDeleteError(null);
                    }}
                    className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Usage Badge */}
                {item.usage_count > 0 ? (
                  <div className="absolute top-2 right-2 rounded-full bg-orange px-2 py-0.5 text-[9.5px] font-extrabold text-white shadow-xs">
                    Used ({item.usage_count})
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[9.5px] font-bold text-white/80 shadow-xs">
                    Unused
                  </div>
                )}

                {/* Format Badge */}
                <div className="absolute bottom-1.5 left-1.5 rounded bg-navy/80 px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase backdrop-blur-xs">
                  WebP
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <p className="text-xs font-bold text-navy truncate" title={item.title || item.filename}>
                  {item.title || item.filename}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-admin-muted">
                  <span className="capitalize">{item.folder}</span>
                  <span>{formatBytes(item.file_size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-admin-bg text-admin-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Preview</th>
                <th className="p-3">Filename / Title</th>
                <th className="p-3">Folder</th>
                <th className="p-3">Dimensions</th>
                <th className="p-3">Size</th>
                <th className="p-3">Database Usage</th>
                <th className="p-3">Date Uploaded</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {items.map((item) => (
                <tr key={item.storage_path} className="hover:bg-admin-bg/60 transition-colors">
                  <td className="p-2">
                    <img
                      src={item.public_url}
                      alt={item.filename}
                      className="h-10 w-10 rounded-xl object-cover bg-cream-deep border border-line"
                    />
                  </td>
                  <td className="p-3 font-bold text-navy truncate max-w-xs">
                    <div>{item.title || item.filename}</div>
                    {item.alt_text && (
                      <span className="text-[10px] text-admin-muted font-normal italic">
                        Alt: {item.alt_text}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="rounded-md bg-orange-light px-2 py-0.5 text-[11px] font-bold text-orange capitalize">
                      {item.folder}
                    </span>
                  </td>
                  <td className="p-3 text-admin-muted font-semibold">
                    {item.width && item.height ? `${item.width} × ${item.height}` : "Optimized"}
                  </td>
                  <td className="p-3 text-admin-muted font-semibold">{formatBytes(item.file_size)}</td>
                  <td className="p-3 font-extrabold">
                    {item.usage_count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-light px-2.5 py-0.5 text-[11px] text-green">
                        <Check className="h-3 w-3" /> Used in {item.usage_count} place(s)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] text-admin-muted">
                        Unused
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-admin-muted font-medium">{formatDate(item.created_at)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openInspector(item)}
                        className="p-1.5 text-admin-muted hover:text-navy transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(item.public_url)}
                        className="p-1.5 text-admin-muted hover:text-orange transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === item.public_url ? (
                          <Check className="h-4 w-4 text-green" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setDeleteConfirmItem(item);
                          setDeleteError(null);
                        }}
                        className="p-1.5 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="modal-overlay">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-lg font-bold text-navy">Upload Media to Hostinger VPS</h2>
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadingFiles([]);
                }}
                className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">Target Storage Directory</label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  className="field-shell font-semibold cursor-pointer capitalize"
                >
                  {ALLOWED_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      /{f}
                    </option>
                  ))}
                </select>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) processFilesUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-orange bg-orange-light/40"
                    : "border-line bg-cream/40 hover:border-orange hover:bg-orange-light/20"
                }`}
              >
                <Upload className="h-10 w-10 text-orange mb-2" />
                <p className="text-xs font-bold text-navy">Drag & drop images here, or click to browse</p>
                <p className="mt-1 text-[11px] text-admin-muted font-medium">
                  JPG, PNG, WEBP allowed (Max size: 5 MB). Converted to WebP on external VPS storage.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && processFilesUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {uploadingFiles.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-line p-3 bg-admin-bg">
                  {uploadingFiles.map((u, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-navy font-semibold">{u.file.name}</span>
                      {u.status === "uploading" && (
                        <span className="flex items-center gap-1 text-orange font-bold animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Optimizing WebP...
                        </span>
                      )}
                      {u.status === "done" && (
                        <span className="flex items-center gap-1 text-green font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </span>
                      )}
                      {u.status === "error" && (
                        <span className="flex items-center gap-1 text-red-600 font-bold" title={u.error}>
                          <AlertCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadingFiles([]);
                }}
                className="button-secondary text-xs px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & DETAILS MODAL WITH "USED IN" SECTION */}
      {selectedItem && (
        <div className="modal-overlay z-50">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-navy truncate max-w-lg">
                  {selectedItem.title || selectedItem.filename}
                </h2>
                <p className="text-xs text-admin-muted font-mono">{selectedItem.storage_path}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Large Image Preview */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-cream-deep p-4 border border-line">
                <img
                  src={selectedItem.public_url}
                  alt={selectedItem.title || selectedItem.filename}
                  className="max-h-72 rounded-xl object-contain shadow-xs"
                />
                <a
                  href={selectedItem.public_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs font-bold text-orange hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open full resolution WebP
                </a>
              </div>

              {/* Right Column: Metadata & Usages */}
              <div className="lg:col-span-7 space-y-4 text-xs">
                {/* Editable fields */}
                <div className="space-y-3 bg-admin-bg p-3.5 rounded-xl border border-line">
                  <div className="flex items-center justify-between font-bold text-navy border-b border-line/60 pb-2">
                    <span>Image Metadata</span>
                    <button
                      disabled={isSavingMeta}
                      onClick={handleSaveMetadata}
                      className="button-primary text-xs py-1 px-3 flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Changes
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy mb-1">Image Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="field-shell text-xs py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-navy mb-1">Alt Text (SEO & Accessibility)</label>
                    <input
                      type="text"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      placeholder="Descriptive alt text for search engine optimization..."
                      className="field-shell text-xs py-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="font-semibold text-admin-muted">File Size:</span>
                      <p className="font-bold text-navy">{formatBytes(selectedItem.file_size)}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-admin-muted">Format:</span>
                      <p className="font-bold text-green">WebP (Optimized)</p>
                    </div>
                  </div>
                </div>

                {/* Copy URL */}
                <div>
                  <label className="block text-[11px] font-bold text-navy mb-1">Public URL</label>
                  <div className="flex items-center gap-2">
                    <input type="text" readOnly value={selectedItem.public_url} className="field-shell text-xs py-1.5" />
                    <button
                      onClick={() => handleCopyUrl(selectedItem.public_url)}
                      className="button-primary text-xs px-3 py-2 shrink-0"
                    >
                      {copiedUrl === selectedItem.public_url ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* ── USED IN SECTION (Interactive links) ── */}
                <div className="space-y-2 rounded-xl border border-line p-3.5 bg-white shadow-xs">
                  <div className="flex items-center justify-between font-bold text-navy border-b border-line pb-2">
                    <span>Used In ({selectedItem.usage_count} Entities)</span>
                    {selectedItem.usage_count > 0 ? (
                      <span className="rounded-full bg-green-light px-2 py-0.5 text-[10px] text-green font-extrabold">
                        Active Reference
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] text-admin-muted font-bold">
                        Unused File
                      </span>
                    )}
                  </div>

                  {selectedItem.usage_count === 0 ? (
                    <p className="text-xs text-admin-muted py-2">
                      This image is currently not attached to any product, category, brand, or banner. It can be safely deleted or attached to a new entity.
                    </p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto space-y-2 pt-1 scrollbar-thin">
                      {selectedItem.usages?.map((u, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-admin-bg p-2.5 rounded-lg border border-line/60">
                          <div>
                            <p className="text-xs font-bold text-navy">{u.title}</p>
                            <p className="text-[10px] text-admin-muted">{u.detail}</p>
                          </div>
                          {u.link && (
                            <Link
                              href={u.link}
                              className="button-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 shrink-0"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setDeleteConfirmItem(selectedItem);
                      setDeleteError(null);
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors w-full"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SAFETY CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="modal-overlay z-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <ShieldAlert className="h-7 w-7 shrink-0" />
              <h3 className="text-base font-bold text-navy">Delete Image Safety Alert</h3>
            </div>

            <p className="text-xs text-admin-muted font-medium">
              Are you sure you want to delete <span className="font-bold text-navy">{deleteConfirmItem.filename}</span>?
            </p>

            {deleteConfirmItem.usage_count > 0 && (
              <div className="mt-3 rounded-xl bg-red-50 p-3.5 border border-red-200">
                <p className="text-xs font-bold text-red-800">
                  Warning: This image is currently used in {deleteConfirmItem.usage_count} location(s):
                </p>
                <ul className="mt-2 max-h-32 overflow-y-auto text-[11px] text-red-700 space-y-1 pl-4 list-disc font-medium">
                  {deleteConfirmItem.usages?.map((u, i) => (
                    <li key={i}>{u.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {deleteError && (
              <div className="mt-3 rounded-xl bg-red-100 p-2.5 text-xs font-bold text-red-800">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
              <button
                disabled={isDeleting}
                onClick={() => {
                  setDeleteConfirmItem(null);
                  setDeleteError(null);
                }}
                className="button-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>

              {deleteConfirmItem.usage_count > 0 ? (
                <button
                  disabled={isDeleting}
                  onClick={() => handleDelete(deleteConfirmItem, true)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                >
                  {isDeleting ? "Cleaning References..." : "Remove All References & Delete"}
                </button>
              ) : (
                <button
                  disabled={isDeleting}
                  onClick={() => handleDelete(deleteConfirmItem, false)}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                >
                  {isDeleting ? "Deleting..." : "Delete Permanently"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STORAGE HEALTH DIAGNOSTIC PANEL MODAL */}
      {isHealthOpen && (
        <div className="modal-overlay z-50">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2 text-navy">
                <Activity className="h-5 w-5 text-orange" />
                <h2 className="text-lg font-bold">Hostinger VPS Storage Health</h2>
              </div>
              <button onClick={() => setIsHealthOpen(false)} className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingHealth ? (
              <div className="flex h-48 flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-orange" />
                <p className="mt-2 text-xs font-bold text-navy">Running diagnostic health scan...</p>
              </div>
            ) : healthData ? (
              <div className="mt-4 space-y-4 text-xs">
                {/* Gauge bar */}
                <div className="bg-admin-bg p-4 rounded-xl border border-line">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-navy">Estimated Storage Usage</span>
                    <span className="font-extrabold text-navy">{healthData.usagePercent}% Used</span>
                  </div>
                  <div className="w-full bg-line rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        healthData.usagePercent > 80 ? "bg-red-600" : "bg-green"
                      }`}
                      style={{ width: `${healthData.usagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Health Checks Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-line bg-white">
                    <p className="text-admin-muted font-semibold">Orphan VPS Files</p>
                    <p className="text-xl font-extrabold text-navy">{healthData.orphanFilesCount} Files</p>
                    <p className="text-[10px] text-admin-muted mt-0.5">Files on VPS with no entity link</p>
                  </div>

                  <div className="p-3 rounded-xl border border-line bg-white">
                    <p className="text-admin-muted font-semibold">Missing Physical Files</p>
                    <p className="text-xl font-extrabold text-navy">{healthData.missingPhysicalFilesCount} Files</p>
                    <p className="text-[10px] text-admin-muted mt-0.5">DB records with missing disk file</p>
                  </div>
                </div>

                {healthData.orphanFiles?.length > 0 && (
                  <div className="rounded-xl border border-line p-3 bg-cream/40 max-h-36 overflow-y-auto">
                    <p className="font-bold text-navy mb-1">Unreferenced Orphan Files on VPS:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-admin-muted font-mono text-[11px]">
                      {healthData.orphanFiles.slice(0, 10).map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setIsHealthOpen(false)} className="button-secondary text-xs px-4 py-2">
                Close Health Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
