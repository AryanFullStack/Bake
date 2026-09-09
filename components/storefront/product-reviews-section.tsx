"use client";

import { useMemo, useState } from "react";
import { Check, MessageSquarePlus, Star, Filter, ArrowUpDown } from "lucide-react";
import type { Product, Review } from "@/lib/types";
import { calculateRatingDistribution, formatReviewerName } from "@/lib/reviews";
import { ReviewSubmissionModal } from "./review-submission-modal";
import { PaginationControls } from "@/components/pagination";

interface ProductReviewsSectionProps {
  product: Product;
  reviews: Review[];
}

export function ProductReviewsSection({ product, reviews }: ProductReviewsSectionProps) {
  const [filterStar, setFilterStar] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);

  // Compute rating statistics
  const ratingDistribution = useMemo(() => calculateRatingDistribution(reviews), [reviews]);

  // Filter & Sort Approved Reviews
  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (filterStar !== "all") {
      result = result.filter((r) => Math.round(r.rating) === filterStar);
    }
    result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      return 0;
    });
    return result;
  }, [reviews, filterStar, sortBy]);

  const paginatedReviews = useMemo(() => {
    const from = (page - 1) * pageSize;
    return filteredReviews.slice(from, from + pageSize);
  }, [filteredReviews, page, pageSize]);

  const handleFilterStarChange = (star: number | "all") => {
    setFilterStar(star);
    setPage(1);
  };

  const handleSortByChange = (val: "newest" | "highest" | "lowest") => {
    setSortBy(val);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Overview & Distribution Header */}
      <div className="grid gap-6 rounded-[28px] bg-cream-deep/40 p-6 border border-line/60 md:grid-cols-[240px_1fr_auto] md:items-center">
        {/* Rating Score */}
        <div className="flex flex-col items-center justify-center border-b border-line/60 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6 text-center">
          <span className="font-display text-5xl font-extrabold text-navy">
            {ratingDistribution.average ? ratingDistribution.average.toFixed(1) : "0.0"}
          </span>
          <div className="mt-2 flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={18}
                className={
                  star <= Math.round(ratingDistribution.average)
                    ? "fill-orange text-orange"
                    : "fill-cream-deep text-muted/40"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-xs font-bold text-muted">
            Based on {ratingDistribution.total} verified {ratingDistribution.total === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Rating Distribution Bars */}
        <div className="flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution.counts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = ratingDistribution.percentages[star as 1 | 2 | 3 | 4 | 5] || 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs font-bold text-navy">
                <button
                  onClick={() => handleFilterStarChange(filterStar === star ? "all" : star)}
                  className={`flex w-10 items-center gap-1 transition-colors ${
                    filterStar === star ? "text-orange" : "text-navy hover:text-orange"
                  }`}
                >
                  <span>{star}</span>
                  <Star size={12} className="fill-orange text-orange" />
                </button>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-deep border border-line/40">
                  <div
                    className="h-full bg-orange transition-all duration-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-xs font-semibold text-muted">{pct}% ({count})</span>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center justify-center border-t border-line/60 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-6">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-orange px-6 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-orange/20 hover:bg-orange-dark active:scale-[0.98] transition-all"
          >
            <MessageSquarePlus size={16} /> Write a Review
          </button>
          <p className="mt-2 text-[10px] text-muted text-center font-medium max-w-[180px]">
            Share feedback with fellow bakers & dessert lovers
          </p>
        </div>
      </div>

      {/* Filter Badges & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-muted uppercase tracking-wider text-[10px] mr-1">Filter:</span>
          <button
            onClick={() => handleFilterStarChange("all")}
            className={`rounded-full px-3 py-1 text-xs font-extrabold transition-all ${
              filterStar === "all" ? "bg-navy text-white shadow-xs" : "bg-cream-deep text-navy hover:bg-cream"
            }`}
          >
            All ({ratingDistribution.total})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => handleFilterStarChange(star)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold transition-all ${
                filterStar === star ? "bg-orange text-white shadow-xs" : "bg-cream-deep text-navy hover:bg-cream"
              }`}
            >
              <span>{star}</span> <Star size={11} className="fill-current" /> ({ratingDistribution.counts[star as 1|2|3|4|5] || 0})
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="flex items-center gap-1 text-xs font-bold text-muted">
            <ArrowUpDown size={13} /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => handleSortByChange(e.target.value as any)}
            className="rounded-xl border border-line/80 bg-white px-3 py-1.5 text-xs font-bold text-navy outline-none focus:border-orange shadow-xs cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Cards List */}
      <div className="grid gap-4">
        {filteredReviews.length > 0 ? (
          <>
            {paginatedReviews.map((review) => {
              const displayName = formatReviewerName(
                review.reviewer_name || review.guest_name || review.profiles?.full_name,
                review.guest_email
              );

              return (
                <article
                  key={review.id}
                  className="rounded-[24px] border border-line/80 bg-white p-6 shadow-xs transition-all hover:shadow-md"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    {/* Rating Stars & Badge */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex gap-0.5 text-orange">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={15}
                              className={star <= review.rating ? "fill-orange text-orange" : "fill-cream-deep text-cream-deep"}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-navy">{review.rating}.0</span>

                        {review.is_verified_purchase && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2.5 py-0.5 text-[11px] font-extrabold text-green border border-green/20">
                            <Check size={12} strokeWidth={3} /> Verified Purchase
                          </span>
                        )}
                      </div>

                      <h4 className="mt-2.5 font-bold text-navy text-sm sm:text-base">
                        {review.body ? `“${review.body.slice(0, 70)}${review.body.length > 70 ? "..." : ""}”` : "Customer Rating"}
                      </h4>
                    </div>

                    {/* Date */}
                    <span className="text-[11px] font-semibold text-muted shrink-0">
                      {new Date(review.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Review Body */}
                  {review.body && (
                    <p className="mt-3 text-xs leading-relaxed font-medium text-navy/80 sm:text-sm">
                      {review.body}
                    </p>
                  )}

                  {/* Author Footer */}
                  <div className="mt-4 flex items-center gap-2.5 border-t border-line/60 pt-3 text-xs">
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-navy font-bold text-white text-xs shadow-xs">
                      {displayName.charAt(0)}
                    </div>
                    <span className="font-extrabold text-navy">{displayName}</span>
                  </div>
                </article>
              );
            })}

            <PaginationControls
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredReviews.length}
              itemLabel="reviews"
              onPageChange={setPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              className="mt-4"
            />
          </>
        ) : (
          /* Empty State */
          <div className="rounded-[28px] border border-line/80 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-cream-deep text-muted">
              <Star size={28} />
            </div>
            <h3 className="font-display text-xl font-bold text-navy">No approved reviews yet</h3>
            <p className="mt-1.5 text-xs font-medium text-muted max-w-sm mx-auto">
              {filterStar !== "all"
                ? `No ${filterStar}-star reviews found. Try changing your star filter.`
                : "Have you purchased this delicious bake? Be the first customer to share your experience!"}
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-dark transition-all"
            >
              <MessageSquarePlus size={15} /> Write the First Review
            </button>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <ReviewSubmissionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}
