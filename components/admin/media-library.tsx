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
} from "lucide-react";
import { ALLOWED_FOLDERS } from "@/lib/media/constants";

interface MediaItem {
  name: string;
  folder: string;
  relativePath: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

interface StatsData {
  totalFiles: number;
  totalSizeBytes: number;
  folders: Record<string, number>;
}

export function MediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
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

  // Inspector modal
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  
  // Delete confirm
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Replace image state
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [isReplacing, setIsReplacing] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = selectedFolder === "all" ? "" : `&folder=${selectedFolder}`;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/media/list?limit=100${folderParam}${searchParam}`);
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
  }, [selectedFolder, searchQuery]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCopyUrl = (url: string) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
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

    for (let i = 0; i < fileArray.length; i++) {
      const fileObj = fileArray[i];
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

    // Refresh media library after batch
    fetchMedia();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesUpload(e.dataTransfer.files);
    }
  };

  // Single file deletion
  const handleDelete = async (item: MediaItem) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/media/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((i) => i.relativePath !== item.relativePath));
        setDeleteConfirmItem(null);
        if (selectedItem?.relativePath === item.relativePath) {
          setSelectedItem(null);
        }
        fetchMedia();
      } else {
        alert(json.error || "Failed to delete image.");
      }
    } catch (err) {
      alert("Error deleting file.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Replace image handler
  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedItem) return;

    setIsReplacing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("oldUrl", selectedItem.url);
      formData.append("folder", selectedItem.folder);

      const res = await fetch("/api/media/replace", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        alert("Image replaced and optimized successfully!");
        setSelectedItem(null);
        fetchMedia();
      } else {
        alert(json.error || "Failed to replace image.");
      }
    } catch (err) {
      alert("Error replacing image.");
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-900/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-amber-950 dark:text-amber-50">Media Library</h1>
          <p className="text-sm text-amber-800/70 dark:text-amber-300/70">
            Deployment-safe, WebP optimized persistent image storage for your e-commerce store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMedia()}
            className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-amber-800"
          >
            <Upload className="h-4 w-4" />
            Upload Media
          </button>
        </div>
      </div>

      {/* Storage Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-4 dark:bg-amber-950/20 dark:border-amber-800/40 flex items-center gap-4">
            <div className="rounded-lg bg-amber-600/10 p-3 text-amber-700 dark:text-amber-400">
              <FileImage className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-800/60 dark:text-amber-400/60">Total Media</p>
              <p className="text-xl font-extrabold text-amber-950 dark:text-amber-100">{stats.totalFiles} Files</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-4 dark:bg-amber-950/20 dark:border-amber-800/40 flex items-center gap-4">
            <div className="rounded-lg bg-amber-600/10 p-3 text-amber-700 dark:text-amber-400">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-800/60 dark:text-amber-400/60">Storage Used</p>
              <p className="text-xl font-extrabold text-amber-950 dark:text-amber-100">{formatBytes(stats.totalSizeBytes)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-900/10 bg-amber-50/50 p-4 dark:bg-amber-950/20 dark:border-amber-800/40 flex items-center gap-4">
            <div className="rounded-lg bg-amber-600/10 p-3 text-amber-700 dark:text-amber-400">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-800/60 dark:text-amber-400/60">Active Folders</p>
              <p className="text-xl font-extrabold text-amber-950 dark:text-amber-100">{ALLOWED_FOLDERS.length} Categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-amber-950/40 p-4 rounded-xl border border-amber-900/10 shadow-sm">
        {/* Folder Filter Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedFolder("all")}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedFolder === "all"
                ? "bg-amber-700 text-white shadow"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-200"
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
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${
                  selectedFolder === f
                    ? "bg-amber-700 text-white shadow"
                    : "bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-200"
                }`}
              >
                <span>{f}</span>
                <span className="rounded-full bg-amber-950/10 px-1.5 py-0.5 text-[10px] opacity-80 dark:bg-amber-100/10">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-amber-800/40 dark:text-amber-300/40" />
            <input
              type="text"
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-amber-50/30 pl-9 pr-3 py-1.5 text-xs text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-100"
            />
          </div>

          <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50/50 p-1 dark:border-amber-800 dark:bg-amber-900/30">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 text-amber-900 transition dark:text-amber-100 ${
                viewMode === "grid" ? "bg-white shadow dark:bg-amber-800" : "opacity-60 hover:opacity-100"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1 text-amber-900 transition dark:text-amber-100 ${
                viewMode === "list" ? "bg-white shadow dark:bg-amber-800" : "opacity-60 hover:opacity-100"
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/20 dark:border-amber-800">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-700 dark:text-amber-400" />
          <p className="mt-2 text-sm font-medium text-amber-800/70 dark:text-amber-300/70">
            Loading persistent media files...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/10 text-center p-6">
          <FileImage className="h-12 w-12 text-amber-400 dark:text-amber-600 mb-2" />
          <h3 className="text-base font-bold text-amber-950 dark:text-amber-100">No media found</h3>
          <p className="text-xs text-amber-800/70 dark:text-amber-300/70 max-w-sm mt-1">
            {searchQuery
              ? `No images matched "${searchQuery}". Try clearing your search query.`
              : "Upload images to populate your persistent storage directory."}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-800"
          >
            <Plus className="h-4 w-4" />
            Upload First Image
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.relativePath}
              className="group relative flex flex-col rounded-xl border border-amber-900/10 bg-white dark:bg-amber-950/40 shadow-sm transition hover:shadow-md hover:border-amber-500 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square w-full bg-amber-100/40 dark:bg-amber-900/30 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlays & Quick Actions */}
                <div className="absolute inset-0 bg-amber-950/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center gap-2 p-2">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="rounded-lg bg-white/90 p-2 text-amber-950 hover:bg-white transition"
                    title="Inspect & Edit"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.url)}
                    className="rounded-lg bg-white/90 p-2 text-amber-950 hover:bg-white transition"
                    title="Copy URL"
                  >
                    {copiedUrl === item.url ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    className="rounded-lg bg-red-600/90 p-2 text-white hover:bg-red-600 transition"
                    title="Delete Image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Format Badge */}
                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-xs">
                  WebP
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-2.5 flex flex-col justify-between flex-1">
                <p className="text-xs font-semibold text-amber-950 dark:text-amber-100 truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-amber-800/60 dark:text-amber-300/60">
                  <span className="capitalize">{item.folder}</span>
                  <span>{formatBytes(item.size)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-x-auto rounded-xl border border-amber-900/10 bg-white dark:bg-amber-950/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-amber-900/10 bg-amber-50/50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200">
              <tr>
                <th className="p-3">Preview</th>
                <th className="p-3">Filename</th>
                <th className="p-3">Folder</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Format</th>
                <th className="p-3">Date Uploaded</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {items.map((item) => (
                <tr key={item.relativePath} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition">
                  <td className="p-2">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover bg-amber-100 dark:bg-amber-900/30"
                    />
                  </td>
                  <td className="p-3 font-semibold text-amber-950 dark:text-amber-100 truncate max-w-xs">
                    {item.name}
                  </td>
                  <td className="p-3">
                    <span className="rounded-md bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:text-amber-200 capitalize">
                      {item.folder}
                    </span>
                  </td>
                  <td className="p-3 text-amber-800/70 dark:text-amber-300/70">{formatBytes(item.size)}</td>
                  <td className="p-3 font-semibold text-amber-700 dark:text-amber-400">WebP</td>
                  <td className="p-3 text-amber-800/70 dark:text-amber-300/70">{formatDate(item.updatedAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1 text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(item.url)}
                        className="p-1 text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white"
                        title="Copy URL"
                      >
                        {copiedUrl === item.url ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-amber-950 dark:border dark:border-amber-800">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
              <h2 className="text-lg font-bold text-amber-950 dark:text-amber-50">Upload Media</h2>
              <button
                onClick={() => {
                  setIsUploadOpen(false);
                  setUploadingFiles([]);
                }}
                className="rounded-lg p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                  Target Storage Folder
                </label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  className="w-full rounded-lg border border-amber-300 bg-amber-50/50 p-2 text-xs font-semibold text-amber-950 focus:border-amber-600 focus:outline-none dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100 capitalize"
                >
                  {ALLOWED_FOLDERS.map((f) => (
                    <option key={f} value={f}>
                      /{f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
                  isDragging
                    ? "border-amber-600 bg-amber-100/50 dark:bg-amber-900/50"
                    : "border-amber-300 bg-amber-50/30 hover:bg-amber-100/30 dark:border-amber-800 dark:bg-amber-900/10"
                }`}
              >
                <Upload className="h-10 w-10 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
                  Drag & drop images here, or click to browse
                </p>
                <p className="mt-1 text-[11px] text-amber-800/60 dark:text-amber-400/60">
                  JPG, PNG, WEBP allowed (Max size: 5 MB). Automatically converted to WebP.
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

              {/* Progress & Queue */}
              {uploadingFiles.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-lg border border-amber-900/10 p-3 bg-amber-50/40 dark:bg-amber-900/20">
                  {uploadingFiles.map((u, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-amber-950 dark:text-amber-100 font-medium">
                        {u.file.name}
                      </span>
                      {u.status === "uploading" && (
                        <span className="flex items-center gap-1 text-amber-600 font-semibold animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Optimizing WebP...
                        </span>
                      )}
                      {u.status === "done" && (
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </span>
                      )}
                      {u.status === "error" && (
                        <span className="flex items-center gap-1 text-red-600 font-semibold" title={u.error}>
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
                className="rounded-lg bg-amber-900/10 px-4 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-900/20 dark:bg-amber-100/10 dark:text-amber-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & DETAILS MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-amber-950 dark:border dark:border-amber-800">
            <div className="flex items-center justify-between border-b border-amber-900/10 pb-4">
              <h2 className="text-lg font-bold text-amber-950 dark:text-amber-50 truncate max-w-md">
                {selectedItem.name}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Image */}
              <div className="flex flex-col items-center justify-center rounded-xl bg-amber-100/50 dark:bg-amber-900/30 p-4 overflow-hidden">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.name}
                  className="max-h-64 rounded-lg object-contain"
                />
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open full resolution
                </a>
              </div>

              {/* Metadata Details */}
              <div className="space-y-4 text-xs">
                <div className="space-y-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 p-3 border border-amber-900/10">
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-800/70 dark:text-amber-300/70">Folder:</span>
                    <span className="font-bold text-amber-950 dark:text-amber-100 capitalize">/{selectedItem.folder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-800/70 dark:text-amber-300/70">File Size:</span>
                    <span className="font-bold text-amber-950 dark:text-amber-100">{formatBytes(selectedItem.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-800/70 dark:text-amber-300/70">Format:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">WebP (Compressed ~80%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-amber-800/70 dark:text-amber-300/70">Uploaded:</span>
                    <span className="font-medium text-amber-950 dark:text-amber-100">{formatDate(selectedItem.updatedAt)}</span>
                  </div>
                </div>

                {/* Copy URL */}
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Image Public URL (Saved in Database)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedItem.url}
                      className="flex-1 rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 text-xs text-amber-950 focus:outline-none dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedItem.url)}
                      className="flex items-center gap-1 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-800"
                    >
                      {copiedUrl === selectedItem.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <input
                    ref={replaceInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleReplaceFileSelected}
                    className="hidden"
                  />
                  <button
                    disabled={isReplacing}
                    onClick={() => replaceInputRef.current?.click()}
                    className="flex-1 rounded-lg border border-amber-300 bg-amber-50 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-100"
                  >
                    {isReplacing ? "Replacing..." : "Replace Image"}
                  </button>

                  <button
                    onClick={() => {
                      setDeleteConfirmItem(selectedItem);
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-amber-950 dark:border dark:border-amber-800">
            <h3 className="text-base font-bold text-amber-950 dark:text-amber-50">Delete Image?</h3>
            <p className="mt-2 text-xs text-amber-800/70 dark:text-amber-300/70">
              Are you sure you want to delete <span className="font-bold">{deleteConfirmItem.name}</span>? This file will be permanently removed from Hostinger storage.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmItem(null)}
                className="rounded-lg bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmItem)}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
