"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Check, X, Star, Search, ShieldCheck, EyeOff, Trash2, StickyNote, Loader2, RefreshCw } from "lucide-react";
import { formatReviewerName } from "@/lib/reviews";
import { PaginationControls } from "@/components/pagination";

interface AdminReviewsManagerProps {
  initialReviews: any[];
}

export function AdminReviewsManager({ initialReviews }: AdminReviewsManagerProps) {
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "hidden" | "reported" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalReviews, setTotalReviews] = useState(initialReviews.length);
  const [loading, setLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: searchTerm,
        status: filterStatus,
      });
      const res = await fetch(`/api/admin/reviews?${params}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
        setTotalReviews(json.pagination?.total ?? (json.reviews || []).length);
      }
    } catch {
      // ignore
    } fontally: {
      setLoading(false);
    }
  }, [page, limit, searchTerm, filterStatus]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setPage(1);
  };

  const handleStatusChange = (val: "pending" | "approved" | "rejected" | "hidden" | "reported" | "all") => {
    setFilterStatus(val);
    setPage(1);
  };

  // Compute Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === "pending" || (!r.status && !r.is_approved)).length;
    const approved = reviews.filter((r) => r.status === "approved" || (!r.status && r.is_approved)).length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;
    const hidden = reviews.filter((r) => r.status === "hidden").length;
    const reported = reviews.filter((r) => r.is_reported).length;

    const approvedReviews = reviews.filter((r) => r.status === "approved" || r.is_approved);
    const avgRating = approvedReviews.length
      ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1)
      : "0.0";

    return { total, pending, approved, rejected, hidden, reported, avgRating };
  }, [reviews]);

  // Execute Moderation Action
  async function handleModeration(id: string, action: "approve" | "reject" | "hide" | "delete" | "update_note") {
    setProcessingId(id);
    try {
      const payload: Record<string, any> = { id, action };
      if (action === "update_note" || noteInputs[id] !== undefined) {
        payload.admin_note = noteInputs[id];
      }

      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setProcessingId(null);

      if (res.ok) {
        fetchReviews();
      }
    } catch {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-6 min-w-0 overflow-x-hidden">
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange">Customer Moderation Studio</p>
        <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">Product Reviews Moderation</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
          Approve, reject, or flag customer product reviews to maintain trust &amp; review quality.
        </p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <div className="rounded-2xl border border-line bg-white p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Total Reviews</span>
          <span className="text-xl font-extrabold text-navy">{totalReviews}</span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Pending Moderation</span>
          <span className="text-xl font-extrabold text-amber-700">{stats.pending}</span>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-800 block">Approved & Published</span>
          <span className="text-xl font-extrabold text-green">{stats.approved}</span>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">Rejected Reviews</span>
          <span className="text-xl font-extrabold text-red-600">{stats.rejected}</span>
        </div>
        <div className="rounded-2xl border border-orange/30 bg-orange/10 p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange block">Avg Rating</span>
          <span className="text-xl font-extrabold text-navy flex items-center justify-center gap-1">
            {stats.avgRating} <Star size={16} className="fill-orange text-orange" />
          </span>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">Reported</span>
          <span className="text-xl font-extrabold text-purple-700">{stats.reported}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-[24px] bg-white p-4 border border-line/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {(["pending", "approved", "rejected", "hidden", "reported", "all"] as const).map((statusKey) => {
            const isActive = filterStatus === statusKey;
            return (
              <button
                key={statusKey}
                onClick={() => handleStatusChange(statusKey)}
                className={`rounded-xl px-3.5 py-2 text-xs font-extrabold capitalize transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-navy text-white shadow-xs"
                    : "bg-cream/40 text-muted hover:bg-cream hover:text-navy"
                }`}
              >
                {statusKey}
              </button>
            );
          })}
        </div>

        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search review content, product, or customer..."
            className="w-full rounded-xl border border-line bg-cream/40 pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-orange focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className={`space-y-4 ${loading ? "opacity-50" : ""}`}>
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const currentStatus = review.status || (review.is_approved ? "approved" : "pending");
            const isProcessing = processingId === review.id;
            const formattedName = formatReviewerName(review.reviewer_name || review.guest_name || review.profiles?.full_name);

            return (
              <article
                key={review.id}
                className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs flex flex-col gap-4 transition-colors hover:border-orange/30"
              >
                <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-navy bg-cream/60 px-3 py-1 rounded-full border border-line">
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
                          <ShieldCheck size={12} /> Verified Buyer
                        </span>
                      )}
                    </div>

                    {/* Rating & Author */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= review.rating ? "fill-orange text-orange" : "text-gray-300"}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-navy text-sm">{formattedName}</span>
                      <span className="text-xs text-muted">({review.guest_email || review.orders?.customer_email || "No email"})</span>
                      <span className="text-xs text-muted">• {new Date(review.created_at).toLocaleDateString("en-PK")}</span>
                    </div>

                    {/* Review Title & Body */}
                    {review.title && <h3 className="font-bold text-navy text-base">{review.title}</h3>}
                    <p className="text-xs text-navy/80 leading-relaxed bg-cream/20 p-3.5 rounded-2xl border border-line/60">
                      {review.body}
                    </p>

                    {/* Admin Note Box */}
                    <div className="mt-2 pt-2 border-t border-line/40">
                      {editingNoteId === review.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={noteInputs[review.id] ?? review.admin_note ?? ""}
                            onChange={(e) => setNoteInputs({ ...noteInputs, [review.id]: e.target.value })}
                            placeholder="Internal admin note..."
                            className="flex-1 rounded-xl border border-line bg-cream/40 px-3 py-1.5 text-xs font-medium outline-none focus:border-orange"
                          />
                          <button
                            onClick={() => {
                              handleModeration(review.id, "update_note");
                              setEditingNoteId(null);
                            }}
                            className="rounded-xl bg-orange px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-orange-dark"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
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
                            <StickyNote size={12} /> {review.admin_note ? "Edit Note" : "Add Note"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Moderation Actions Toolbar */}
                  <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 border-line/60 pt-4 lg:pt-0">
                    {isProcessing ? (
                      <div className="flex items-center justify-center p-3 text-xs font-bold text-muted">
                        <Loader2 size={16} className="animate-spin mr-1" /> Saving...
                      </div>
                    ) : (
                      <>
                        {currentStatus !== "approved" && (
                          <button
                            onClick={() => handleModeration(review.id, "approve")}
                            className="flex items-center gap-1.5 rounded-xl bg-green/10 px-4 py-2.5 text-xs font-extrabold text-green border border-green/20 hover:bg-green hover:text-white transition-all shadow-2xs"
                          >
                            <Check size={14} /> Approve & Publish
                          </button>
                        )}

                        {currentStatus !== "rejected" && (
                          <button
                            onClick={() => handleModeration(review.id, "reject")}
                            className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-all shadow-2xs"
                          >
                            <X size={14} /> Reject
                          </button>
                        )}

                        {currentStatus !== "hidden" && (
                          <button
                            onClick={() => handleModeration(review.id, "hide")}
                            className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-700 hover:text-white transition-all shadow-2xs"
                          >
                            <EyeOff size={14} /> Hide
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to permanently delete this review?")) {
                              handleModeration(review.id, "delete");
                            }
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-red-600 hover:text-white transition-all shadow-2xs"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] bg-white p-12 text-center border border-line/80 shadow-xs">
            <Star size={36} className="mx-auto text-cream-deep mb-3" />
            <h3 className="font-display text-xl font-bold text-navy">No reviews found</h3>
            <p className="mt-1.5 text-xs font-bold text-muted">
              {searchTerm
                ? `No reviews matching "${searchTerm}"`
                : filterStatus === "pending"
                ? "All customer reviews have been moderated."
                : `No reviews found in status "${filterStatus}".`}
            </p>
          </div>
        )}

        <PaginationControls
          currentPage={page}
          pageSize={limit}
          totalItems={totalReviews}
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
