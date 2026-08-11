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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-navy/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy">Media Library</h1>
          <p className="text-sm text-admin-muted">
            Deployment-safe, WebP optimized persistent image storage for your e-commerce store.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMedia()}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-navy shadow-xs transition hover:border-orange hover:text-orange"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange" : ""}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="button-primary"
          >
            <Upload className="h-4 w-4" />
            Upload Media
          </button>
        </div>
      </div>

      {/* Storage Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-line bg-white p-4 shadow-xs flex items-center gap-4">
            <div className="rounded-lg bg-orange-light p-3 text-orange">
              <FileImage className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted">Total Media</p>
              <p className="text-xl font-extrabold text-navy">{stats.totalFiles} Files</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4 shadow-xs flex items-center gap-4">
            <div className="rounded-lg bg-green-light p-3 text-green">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted">Storage Used</p>
              <p className="text-xl font-extrabold text-navy">{formatBytes(stats.totalSizeBytes)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-white p-4 shadow-xs flex items-center gap-4">
            <div className="rounded-lg bg-orange-light p-3 text-orange">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-admin-muted">Active Folders</p>
              <p className="text-xl font-extrabold text-navy">{ALLOWED_FOLDERS.length} Categories</p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white p-4 rounded-xl border border-line shadow-xs">
        {/* Folder Filter Scrollable */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedFolder("all")}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
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
                className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedFolder === f
                    ? "bg-navy text-white shadow-xs"
                    : "bg-admin-bg text-admin-muted hover:bg-orange-light hover:text-orange"
                }`}
              >
                <span>{f}</span>
                <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-admin-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-shell pl-9 pr-3 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center rounded-lg border border-line bg-admin-bg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded p-1 transition ${
                viewMode === "grid" ? "bg-white text-orange shadow-xs font-bold" : "text-admin-muted hover:text-navy"
              }`}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded p-1 transition ${
                viewMode === "list" ? "bg-white text-orange shadow-xs font-bold" : "text-admin-muted hover:text-navy"
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
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-cream/30">
          <RefreshCw className="h-8 w-8 animate-spin text-orange" />
          <p className="mt-2 text-xs font-bold text-navy">
            Loading persistent media files...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white text-center p-6 shadow-xs">
          <FileImage className="h-12 w-12 text-admin-muted/40 mb-2" />
          <h3 className="text-base font-bold text-navy">No media found</h3>
          <p className="text-xs text-admin-muted max-w-sm mt-1">
            {searchQuery
              ? `No images matched "${searchQuery}". Try clearing your search query.`
              : "Upload images to populate your persistent storage directory."}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="button-primary mt-4 text-xs py-2 px-4"
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
              className="group relative flex flex-col rounded-2xl border border-line bg-white shadow-xs transition hover:shadow-md hover:border-orange/40 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square w-full bg-cream-deep overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlays & Quick Actions */}
                <div className="absolute inset-0 bg-navy/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center gap-2 p-2 backdrop-blur-xs">
                  <button
                    onClick={() => setSelectedItem(item)}
                    className="rounded-lg bg-white p-2 text-navy hover:bg-orange hover:text-white transition-colors"
                    title="Inspect & Edit"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(item.url)}
                    className="rounded-lg bg-white p-2 text-navy hover:bg-orange hover:text-white transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === item.url ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmItem(item)}
                    className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700 transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Format Badge */}
                <div className="absolute bottom-1.5 left-1.5 rounded bg-navy/80 px-1.5 py-0.5 text-[9px] font-extrabold text-white uppercase backdrop-blur-xs">
                  WebP
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <p className="text-xs font-bold text-navy truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] font-semibold text-admin-muted">
                  <span className="capitalize">{item.folder}</span>
                  <span>{formatBytes(item.size)}</span>
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
                <th className="p-3">Filename</th>
                <th className="p-3">Folder</th>
                <th className="p-3">File Size</th>
                <th className="p-3">Format</th>
                <th className="p-3">Date Uploaded</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {items.map((item) => (
                <tr key={item.relativePath} className="hover:bg-admin-bg/60 transition-colors">
                  <td className="p-2">
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-10 w-10 rounded-xl object-cover bg-cream-deep border border-line"
                    />
                  </td>
                  <td className="p-3 font-bold text-navy truncate max-w-xs">
                    {item.name}
                  </td>
                  <td className="p-3">
                    <span className="rounded-md bg-orange-light px-2 py-0.5 text-[11px] font-bold text-orange capitalize">
                      {item.folder}
                    </span>
                  </td>
                  <td className="p-3 text-admin-muted font-semibold">{formatBytes(item.size)}</td>
                  <td className="p-3 font-extrabold text-navy">WebP</td>
                  <td className="p-3 text-admin-muted font-medium">{formatDate(item.updatedAt)}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 text-admin-muted hover:text-navy transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(item.url)}
                        className="p-1.5 text-admin-muted hover:text-orange transition-colors"
                        title="Copy URL"
                      >
                        {copiedUrl === item.url ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
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
              <h2 className="text-lg font-bold text-navy">Upload Media</h2>
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
              {/* Folder Selector */}
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Target Storage Folder
                </label>
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

              {/* Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-orange bg-orange-light/40"
                    : "border-line bg-cream/40 hover:border-orange hover:bg-orange-light/20"
                }`}
              >
                <Upload className="h-10 w-10 text-orange mb-2" />
                <p className="text-xs font-bold text-navy">
                  Drag & drop images here, or click to browse
                </p>
                <p className="mt-1 text-[11px] text-admin-muted font-medium">
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
                <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-line p-3 bg-admin-bg">
                  {uploadingFiles.map((u, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-navy font-semibold">
                        {u.file.name}
                      </span>
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

      {/* INSPECT & DETAILS MODAL */}
      {selectedItem && (
        <div className="modal-overlay">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-lg font-bold text-navy truncate max-w-md">
                {selectedItem.name}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-admin-muted hover:bg-admin-bg hover:text-navy"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview Image */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-cream-deep p-4 overflow-hidden border border-line">
                <img
                  src={selectedItem.url}
                  alt={selectedItem.name}
                  className="max-h-64 rounded-xl object-contain shadow-xs"
                />
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs font-bold text-orange hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open full resolution
                </a>
              </div>

              {/* Metadata Details */}
              <div className="space-y-4 text-xs">
                <div className="space-y-2 rounded-xl bg-admin-bg p-3.5 border border-line">
                  <div className="flex justify-between">
                    <span className="font-semibold text-admin-muted">Folder:</span>
                    <span className="font-bold text-navy capitalize">/{selectedItem.folder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-admin-muted">File Size:</span>
                    <span className="font-bold text-navy">{formatBytes(selectedItem.size)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-admin-muted">Format:</span>
                    <span className="font-bold text-green">WebP (Optimized)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-admin-muted">Uploaded:</span>
                    <span className="font-medium text-navy">{formatDate(selectedItem.updatedAt)}</span>
                  </div>
                </div>

                {/* Copy URL */}
                <div>
                  <label className="block text-[11px] font-bold text-navy mb-1">
                    Image Public URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={selectedItem.url}
                      className="field-shell text-xs py-1.5"
                    />
                    <button
                      onClick={() => handleCopyUrl(selectedItem.url)}
                      className="button-primary text-xs px-3 py-2 shrink-0"
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
                    className="button-secondary text-xs flex-1 py-2"
                  >
                    {isReplacing ? "Replacing..." : "Replace Image"}
                  </button>

                  <button
                    onClick={() => {
                      setDeleteConfirmItem(selectedItem);
                    }}
                    className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
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
        <div className="modal-overlay">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-line animate-scale-in">
            <h3 className="text-base font-bold text-navy">Delete Image?</h3>
            <p className="mt-2 text-xs text-admin-muted font-medium">
              Are you sure you want to delete <span className="font-bold text-navy">{deleteConfirmItem.name}</span>? This file will be permanently removed from persistent storage.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmItem(null)}
                className="button-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmItem)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
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
