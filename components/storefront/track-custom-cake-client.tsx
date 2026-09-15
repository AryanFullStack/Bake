"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Cake,
  Check,
  Clock,
  Search,
  ShieldCheck,
  Truck,
  Sparkles,
  MapPin,
  User,
  Calendar,
  Layers,
  Heart,
  FileText,
  AlertCircle,
  ExternalLink,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
  X,
  CreditCard,
  Building2,
  Copy,
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import {
  CUSTOM_CAKE_STEPS,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_BADGE_CLASSES,
  getCustomCakeTimelineIndex,
} from "@/lib/custom-cake";
import { resolveCakeImageUrl } from "@/lib/custom-cake-media";

function TrackCustomCakeContent() {
  const searchParams = useSearchParams();
  const initialRequest = searchParams.get("request") || searchParams.get("order") || "";
  const initialPhone = searchParams.get("phone") || searchParams.get("email") || "";

  const [refInput, setRefInput] = useState(initialRequest);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [result, setResult] = useState<{ type?: string; request?: any; order?: any } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Quotation Action Modals
  const [quoteActionLoading, setQuoteActionLoading] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Payment Proof Form State
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "jazzcash">("bank_transfer");
  const [txRef, setTxRef] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [copiedBank, setCopiedBank] = useState(false);

  useEffect(() => {
    if (initialRequest && initialPhone) {
      performLookup(initialRequest, initialPhone);
    }
  }, [initialRequest, initialPhone]);

  async function performLookup(ref: string, phone: string) {
    if (!ref.trim() || !phone.trim()) return;

    setLoading(true);
    setError("");
    setActionSuccessMsg("");
    setPaymentSuccessMsg("");

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
        setError(data.error || "Cake request not found. Please verify both reference and phone/email.");
      } else {
        setResult(data);
      }
    } catch {
      setLoading(false);
      setError("Network error occurred. Please check your connection and try again.");
    }
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    performLookup(refInput, phoneInput);
  }

  // Handle Quote Decisions: Accept, Request Changes, Decline
  async function handleQuoteDecision(action: "accept" | "request_changes" | "decline", notes?: string) {
    if (!cakeReq?.id) return;
    setQuoteActionLoading(true);
    setError("");

    try {
      const res = await fetch("/api/custom-cake/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: cakeReq.id,
          phone_or_email: phoneInput,
          action,
          notes: notes || "",
        }),
      });

      const json = await res.json();
      setQuoteActionLoading(false);

      if (!res.ok) {
        setError(json.error || "Failed to submit response.");
      } else {
        setShowChangesModal(false);
        setShowDeclineModal(false);
        setFeedbackNote("");
        setActionSuccessMsg(
          action === "accept"
            ? "Quotation accepted! If advance deposit is required, please submit payment proof below."
            : action === "request_changes"
            ? "Change request sent to our master decorator. We will revise your quotation shortly."
            : "Quotation declined. Your request status has been updated."
        );
        // Refresh live data
        performLookup(refInput, phoneInput);
      }
    } catch {
      setQuoteActionLoading(false);
      setError("Failed to communicate with server.");
    }
  }

  // Handle Payment Proof Submission
  async function handlePaymentProofSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!cakeReq?.id) return;
    if (!proofFile && !txRef.trim()) {
      setError("Please provide either a transaction reference ID or upload receipt screenshot.");
      return;
    }

    setPaymentSubmitting(true);
    setError("");

    try {
      const data = new FormData();
      data.append("request_id", cakeReq.id);
      data.append("phone_or_email", phoneInput);
      data.append("method", paymentMethod);
      data.append("transaction_reference", txRef);
      data.append("amount_paid", paidAmount || String(cakeReq.quote?.deposit_amount || "0"));
      if (proofFile) {
        data.append("proof", proofFile);
      }

      const res = await fetch("/api/custom-cake/payment", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      setPaymentSubmitting(false);

      if (!res.ok) {
        setError(json.error || "Failed to submit payment proof.");
      } else {
        setPaymentSuccessMsg("Payment proof uploaded successfully! Our accounts team is verifying your payment.");
        setTxRef("");
        setPaidAmount("");
        setProofFile(null);
        setProofPreview(null);
        performLookup(refInput, phoneInput);
      }
    } catch {
      setPaymentSubmitting(false);
      setError("Error submitting payment proof.");
    }
  }

  function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  }

  const cakeReq = result?.type === "custom_cake" ? result.request : null;
  const quote = cakeReq?.quote;
  const specs = cakeReq?.specs;
  const images: Array<{ id: string; url: string }> = cakeReq?.images || [];
  const history: any[] = cakeReq?.history || [];
  const linkedOrder = cakeReq?.linked_order;

  const currentTimelineIndex = cakeReq ? getCustomCakeTimelineIndex(cakeReq.status) : 0;
  const statusLabel = cakeReq ? STATUS_LABELS[cakeReq.status] || cakeReq.status : "";
  const statusBadge = cakeReq ? STATUS_BADGE_CLASSES[cakeReq.status] || "bg-gray-100 text-gray-700" : "";
  const paymentBadge = cakeReq?.payment_status
    ? PAYMENT_STATUS_BADGE_CLASSES[cakeReq.payment_status] || "bg-gray-100 text-gray-700"
    : "";

  return (
    <div className="container-shell py-12 md:py-20">
      {/* Page Title */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange/10 px-3.5 py-1.5 text-xs font-extrabold text-orange border border-orange/20 mb-3 shadow-sm">
          <Truck size={14} className="animate-pulse" /> LIVE CUSTOM CAKE TRACKER
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
          Track Your Custom Cake
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted font-medium">
          Enter your Custom Cake Request # (e.g. <strong className="text-navy">BM-CR-1000</strong>) and your phone number or email to view live decorator progress, quotation, and timeline.
        </p>
      </div>

      {/* Lookup Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="mx-auto mt-8 grid max-w-xl gap-3 rounded-[28px] bg-white p-5 border border-line/80 shadow-md sm:grid-cols-[1.2fr_1fr_auto] sm:items-end transition-all hover:shadow-lg"
      >
        <label className="text-left text-xs font-bold uppercase tracking-wider text-navy">
          Request #
          <input
            required
            value={refInput}
            onChange={(e) => setRefInput(e.target.value)}
            placeholder="e.g. BM-CR-1000"
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
          />
        </label>

        <label className="text-left text-xs font-bold uppercase tracking-wider text-navy">
          Phone / Email
          <input
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="0300 1234567"
            className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold outline-none focus:border-orange focus:bg-white transition-all"
          />
        </label>

        <button
          disabled={loading}
          aria-label="Track request"
          className="grid h-[48px] w-full place-items-center rounded-xl bg-orange px-5 text-white shadow-md hover:bg-orange-dark active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? <Clock size={18} className="animate-spin" /> : <Search size={18} />}
        </button>
      </form>

      {error && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {actionSuccessMsg && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-green-50 p-4 border border-green-200 text-xs font-bold text-green-700 text-center animate-in fade-in slide-in-from-top-2">
          {actionSuccessMsg}
        </div>
      )}

      {paymentSuccessMsg && (
        <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-blue-50 p-4 border border-blue-200 text-xs font-bold text-blue-700 text-center animate-in fade-in slide-in-from-top-2">
          {paymentSuccessMsg}
        </div>
      )}

      {/* Result Section */}
      {cakeReq && (
        <div className="mx-auto mt-10 max-w-4xl space-y-8 animate-in fade-in duration-500">
          {/* Header Card */}
          <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-line shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line/60 pb-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Custom Cake Brief
                </span>
                <h2 className="font-mono text-3xl font-extrabold text-navy tracking-tight mt-0.5">
                  #{cakeReq.request_number}
                </h2>
                <p className="mt-1 text-xs text-muted font-medium">
                  Submitted on {new Date(cakeReq.created_at).toLocaleDateString("en-PK", { dateStyle: "long" })} • Customer: <strong className="text-navy">{cakeReq.customer_name}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-extrabold border ${statusBadge}`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  {statusLabel}
                </span>

                {cakeReq.payment_status && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-extrabold border ${paymentBadge}`}>
                    Payment: {String(cakeReq.payment_status).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Linked Store Order Alert */}
            {linkedOrder && (
              <div className="mt-4 rounded-2xl bg-orange/10 p-4 border border-orange/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-navy">
                  <Sparkles size={16} className="text-orange" />
                  <span>Converted to Store Order: <strong className="font-mono text-orange">#{linkedOrder.order_number}</strong></span>
                </div>
                <Link
                  href={`/track-order?order=${linkedOrder.order_number}&phone=${encodeURIComponent(phoneInput)}`}
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-orange hover:underline"
                >
                  Track Storefront Order <ExternalLink size={14} />
                </Link>
              </div>
            )}

            {/* 11-Step Visual Interactive Timeline */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Production & Delivery Roadmap
                </h3>
                <span className="text-xs font-bold text-orange">
                  Phase {currentTimelineIndex + 1} of {CUSTOM_CAKE_STEPS.length}
                </span>
              </div>

              <div className="overflow-x-auto pb-4 pt-1">
                <div className="flex min-w-[760px] justify-between relative">
                  {/* Progress Line */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-cream-deep -z-0 rounded-full">
                    <div
                      className="h-full bg-orange transition-all duration-700 ease-out rounded-full"
                      style={{
                        width: `${(currentTimelineIndex / (CUSTOM_CAKE_STEPS.length - 1)) * 100}%`,
                      }}
                    />
                  </div>

                  {CUSTOM_CAKE_STEPS.map((step, idx) => {
                    const isPassed = idx < currentTimelineIndex;
                    const isCurrent = idx === currentTimelineIndex;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center relative z-10 w-16">
                        <div
                          className={`grid h-8 w-8 place-items-center rounded-full text-xs font-extrabold transition-all duration-300 ${
                            isPassed
                              ? "bg-orange text-white shadow-md"
                              : isCurrent
                              ? "bg-orange text-white ring-4 ring-orange/30 scale-110 shadow-lg"
                              : "bg-white text-muted border-2 border-line"
                          }`}
                        >
                          {isPassed ? <Check size={14} /> : idx + 1}
                        </div>
                        <p
                          className={`mt-2 text-[10px] font-bold leading-tight ${
                            isCurrent ? "text-orange font-extrabold" : isPassed ? "text-navy" : "text-muted/60"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Quotation & Customer Decision Card */}
          {quote && (
            <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-orange/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 h-2 bg-gradient-to-r from-orange to-amber-500 w-full" />

              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-orange" />
                  <h3 className="font-display text-xl font-bold text-navy">
                    Official Quotation & Pricing
                  </h3>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                  quote.status === "accepted"
                    ? "bg-green-100 text-green-700"
                    : quote.status === "declined"
                    ? "bg-red-100 text-red-700"
                    : quote.status === "changes_requested"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-orange/10 text-orange border border-orange/20"
                }`}>
                  Status: {quote.status}
                </span>
              </div>

              {/* Itemized Breakdown Table */}
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-cream/50 p-4 border border-line text-xs space-y-2.5">
                  <div className="flex justify-between text-muted">
                    <span>Base Cake Price:</span>
                    <strong className="text-navy">{formatPKR(quote.base_price)}</strong>
                  </div>
                  {quote.design_charges > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Design & Handcrafted Art:</span>
                      <strong className="text-navy">{formatPKR(quote.design_charges)}</strong>
                    </div>
                  )}
                  {quote.tier_charges > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Multi-Tier Structure:</span>
                      <strong className="text-navy">{formatPKR(quote.tier_charges)}</strong>
                    </div>
                  )}
                  {quote.delivery_fee > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Delivery Fee:</span>
                      <strong className="text-navy">{formatPKR(quote.delivery_fee)}</strong>
                    </div>
                  )}
                  {quote.extra_charges > 0 && (
                    <div className="flex justify-between text-muted">
                      <span>Extra Add-ons / Toppers:</span>
                      <strong className="text-navy">{formatPKR(quote.extra_charges)}</strong>
                    </div>
                  )}
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Special Discount:</span>
                      <span>-{formatPKR(quote.discount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-line flex justify-between text-sm font-extrabold text-navy">
                    <span>Final Total Price:</span>
                    <span className="text-orange">{formatPKR(quote.final_price)}</span>
                  </div>
                </div>

                {/* Advance & Payment Summary */}
                <div className="rounded-2xl bg-orange/5 p-4 border border-orange/20 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-orange">
                      Payment Breakdown
                    </span>
                    <div className="mt-3 space-y-2 text-xs">
                      <div className="flex justify-between text-muted">
                        <span>Advance Required (Deposit):</span>
                        <strong className="text-navy font-bold">{formatPKR(quote.deposit_amount)}</strong>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Total Paid to Date:</span>
                        <strong className="text-green-700 font-bold">{formatPKR(quote.amount_paid)}</strong>
                      </div>
                      <div className="flex justify-between text-muted pt-2 border-t border-orange/10">
                        <span>Remaining Balance:</span>
                        <strong className="text-navy font-extrabold">{formatPKR(quote.remaining_balance)}</strong>
                      </div>
                    </div>
                  </div>

                  {quote.note && (
                    <div className="mt-4 rounded-xl bg-white p-3 border border-line/60 text-xs text-muted">
                      <strong className="text-navy">Decorator Note:</strong> {quote.note}
                    </div>
                  )}
                </div>
              </div>

              {/* Quotation Customer Actions */}
              {(cakeReq.status === "quotation_prepared" || cakeReq.status === "confirmation_required" || quote.status === "pending") && (
                <div className="mt-6 pt-6 border-t border-line/60 flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={quoteActionLoading}
                    onClick={() => setShowDeclineModal(true)}
                    className="rounded-xl border border-red-200 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-all disabled:opacity-60"
                  >
                    Decline Quote
                  </button>
                  <button
                    type="button"
                    disabled={quoteActionLoading}
                    onClick={() => setShowChangesModal(true)}
                    className="rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-navy hover:bg-cream/60 transition-all disabled:opacity-60"
                  >
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={quoteActionLoading}
                    onClick={() => handleQuoteDecision("accept")}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    <Check size={16} /> Accept Quotation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Proof Upload Section (if deposit is required or pending) */}
          {(cakeReq.status === "deposit_pending" || cakeReq.status === "quotation_prepared" || quote?.deposit_amount > 0) && (
            <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-line shadow-lg">
              <div className="flex items-center gap-2 pb-4 border-b border-line/60">
                <CreditCard size={20} className="text-orange" />
                <h3 className="font-display text-xl font-bold text-navy">
                  Submit Payment Proof (Advance Deposit)
                </h3>
              </div>

              {/* Bank Account Details */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream/70 p-4 border border-line text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy flex items-center gap-1.5">
                      <Building2 size={16} className="text-orange" /> Bank Transfer (Meezan Bank)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("01020304050607");
                        setCopiedBank(true);
                        setTimeout(() => setCopiedBank(false), 2000);
                      }}
                      className="text-[11px] font-bold text-orange hover:underline flex items-center gap-1"
                    >
                      <Copy size={12} /> {copiedBank ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-muted"><strong>Account Title:</strong> Bake Bazaar Mart</p>
                  <p className="text-muted"><strong>Account Number:</strong> 0102 0304 0506 07</p>
                  <p className="text-muted"><strong>IBAN:</strong> PK65 MEZN 0001 0203 0405 0607</p>
                </div>

                <div className="rounded-2xl bg-cream/70 p-4 border border-line text-xs space-y-2">
                  <span className="font-bold text-navy flex items-center gap-1.5">
                    <Sparkles size={16} className="text-orange" /> JazzCash Mobile Wallet
                  </span>
                  <p className="text-muted"><strong>Account Title:</strong> Bake Bazaar Mart</p>
                  <p className="text-muted"><strong>Mobile Number:</strong> 0300 1234567</p>
                  <p className="text-muted"><strong>Instructions:</strong> Please include your Request # in the transfer remark.</p>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handlePaymentProofSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Payment Method
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
                    >
                      <option value="bank_transfer">Bank Transfer (IBFT)</option>
                      <option value="jazzcash">JazzCash Mobile Wallet</option>
                    </select>
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Transaction / Ref ID
                    <input
                      type="text"
                      placeholder="e.g. TRX-987654"
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Amount Paid (PKR)
                    <input
                      type="number"
                      placeholder={`e.g. ${quote?.deposit_amount || 2500}`}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-orange focus:bg-white"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-navy mb-2">
                    Upload Payment Receipt Screenshot (JPG, PNG, WebP)
                  </label>
                  <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange/40 bg-orange/5 p-5 text-center cursor-pointer hover:bg-orange/10 transition-all">
                    <Upload size={22} className="text-orange" />
                    <span className="mt-2 text-xs font-bold text-navy">
                      {proofFile ? proofFile.name : "Click to select payment screenshot"}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {proofPreview && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-line shadow-sm">
                    <img src={proofPreview} alt="Receipt preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="absolute top-1 right-1 bg-navy/80 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark transition-all disabled:opacity-60"
                  >
                    {paymentSubmitting ? (
                      <>
                        <Clock size={16} className="animate-spin" /> Uploading Receipt...
                      </>
                    ) : (
                      <>
                        <Upload size={16} /> Submit Payment Proof
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Specifications Breakdown & Design Photos */}
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            {/* Specs Grid */}
            <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-line shadow-lg">
              <div className="flex items-center gap-2 pb-4 border-b border-line/60">
                <Cake size={20} className="text-orange" />
                <h3 className="font-display text-xl font-bold text-navy">
                  Cake Specifications
                </h3>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Cake Type:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">{specs?.cake_type || cakeReq.cake_type}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Size / Weight:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">{specs?.cake_size || cakeReq.cake_size}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Flavour:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">{specs?.flavor || cakeReq.flavor}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Filling:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">{specs?.filling || "Standard Ganache"}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Shape & Tiers:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">{specs?.shape || "Round"} • {specs?.tiers || "Single Tier"}</p>
                </div>
                <div className="rounded-xl bg-cream/40 p-3.5 border border-line/60">
                  <span className="text-muted font-medium">Target Delivery:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">
                    {cakeReq.preferred_delivery_at
                      ? new Date(cakeReq.preferred_delivery_at).toLocaleDateString("en-PK", { dateStyle: "medium" })
                      : "Not specified"}
                  </p>
                </div>
              </div>

              {specs?.cake_message && (
                <div className="mt-4 rounded-xl bg-orange/5 p-4 border border-orange/15 text-xs">
                  <span className="text-muted font-medium">Message on Cake:</span>
                  <p className="font-bold text-navy text-sm mt-0.5">"{specs.cake_message}"</p>
                </div>
              )}

              {specs?.special_instructions && (
                <div className="mt-3 rounded-xl bg-cream/50 p-4 border border-line/60 text-xs">
                  <span className="text-muted font-medium">Special Decorator Instructions:</span>
                  <p className="font-medium text-navy mt-1">{specs.special_instructions}</p>
                </div>
              )}
            </div>

            {/* Reference Photos Gallery */}
            <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-line shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-line/60">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={20} className="text-orange" />
                    <h3 className="font-display text-lg font-bold text-navy">
                      Reference Images ({images.length})
                    </h3>
                  </div>
                </div>

                {images.length === 0 ? (
                  <div className="mt-8 text-center text-xs text-muted py-8">
                    No reference photos attached to this brief.
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.id || idx}
                        onClick={() => setActiveLightboxImage(img.url)}
                        className="group relative aspect-square rounded-2xl overflow-hidden border border-line bg-cream cursor-pointer shadow-sm hover:shadow-md transition-all"
                      >
                        <img
                          src={img.url}
                          alt={`Reference ${idx + 1}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-navy/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                          Click to View
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-4 text-[11px] text-muted text-center">
                High-resolution images securely hosted via ImageKit CDN.
              </p>
            </div>
          </div>

          {/* Status History Audit Log */}
          {history.length > 0 && (
            <div className="rounded-[32px] bg-white p-6 sm:p-8 border border-line shadow-lg">
              <div className="flex items-center gap-2 pb-4 border-b border-line/60">
                <Clock size={20} className="text-orange" />
                <h3 className="font-display text-xl font-bold text-navy">
                  Activity & Progress Log
                </h3>
              </div>

              <div className="mt-6 space-y-4">
                {history.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-start gap-3.5 text-xs">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange shrink-0 ring-4 ring-orange/20" />
                    <div className="flex-1 rounded-xl bg-cream/40 p-3.5 border border-line/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-navy uppercase tracking-wider text-[11px]">
                          {STATUS_LABELS[item.new_status] || item.new_status}
                        </strong>
                        <span className="text-muted font-medium text-[11px]">
                          {new Date(item.created_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      </div>
                      {item.note && <p className="mt-1 text-muted leading-relaxed">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-navy/80 text-white hover:bg-red-600 transition-colors shadow z-10"
            >
              <X size={16} />
            </button>
            <img src={activeLightboxImage} alt="Enlarged Reference" className="max-h-[85vh] w-auto object-contain" />
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-line">
            <h3 className="font-display text-xl font-bold text-navy">Request Quotation Changes</h3>
            <p className="mt-2 text-xs text-muted">
              Specify what you would like changed (e.g. different flavour, tier adjustments, date change, or budget adjustment).
            </p>
            <textarea
              rows={4}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Can we change from 3 tiers to 2 tiers to fit within PKR 12,000?"
              className="mt-4 w-full rounded-xl border border-line bg-cream/40 p-3 text-xs outline-none focus:border-orange focus:bg-white resize-none"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowChangesModal(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-navy hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={quoteActionLoading || !feedbackNote.trim()}
                onClick={() => handleQuoteDecision("request_changes", feedbackNote)}
                className="rounded-xl bg-orange px-5 py-2 text-xs font-extrabold text-white shadow hover:bg-orange-dark disabled:opacity-50"
              >
                {quoteActionLoading ? "Submitting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Quote Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-line">
            <h3 className="font-display text-xl font-bold text-navy">Decline Quotation</h3>
            <p className="mt-2 text-xs text-muted">
              Are you sure you want to decline this quote? You can optionally let our decorators know why.
            </p>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="e.g. Budget constraints, date postponed..."
              className="mt-4 w-full rounded-xl border border-line bg-cream/40 p-3 text-xs outline-none focus:border-orange focus:bg-white resize-none"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-bold text-navy hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={quoteActionLoading}
                onClick={() => handleQuoteDecision("decline", feedbackNote)}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-extrabold text-white shadow hover:bg-red-700 disabled:opacity-50"
              >
                {quoteActionLoading ? "Processing..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrackCustomCakeClient() {
  return (
    <Suspense fallback={<div className="container-shell py-20 text-center text-muted">Loading custom cake tracker...</div>}>
      <TrackCustomCakeContent />
    </Suspense>
  );
}
