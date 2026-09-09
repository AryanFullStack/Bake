"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { useRouter } from "next/navigation";
import {
  Calendar, CheckCircle2, ChevronRight, Clock, Copy, Eye,
  Layers, MoreVertical, Pause, Play, Plus, RefreshCw, Search,
  Sparkles, Tag, Trash2, XCircle, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { formatPKR, publicStorageUrl } from "@/lib/catalog";
import { PaginationControls } from "@/components/pagination";
import type { Deal, DealSummaryStats } from "@/lib/types";

interface DealsDashboardClientProps {
  initialSummary: DealSummaryStats;
  initialDeals: Deal[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return {
        cls: "bg-green/15 text-green-dark border-green/30",
        label: "ACTIVE",
        icon: Clock,
      };
    case "scheduled":
      return {
        cls: "bg-blue-500/15 text-blue-700 border-blue-500/30",
        label: "SCHEDULED",
        icon: Calendar,
      };
    case "expired":
      return {
        cls: "bg-gray-200 text-gray-700 border-gray-300",
        label: "EXPIRED",
        icon: XCircle,
      };
    case "paused":
      return {
        cls: "bg-amber-500/15 text-amber-800 border-amber-500/30",
        label: "PAUSED",
        icon: Pause,
      };
    default:
      return {
        cls: "bg-gray-100 text-gray-600 border-gray-200",
        label: "DRAFT",
        icon: Tag,
      };
  }
}

export function DealsDashboardClient({ initialSummary, initialDeals }: DealsDashboardClientProps) {
  const router = useRouter();
  const [summary, setSummary] = useState<DealSummaryStats>(initialSummary);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalDeals, setTotalDeals] = useState(initialDeals.length);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        status: selectedStatus,
        deal_type: selectedType,
      });
      const res = await fetch(`/api/admin/deals?${params}`);
      const json = await res.json();
      if (json.success) {
        setDeals(json.deals || []);
        setTotalDeals(json.pagination?.total ?? json.total ?? (json.deals || []).length);
        if (json.summary) setSummary(json.summary);
      }
    } catch {
      showToast("Failed to refresh deals", "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedStatus, selectedType]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStatus, selectedType]);

  const handleAction = async (id: string, action: "pause" | "resume" | "end_now" | "duplicate" | "delete", name: string) => {
    setActiveMenu(null);
    if (action === "delete" && !confirm(`Are you sure you want to delete "${name}" permanently?`)) return;
    if (action === "end_now" && !confirm(`End "${name}" immediately? Product prices will return to regular rates.`)) return;

    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/deals/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.success) {
          showToast(`"${name}" deleted`, "error");
          fetchDeals();
        } else showToast(json.error || "Delete failed", "error");
      } else if (action === "duplicate") {
        const res = await fetch(`/api/admin/deals/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate" }) });
        const json = await res.json();
        if (json.success) {
          showToast(`"${name}" duplicated!`);
          fetchDeals();
        } else showToast(json.error || "Duplication failed", "error");
      } else {
        const res = await fetch(`/api/admin/deals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
        const json = await res.json();
        if (json.success) {
          showToast(`Action applied to "${name}"`);
          fetchDeals();
        } else showToast(json.error || "Action failed", "error");
      }
    } catch {
      showToast("Operation failed", "error");
    }
  };

  const filteredDeals = deals.filter((deal) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = deal.name.toLowerCase().includes(q);
      const matchSlug = deal.slug.toLowerCase().includes(q);
      const matchBadge = deal.badge_text?.toLowerCase().includes(q);
      if (!matchName && !matchSlug && !matchBadge) return false;
    }
    if (selectedStatus && deal.status !== selectedStatus) return false;
    if (selectedType && deal.deal_type !== selectedType) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-admin-bg p-4 sm:p-6 md:p-8 min-w-0 overflow-x-hidden" onClick={() => setActiveMenu(null)}>
      {/* ── Page Header ─────────────────────────────── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-navy">Deals &amp; Promotions</h1>
            <span className="rounded-full bg-orange/15 border border-orange/30 px-3 py-0.5 text-xs font-extrabold text-orange">
              Campaign Manager
            </span>
          </div>
          <p className="mt-1 text-sm text-admin-muted">
            Create, schedule and manage time-limited promotional sales across Bake Mart storefront.
          </p>
        </div>
        <Link href="/admin/deals/new" className="button-primary shadow-sm hover:shadow-md">
          <Plus size={16} /> Create Deal
        </Link>
      </div>

      {/* ── Summary Statistics Cards ────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total Deals", val: summary.totalDeals, color: "text-navy", icon: Tag },
          { label: "Active Deals", val: summary.activeDeals, color: "text-green", icon: Clock, highlight: true },
          { label: "Scheduled Deals", val: summary.scheduledDeals, color: "text-blue-600", icon: Calendar },
          { label: "Expired Deals", val: summary.expiredDeals, color: "text-gray-500", icon: XCircle },
          { label: "Draft / Paused", val: summary.draftDeals, color: "text-amber-600", icon: Pause },
          { label: "Products on Deal", val: summary.productsOnDeal, color: "text-orange", icon: Layers },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border p-4 shadow-xs transition-all hover:-translate-y-0.5 ${
                card.highlight ? "border-green/40 bg-green/5" : "border-admin-border bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-admin-muted truncate">{card.label}</span>
                <Icon size={16} className={card.color} />
              </div>
              <p className={`mt-2 font-display text-2xl font-black ${card.color}`}>{card.val}</p>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar & Filters ────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-admin-border bg-white p-4 shadow-xs">
        {/* Quick Filter Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {[
            ["All Deals", ""],
            ["Active", "active"],
            ["Scheduled", "scheduled"],
            ["Paused", "paused"],
            ["Expired", "expired"],
            ["Draft", "draft"],
          ].map(([label, val]) => (
            <button
              key={val}
              onClick={() => setSelectedStatus(val)}
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedStatus === val ? "bg-navy text-white shadow-xs" : "text-admin-muted hover:bg-admin-bg hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-muted pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deal name, slug, badge text…"
              className="w-full rounded-xl border border-admin-border bg-admin-bg py-2.5 pl-10 pr-4 text-sm font-medium text-navy outline-none transition focus:border-orange focus:bg-white focus:shadow-[0_0_0_3px_rgba(253,118,0,.08)]"
            />
          </div>

          {/* Deal type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-xl border border-admin-border bg-admin-bg px-3.5 py-2.5 text-xs font-semibold text-navy outline-none focus:border-orange cursor-pointer"
          >
            <option value="">All Deal Types</option>
            <option value="percentage">Percentage Discount</option>
            <option value="fixed">Fixed Amount OFF</option>
            <option value="sale_price">Special Sale Price</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
          </select>

          <button
            onClick={fetchDeals}
            className="rounded-xl border border-admin-border bg-white p-2.5 text-admin-muted hover:text-navy transition-colors"
            title="Refresh Deals"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ── Table & Cards Container ─────────────────── */}
      <div className="rounded-2xl border border-admin-border bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-admin-muted">
            <RefreshCw size={20} className="animate-spin-slow text-orange" />
            <span className="text-sm font-semibold">Loading campaign deals…</span>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange/10 text-orange">
              <Tag size={28} />
            </div>
            <h3 className="font-display text-lg font-bold text-navy">No deals created yet</h3>
            <p className="max-w-md text-xs text-admin-muted leading-relaxed">
              Create your first promotional deal to highlight special discounts, display countdown timers, and attract more customers across the Bake Mart storefront.
            </p>
            <Link href="/admin/deals/new" className="button-primary mt-2 text-xs px-5">
              <Plus size={15} /> Create Your First Deal
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View (≥768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-admin-border bg-admin-bg text-[11px] font-extrabold uppercase tracking-wider text-admin-muted">
                  <tr>
                    <th className="p-4">Deal</th>
                    <th className="p-4">Type &amp; Discount</th>
                    <th className="p-4">Products</th>
                    <th className="p-4">Schedule</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Priority</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border/60 text-sm">
                  {filteredDeals.map((deal) => {
                    const badge = getStatusBadge(deal.status || "draft");
                    const StatusIcon = badge.icon;
                    const bannerSrc = deal.banner_image ? publicStorageUrl(deal.banner_image) : "/placeholder-bake.svg";
                    const isFeatured = deal.is_featured;

                    return (
                      <tr
                        key={deal.id}
                        className="transition-colors hover:bg-admin-bg/60 cursor-pointer"
                        onClick={() => router.push(`/admin/deals/${deal.id}`)}
                      >
                        {/* Deal Name & Banner */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-admin-border bg-navy-dark shadow-xs">
                              <SafeImage src={bannerSrc} alt={deal.name} fill sizes="64px" className="object-cover" />
                              {isFeatured && (
                                <span className="absolute top-1 left-1 grid h-4 w-4 place-items-center rounded-full bg-orange text-white shadow-xs" title="Featured Deal">
                                  <Sparkles size={10} />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-navy hover:text-orange transition-colors truncate max-w-[220px]">
                                  {deal.name}
                                </p>
                                {deal.badge_text && (
                                  <span className="rounded-md bg-orange/10 px-1.5 py-0.5 text-[10px] font-extrabold text-orange truncate">
                                    {deal.badge_text}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[11px] text-admin-muted font-mono truncate">/deals/{deal.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type & Discount */}
                        <td className="p-4">
                          <div>
                            <span className="inline-block rounded-md bg-admin-bg px-2 py-0.5 text-xs font-bold text-navy capitalize">
                              {deal.deal_type.replace(/_/g, " ")}
                            </span>
                            <p className="mt-1 text-xs font-bold text-orange">
                              {deal.deal_type === "percentage"
                                ? `${deal.discount_value}% OFF`
                                : deal.deal_type === "fixed"
                                ? `${formatPKR(deal.discount_value)} OFF`
                                : deal.deal_type === "sale_price"
                                ? `Deal Price: ${formatPKR(deal.discount_value)}`
                                : `Promo Offer`}
                            </p>
                          </div>
                        </td>

                        {/* Products Count */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                            <Layers size={14} className="text-orange" />
                            {deal.products_count ?? deal.deal_products?.length ?? 0} Products
                          </span>
                        </td>

                        {/* Schedule Dates */}
                        <td className="p-4">
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold text-navy flex items-center gap-1">
                              <span className="text-[10px] uppercase font-extrabold text-admin-muted">Start:</span>
                              {new Date(deal.start_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            <p className="font-semibold text-admin-muted flex items-center gap-1">
                              <span className="text-[10px] uppercase font-extrabold text-admin-muted">End:</span>
                              {new Date(deal.end_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-black tracking-wider ${badge.cls}`}>
                            <StatusIcon size={12} />
                            {badge.label}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="p-4 text-center">
                          <span className="inline-block h-6 w-6 rounded-full bg-admin-bg text-xs font-bold text-navy leading-6 text-center border border-admin-border">
                            {deal.priority}
                          </span>
                        </td>

                        {/* Quick Actions */}
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveMenu(activeMenu === deal.id ? null : deal.id)}
                              className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-bg hover:text-navy transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {activeMenu === deal.id && (
                              <div className="absolute right-0 top-8 z-50 w-48 overflow-hidden rounded-xl border border-admin-border bg-white shadow-xl animate-scale-in text-left">
                                <Link
                                  href={`/admin/deals/${deal.id}`}
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg"
                                >
                                  <Eye size={13} className="text-admin-muted" /> View &amp; Analytics
                                </Link>
                                <Link
                                  href={`/admin/deals/${deal.id}/edit`}
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg"
                                >
                                  <Tag size={13} className="text-admin-muted" /> Edit Deal
                                </Link>
                                <button
                                  onClick={() => handleAction(deal.id, "duplicate", deal.name)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-navy hover:bg-admin-bg"
                                >
                                  <Copy size={13} className="text-admin-muted" /> Duplicate
                                </button>
                                {deal.is_active ? (
                                  <button
                                    onClick={() => handleAction(deal.id, "pause", deal.name)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                  >
                                    <Pause size={13} /> Pause Deal
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAction(deal.id, "resume", deal.name)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                                  >
                                    <Play size={13} /> Resume Deal
                                  </button>
                                )}
                                {deal.status === "active" && (
                                  <button
                                    onClick={() => handleAction(deal.id, "end_now", deal.name)}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-orange hover:bg-orange/10"
                                  >
                                    <Clock size={13} /> End Now
                                  </button>
                                )}
                                <div className="my-1 border-t border-admin-border" />
                                <button
                                  onClick={() => handleAction(deal.id, "delete", deal.name)}
                                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout (<768px) */}
            <div className="md:hidden divide-y divide-admin-border/60">
              {filteredDeals.map((deal) => {
                const badge = getStatusBadge(deal.status || "draft");
                const StatusIcon = badge.icon;
                const bannerSrc = deal.banner_image ? publicStorageUrl(deal.banner_image) : "/placeholder-bake.svg";

                return (
                  <div
                    key={deal.id}
                    className="p-4 space-y-3 hover:bg-admin-bg/40 transition-colors"
                    onClick={() => router.push(`/admin/deals/${deal.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-admin-border bg-navy-dark">
                          <SafeImage src={bannerSrc} alt={deal.name} fill sizes="64px" className="object-cover" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-navy">{deal.name}</h3>
                          <p className="text-[11px] font-mono text-admin-muted">/deals/{deal.slug}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-extrabold ${badge.cls}`}>
                        <StatusIcon size={10} />
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-admin-bg/60 p-2.5 rounded-xl border border-admin-border/70">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-admin-muted block">Discount</span>
                        <span className="font-extrabold text-orange">
                          {deal.deal_type === "percentage"
                            ? `${deal.discount_value}% OFF`
                            : deal.deal_type === "fixed"
                            ? `${formatPKR(deal.discount_value)} OFF`
                            : deal.deal_type === "sale_price"
                            ? `${formatPKR(deal.discount_value)} Price`
                            : `Special Offer`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-admin-muted block">Products</span>
                        <span className="font-extrabold text-navy">{deal.products_count ?? 0} Included</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-admin-muted border-t border-admin-border/40 pt-2">
                      <span>Ends: {new Date(deal.end_at).toLocaleDateString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <Link
                        href={`/admin/deals/${deal.id}`}
                        className="font-bold text-orange flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Details <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <PaginationControls
              currentPage={page}
              pageSize={limit}
              totalItems={totalDeals}
              itemLabel="deals"
              onPageChange={setPage}
              onPageSizeChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              pageSizeOptions={[10, 15, 25, 50, 100]}
              className="mt-4"
            />
          </>
        )}
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
