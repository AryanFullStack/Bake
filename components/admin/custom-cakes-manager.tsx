"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Sparkles,
  ShoppingBag,
  X,
  Cake,
  Phone,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import {
  CUSTOM_CAKE_STATUSES,
  CUSTOM_CAKE_PAYMENT_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_BADGE_CLASSES,
  calculateQuotation,
} from "@/lib/custom-cake";

interface CustomCakeManagerProps {
  initialRequests?: any[];
  initialTotal?: number;
}

export function CustomCakesManager({
  initialRequests = [],
  initialTotal = 0,
}: CustomCakeManagerProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [totalRequests, setTotalRequests] = useState(initialTotal);
  const [loading, setLoading] = useState(false);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Action states
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Lightbox & Modal states
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [quickQuoteTarget, setQuickQuoteTarget] = useState<any | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Quick Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    base_price: "",
    design_charges: "",
    tier_charges: "",
    extra_charges: "",
    delivery_fee: "",
    discount: "",
    deposit_amount: "",
    note: "",
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setActionError("");

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchQuery,
        status: selectedStatus,
        payment_status: selectedPaymentStatus,
        delivery_filter: deliveryFilter,
        sort_by: sortBy,
      });

      const res = await fetch(`/api/admin/custom-cakes?${params}`);
      const json = await res.json();
      if (json.success) {
        setRequests(json.requests || []);
        setTotalRequests(json.pagination?.total ?? json.requests.length);
      } else {
        setActionError(json.error || "Failed to load requests.");
      }
    } catch {
      setActionError("Network error while loading custom cake requests.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, selectedStatus, selectedPaymentStatus, deliveryFilter, sortBy]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const json = await res.json();
      setUpdatingId(null);

      if (json.success) {
        setActionSuccess(`Request status updated to ${STATUS_LABELS[status] || status}`);
        fetchRequests();
      } else {
        setActionError(json.error || "Failed to update status");
      }
    } catch {
      setUpdatingId(null);
      setActionError("Error updating status");
    }
  }

  function openQuickQuote(req: any) {
    setQuickQuoteTarget(req);
    const q = req.quote;
    setQuoteForm({
      base_price: q?.base_price ? String(q.base_price) : req.budget ? String(req.budget) : "",
      design_charges: q?.design_charges ? String(q.design_charges) : "",
      tier_charges: q?.tier_charges ? String(q.tier_charges) : "",
      extra_charges: q?.extra_charges ? String(q.extra_charges) : "",
      delivery_fee: q?.delivery_fee ? String(q.delivery_fee) : "200",
      discount: q?.discount ? String(q.discount) : "",
      deposit_amount: q?.deposit_amount ? String(q.deposit_amount) : "",
      note: q?.note || "",
    });
  }

  async function handleQuickQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickQuoteTarget) return;

    setUpdatingId(quickQuoteTarget.id);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quickQuoteTarget.id,
          status: "quotation_prepared",
          quotation: {
            base_price: Number(quoteForm.base_price || 0),
            design_charges: Number(quoteForm.design_charges || 0),
            tier_charges: Number(quoteForm.tier_charges || 0),
            extra_charges: Number(quoteForm.extra_charges || 0),
            delivery_fee: Number(quoteForm.delivery_fee || 0),
            discount: Number(quoteForm.discount || 0),
            deposit_amount: Number(quoteForm.deposit_amount || 0),
            note: quoteForm.note,
          },
        }),
      });

      const json = await res.json();
      setUpdatingId(null);

      if (json.success) {
        setActionSuccess(`Itemized quotation sent for #${quickQuoteTarget.request_number}`);
        setQuickQuoteTarget(null);
        fetchRequests();
      } else {
        setActionError(json.error || "Failed to save quotation");
      }
    } catch {
      setUpdatingId(null);
      setActionError("Error saving quotation");
    }
  }

  async function handleConvertToOrder(req: any) {
    if (req.linked_order_id) {
      alert(`Already converted to order #${req.linked_order?.order_number || ""}`);
      return;
    }

    if (!confirm(`Convert Custom Cake Request #${req.request_number} to an official Storefront Order?`)) {
      return;
    }

    setConvertingId(req.id);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: req.id }),
      });

      const json = await res.json();
      setConvertingId(null);

      if (res.ok && json.success) {
        setActionSuccess(`Converted successfully! Order #${json.order_number} created.`);
        fetchRequests();
      } else {
        setActionError(json.error || "Failed to convert to order");
      }
    } catch {
      setConvertingId(null);
      setActionError("Error converting custom cake request to order");
    }
  }

  // Live Quick Quote Preview calculation
  const calculatedQuote = calculateQuotation({
    base_price: Number(quoteForm.base_price || 0),
    design_charges: Number(quoteForm.design_charges || 0),
    tier_charges: Number(quoteForm.tier_charges || 0),
    extra_charges: Number(quoteForm.extra_charges || 0),
    delivery_fee: Number(quoteForm.delivery_fee || 0),
    discount: Number(quoteForm.discount || 0),
    deposit_amount: Number(quoteForm.deposit_amount || 0),
  });

  // KPI Metrics
  const totalCount = totalRequests;
  const reviewCount = requests.filter((r) =>
    ["submitted", "under_review", "confirmation_required"].includes(r.status)
  ).length;
  const productionCount = requests.filter((r) =>
    ["confirmed", "deposit_pending", "in_production"].includes(r.status)
  ).length;
  const completedCount = requests.filter((r) =>
    ["delivered", "completed"].includes(r.status)
  ).length;

  const totalPages = Math.ceil(totalRequests / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cake size={24} className="text-orange" />
            <h1 className="text-2xl font-bold tracking-tight text-navy">
              Custom Cake Studio Orders
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Manage custom design briefs, prepare itemized quotations, verify advance payments, and convert to storefront orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchRequests()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-navy shadow-sm hover:border-orange hover:text-orange transition-all disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/custom-cake"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all"
          >
            <Sparkles size={14} /> View Studio Form <ExternalLink size={12} />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-muted uppercase">Total Requests</p>
          <p className="mt-1 text-2xl font-extrabold text-navy">{totalCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-amber-700 uppercase">Needs Review / Quoting</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">{reviewCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-blue-700 uppercase">In Production</p>
          <p className="mt-1 text-2xl font-extrabold text-blue-800">{productionCount}</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 shadow-sm">
          <p className="text-xs font-bold text-green-700 uppercase">Delivered / Completed</p>
          <p className="mt-1 text-2xl font-extrabold text-green-800">{completedCount}</p>
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-xl bg-green-50 p-3.5 border border-green-200 text-xs font-bold text-green-700 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess("")}><X size={14} /></button>
        </div>
      )}

      {actionError && (
        <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError("")}><X size={14} /></button>
        </div>
      )}

      {/* Advanced Filters Bar */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              type="text"
              placeholder="Search request #, customer, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-line bg-cream/40 pl-9 pr-3 py-2 text-xs font-semibold outline-none focus:border-orange focus:bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs font-semibold outline-none focus:border-orange focus:bg-white"
            >
              <option value="all">All Request Statuses</option>
              {CUSTOM_CAKE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {STATUS_LABELS[st] || st}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs font-semibold outline-none focus:border-orange focus:bg-white"
            >
              <option value="all">All Payment Statuses</option>
              {CUSTOM_CAKE_PAYMENT_STATUSES.map((pst) => (
                <option key={pst} value={pst}>
                  Payment: {pst.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Date Filter */}
          <div>
            <select
              value={deliveryFilter}
              onChange={(e) => {
                setDeliveryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs font-semibold outline-none focus:border-orange focus:bg-white"
            >
              <option value="all">Any Delivery Date</option>
              <option value="today">Due Today</option>
              <option value="tomorrow">Due Tomorrow</option>
              <option value="this_week">Due This Week</option>
              <option value="upcoming">All Upcoming</option>
              <option value="overdue">Overdue / Delayed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-line bg-cream/40 px-3 py-2 text-xs font-semibold outline-none focus:border-orange focus:bg-white"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="delivery_soonest">Sort: Delivery Date (Soonest)</option>
              <option value="budget_highest">Sort: Highest Budget</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-line bg-cream/60 font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="py-3.5 pl-4 pr-2">Photo</th>
                <th className="py-3.5 px-3">Request #</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Cake Specs</th>
                <th className="py-3.5 px-3">Delivery Date</th>
                <th className="py-3.5 px-3">Quotation</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70 font-medium text-navy">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <Clock size={20} className="mx-auto mb-2 animate-spin text-orange" />
                    Loading custom cake orders...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No custom cake requests found matching the current filters.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const images = req.images || [];
                  const firstImg = images[0]?.url;
                  const quote = req.quote;
                  const specs = req.specs;
                  const isConverted = !!req.linked_order_id;

                  return (
                    <tr key={req.id} className="hover:bg-cream/30 transition-colors">
                      {/* Thumbnail */}
                      <td className="py-3 pl-4 pr-2">
                        {firstImg ? (
                          <div
                            onClick={() => setLightboxUrl(firstImg)}
                            className="h-12 w-12 rounded-xl overflow-hidden border border-line bg-cream cursor-pointer shadow-sm hover:scale-105 transition-transform"
                          >
                            <img src={firstImg} alt="Cake sample" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-xl border border-dashed border-line bg-cream/50 flex items-center justify-center text-muted">
                            <Cake size={18} />
                          </div>
                        )}
                      </td>

                      {/* Request # */}
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/custom-cakes/${req.id}`}
                          className="font-mono font-extrabold text-orange hover:underline flex items-center gap-1"
                        >
                          #{req.request_number}
                        </Link>
                        <span className="block text-[10px] text-muted mt-0.5">
                          {new Date(req.created_at).toLocaleDateString("en-PK", { dateStyle: "short" })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <p className="font-bold">{req.customer_name}</p>
                        <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {req.phone}
                        </p>
                        <p className="text-[11px] text-muted flex items-center gap-1">
                          <MapPin size={10} /> {req.city} ({req.area})
                        </p>
                      </td>

                      {/* Specs */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="font-bold truncate">{specs?.cake_type || req.cake_type}</p>
                        <p className="text-[11px] text-muted truncate">
                          {specs?.flavor || req.flavor} • {specs?.cake_size || req.cake_size}
                        </p>
                        <p className="text-[10px] text-muted/80 truncate">
                          Shape: {specs?.shape || "Round"} • {specs?.tiers || "1 Tier"}
                        </p>
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold flex items-center gap-1">
                          <Calendar size={12} className="text-muted" />
                          {req.preferred_delivery_at
                            ? new Date(req.preferred_delivery_at).toLocaleDateString("en-PK", { dateStyle: "medium" })
                            : "Flexible"}
                        </span>
                      </td>

                      {/* Quotation */}
                      <td className="py-3 px-3">
                        {quote?.final_price ? (
                          <div>
                            <span className="font-extrabold text-navy">
                              {formatPKR(quote.final_price)}
                            </span>
                            <span className="block text-[10px] text-muted capitalize">
                              Quote: {quote.status}
                            </span>
                          </div>
                        ) : req.budget ? (
                          <div>
                            <span className="text-muted font-medium">Budget:</span>
                            <p className="font-bold">{formatPKR(req.budget)}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
                            Pending Quote
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <select
                          disabled={updatingId === req.id}
                          value={req.status}
                          onChange={(e) => updateStatus(req.id, e.target.value)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border outline-none cursor-pointer ${
                            STATUS_BADGE_CLASSES[req.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {CUSTOM_CAKE_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s] || s}
                            </option>
                          ))}
                        </select>

                        {isConverted && (
                          <span className="mt-1 block text-[10px] font-extrabold text-green-700">
                            ✓ Order #{req.linked_order?.order_number || ""}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openQuickQuote(req)}
                            className="rounded-lg border border-line bg-cream/50 px-2.5 py-1.5 text-xs font-bold text-navy hover:bg-cream hover:text-orange transition-all"
                            title="Quick Quote Builder"
                          >
                            <DollarSign size={13} className="inline mr-0.5" /> Quote
                          </button>

                          {!isConverted ? (
                            <button
                              type="button"
                              disabled={convertingId === req.id}
                              onClick={() => handleConvertToOrder(req)}
                              className="rounded-lg bg-orange/10 border border-orange/20 px-2.5 py-1.5 text-xs font-extrabold text-orange hover:bg-orange hover:text-white transition-all disabled:opacity-50"
                              title="Convert to Store Order"
                            >
                              <ShoppingBag size={13} className="inline mr-0.5" /> Convert
                            </button>
                          ) : (
                            <Link
                              href={`/admin/orders/${req.linked_order_id}`}
                              className="rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 transition-all"
                            >
                              View Order
                            </Link>
                          )}

                          <Link
                            href={`/admin/custom-cakes/${req.id}`}
                            className="rounded-lg border border-line p-1.5 text-navy hover:bg-cream transition-all"
                            title="Open Full Detail Page"
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs">
          <div className="text-muted">
            Showing <strong className="text-navy">{requests.length > 0 ? (page - 1) * limit + 1 : 0}</strong> to{" "}
            <strong className="text-navy">{Math.min(page * limit, totalRequests)}</strong> of{" "}
            <strong className="text-navy">{totalRequests}</strong> requests
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-bold text-navy hover:bg-cream disabled:opacity-40 transition-all"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="font-bold text-navy">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 font-bold text-navy hover:bg-cream disabled:opacity-40 transition-all"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Quote Modal */}
      {quickQuoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange">
                  Itemized Quotation
                </span>
                <h3 className="font-display text-xl font-bold text-navy">
                  #{quickQuoteTarget.request_number} • {quickQuoteTarget.customer_name}
                </h3>
              </div>
              <button
                onClick={() => setQuickQuoteTarget(null)}
                className="rounded-full p-1 text-muted hover:bg-cream hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickQuoteSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Base Cake Price (PKR) *
                  <input
                    type="number"
                    required
                    value={quoteForm.base_price}
                    onChange={(e) => setQuoteForm({ ...quoteForm, base_price: e.target.value })}
                    placeholder="e.g. 3500"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Design / Art Charges (PKR)
                  <input
                    type="number"
                    value={quoteForm.design_charges}
                    onChange={(e) => setQuoteForm({ ...quoteForm, design_charges: e.target.value })}
                    placeholder="e.g. 800"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Tier Structure Charges
                  <input
                    type="number"
                    value={quoteForm.tier_charges}
                    onChange={(e) => setQuoteForm({ ...quoteForm, tier_charges: e.target.value })}
                    placeholder="e.g. 500"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Delivery Fee (PKR)
                  <input
                    type="number"
                    value={quoteForm.delivery_fee}
                    onChange={(e) => setQuoteForm({ ...quoteForm, delivery_fee: e.target.value })}
                    placeholder="e.g. 200"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Extra Toppers / Add-ons
                  <input
                    type="number"
                    value={quoteForm.extra_charges}
                    onChange={(e) => setQuoteForm({ ...quoteForm, extra_charges: e.target.value })}
                    placeholder="e.g. 0"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <label className="block font-bold text-green-700">
                  Special Discount (PKR)
                  <input
                    type="number"
                    value={quoteForm.discount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, discount: e.target.value })}
                    placeholder="e.g. 300"
                    className="mt-1 w-full rounded-xl border border-green-200 bg-green-50/40 p-2.5 font-semibold outline-none focus:border-green-600 focus:bg-white"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Advance Required (Deposit)
                  <input
                    type="number"
                    value={quoteForm.deposit_amount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, deposit_amount: e.target.value })}
                    placeholder="e.g. 2000"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-semibold outline-none focus:border-orange focus:bg-white"
                  />
                </label>

                <div className="rounded-xl bg-orange/10 p-2.5 border border-orange/20 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-muted">Calculated Total</span>
                  <span className="text-base font-extrabold text-orange">
                    {formatPKR(calculatedQuote.final_price)}
                  </span>
                </div>
              </div>

              <label className="block font-bold text-navy">
                Quotation Note for Customer
                <textarea
                  rows={2}
                  value={quoteForm.note}
                  onChange={(e) => setQuoteForm({ ...quoteForm, note: e.target.value })}
                  placeholder="e.g. Price includes hand-crafted sugar figurines and customized cake topper."
                  className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 font-medium outline-none focus:border-orange focus:bg-white resize-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => setQuickQuoteTarget(null)}
                  className="rounded-xl border border-line px-4 py-2 font-bold text-navy hover:bg-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === quickQuoteTarget.id}
                  className="rounded-xl bg-orange px-5 py-2 font-extrabold text-white shadow hover:bg-orange-dark disabled:opacity-50"
                >
                  {updatingId === quickQuoteTarget.id ? "Saving..." : "Save & Send Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-navy/80 text-white hover:bg-red-600 transition-colors shadow z-10"
            >
              <X size={16} />
            </button>
            <img src={lightboxUrl} alt="Sample" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

export const AdminCustomCakesManager = CustomCakesManager;
