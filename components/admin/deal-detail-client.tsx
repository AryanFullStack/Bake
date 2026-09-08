"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, Copy, Layers,
  Pause, Play, RefreshCw, ShoppingBag, Sparkles, Tag, Trash2,
  TrendingUp, XCircle, DollarSign,
} from "lucide-react";
import { formatPKR, publicStorageUrl } from "@/lib/catalog";
import type { Deal, DealAnalytics } from "@/lib/types";

interface DealDetailClientProps {
  initialDeal: Deal;
  initialAnalytics: DealAnalytics;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function DealDetailClient({ initialDeal, initialAnalytics }: DealDetailClientProps) {
  const router = useRouter();
  const [deal, setDeal] = useState<Deal>(initialDeal);
  const [analytics, setAnalytics] = useState<DealAnalytics>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Live countdown update loop
  useEffect(() => {
    if (!deal.end_at || deal.status !== "active") return;

    function updateTimer() {
      const now = new Date().getTime();
      const end = new Date(deal.end_at).getTime();
      const diff = Math.max(0, Math.floor((end - now) / 1000));

      setTimeLeft({
        d: Math.floor(diff / 86400),
        h: Math.floor((diff % 86400) / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deal.end_at, deal.status]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deals/${deal.id}`);
      const json = await res.json();
      if (json.success) {
        setDeal(json.deal);
        if (json.analytics) setAnalytics(json.analytics);
      }
    } catch {
      showToast("Failed to refresh deal details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: "pause" | "resume" | "end_now" | "duplicate" | "delete") => {
    if (action === "delete" && !confirm(`Are you sure you want to delete "${deal.name}" permanently?`)) return;
    if (action === "end_now" && !confirm(`End "${deal.name}" immediately?`)) return;

    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/deals/${deal.id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          showToast(`"${deal.name}" deleted`, "error");
          setTimeout(() => router.push("/admin/deals"), 1000);
        } else showToast(json.error || "Delete failed", "error");
      } else if (action === "duplicate") {
        const res = await fetch(`/api/admin/deals/${deal.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate" }) });
        const json = await res.json();
        if (json.success && json.deal_id) {
          showToast(`Deal duplicated! Opening copy...`);
          setTimeout(() => router.push(`/admin/deals/${json.deal_id}`), 1000);
        } else showToast(json.error || "Duplication failed", "error");
      } else {
        const res = await fetch(`/api/admin/deals/${deal.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const json = await res.json();
        if (json.success) {
          showToast("Action applied successfully!");
          refreshData();
        } else showToast(json.error || "Action failed", "error");
      }
    } catch {
      showToast("Operation failed", "error");
    }
  };

  const isCurrentActive = deal.status === "active";

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden">
      {/* ── Header Bar ──────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-admin-border/60 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deals"
            className="rounded-xl border border-admin-border bg-white p-2.5 text-admin-muted hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-navy">{deal.name}</h1>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-black tracking-wider uppercase ${
                  isCurrentActive
                    ? "bg-green/15 text-green-dark border-green/30"
                    : deal.status === "scheduled"
                    ? "bg-blue-500/15 text-blue-700 border-blue-500/30"
                    : deal.status === "paused"
                    ? "bg-amber-500/15 text-amber-800 border-amber-500/30"
                    : "bg-gray-100 text-gray-700 border-gray-300"
                }`}
              >
                {deal.status}
              </span>
            </div>
            <p className="text-xs text-admin-muted font-mono mt-0.5">/deals/{deal.slug}</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/deals/${deal.id}/edit`} className="button-secondary text-xs px-3.5 py-2">
            <Tag size={14} /> Edit Deal
          </Link>

          <button onClick={() => handleAction("duplicate")} className="button-secondary text-xs px-3.5 py-2">
            <Copy size={14} /> Duplicate
          </button>

          {isCurrentActive ? (
            <button onClick={() => handleAction("pause")} className="button-secondary text-xs px-3.5 py-2 text-amber-700">
              <Pause size={14} /> Pause
            </button>
          ) : (
            <button onClick={() => handleAction("resume")} className="button-secondary text-xs px-3.5 py-2 text-green-700">
              <Play size={14} /> Resume
            </button>
          )}

          {isCurrentActive && (
            <button onClick={() => handleAction("end_now")} className="button-secondary text-xs px-3.5 py-2 text-orange">
              <Clock size={14} /> End Now
            </button>
          )}

          <button onClick={() => handleAction("delete")} className="button-secondary text-xs px-3.5 py-2 text-red-600 hover:bg-red-50">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Deal Overview & Active Countdown (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Live Countdown Timer Card */}
          {isCurrentActive && (
            <div className="rounded-3xl border border-orange/40 bg-navy p-6 text-white shadow-xl relative overflow-hidden">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-orange/20 blur-2xl" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <span className="deal-badge mb-2 inline-block">🔥 Campaign Currently Live</span>
                  <h3 className="font-display text-xl font-bold text-white">Deal Countdown Timer</h3>
                  <p className="text-xs text-white/70 mt-0.5">Live remaining window on customer product pages</p>
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { val: timeLeft.d, label: "DAYS" },
                    { val: timeLeft.h, label: "HRS" },
                    { val: timeLeft.m, label: "MIN" },
                    { val: timeLeft.s, label: "SEC" },
                  ].map(({ val, label }, i) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="countdown-digit">
                        <span className="countdown-number bg-white/10 text-orange border border-white/20 backdrop-blur-md">
                          {pad(val)}
                        </span>
                        <span className="countdown-label text-white/60">{label}</span>
                      </div>
                      {i < 3 && <span className="mb-4 text-xl font-black text-white/40">:</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Deal Metadata Overview Card */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-navy border-b border-admin-border pb-3 flex items-center gap-2">
              <Tag size={16} className="text-orange" /> Deal Configuration Overview
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-admin-bg/60 p-3 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Deal Type</span>
                <span className="font-extrabold text-navy capitalize">{deal.deal_type.replace(/_/g, " ")}</span>
              </div>
              <div className="bg-admin-bg/60 p-3 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Discount Value</span>
                <span className="font-extrabold text-orange">
                  {deal.deal_type === "percentage"
                    ? `${deal.discount_value}% OFF`
                    : deal.deal_type === "fixed"
                    ? `${formatPKR(deal.discount_value)} OFF`
                    : formatPKR(deal.discount_value)}
                </span>
              </div>
              <div className="bg-admin-bg/60 p-3 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Priority</span>
                <span className="font-extrabold text-navy">Priority {deal.priority}</span>
              </div>
              <div className="bg-admin-bg/60 p-3 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Featured Status</span>
                <span className="font-extrabold text-navy">{deal.is_featured ? "★ Featured" : "Standard"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="border border-admin-border p-3.5 rounded-xl">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block mb-1">Start Date &amp; Time</span>
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <Calendar size={14} className="text-orange" />
                  {new Date(deal.start_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" })}
                </span>
              </div>
              <div className="border border-admin-border p-3.5 rounded-xl">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block mb-1">End Date &amp; Time</span>
                <span className="font-bold text-navy flex items-center gap-1.5">
                  <Clock size={14} className="text-orange" />
                  {new Date(deal.end_at).toLocaleString("en-PK", { dateStyle: "full", timeStyle: "short" })}
                </span>
              </div>
            </div>

            {deal.description && (
              <div>
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block mb-1">Description</span>
                <p className="text-xs text-navy leading-relaxed bg-admin-bg/40 p-3 rounded-xl border border-admin-border">
                  {deal.description}
                </p>
              </div>
            )}
          </div>

          {/* Included Products Table */}
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Layers size={16} className="text-orange" /> Included Products ({deal.deal_products?.length ?? 0})
            </h3>

            {!deal.deal_products || deal.deal_products.length === 0 ? (
              <p className="text-xs text-admin-muted p-4 text-center">No products assigned to this deal.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-admin-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-admin-border bg-admin-bg font-bold uppercase tracking-wider text-admin-muted">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Regular Price</th>
                      <th className="p-3">Deal Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border/50">
                    {deal.deal_products.map((dp: any) => {
                      const prod = dp.products;
                      const variation = dp.product_variations;
                      const regPrice = variation ? Number(variation.regular_price ?? variation.price) : Number(prod?.price ?? 0);
                      const customP = dp.custom_deal_price;

                      return (
                        <tr key={dp.id} className="hover:bg-admin-bg/40">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="relative h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden border border-admin-border bg-admin-bg">
                                <SafeImage
                                  src={prod?.featured_image ? publicStorageUrl(prod.featured_image) : "/placeholder-bake.svg"}
                                  alt={prod?.name || "Product"}
                                  fill
                                  sizes="36px"
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-navy">{prod?.name || "Product"}</p>
                                {variation && (
                                  <span className="text-[10px] text-orange font-bold bg-orange/10 px-1.5 py-0.5 rounded">
                                    Option: {variation.name || Object.values(variation.attributes || {}).join(" / ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-admin-muted">{variation?.sku || prod?.sku || "—"}</td>
                          <td className="p-3 font-bold text-navy">{formatPKR(regPrice)}</td>
                          <td className="p-3 font-extrabold text-orange">
                            {customP != null ? formatPKR(customP) : "Calculated Discount"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Genuine Performance & Real Analytics */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-admin-border bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-admin-border pb-3">
              <h3 className="text-base font-bold text-navy flex items-center gap-2">
                <TrendingUp size={16} className="text-orange" /> Real Campaign Performance
              </h3>
              <button onClick={refreshData} className="text-admin-muted hover:text-navy p-1">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Performance KPI Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-admin-bg/60 p-4 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Total Orders</span>
                <p className="mt-1 font-display text-2xl font-black text-navy">{analytics.totalOrders}</p>
                <span className="text-[10px] text-admin-muted">Containing deal items</span>
              </div>

              <div className="bg-admin-bg/60 p-4 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Units Sold</span>
                <p className="mt-1 font-display text-2xl font-black text-orange">{analytics.unitsSold}</p>
                <span className="text-[10px] text-admin-muted">Deal items quantity</span>
              </div>

              <div className="bg-admin-bg/60 p-4 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Gross Sales</span>
                <p className="mt-1 font-display text-lg font-black text-navy">{formatPKR(analytics.grossSales)}</p>
                <span className="text-[10px] text-admin-muted">Revenue generated</span>
              </div>

              <div className="bg-admin-bg/60 p-4 rounded-xl border border-admin-border">
                <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Discounts Given</span>
                <p className="mt-1 font-display text-lg font-black text-green-dark">{formatPKR(analytics.discountGiven)}</p>
                <span className="text-[10px] text-admin-muted">Savings to customers</span>
              </div>
            </div>

            <div className="bg-orange/10 p-4 rounded-xl border border-orange/20">
              <span className="text-[10.5px] uppercase font-bold text-admin-muted block">Average Order Value</span>
              <p className="mt-1 font-display text-xl font-black text-navy">{formatPKR(analytics.averageOrderValue)}</p>
            </div>

            {analytics.totalOrders === 0 && (
              <div className="p-4 rounded-xl bg-admin-bg text-center border border-admin-border text-xs text-admin-muted space-y-1">
                <ShoppingBag size={20} className="mx-auto text-admin-muted/40 mb-1" />
                <p className="font-bold text-navy">No orders recorded yet for this deal</p>
                <p className="text-[11px]">Statistics are calculated dynamically as customers place orders containing these deal items.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast Notification ─────────────────────── */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "error" ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
