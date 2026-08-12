"use client";

import { useState } from "react";
import { Plus, Truck, X, Edit2, CheckCircle2 } from "lucide-react";
import { Courier } from "@/lib/types";

interface CourierManagerModalProps {
  couriers: Courier[];
  onClose: () => void;
  onRefresh: () => void;
}

export function CourierManagerModal({ couriers, onClose, onRefresh }: CourierManagerModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [trackingTemplate, setTrackingTemplate] = useState("");
  const [phone, setPhone] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEdit(c: Courier) {
    setEditingId(c.id);
    setName(c.name);
    setCode(c.code);
    setWebsiteUrl(c.website_url || "");
    setTrackingTemplate(c.tracking_url_template || "");
    setPhone(c.phone || "");
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setCode("");
    setWebsiteUrl("");
    setTrackingTemplate("");
    setPhone("");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Courier name and unique code are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/couriers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          name: name.trim(),
          code: code.trim().toLowerCase().replace(/\s+/g, "_"),
          website_url: websiteUrl.trim() || null,
          tracking_url_template: trackingTemplate.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        setError(data.error || "Failed to save courier");
      } else {
        resetForm();
        onRefresh();
      }
    } catch {
      setSaving(false);
      setError("Network error saving courier");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-line bg-cream/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-orange" />
            <h3 className="text-lg font-bold text-navy">Manage Courier Services</h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-line text-muted hover:text-navy hover:bg-cream transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add / Edit Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-cream/30 border border-line/80 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange flex items-center gap-1.5">
              {editingId ? <Edit2 size={13} /> : <Plus size={13} />} {editingId ? "Edit Courier" : "Add New Courier"}
            </h4>

            {error && (
              <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs font-bold text-navy">
                Courier Name *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Leopard Courier"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                System Code *
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. leopard"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all font-mono"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Website URL
                <input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.leopardscourier.com"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Phone Contact
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 21 111 300 300"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-navy">
              Tracking URL Template (Use <span className="font-mono text-orange">{"{tracking_number}"}</span> as placeholder)
              <input
                value={trackingTemplate}
                onChange={(e) => setTrackingTemplate(e.target.value)}
                placeholder="https://www.leopardscourier.com/tracking?cn={tracking_number}"
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all font-mono"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-orange px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-dark disabled:opacity-60 transition-all"
              >
                {saving ? "Saving..." : editingId ? "Update Courier" : "Save Courier"}
              </button>
            </div>
          </form>

          {/* Courier List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy mb-3">Available Couriers ({couriers.length})</h4>
            <div className="divide-y divide-line/60 rounded-2xl border border-line/80 bg-white overflow-hidden">
              {couriers.map((c) => (
                <div key={c.id} className="p-3.5 flex items-center justify-between hover:bg-cream/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-navy text-sm">{c.name}</p>
                      <span className="font-mono text-[10px] bg-navy/10 text-navy px-2 py-0.5 rounded-md font-bold">
                        {c.code}
                      </span>
                    </div>
                    {c.tracking_url_template && (
                      <p className="text-[11px] text-muted font-mono truncate max-w-md mt-0.5">{c.tracking_url_template}</p>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(c)}
                    className="p-2 text-muted hover:text-orange transition-colors"
                    title="Edit Courier"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              ))}
              {!couriers.length && (
                <p className="p-6 text-center text-xs text-muted">No couriers configured yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
