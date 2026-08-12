"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Clock, Search, ShieldCheck, Truck, Cake, Sparkles, Star } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { getCustomCakeStepIndex, getStandardOrderStepIndex } from "@/lib/tracking-status";
import { ReviewSubmissionModal } from "@/components/storefront/review-submission-modal";

const standardSteps = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "baking", label: "Baking Fresh" },
  { key: "ready", label: "Packed & Ready" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

const cakeSteps = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "quoted", label: "Quote Ready" },
  { key: "confirmed", label: "Order Confirmed" },
  { key: "baking", label: "Baking & Decorating" },
  { key: "ready", label: "Ready / Dispatched" },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrder = searchParams.get("order") || searchParams.get("request") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [refInput, setRefInput] = useState(initialOrder);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [result, setResult] = useState<{ type?: string; order?: any; request?: any } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (initialOrder && initialPhone) {
      performLookup(initialOrder, initialPhone);
    }
  }, [initialOrder, initialPhone]);

  async function performLookup(ref: string, phone: string) {
    if (!ref.trim() || !phone.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_number: ref, phone: phone }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setResult(null);
        setError(data.error ?? "Order or request not found. Check both details and try again.");
      } else {
        setResult(data);
      }
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    performLookup(refInput, phoneInput);
  }

  const isStandard = result?.type === "standard" && result.order;
  const isCustom = result?.type === "custom_cake" && result.request;

  const currentOrder = isStandard ? result.order : null;
  const currentRequest = isCustom ? result.request : null;

  const standardIndex = currentOrder ? getStandardOrderStepIndex(currentOrder.status) : -1;
  const cakeIndex = currentRequest ? getCustomCakeStepIndex(currentRequest.status) : -1;

  return (
    <div className="container-shell py-12 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-bold text-orange border border-orange/20 mb-3 shadow-sm">
          <Truck size={14} className="animate-pulse" /> LIVE BAKERY TRACKING
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Track Your Order & Consultations
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
          Enter your reference number (e.g. BM-10024 or BM-CR-1001) and phone number to view real-time status.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={submit}
        className="mx-auto mt-8 grid max-w-xl gap-3 rounded-[28px] bg-white p-5 border border-line/80 shadow-md sm:grid-cols-[1fr_1fr_auto] sm:items-end transition-all hover:shadow-lg"
      >
        <label className="text-left text-xs font-bold uppercase tracking-wider text-navy">
          Order / Request #
          <input
            name="order"
            required
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="BM-10024 or BM-CR-1001"
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
          />
        </label>

        <label className="text-left text-xs font-bold uppercase tracking-wider text-navy">
          Phone Number
          <input
            name="phone"
            required
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="03XX XXXXXXX"
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
          />
        </label>

        <button
          disabled={loading}
          className="grid h-[46px] w-full place-items-center rounded-xl bg-orange px-5 text-white shadow-md hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60"
          aria-label="Search order"
        >
          {loading ? <Clock size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </form>

      {error && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Standard Order Results */}
      {isStandard && (
        <section className="mx-auto mt-10 max-w-3xl rounded-[32px] bg-white p-6 sm:p-10 border border-line/80 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-green flex items-center gap-1.5">
                <ShieldCheck size={14} /> Standard Order Located
              </span>
              <h2 className="mt-1 font-display text-3xl font-bold text-navy flex items-center gap-2">
                {currentOrder.order_number}
              </h2>
              <p className="mt-1 text-xs text-muted font-medium">
                Customer: <span className="font-semibold text-navy">{currentOrder.customer_name}</span> • Destination: <span className="font-semibold text-navy">{currentOrder.city}</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-green/10 px-4 py-2 text-xs font-extrabold capitalize text-green border border-green/20 w-fit shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green"></span>
              </span>
              Status: {String(currentOrder.status).replaceAll("_", " ")}
            </div>
          </div>

          {currentOrder.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-muted">
              <div>
                Total Amount: <span className="font-bold text-navy text-sm">{formatPKR(currentOrder.total)}</span>
              </div>
              {currentOrder.payment_method && (
                <div className="capitalize">
                  Payment Method: <span className="font-bold text-navy">{currentOrder.payment_method.replace(/_/g, " ")}</span>
                </div>
              )}
            </div>
          )}

          {/* Courier Dispatch Card */}
          {(currentOrder.courier_name || currentOrder.tracking_number || currentOrder.courier) && (
            <div className="mt-5 p-4 rounded-2xl bg-orange/5 border border-orange/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange text-white shadow-xs">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-orange">Courier Dispatched</p>
                  <p className="font-bold text-navy text-sm">{currentOrder.courier_name || currentOrder.courier?.name || "Assigned Courier"}</p>
                  {currentOrder.tracking_number && (
                    <p className="text-xs text-muted font-mono">Consignment #: <strong className="text-navy">{currentOrder.tracking_number}</strong></p>
                  )}
                </div>
              </div>

              {(currentOrder.tracking_url || currentOrder.courier?.tracking_url_template) && (
                <a
                  href={
                    currentOrder.tracking_url ||
                    currentOrder.courier?.tracking_url_template?.replace("{tracking_number}", currentOrder.tracking_number || "") ||
                    "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange transition-all"
                >
                  Live Courier Tracking →
                </a>
              )}
            </div>
          )}

          {/* Animated Timeline */}
          <div className="relative mt-12 px-2">
            {/* Connecting Progress Line (Desktop) */}
            <div className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-cream-deep -z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green/80 to-green transition-all duration-700 ease-out rounded-full"
                style={{
                  width: `${(Math.max(0, standardIndex) / (standardSteps.length - 1)) * 100}%`,
                }}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-7 relative z-10">
              {standardSteps.map((step, index) => {
                const isCompleted = index <= standardIndex;
                const isCurrent = index === standardIndex;

                return (
                  <div key={step.key} className="relative flex gap-3 sm:block sm:text-center group">
                    <div
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all duration-500 mx-auto ${
                        isCompleted
                          ? "bg-green text-white shadow-lg shadow-green/25 scale-100"
                          : "bg-white text-muted border-2 border-line hover:border-muted"
                      } ${isCurrent ? "ring-4 ring-green/30 scale-110 animate-bounce-subtle" : ""}`}
                    >
                      {isCompleted ? <Check size={18} className="animate-in zoom-in-50 duration-300" /> : index + 1}
                    </div>

                    <div className="sm:mt-3">
                      <p
                        className={`text-xs font-bold leading-snug transition-colors duration-300 ${
                          isCompleted ? "text-navy" : "text-muted/70"
                        } ${isCurrent ? "text-green font-extrabold" : ""}`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-1 text-[10px] font-extrabold text-green bg-green/10 px-2 py-0.5 rounded-full border border-green/20">
                          Active Phase
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {currentOrder.status === "delivered" && currentOrder.order_items?.length > 0 && (
            <div className="mt-8 border-t border-line/60 pt-6 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange mb-3">
                <Star size={14} className="fill-orange text-orange" /> Review Purchased Products
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentOrder.order_items.map((item: any) => (
                  <div key={item.product_id || item.product_name} className="flex items-center justify-between gap-3 rounded-2xl bg-cream-deep/50 p-4 border border-line/60">
                    <div className="min-w-0">
                      <p className="font-bold text-navy text-xs truncate">{item.product_name}</p>
                      <p className="text-[10px] text-muted">{item.quantity} × {formatPKR(item.unit_price)}</p>
                    </div>
                    {item.product_id ? (
                      <button
                        onClick={() => setReviewItem({ id: item.product_id, name: item.product_name })}
                        className="flex items-center gap-1 rounded-xl bg-orange px-3.5 py-2 text-[11px] font-bold text-white shadow-xs hover:bg-orange-dark transition-all shrink-0"
                      >
                        <Star size={12} className="fill-white" /> Review
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Custom Cake Results */}
      {isCustom && (
        <section className="mx-auto mt-10 max-w-3xl rounded-[32px] bg-white p-6 sm:p-10 border border-line/80 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-orange flex items-center gap-1.5">
                <Cake size={14} /> Custom Cake Consultation Found
              </span>
              <h2 className="mt-1 font-display text-3xl font-bold text-navy flex items-center gap-2">
                {currentRequest.request_number}
              </h2>
              <p className="mt-1 text-xs text-muted font-medium">
                Customer: <span className="font-semibold text-navy">{currentRequest.full_name || currentRequest.customer_name}</span> • Flavour: <span className="font-semibold text-navy">{currentRequest.flavor} ({currentRequest.cake_size})</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-4 py-2 text-xs font-extrabold capitalize text-orange border border-orange/20 w-fit shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange"></span>
              </span>
              Status: {String(currentRequest.status).replaceAll("_", " ")}
            </div>
          </div>

          {currentRequest.price_quote && (
            <div className="mt-6 rounded-2xl bg-orange/10 p-5 border border-orange/20 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange">
                <Sparkles size={14} /> Official Price Quotation
              </div>
              <p className="mt-1 font-display text-2xl font-extrabold text-navy">
                PKR {currentRequest.price_quote}
              </p>
              {currentRequest.admin_notes && (
                <p className="mt-2 text-xs text-muted font-medium bg-white/60 p-3 rounded-xl border border-orange/10">
                  <span className="font-bold text-navy">Decorator Note:</span> {currentRequest.admin_notes}
                </p>
              )}
            </div>
          )}

          {/* Animated Cake Timeline */}
          <div className="relative mt-12 px-2">
            {/* Connecting Progress Line (Desktop) */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-cream-deep -z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange to-amber-500 transition-all duration-700 ease-out rounded-full"
                style={{
                  width: `${(Math.max(0, cakeIndex) / (cakeSteps.length - 1)) * 100}%`,
                }}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-6 relative z-10">
              {cakeSteps.map((step, index) => {
                const isCompleted = index <= cakeIndex;
                const isCurrent = index === cakeIndex;

                return (
                  <div key={step.key} className="relative flex gap-3 sm:block sm:text-center group">
                    <div
                      className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-extrabold transition-all duration-500 mx-auto ${
                        isCompleted
                          ? "bg-orange text-white shadow-lg shadow-orange/25 scale-100"
                          : "bg-white text-muted border-2 border-line hover:border-muted"
                      } ${isCurrent ? "ring-4 ring-orange/30 scale-110 animate-bounce-subtle" : ""}`}
                    >
                      {isCompleted ? <Check size={18} className="animate-in zoom-in-50 duration-300" /> : index + 1}
                    </div>

                    <div className="sm:mt-3">
                      <p
                        className={`text-xs font-bold leading-snug transition-colors duration-300 ${
                          isCompleted ? "text-navy" : "text-muted/70"
                        } ${isCurrent ? "text-orange font-extrabold" : ""}`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && (
                        <span className="inline-block mt-1 text-[10px] font-extrabold text-orange bg-orange/10 px-2 py-0.5 rounded-full border border-orange/20">
                          Active Phase
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {reviewItem && (
        <ReviewSubmissionModal
          isOpen={Boolean(reviewItem)}
          onClose={() => setReviewItem(null)}
          productId={reviewItem.id}
          productName={reviewItem.name}
          initialOrderId={currentOrder?.id}
          initialOrderNumber={currentOrder?.order_number}
        />
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center">Loading tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
