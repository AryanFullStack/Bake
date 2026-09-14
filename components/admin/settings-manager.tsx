"use client";

import { FormEvent, useRef, useState } from "react";
import {
  AlertCircle,
  Cake,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
interface Banner {
  id: string;
  title: string;
  body?: string;
  image_path?: string;
  cta_label?: string;
  cta_href?: string;
  is_active: boolean;
  sort_order?: number;
}

interface Faq {
  id: string;
  question: string;
  answer?: string;
  is_published: boolean;
  sort_order?: number;
}

/* ─── Toast helper ────────────────────────────────────────── */
type ToastType = "success" | "error";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

/* ─── Main Component ──────────────────────────────────────── */
export function SettingsManager({
  initialSettings,
  initialBanners,
  initialFaqs,
}: {
  initialSettings: any;
  initialBanners: Banner[];
  initialFaqs: Faq[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  /* ── Toast ── */
  const toast = (msg: string, type: ToastType = "success") => {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  /* ── Save site_settings key ── */
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function saveSetting(event: FormEvent<HTMLFormElement>, key: string) {
    event.preventDefault();
    setSavingKey(key);
    const raw: any = Object.fromEntries(new FormData(event.currentTarget).entries());
    const value =
      key === "delivery"
        ? {
            ...raw,
            free_threshold: Number(raw.free_threshold),
            fee: Number(raw.fee),
            cities: String(raw.cities ?? "")
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          }
        : raw;

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "setting", key, value }),
    });
    setSavingKey(null);
    if (res.ok) {
      setSettings({ ...settings, [key]: value });
      toast(`${key === "store" ? "Store info" : "Delivery settings"} saved successfully.`);
    } else {
      toast("Failed to save settings.", "error");
    }
  }

  const store = settings.store ?? {};
  const delivery = settings.delivery ?? {};

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-10 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-orange">
          System Administration
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">
          Site Settings &amp; Banner Manager
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
          Manage homepage hero banners, store information, delivery fees, and FAQ entries directly from Supabase.
        </p>
      </div>

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl animate-fade-in pointer-events-auto ${
              t.type === "success"
                ? "bg-green/10 border border-green/20 text-green"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}
          >
            {t.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Grid: Store + Delivery ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Store Info */}
        <form
          onSubmit={(e) => saveSetting(e, "store")}
          className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs flex flex-col gap-6"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
              <Settings size={20} className="text-orange" /> Store Information
            </h2>
            <div className="mt-5 grid gap-4">
              <Field name="name" label="Store Name" defaultValue={store.name} />
              <Field name="email" label="Contact Email" defaultValue={store.email} />
              <Field name="phone" label="Hotline Phone" defaultValue={store.phone} />
              <Field name="city" label="Headquarters City" defaultValue={store.city} />
            </div>
          </div>
          <SaveButton loading={savingKey === "store"} label="Save Store Details" />
        </form>

        {/* Delivery */}
        <form
          onSubmit={(e) => saveSetting(e, "delivery")}
          className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs flex flex-col gap-6"
        >
          <div>
            <h2 className="font-display text-xl font-bold text-navy border-b border-line pb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-green" /> Delivery Configurations
            </h2>
            <div className="mt-5 grid gap-4">
              <Field
                name="free_threshold"
                label="Free Shipping Threshold (PKR)"
                defaultValue={delivery.free_threshold}
                type="number"
              />
              <Field
                name="fee"
                label="Standard Shipping Fee (PKR)"
                defaultValue={delivery.fee}
                type="number"
              />
              <Field
                name="same_day_cutoff"
                label="Same-Day Order Cutoff Time"
                defaultValue={delivery.same_day_cutoff}
                placeholder="13:00"
              />
              <Field
                name="cities"
                label="Supported Delivery Cities (Comma Separated)"
                defaultValue={(delivery.cities ?? []).join(", ")}
                placeholder="Karachi, Lahore, Islamabad, Rawalpindi"
              />
            </div>
          </div>
          <SaveButton loading={savingKey === "delivery"} label="Save Delivery Rules" />
        </form>
      </div>

      {/* ── Banner Manager ── */}
      <BannerManager banners={banners} setBanners={setBanners} toast={toast} />

      {/* ── FAQ Manager ── */}
      <FaqManager faqs={faqs} setFaqs={setFaqs} toast={toast} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   BANNER MANAGER
══════════════════════════════════════════════════════════════ */
function BannerManager({
  banners,
  setBanners,
  toast,
}: {
  banners: Banner[];
  setBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  toast: (msg: string, type?: "success" | "error") => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Banner>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const addFileRef = useRef<HTMLInputElement>(null);
  const [addPreview, setAddPreview] = useState("");
  const [adding, setAdding] = useState(false);

  /* Upload image for inline edit */
  const uploadFile = async (file: File, onDone: (url: string) => void) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "banners");
    fd.append("mediaType", "banner");
    const res = await fetch("/api/media/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.success) {
      onDone(json.data?.public_url ?? json.data?.storage_path ?? "");
    } else {
      toast("Image upload failed: " + (json.error ?? "Unknown error"), "error");
    }
  };

  /* Toggle active */
  const toggleActive = async (banner: Banner) => {
    setToggling(banner.id);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "banner", id: banner.id, is_active: !banner.is_active }),
    });
    setToggling(null);
    if (res.ok) {
      setBanners((p) => p.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b)));
      toast(banner.is_active ? "Banner hidden from homepage." : "Banner is now live on homepage.");
    } else {
      toast("Failed to update banner.", "error");
    }
  };

  /* Start edit */
  const startEdit = (b: Banner) => {
    setEditId(b.id);
    setEditData({ title: b.title, body: b.body, image_path: b.image_path, cta_label: b.cta_label, cta_href: b.cta_href });
    setPreviewUrl(b.image_path ?? "");
  };

  /* Save edit */
  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "banner", id: editId, ...editData }),
    });
    setSaving(false);
    if (res.ok) {
      setBanners((p) => p.map((b) => (b.id === editId ? { ...b, ...editData } : b)));
      setEditId(null);
      toast("Banner updated successfully.");
    } else {
      toast("Failed to update banner.", "error");
    }
  };

  /* Delete */
  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner? It will be removed from the homepage slider.")) return;
    setDeleting(id);
    const res = await fetch("/api/admin/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "banner", id }),
    });
    setDeleting(null);
    if (res.ok) {
      setBanners((p) => p.filter((b) => b.id !== id));
      toast("Banner deleted.");
    } else {
      toast("Failed to delete banner.", "error");
    }
  };

  /* Add new banner */
  const handleAddBanner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);
    const raw: any = Object.fromEntries(new FormData(e.currentTarget).entries());
    raw.entity = "banner";
    raw.is_active = raw.is_active === "true";

    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(raw),
    });
    const json = await res.json();
    setAdding(false);
    if (res.ok) {
      toast("Banner published! Reloading data…");
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast(json.error ?? "Failed to add banner.", "error");
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-navy flex items-center gap-2">
            <ImageIcon size={20} className="text-orange" /> Homepage Hero Banner Manager
          </h2>
          <p className="mt-1 text-xs text-muted font-medium">
            Active banners dynamically control the main homepage hero slider.
          </p>
        </div>
        <button
          onClick={() => setAddOpen((p) => !p)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-xs font-extrabold text-white hover:bg-orange-dark transition-all shadow-md"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      {/* Banner Cards */}
      <div className="mt-6 flex flex-col gap-4">
        {banners.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No banners yet. Add your first banner below.</p>
        )}
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`rounded-2xl border transition-all overflow-hidden ${
              banner.is_active ? "border-green/30 bg-green/5" : "border-line bg-cream/30"
            }`}
          >
            {editId === banner.id ? (
              /* ── Edit Mode ── */
              <div className="p-5 grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-orange">Editing Banner</p>
                  <button onClick={() => setEditId(null)} className="text-muted hover:text-navy transition">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InlineField
                    label="Headline Title"
                    value={editData.title ?? ""}
                    onChange={(v) => setEditData((p) => ({ ...p, title: v }))}
                  />
                  <InlineField
                    label="Subtitle"
                    value={editData.body ?? ""}
                    onChange={(v) => setEditData((p) => ({ ...p, body: v }))}
                  />
                  <InlineField
                    label="CTA Button Label"
                    value={editData.cta_label ?? ""}
                    onChange={(v) => setEditData((p) => ({ ...p, cta_label: v }))}
                  />
                  <InlineField
                    label="CTA Target URL"
                    value={editData.cta_href ?? ""}
                    onChange={(v) => setEditData((p) => ({ ...p, cta_href: v }))}
                  />
                </div>
                {/* Image upload */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy mb-2">Banner Image</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {(previewUrl || editData.image_path) && (
                      <img
                        src={previewUrl || editData.image_path}
                        alt="Preview"
                        className="h-16 w-28 rounded-xl object-cover border border-line shadow-xs"
                      />
                    )}
                    <div className="flex flex-col gap-2">
                      <InlineField
                        label="Image URL (paste or upload below)"
                        value={editData.image_path ?? ""}
                        onChange={(v) => {
                          setEditData((p) => ({ ...p, image_path: v }));
                          setPreviewUrl(v);
                        }}
                        className="min-w-[240px]"
                      />
                      <label className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-orange/40 bg-orange/5 px-4 py-2 text-xs font-bold text-orange cursor-pointer hover:bg-orange/10 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploading ? "Uploading…" : "Upload New Image"}
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadFile(f, (url) => {
                              setEditData((p) => ({ ...p, image_path: url }));
                              setPreviewUrl(url);
                            });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-extrabold text-white hover:bg-navy-light transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-muted hover:text-navy transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View Mode ── */
              <div className="flex items-center gap-4 p-4">
                {banner.image_path && (
                  <img
                    src={banner.image_path}
                    alt={banner.title}
                    className="h-14 w-20 shrink-0 rounded-xl object-cover border border-line shadow-xs"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy text-sm truncate">{banner.title}</p>
                  {banner.body && <p className="text-xs text-muted truncate mt-0.5">{banner.body}</p>}
                  {banner.cta_label && (
                    <span className="mt-1 inline-block text-[10px] font-extrabold text-orange bg-orange/10 px-2 py-0.5 rounded-full">
                      CTA: {banner.cta_label} → {banner.cta_href}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle active */}
                  <button
                    onClick={() => toggleActive(banner)}
                    disabled={toggling === banner.id}
                    title={banner.is_active ? "Hide from homepage" : "Show on homepage"}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition ${
                      banner.is_active
                        ? "bg-green/10 text-green hover:bg-red-50 hover:text-red-600"
                        : "bg-cream-deep text-muted hover:bg-green/10 hover:text-green"
                    }`}
                  >
                    {toggling === banner.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : banner.is_active ? (
                      <Eye size={13} />
                    ) : (
                      <EyeOff size={13} />
                    )}
                    {banner.is_active ? "Active on Homepage" : "Draft"}
                  </button>
                  <button
                    onClick={() => startEdit(banner)}
                    className="rounded-xl border border-line p-2 text-muted hover:border-orange hover:text-orange transition"
                    title="Edit banner"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => deleteBanner(banner.id)}
                    disabled={deleting === banner.id}
                    className="rounded-xl border border-line p-2 text-muted hover:border-red-500 hover:text-red-600 transition disabled:opacity-50"
                    title="Delete banner"
                  >
                    {deleting === banner.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Banner Form */}
      {addOpen && (
        <form onSubmit={handleAddBanner} className="mt-6 border-t border-line pt-6 grid gap-5">
          <h3 className="font-bold text-navy text-base flex items-center gap-2">
            <Plus size={16} className="text-orange" /> Add New Hero Banner
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="title" label="Banner Headline Title *" placeholder="e.g. Fresh Artisan Croissants" required />
            <Field name="body" label="Subtitle Description" placeholder="e.g. Baked fresh every morning with pure butter" />
            {/* image field with upload */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-navy mb-2">
                Image URL or Upload *
              </p>
              <div className="flex flex-col gap-2">
                <input
                  name="image_path"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={addPreview}
                  onChange={(e) => setAddPreview(e.target.value)}
                  className="w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
                />
                <label className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-orange/40 bg-orange/5 px-4 py-2 text-xs font-bold text-orange cursor-pointer hover:bg-orange/10 transition w-fit ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? "Uploading…" : "Upload Image"}
                  <input
                    ref={addFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        // temporarily show blob url for preview
                        const blob = URL.createObjectURL(f);
                        setAddPreview(blob);
                        // actual upload
                        const fd = new FormData();
                        fd.append("file", f);
                        fd.append("folder", "banners");
                        fd.append("mediaType", "banner");
                        setUploading(true);
                        fetch("/api/media/upload", { method: "POST", body: fd })
                          .then((r) => r.json())
                          .then((json) => {
                            setUploading(false);
                            if (json.success) {
                              setAddPreview(json.data?.public_url ?? json.data?.storage_path ?? "");
                            } else {
                              toast("Image upload failed: " + (json.error ?? "Unknown error"), "error");
                            }
                          })
                          .catch(() => { setUploading(false); toast("Image upload error.", "error"); });
                      }
                    }}
                  />
                </label>
                {addPreview && (
                  <img src={addPreview} alt="Preview" className="h-20 w-32 rounded-xl object-cover border border-line shadow-xs" />
                )}
              </div>
            </div>
            <Field name="cta_label" label="CTA Button Label" placeholder="e.g. Shop Fresh Bakes" />
            <Field name="cta_href" label="CTA Target URL Path" placeholder="/shop" />
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-navy">
                Publish Status
                <select
                  name="is_active"
                  defaultValue="true"
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange"
                >
                  <option value="true">Active (Show on Homepage)</option>
                  <option value="false">Draft (Hide)</option>
                </select>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={adding || uploading}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange py-3 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition disabled:opacity-60"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Publish Hero Banner
            </button>
            <button
              type="button"
              onClick={() => { setAddOpen(false); setAddPreview(""); }}
              className="rounded-2xl border border-line px-6 py-3 text-sm font-bold text-muted hover:text-navy transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════
   FAQ MANAGER
══════════════════════════════════════════════════════════════ */
function FaqManager({
  faqs,
  setFaqs,
  toast,
}: {
  faqs: Faq[];
  setFaqs: React.Dispatch<React.SetStateAction<Faq[]>>;
  toast: (msg: string, type?: "success" | "error") => void;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Faq>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const togglePublish = async (faq: Faq) => {
    setToggling(faq.id);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "faq", id: faq.id, is_published: !faq.is_published }),
    });
    setToggling(null);
    if (res.ok) {
      setFaqs((p) => p.map((f) => (f.id === faq.id ? { ...f, is_published: !f.is_published } : f)));
      toast(faq.is_published ? "FAQ hidden from storefront." : "FAQ is now live on storefront.");
    } else {
      toast("Failed to update FAQ.", "error");
    }
  };

  const startEdit = (faq: Faq) => {
    setEditId(faq.id);
    setEditData({ question: faq.question, answer: faq.answer });
    setExpandedId(faq.id);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "faq", id: editId, ...editData }),
    });
    setSaving(false);
    if (res.ok) {
      setFaqs((p) => p.map((f) => (f.id === editId ? { ...f, ...editData } : f)));
      setEditId(null);
      toast("FAQ updated successfully.");
    } else {
      toast("Failed to update FAQ.", "error");
    }
  };

  const deleteFaq = async (id: string) => {
    if (!confirm("Delete this FAQ? It will be removed from the storefront.")) return;
    setDeleting(id);
    const res = await fetch("/api/admin/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "faq", id }),
    });
    setDeleting(null);
    if (res.ok) {
      setFaqs((p) => p.filter((f) => f.id !== id));
      toast("FAQ deleted.");
    } else {
      toast("Failed to delete FAQ.", "error");
    }
  };

  const handleAddFaq = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAdding(true);
    const raw: any = Object.fromEntries(new FormData(e.currentTarget).entries());
    raw.entity = "faq";
    raw.is_published = true;
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(raw),
    });
    const json = await res.json();
    setAdding(false);
    if (res.ok) {
      toast("FAQ published! Reloading data…");
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast(json.error ?? "Failed to add FAQ.", "error");
    }
  };

  return (
    <section className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-navy flex items-center gap-2">
            <MessageSquare size={20} className="text-orange" /> Frequently Asked Questions (FAQ) Manager
          </h2>
          <p className="mt-1 text-xs text-muted font-medium">
            Manage FAQ entries visible on the storefront. Toggle, edit, or remove entries instantly.
          </p>
        </div>
        <button
          onClick={() => setAddOpen((p) => !p)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-xs font-extrabold text-white hover:bg-orange-dark transition-all shadow-md"
        >
          <Plus size={14} /> Add FAQ
        </button>
      </div>

      {/* FAQ List */}
      <div className="mt-6 flex flex-col gap-3">
        {faqs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No FAQs yet. Add your first FAQ below.</p>
        )}
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className={`rounded-2xl border transition-all ${
              faq.is_published ? "border-line bg-white" : "border-dashed border-line/60 bg-cream/20"
            }`}
          >
            {editId === faq.id ? (
              /* ── Edit Mode ── */
              <div className="p-5 grid gap-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-orange">Editing FAQ</p>
                  <button onClick={() => setEditId(null)} className="text-muted hover:text-navy transition">
                    <X size={18} />
                  </button>
                </div>
                <InlineField
                  label="Question"
                  value={editData.question ?? ""}
                  onChange={(v) => setEditData((p) => ({ ...p, question: v }))}
                />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-navy mb-2">Answer</p>
                  <textarea
                    rows={4}
                    value={editData.answer ?? ""}
                    onChange={(e) => setEditData((p) => ({ ...p, answer: e.target.value }))}
                    className="w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2.5 text-sm font-extrabold text-white hover:bg-navy-light transition disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditId(null)}
                    className="rounded-xl border border-line px-5 py-2.5 text-sm font-bold text-muted hover:text-navy transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── View Mode ── */
              <div>
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => setExpandedId((p) => (p === faq.id ? null : faq.id))}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <span className="font-bold text-navy text-sm flex-1 truncate">{faq.question}</span>
                    {expandedId === faq.id ? (
                      <ChevronUp size={15} className="text-muted shrink-0" />
                    ) : (
                      <ChevronDown size={15} className="text-muted shrink-0" />
                    )}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePublish(faq)}
                      disabled={toggling === faq.id}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition ${
                        faq.is_published
                          ? "bg-green/10 text-green hover:bg-red-50 hover:text-red-600"
                          : "bg-cream-deep text-muted hover:bg-green/10 hover:text-green"
                      }`}
                    >
                      {toggling === faq.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : faq.is_published ? (
                        <Eye size={12} />
                      ) : (
                        <EyeOff size={12} />
                      )}
                      {faq.is_published ? "Published" : "Hidden"}
                    </button>
                    <button
                      onClick={() => startEdit(faq)}
                      className="rounded-xl border border-line p-2 text-muted hover:border-orange hover:text-orange transition"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteFaq(faq.id)}
                      disabled={deleting === faq.id}
                      className="rounded-xl border border-line p-2 text-muted hover:border-red-500 hover:text-red-600 transition disabled:opacity-50"
                    >
                      {deleting === faq.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
                {expandedId === faq.id && faq.answer && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted leading-relaxed border-t border-line/50 pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New FAQ Form */}
      {addOpen && (
        <form onSubmit={handleAddFaq} className="mt-6 border-t border-line pt-6 grid gap-5">
          <h3 className="font-bold text-navy text-base flex items-center gap-2">
            <Plus size={16} className="text-orange" /> Add New FAQ Item
          </h3>
          <Field name="question" label="Question *" required />
          <label className="block text-[11px] font-bold uppercase tracking-wider text-navy">
            Answer
            <textarea
              name="answer"
              rows={4}
              required
              className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors resize-none"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange py-3 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition disabled:opacity-60"
            >
              {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Add Published FAQ
            </button>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-2xl border border-line px-6 py-3 text-sm font-bold text-muted hover:text-navy transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/* ─── Shared Sub-components ───────────────────────────────── */

function Field({
  name,
  label,
  defaultValue,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-wider text-navy">
      {label} {required && <span className="text-orange">*</span>}
      <input
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
      />
    </label>
  );
}

function InlineField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-navy mb-1.5">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white transition-colors"
      />
    </div>
  );
}

function SaveButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-3.5 px-6 text-sm font-extrabold text-white shadow-md hover:bg-orange-dark transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {label}
    </button>
  );
}
