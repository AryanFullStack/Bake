"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Search,
  Upload,
  Check,
  Folder,
  RefreshCw,
  FileImage,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { ALLOWED_FOLDERS } from "@/lib/media/constants";

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[], items: any[]) => void;
  multiSelect?: boolean;
  initialFolder?: string;
  title?: string;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  multiSelect = false,
  initialFolder = "all",
  title = "Choose From Media Library",
}: MediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  // Upload State
  const [uploadFolder, setUploadFolder] = useState<string>(
    initialFolder === "all" ? "products" : initialFolder
  );
  const [uploadingFiles, setUploadingFiles] = useState<
    { file: File; progress: number; status: "pending" | "uploading" | "done" | "error"; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const folderParam = selectedFolder !== "all" ? `&folder=${selectedFolder}` : "";
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/media/list?limit=80${folderParam}${searchParam}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch media in picker:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
      setSelectedItems([]);
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  const handleToggleSelect = (item: any) => {
    if (multiSelect) {
      setSelectedItems((prev) =>
        prev.some((i) => i.public_url === item.public_url)
          ? prev.filter((i) => i.public_url !== item.public_url)
          : [...prev, item]
      );
    } else {
      setSelectedItems([item]);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedItems.length === 0) return;
    const urls = selectedItems.map((i) => i.public_url || i.url);
    onSelect(urls, selectedItems);
    onClose();
  };

  // Upload Processing
  const processFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newUploadState = fileArray.map((f) => ({
      file: f,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadState]);

    const newlyUploadedItems: any[] = [];

    for (const fileObj of fileArray) {
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("folder", uploadFolder);

      setUploadingFiles((prev) =>
        prev.map((item) => (item.file === fileObj ? { ...item, status: "uploading", progress: 50 } : item))
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
          if (json.data) {
            const uploadedItem = Array.isArray(json.data) ? json.data[0] : json.data;
            newlyUploadedItems.push({
              public_url: uploadedItem.url,
              storage_path: uploadedItem.relativePath,
              filename: uploadedItem.filename,
            });
          }
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

    if (newlyUploadedItems.length > 0) {
      await fetchMedia();
      if (!multiSelect) {
        setSelectedItems(newlyUploadedItems);
      } else {
        setSelectedItems((prev) => [...prev, ...newlyUploadedItems]);
      }
      setTimeout(() => setActiveTab("library"), 800);
    }
  };

  return (
    <div className="modal-overlay z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-line flex flex-col h-[80vh] max-h-[720px] animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h2 className="text-lg font-bold text-navy">{title}</h2>
            <p className="text-xs text-admin-muted">
              Select existing images from ImageKit CDN / Media Library or upload new ones.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-bg hover:text-navy transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex items-center justify-between border-b border-line pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("library")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === "library"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-admin-bg text-admin-muted hover:text-navy"
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-admin-bg text-admin-muted hover:text-navy"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload New
            </button>
          </div>

          {/* Search & Folder filters for Library Tab */}
          {activeTab === "library" && (
            <div className="flex items-center gap-3">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="field-shell text-xs py-1 px-2.5 font-semibold capitalize"
              >
                <option value="all">All Folders</option>
                {ALLOWED_FOLDERS.map((f) => (
                  <option key={f} value={f}>
                    /{f}
                  </option>
                ))}
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-admin-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search image..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="field-shell pl-8 pr-2.5 py-1 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {activeTab === "library" ? (
            loading ? (
              <div className="flex h-full flex-col items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-orange" />
                <p className="mt-2 text-xs font-bold text-navy">Loading media files...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6">
                <FileImage className="h-12 w-12 text-admin-muted/40 mb-2" />
                <p className="text-sm font-bold text-navy">No media items found</p>
                <p className="text-xs text-admin-muted mt-1 max-w-xs">
                  {searchQuery
                    ? `No images matched "${searchQuery}".`
                    : "Upload images to populate your library."}
                </p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="button-primary mt-4 text-xs py-1.5 px-3"
                >
                  <Plus className="h-3.5 w-3.5" /> Upload Image
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {items.map((item) => {
                  const url = item.public_url || item.url;
                  const isSelected = selectedItems.some((i) => (i.public_url || i.url) === url);

                  return (
                    <div
                      key={item.id || item.storage_path || url}
                      onClick={() => handleToggleSelect(item)}
                      className={`group relative flex flex-col rounded-xl border p-1.5 cursor-pointer transition-all ${
                        isSelected
                          ? "border-orange bg-orange-light/30 shadow-md ring-2 ring-orange/50"
                          : "border-line bg-white hover:border-orange/60 hover:shadow-xs"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-square w-full rounded-lg bg-cream-deep overflow-hidden">
                        <img
                          src={url}
                          alt={item.filename || item.name}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Selection Checkmark Overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-orange/40 backdrop-blur-xs flex items-center justify-center">
                            <div className="rounded-full bg-orange p-1.5 text-white shadow-md">
                              <Check className="h-5 w-5 stroke-[3]" />
                            </div>
                          </div>
                        )}

                        {/* Usage Counter Badge */}
                        {item.usage_count > 0 && (
                          <div className="absolute top-1 right-1 rounded bg-navy/80 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            Used ({item.usage_count})
                          </div>
                        )}
                      </div>

                      {/* Filename label */}
                      <div className="mt-1.5 px-1">
                        <p className="text-[11px] font-bold text-navy truncate" title={item.filename || item.name}>
                          {item.filename || item.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* UPLOAD TAB */
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto space-y-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-navy mb-1">Target Storage Folder</label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  className="field-shell text-xs font-semibold capitalize"
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
                className={`w-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-orange bg-orange-light/40"
                    : "border-line bg-cream/30 hover:border-orange hover:bg-orange-light/20"
                }`}
              >
                <Upload className="h-10 w-10 text-orange mb-2" />
                <p className="text-xs font-bold text-navy">Click or drag images to upload</p>
                <p className="mt-1 text-[10px] text-admin-muted font-medium">
                  Max 5MB. Automatically compressed to WebP and stored on ImageKit CDN.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={multiSelect}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => e.target.files && processFilesUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Progress */}
              {uploadingFiles.length > 0 && (
                <div className="w-full max-h-36 overflow-y-auto space-y-2 rounded-xl border border-line p-3 bg-admin-bg">
                  {uploadingFiles.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] text-navy font-semibold">{u.file.name}</span>
                      {u.status === "uploading" && (
                        <span className="text-orange font-bold flex items-center gap-1 animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Uploading...
                        </span>
                      )}
                      {u.status === "done" && (
                        <span className="text-green font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                        </span>
                      )}
                      {u.status === "error" && (
                        <span className="text-red-600 font-bold flex items-center gap-1" title={u.error}>
                          <AlertCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line pt-4 flex items-center justify-between">
          <div className="text-xs font-semibold text-admin-muted">
            {selectedItems.length > 0 ? (
              <span className="text-navy font-bold">{selectedItems.length} image(s) selected</span>
            ) : (
              "Select an image to attach"
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="button-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button
              disabled={selectedItems.length === 0}
              onClick={handleConfirmSelect}
              className="button-primary text-xs px-5 py-2 disabled:opacity-50"
            >
              Use Selected ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
