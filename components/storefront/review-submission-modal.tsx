"use client";

import { useState, useEffect } from "react";
import { Star, X, CheckCircle2, AlertCircle, Loader2, ShieldCheck, ShoppingBag } from "lucide-react";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  initialOrderId?: string;
  initialOrderNumber?: string;
  initialReview?: any;
  onSuccess?: () => void;
}

export function ReviewSubmissionModal({
  isOpen,
  onClose,
  productId,
  productName,
  initialOrderId,
  initialOrderNumber,
  initialReview,
  onSuccess,
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState<number>(initialReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [body, setBody] = useState<string>(initialReview?.body || "");
  const [orderNumber, setOrderNumber] = useState<string>(initialOrderNumber || "");
  const [contact, setContact] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedOrder, setVerifiedOrder] = useState<{ id: string; number: string } | null>(
    initialOrderId && initialOrderNumber ? { id: initialOrderId, number: initialOrderNumber } : null
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setRating(initialReview?.rating || 5);
      setBody(initialReview?.body || "");
      setErrorMessage("");
      setSuccessMessage("");
      if (initialOrderId && initialOrderNumber) {
        setVerifiedOrder({ id: initialOrderId, number: initialOrderNumber });
      }
    }
  }, [isOpen, initialReview, initialOrderId, initialOrderNumber]);

  if (!isOpen) return null;

  async function verifyGuestOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !contact.trim()) {
      setErrorMessage("Please enter your Order Number and Phone or Email.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/reviews/check-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          order_number: orderNumber.trim(),
          contact: contact.trim(),
        }),
      });

      const data = await res.json();
      setIsVerifying(false);

      if (!res.ok || !data.eligible) {
        setErrorMessage(data.reason || "We could not find a delivered order for this product matching your details.");
      } else {
        setVerifiedOrder({ id: data.order_id, number: data.order_number });
        if (data.existing_review) {
          setRating(data.existing_review.rating || 5);
          setBody(data.existing_review.body || "");
        }
        if (data.customer_name) {
          setGuestName(data.customer_name);
        }
      }
    } catch {
      setIsVerifying(false);
      setErrorMessage("Network error. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating from 1 to 5 stars.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload: Record<string, any> = {
        product_id: productId,
        rating,
        body: body.trim(),
      };

      if (verifiedOrder) {
        payload.order_id = verifiedOrder.id;
        payload.order_number = verifiedOrder.number;
      } else if (orderNumber) {
        payload.order_number = orderNumber.trim();
      }

      if (contact.includes("@")) {
        payload.guest_email = contact.trim();
      } else if (contact) {
        payload.guest_phone = contact.trim();
      }
      if (guestName) {
        payload.guest_name = guestName.trim();
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to submit review.");
      } else {
        setSuccessMessage(data.message || "Thank you! Your review has been submitted for moderation.");
        if (onSuccess) onSuccess();
      }
    } catch {
      setSubmitting(false);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[32px] border border-line/80 bg-white p-6 shadow-2xl sm:p-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange/10 text-orange">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange">Verified Review</p>
              <h2 className="font-display text-xl font-bold text-navy line-clamp-1">{productName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-cream hover:text-navy transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        {successMessage ? (
          <div className="py-8 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-green/10 text-green">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="font-display text-2xl font-bold text-navy">Review Submitted!</h3>
            <p className="mt-2 text-xs font-medium text-muted leading-relaxed max-w-xs mx-auto">
              {successMessage}
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-2xl bg-navy px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-navy-dark transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5">
            {errorMessage && (
              <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Order Verification if not verified */}
            {!verifiedOrder ? (
              <form onSubmit={verifyGuestOrder} className="flex flex-col gap-4">
                <div className="rounded-2xl bg-cream-deep/60 p-4 border border-line/60 text-xs text-muted font-medium">
                  <p className="font-bold text-navy mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-orange" /> Purchase Verification Required
                  </p>
                  To leave a verified purchase review, please enter the order number and contact details used during checkout.
                </div>

                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Order Number *
                  <input
                    required
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. BM-10024"
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-3 text-xs font-semibold text-navy outline-none focus:border-orange focus:bg-white transition-all"
                  />
                </label>

                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Phone Number or Email *
                  <input
                    required
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="03XX XXXXXXX or your checkout email"
                    className="mt-1.5 w-full rounded-xl border border-line bg-cream/40 px-3.5 py-3 text-xs font-semibold text-navy outline-none focus:border-orange focus:bg-white transition-all"
                  />
                </label>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange px-5 py-3.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Verifying Order...
                    </>
                  ) : (
                    "Verify Purchase & Write Review"
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Review Form */
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex items-center justify-between rounded-xl bg-green/10 px-3.5 py-2.5 border border-green/20 text-xs font-bold text-green">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Order #{verifiedOrder.number} Verified
                  </span>
                  <button
                    type="button"
                    onClick={() => setVerifiedOrder(null)}
                    className="text-[10px] underline hover:text-green-dark"
                  >
                    Change
                  </button>
                </div>

                {/* Interactive Star Rating */}
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted">Your Overall Rating</span>
                  <div className="mt-2.5 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                          aria-label={`Rate ${star} out of 5 stars`}
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              isFilled ? "fill-orange text-orange" : "fill-cream-deep text-cream-deep hover:text-orange/50"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs font-bold text-navy">
                    {rating === 5 ? "Exceptional! 5/5" : rating === 4 ? "Very Good 4/5" : rating === 3 ? "Average 3/5" : rating === 2 ? "Below Average 2/5" : "Poor 1/5"}
                  </p>
                </div>

                {/* Review Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Your Review (Optional)
                    </label>
                    <span className="text-[10px] font-medium text-muted">{body.length}/2000</span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={2000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Tell us what you liked about this bake, flavor, freshness, packaging, or delivery experience..."
                    className="w-full rounded-2xl border border-line bg-cream/40 p-4 text-xs font-medium text-navy outline-none focus:border-orange focus:bg-white transition-all leading-relaxed"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange px-5 py-4 text-xs font-extrabold text-white shadow-lg shadow-orange/20 hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Review for Approval"
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
