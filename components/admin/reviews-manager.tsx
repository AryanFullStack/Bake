"use client";

import { useState, useMemo, useCallback } from "react";
import { Check, X, Star, Search, ShieldCheck, EyeOff, Trash2, StickyNote, Loader2, RefreshCw } from "lucide-react";
import { formatReviewerName } from "@/lib/reviews";
import { PaginationControls } from "@/components/pagination";

interface AdminReviewsManagerProps {
  initialReviews: any[];
}

export function AdminReviewsManager({ initialReviews }: AdminReviewsManagerProps) {
  const [allReviews, setAllReviews] = useState<any[]>(initialReviews);

  // If there are pending reviews, open on pending; otherwise open on approved
  const defaultTab = useMemo(() => {
    const hasPending = initialReviews.some((r) => r.status === "pending" || (!r.status && !r.is_approved));
    return hasPending ? "pending" : "approved";
  }, [initialReviews]);

  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "hidden" | "reported" | "all">(defaultTab);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // Compute Overall Statistics from all reviews
  const stats = useMemo(() => {
    const total = allReviews.length;
    const pending = allReviews.filter((r) => r.status === "pending" || (!r.status && !r.is_approved)).length;
    const approved = allReviews.filter((r) => r.status === "approved" || (!r.status && r.is_approved)).length;
    const rejected = allReviews.filter((r) => r.status === "rejected").length;
    const hidden = allReviews.filter((r) => r.status === "hidden").length;
    const reported = allReviews.filter((r) => r.is_reported).length;

    const approvedReviews = allReviews.filter((r) => r.status === "approved" || r.is_approved);
    const avgRating = approvedReviews.length
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : "0.0";

    return { total, pending, approved, rejected, hidden, reported, avgRating };
  }, [allReviews]);

  // Filter reviews accurately based on active tab and search
  const filteredReviews = useMemo(() => {
    let list = allReviews;

    if (filterStatus === "pending") {
      list = list.filter((r) => r.status === "pending" || (!r.status && !r.is_approved));
    } else if (filterStatus === "approved") {
      list = list.filter((r) => r.status === "approved" || (!r.status && r.is_approved));
    } else if (filterStatus === "rejected") {
      list = list.filter((r) => r.status === "rejected");
    } else if (filterStatus === "hidden") {
      list = list.filter((r) => r.status === "hidden");
    } else if (filterStatus === "reported") {
      list = list.filter((r) => r.is_reported);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((r) => {
        const bodyMatch = r.body?.toLowerCase().includes(q);
        const titleMatch = r.title?.toLowerCase().includes(q);
        const reviewerMatch = (r.reviewer_name || r.guest_name || r.profiles?.full_name)?.toLowerCase().includes(q);
        const emailMatch = (r.guest_email || r.orders?.customer_email)?.toLowerCase().includes(q);
        const productMatch = r.products?.name?.toLowerCase().includes(q);
        return Boolean(bodyMatch || titleMatch || reviewerMatch || emailMatch || productMatch);
      });
    }

    return list;
  }, [allReviews, filterStatus, searchTerm]);

  // Paginated slice for current page
  const paginatedReviews = useMemo(() => {
    const from = (page - 1) * limit;
    return filteredReviews.slice(from, from + limit);
  }, [filteredReviews, page, limit]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusChange = (val: "pending" | "approved" | "rejected" | "hidden" | "reported" | "all") => {
    setFilterStatus(val);
    setPage(1);
  };

  // Refresh reviews from API
  const refreshFromApi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews?limit=1000&status=all");
      const json = await res.json();
      if (json.success && Array.isArray(json.reviews)) {
        setAllReviews(json.reviews);
      }
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  // Execute Moderation Action
  async function handleModeration(id: string, action: "approve" | "reject" | "hide" | "delete" | "update_note") {
    setProcessingId(id);
    const noteVal = noteInputs[id];

    // Optimistic state update
    if (action === "delete") {
      setAllReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      setAllReviews((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r };
          if (action === "approve") {
            updated.status = "approved";
            updated.is_approved = true;
          } else if (action === "reject") {
            updated.status = "rejected";
            updated.is_approved = false;
          } else if (action === "hide") {
            updated.status = "hidden";
            updated.is_approved = false;
          }
          if (noteVal !== undefined) {
            updated.admin_note = noteVal;
          }
          return updated;
        })
      );
    }

    try {
      const payload: Record<string, any> = { id, action };
      if (action === "update_note" || noteVal !== undefined) {
        payload.admin_note = noteVal;
      }

      await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // ignore
    } finally {
      setProcessingId(null);
    }
  }

  const tabCounts: Record<string, number> = {
    pending: stats.pending,
    approved: stats.approved,
    rejected: stats.rejected,
    hidden: stats.hidden,
    reported: stats.reported,
    all: stats.total,
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 min-w-0 overflow-x-hidden max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-5">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange">Customer Moderation Studio</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-navy">Product Reviews Moderation</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Approve, reject, or flag customer product reviews to maintain trust &amp; review quality.
          </p>
        </div>
        <button
          onClick={refreshFromApi}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-line bg-white hover:bg-cream text-navy transition-colors shadow-2xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <div className="rounded-2xl border border-line bg-white p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Total Reviews</span>
          <span className="text-xl font-extrabold text-navy">{stats.total}</span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending</span>
          <span className="text-xl font-extrabold text-amber-700">{stats.pending}</span>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/60 p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 block">Approved</span>
          <span className="text-xl font-extrabold text-green">{stats.approved}</span>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">Rejected</span>
          <span className="text-xl font-extrabold text-red-600">{stats.rejected}</span>
        </div>
        <div className="rounded-2xl border border-orange/30 bg-orange/10 p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange block">Avg Rating</span>
          <span className="text-xl font-extrabold text-navy flex items-center justify-center gap-1">
            {stats.avgRating} <Star size={15} className="fill-orange text-orange" />
          </span>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-3.5 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Reported</span>
          <span className="text-xl font-extrabold text-purple-700">{stats.reported}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl bg-white p-3.5 border border-line/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(["pending", "approved", "rejected", "hidden", "reported", "all"] as const).map((statusKey) => {
            const isActive = filterStatus === statusKey;
            const count = tabCounts[statusKey] ?? 0;
            return (
              <button
                key={statusKey}
                onClick={() => handleStatusChange(statusKey)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-navy text-white shadow-xs"
                    : "bg-cream/40 text-muted hover:bg-cream hover:text-navy"
                }`}
              >
                <span>{statusKey}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative max-w-sm w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search review content, product, or customer..."
            className="w-full rounded-xl border border-line bg-cream/40 pl-9 pr-4 py-1.5 text-xs font-medium outline-none focus:border-orange focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {paginatedReviews.length > 0 ? (
          paginatedReviews.map((review) => {
            const currentStatus = review.status || (review.is_approved ? "approved" : "pending");
            const isProcessing = processingId === review.id;
            const formattedName = formatReviewerName(review.reviewer_name || review.guest_name || review.profiles?.full_name);

            return (
              <article
                key={review.id}
                className="rounded-2xl bg-white p-4 sm:p-5 border border-line/80 shadow-xs flex flex-col gap-3 transition-colors hover:border-orange/30"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Header Badges & Rating */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-navy bg-cream/80 px-2.5 py-0.5 rounded-full border border-line/80">
                        {review.products?.name || "Product"}
                      </span>

                      {currentStatus === "approved" && (
                        <span className="text-[10px] font-black uppercase text-green bg-green/10 px-2.5 py-0.5 rounded-full border border-green/20">
                          Approved
                        </span>
                      )}
                      {currentStatus === "pending" && (
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending Moderation
                        </span>
                      )}
                      {currentStatus === "rejected" && (
                        <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                          Rejected
                        </span>
                      )}
                      {currentStatus === "hidden" && (
                        <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          Hidden
                        </span>
                      )}

                      {review.is_verified_buyer && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange bg-orange/10 px-2 py-0.5 rounded-full border border-orange/20">
                          <ShieldCheck size={11} /> Verified Buyer
                        </span>
                      )}
                    </div>

                    {/* Author & Stars */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={star <= review.rating ? "fill-orange text-orange" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-navy">{formattedName}</span>
                      <span className="text-muted text-[11px]">({review.guest_email || review.orders?.customer_email || "No email"})</span>
                      <span className="text-muted text-[11px]">• {new Date(review.created_at).toLocaleDateString("en-PK")}</span>
                    </div>

                    {/* Review Body */}
                    {review.title && <h3 className="font-bold text-navy text-sm">{review.title}</h3>}
                    <p className="text-xs text-navy/90 leading-relaxed bg-cream/20 p-3 rounded-xl border border-line/50">
                      {review.body}
                    </p>

                    {/* Admin Note */}
                    <div className="pt-1.5 flex items-center justify-between text-xs">
                      {editingNoteId === review.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input
                            type="text"
                            value={noteInputs[review.id] ?? review.admin_note ?? ""}
                            onChange={(e) => setNoteInputs({ ...noteInputs, [review.id]: e.target.value })}
                            placeholder="Internal admin note..."
                            className="flex-1 rounded-xl border border-line bg-cream/40 px-3 py-1 text-xs font-medium outline-none focus:border-orange"
                          />
                          <button
                            onClick={() => {
                              handleModeration(review.id, "update_note");
                              setEditingNoteId(null);
                            }}
                            className="rounded-xl bg-orange px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-orange-dark"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <>
                          {review.admin_note ? (
                            <span className="text-xs text-orange font-medium">
                              <strong>Admin Note:</strong> {review.admin_note}
                            </span>
                          ) : (
                            <span className="text-muted text-[11px]">No admin notes</span>
                          )}
                          <button
                            onClick={() => {
                              setEditingNoteId(review.id);
                              setNoteInputs({ ...noteInputs, [review.id]: review.admin_note || "" });
                            }}
                            className="text-[11px] font-bold text-orange hover:underline ml-2 shrink-0 flex items-center gap-1"
                          >
                            <StickyNote size={11} /> {review.admin_note ? "Edit Note" : "Add Note"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Moderation Actions Toolbar */}
                  <div className="flex flex-wrap lg:flex-col gap-1.5 shrink-0 pt-2 lg:pt-0 w-full lg:w-auto justify-end">
                    {isProcessing ? (
                      <div className="flex items-center justify-center p-2 text-xs font-bold text-muted">
                        <Loader2 size={14} className="animate-spin mr-1" /> Saving...
                      </div>
                    ) : (
                      <>
                        {currentStatus !== "approved" && (
                          <button
                            onClick={() => handleModeration(review.id, "approve")}
                            className="flex items-center gap-1 rounded-xl bg-green/10 px-3 py-1.5 text-xs font-bold text-green border border-green/20 hover:bg-green hover:text-white transition-all shadow-2xs"
                          >
                            <Check size={13} /> Approve
                          </button>
                        )}

                        {currentStatus !== "rejected" && (
                          <button
                            onClick={() => handleModeration(review.id, "reject")}
                            className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-2xs"
                          >
                            <X size={13} /> Reject
                          </button>
                        )}

                        {currentStatus !== "hidden" && (
                          <button
                            onClick={() => handleModeration(review.id, "hide")}
                            className="flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-700 hover:text-white transition-all shadow-2xs"
                          >
                            <EyeOff size={13} /> Hide
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this review?")) {
                              handleModeration(review.id, "delete");
                            }
                          }}
                          className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-red-600 hover:text-white transition-all shadow-2xs"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center border border-line/80 shadow-xs">
            <Star size={32} className="mx-auto text-cream-deep mb-2" />
            <h3 className="font-display text-lg font-bold text-navy">No reviews found</h3>
            <p className="mt-1 text-xs font-medium text-muted">
              {searchTerm
                ? `No reviews matching "${searchTerm}"`
                : filterStatus === "pending"
                ? "All customer reviews have been moderated. Check the Approved tab to view live reviews."
                : `No reviews found in status "${filterStatus}".`}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <PaginationControls
          currentPage={page}
          pageSize={limit}
          totalItems={filteredReviews.length}
          itemLabel="reviews"
          onPageChange={setPage}
          onPageSizeChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          className="mt-4"
        />
      </div>
    </div>
  );
}
