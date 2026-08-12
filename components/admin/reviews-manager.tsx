"use client";

import { useState, useMemo } from "react";
import { Check, X, Star, Search, ShieldCheck, EyeOff, Trash2, StickyNote, Loader2, RefreshCw } from "lucide-react";
import { formatReviewerName } from "@/lib/reviews";

interface AdminReviewsManagerProps {
  initialReviews: any[];
}

export function AdminReviewsManager({ initialReviews }: AdminReviewsManagerProps) {
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "rejected" | "hidden" | "reported" | "all">("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

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

  // Filtered & Searched Reviews
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const currentStatus = r.status || (r.is_approved ? "approved" : "pending");

      // Status filter
      if (filterStatus === "pending" && currentStatus !== "pending") return false;
      if (filterStatus === "approved" && currentStatus !== "approved") return false;
      if (filterStatus === "rejected" && currentStatus !== "rejected") return false;
      if (filterStatus === "hidden" && currentStatus !== "hidden") return false;
      if (filterStatus === "reported" && !r.is_reported) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const productName = r.products?.name?.toLowerCase() || "";
        const reviewer = (r.reviewer_name || r.guest_name || r.profiles?.full_name || "").toLowerCase();
        const email = (r.guest_email || r.orders?.customer_email || "").toLowerCase();
        const orderNum = (r.orders?.order_number || "").toLowerCase();
        const body = (r.body || "").toLowerCase();

        return (
          productName.includes(term) ||
          reviewer.includes(term) ||
          email.includes(term) ||
          orderNum.includes(term) ||
          body.includes(term)
        );
      }

      return true;
    });
  }, [reviews, filterStatus, searchTerm]);

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
        if (action === "delete") {
          setReviews((prev) => prev.filter((r) => r.id !== id));
        } else {
          setReviews((prev) =>
            prev.map((r) => {
              if (r.id !== id) return r;
              let nextStatus = r.status;
              let nextApproved = r.is_approved;

              if (action === "approve") {
                nextStatus = "approved";
                nextApproved = true;
              } else if (action === "reject") {
                nextStatus = "rejected";
                nextApproved = false;
              } else if (action === "hide") {
                nextStatus = "hidden";
                nextApproved = false;
              }

              return {
                ...r,
                status: nextStatus,
                is_approved: nextApproved,
                admin_note: payload.admin_note !== undefined ? payload.admin_note : r.admin_note,
              };
            })
          );
          setEditingNoteId(null);
        }
      }
    } catch {
      setProcessingId(null);
    }
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header Title & Metrics */}
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-orange bg-orange/10 px-3 py-1 rounded-full border border-orange/20">
          Admin Moderation
        </span>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-navy">Review Management</h1>
        <p className="mt-1 text-sm text-muted font-medium">
          Moderate customer product reviews, audit verified purchases, add internal notes, and manage public visibility.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Pending</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-amber-600">{stats.pending}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Published</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-green">{stats.approved}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Rejected</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-red-600">{stats.rejected}</p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Avg Rating</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-orange flex items-center gap-1">
            {stats.avgRating} <Star size={20} className="fill-orange" />
          </p>
        </div>
        <div className="rounded-2xl border border-line/80 bg-white p-4 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">Total Reviews</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy">{stats.total}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "approved", label: `Published (${stats.approved})` },
            { key: "rejected", label: `Rejected (${stats.rejected})` },
            { key: "hidden", label: `Hidden (${stats.hidden})` },
            { key: "reported", label: `Reported (${stats.reported})` },
            { key: "all", label: `All (${stats.total})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as typeof filterStatus)}
              className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
                filterStatus === key
                  ? "bg-navy text-white shadow-xs"
                  : "bg-cream-deep text-muted hover:text-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product, customer, order..."
            className="w-full rounded-xl border border-line/80 bg-white pl-9 pr-4 py-2 text-xs font-semibold text-navy outline-none focus:border-orange shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted hover:text-navy"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4">
        {filtered.length ? (
          filtered.map((review) => {
            const currentStatus = review.status || (review.is_approved ? "approved" : "pending");
            const displayName = formatReviewerName(
              review.reviewer_name || review.guest_name || review.profiles?.full_name,
              review.guest_email || review.orders?.customer_email
            );
            const isProcessing = processingId === review.id;
            const isEditingNote = editingNoteId === review.id;

            return (
              <article
                key={review.id}
                className={`rounded-[28px] bg-white p-6 border shadow-xs transition-all ${
                  currentStatus === "pending"
                    ? "border-amber-400/50 bg-amber-500/[0.02]"
                    : currentStatus === "rejected"
                    ? "border-red-200 bg-red-50/20 opacity-80"
                    : currentStatus === "hidden"
                    ? "border-purple-200 bg-purple-50/20"
                    : "border-line/80"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Metadata Header */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {/* Product Tag */}
                      <span className="text-xs font-extrabold text-navy bg-cream-deep px-3 py-1 rounded-full border border-line/60">
                        {review.products?.name ?? "Product"}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-0.5 border ${
                          currentStatus === "approved"
                            ? "bg-green/10 text-green border-green/20"
                            : currentStatus === "pending"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : currentStatus === "rejected"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-purple-100 text-purple-700 border-purple-200"
                        }`}
                      >
                        {currentStatus === "approved" ? "Published" : currentStatus}
                      </span>

                      {/* Verified Purchase Badge */}
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-green bg-green/10 px-2.5 py-0.5 rounded-full border border-green/20">
                          <ShieldCheck size={12} /> Verified Purchase
                        </span>
                      )}

                      {/* Order Number link */}
                      {review.orders?.order_number && (
                        <span className="text-[11px] font-bold text-muted">
                          Order: <strong className="text-navy">{review.orders.order_number}</strong>
                        </span>
                      )}
                    </div>

                    {/* Reviewer Name & Contact */}
                    <div className="mt-2 flex items-baseline gap-2">
                      <h3 className="font-display text-lg font-bold text-navy">{displayName}</h3>
                      {(review.guest_email || review.orders?.customer_email) && (
                        <span className="text-xs text-muted font-medium">
                          ({review.guest_email || review.orders?.customer_email})
                        </span>
                      )}
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={15}
                          className={star <= review.rating ? "fill-orange text-orange" : "fill-cream-deep text-cream-deep"}
                        />
                      ))}
                      <span className="ml-1 text-xs font-bold text-navy">{review.rating}/5</span>
                      <span className="ml-2 text-xs text-muted">•</span>
                      <span className="text-xs text-muted font-semibold">
                        {new Date(review.created_at).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Review Body */}
                    <p className="mt-3 text-sm leading-relaxed text-navy font-medium bg-cream/30 p-4 rounded-2xl border border-line/40">
                      {review.body ? `“${review.body}”` : <em className="text-muted">No text written (Star rating only)</em>}
                    </p>

                    {/* Internal Moderation Note */}
                    <div className="mt-3">
                      {isEditingNote ? (
                        <div className="flex flex-col gap-2 rounded-2xl bg-amber-50/60 p-3 border border-amber-200">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                            <StickyNote size={13} /> Internal Moderation Note
                          </span>
                          <textarea
                            rows={2}
                            value={noteInputs[review.id] ?? review.admin_note ?? ""}
                            onChange={(e) => setNoteInputs({ ...noteInputs, [review.id]: e.target.value })}
                            placeholder="Add reason for approval/rejection or internal follow-up notes..."
                            className="w-full rounded-xl border border-amber-300 bg-white p-2.5 text-xs font-medium text-navy outline-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingNoteId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-muted hover:text-navy"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleModeration(review.id, "update_note")}
                              className="rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-800"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-muted font-semibold">
                          <span>
                            <strong className="text-navy">Internal Note:</strong>{" "}
                            {review.admin_note ? (
                              <span className="italic text-navy">{review.admin_note}</span>
                            ) : (
                              <span className="text-muted/60">None</span>
                            )}
                          </span>
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
      </div>
    </div>
  );
}
