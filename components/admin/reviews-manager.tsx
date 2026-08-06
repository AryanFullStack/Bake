"use client";

import { useState } from "react";
import { Check, X, Star } from "lucide-react";

export function AdminReviewsManager({ initialReviews }: { initialReviews: any[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const filtered = reviews.filter((r) => {
    if (filter === "pending") return !r.is_approved;
    if (filter === "approved") return r.is_approved;
    return true;
  });

  async function moderate(id: string, approved: boolean) {
    const response = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved: approved }),
    });
    if (response.ok) {
      setReviews(reviews.map((review) => (review.id === id ? { ...review, is_approved: approved } : review)));
    }
  }

  const pending = reviews.filter((r) => !r.is_approved).length;
  const approved = reviews.filter((r) => r.is_approved).length;

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">Review Moderation</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-navy">Reviews</h1>
        <p className="mt-1 text-sm text-muted font-medium">
          {pending} pending approval · {approved} published
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-4">
        {[
          { key: "pending", label: `Pending (${pending})` },
          { key: "approved", label: `Approved (${approved})` },
          { key: "all", label: `All (${reviews.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              filter === key
                ? "bg-navy text-white"
                : "bg-cream-deep text-muted hover:text-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid gap-4">
        {filtered.length ? (
          filtered.map((review: any) => (
            <article
              key={review.id}
              className={`rounded-[24px] bg-white p-6 border shadow-xs transition-all ${
                !review.is_approved
                  ? "border-orange/30 bg-orange/[0.02]"
                  : "border-line/80"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  {/* Product & Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-orange bg-orange/10 rounded-full px-2.5 py-1">
                      {review.products?.name ?? "Product"}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest rounded-full px-2.5 py-1 ${
                        review.is_approved
                          ? "bg-green/10 text-green"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {review.is_approved ? "Published" : "Pending"}
                    </span>
                  </div>

                  {/* Author & Rating */}
                  <p className="mt-3 font-extrabold text-navy text-base">
                    {review.profiles?.full_name ?? "Anonymous Customer"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={star <= review.rating ? "fill-orange text-orange" : "fill-cream-deep text-cream-deep"}
                      />
                    ))}
                    <span className="ml-1 text-xs text-muted font-medium">{review.rating}/5</span>
                  </div>

                  {/* Body */}
                  <p className="mt-3 text-sm leading-7 text-navy/80">{review.body}</p>

                  {/* Date */}
                  {review.created_at && (
                    <p className="mt-2 text-xs text-muted">
                      {new Date(review.created_at).toLocaleDateString("en-PK")}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex sm:flex-col gap-2 shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => moderate(review.id, true)}
                      className="flex items-center gap-1.5 rounded-xl bg-green/10 px-4 py-2.5 text-xs font-bold text-green hover:bg-green/20 transition-colors"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => moderate(review.id, false)}
                    className="flex items-center gap-1.5 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <X size={14} /> {review.is_approved ? "Unpublish" : "Reject"}
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[24px] bg-white p-12 text-center border border-line/80">
            <Star size={32} className="mx-auto text-cream-deep mb-3" />
            <p className="text-sm font-bold text-muted">
              {filter === "pending"
                ? "No reviews pending moderation."
                : filter === "approved"
                ? "No approved reviews yet."
                : "No reviews in the database yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
