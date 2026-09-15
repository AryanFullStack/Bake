"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Cake,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Layers,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
  AlertCircle,
  CreditCard,
  Send,
  Eye,
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import {
  CUSTOM_CAKE_STATUSES,
  CUSTOM_CAKE_PAYMENT_STATUSES,
  CUSTOM_CAKE_PAYMENT_METHODS,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  PAYMENT_STATUS_BADGE_CLASSES,
  calculateQuotation,
} from "@/lib/custom-cake";
import { resolveCakeImageUrl } from "@/lib/custom-cake-media";

export function CustomCakeDetailClient({ initialRequest }: { initialRequest: any }) {
  const router = useRouter();
  const [request, setRequest] = useState(initialRequest);
  const [activeTab, setActiveTab] = useState<"overview" | "quote" | "payment" | "history">("overview");

  // Status Update State
  const [statusSelect, setStatusSelect] = useState(request.status);
  const [statusNote, setStatusNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Quotation Edit State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [basePrice, setBasePrice] = useState(String(request.quote?.base_price || request.quote?.final_price || ""));
  const [designCharges, setDesignCharges] = useState(String(request.quote?.design_charges || ""));
  const [tierCharges, setTierCharges] = useState(String(request.quote?.tier_charges || ""));
  const [extraCharges, setExtraCharges] = useState(String(request.quote?.extra_charges || ""));
  const [deliveryFee, setDeliveryFee] = useState(String(request.quote?.delivery_fee || "250"));
  const [discount, setDiscount] = useState(String(request.quote?.discount || ""));
  const [depositAmount, setDepositAmount] = useState(String(request.quote?.deposit_amount || ""));
  const [quoteNotes, setQuoteNotes] = useState(request.quote?.note || "");
  const [quoteExpiry, setQuoteExpiry] = useState(request.quote?.expires_at?.split("T")[0] || "");
  const [quoteSaving, setQuoteSaving] = useState(false);

  // Payment Management State
  const [paymentMethod, setPaymentMethod] = useState(request.payment_method || "cod");
  const [paymentStatus, setPaymentStatus] = useState(request.payment_status || "pending");
  const [amountPaidInput, setAmountPaidInput] = useState(String(request.amount_paid || ""));
  const [txRefInput, setTxRefInput] = useState(request.payment_reference || "");
  const [paymentSaving, setPaymentSaving] = useState(false);

  // Conversion State
  const [converting, setConverting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Lightbox State
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Quotation calculation live preview
  const liveCalc = calculateQuotation({
    base_price: basePrice,
    design_charges: designCharges,
    tier_charges: tierCharges,
    extra_charges: extraCharges,
    delivery_fee: deliveryFee,
    discount,
    deposit_amount: depositAmount,
    amount_paid: request.amount_paid,
  });

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    setStatusUpdating(true);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status: statusSelect,
          status_note: statusNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      setStatusUpdating(false);

      if (res.ok) {
        setActionSuccess(`Status updated to ${STATUS_LABELS[statusSelect] || statusSelect}`);
        setRequest((prev: any) => ({
          ...prev,
          status: statusSelect,
          history: [
            {
              id: crypto.randomUUID(),
              new_status: statusSelect,
              note: statusNote.trim() || null,
              created_at: new Date().toISOString(),
            },
            ...(prev.history || []),
          ],
        }));
        setStatusNote("");
      } else {
        setActionError(data.error || "Failed to update status");
      }
    } catch {
      setStatusUpdating(false);
      setActionError("Network error updating status");
    }
  }

  async function handleSaveQuotation(e: React.FormEvent) {
    e.preventDefault();
    setQuoteSaving(true);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          quotation: {
            base_price: liveCalc.base_price,
            design_charges: liveCalc.design_charges,
            tier_charges: liveCalc.tier_charges,
            extra_charges: liveCalc.extra_charges,
            delivery_fee: liveCalc.delivery_fee,
            discount: liveCalc.discount,
            amount: liveCalc.final_price,
            deposit_amount: liveCalc.deposit_amount,
            note: quoteNotes.trim() || undefined,
            expires_at: quoteExpiry ? `${quoteExpiry}T23:59:59+05:00` : undefined,
          },
          notify_quote: true,
        }),
      });

      const data = await res.json();
      setQuoteSaving(false);

      if (res.ok) {
        setActionSuccess("Quotation breakdown saved & notified to customer!");
        setQuoteModalOpen(false);
        setRequest((prev: any) => ({
          ...prev,
          status: prev.status === "submitted" ? "quotation_prepared" : prev.status,
          quote: {
            ...liveCalc,
            note: quoteNotes,
            status: prev.quote?.status || "pending",
            expires_at: quoteExpiry,
          },
        }));
      } else {
        setActionError(data.error || "Failed to save quotation");
      }
    } catch {
      setQuoteSaving(false);
      setActionError("Network error saving quotation");
    }
  }

  async function handleSavePayment() {
    setPaymentSaving(true);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          amount_paid: Number(amountPaidInput || 0),
          payment_reference: txRefInput.trim() || undefined,
          payment_note: `Updated in payment panel (${paymentMethod.toUpperCase()}: ${paymentStatus})`,
        }),
      });

      const data = await res.json();
      setPaymentSaving(false);

      if (res.ok) {
        setActionSuccess(`Payment status updated to ${paymentStatus.toUpperCase()}`);
        setRequest((prev: any) => ({
          ...prev,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          amount_paid: Number(amountPaidInput || 0),
          payment_reference: txRefInput,
          status: paymentStatus === "verified" ? "in_production" : prev.status,
        }));
      } else {
        setActionError(data.error || "Failed to update payment settings");
      }
    } catch {
      setPaymentSaving(false);
      setActionError("Network error updating payment");
    }
  }

  async function handleConvertToOrder() {
    if (!confirm(`Convert Custom Cake Request #${request.request_number} to a Storefront Order?`)) return;

    setConverting(true);
    setActionSuccess("");
    setActionError("");

    try {
      const res = await fetch("/api/admin/custom-cakes/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id }),
      });

      const data = await res.json();
      setConverting(false);

      if (res.ok && data.order_number) {
        setActionSuccess(`Successfully converted to Storefront Order #${data.order_number}!`);
        setRequest((prev: any) => ({
          ...prev,
          status: "confirmed",
          linked_order_id: data.order_id,
          linked_order: { order_number: data.order_number, id: data.order_id },
        }));
      } else {
        setActionError(data.error || "Order conversion failed.");
      }
    } catch {
      setConverting(false);
      setActionError("Network error during conversion.");
    }
  }

  const specs = request.specs;
  const quote = request.quote;
  const images = request.images || [];

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-6 max-w-7xl mx-auto min-w-0">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/custom-cakes"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-navy hover:border-orange transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Requests</span>
          </Link>
          <div>
            <span className="font-mono text-sm font-extrabold text-orange bg-orange/10 px-3 py-1 rounded-full border border-orange/20">
              {request.request_number}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black uppercase tracking-wider border ${STATUS_BADGE_CLASSES[request.status] || "bg-cream text-navy"}`}>
            {STATUS_LABELS[request.status] || request.status.replace(/_/g, " ")}
          </span>

          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider border ${PAYMENT_STATUS_BADGE_CLASSES[request.payment_status || "pending"] || "bg-cream text-navy"}`}>
            Payment: {(request.payment_status || "pending").replace(/_/g, " ")}
          </span>

          {request.linked_order_id && (
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy text-white px-3.5 py-1.5 text-xs font-extrabold hover:bg-navy/90 transition-colors shadow-xs"
            >
              <CheckCircle2 size={13} className="text-green" />
              <span>Order #{request.linked_order?.order_number || "Linked"}</span>
            </Link>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl bg-green-50 p-4 border border-green-200 text-xs font-bold text-green-800 flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess("")} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {actionError}
          </span>
          <button onClick={() => setActionError("")} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        {/* LEFT COLUMN: Cake Specifications, Reference Images, Delivery */}
        <div className="space-y-6">
          {/* SECTION 1: Cake Specifications */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <Cake size={18} className="text-orange" /> Handcrafted Cake Specifications
              </h2>
              <span className="text-xs font-bold text-orange bg-orange/10 px-2.5 py-0.5 rounded-full">
                {specs?.cake_type}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Size / Weight</span>
                <strong className="text-navy text-sm">{specs?.cake_size}</strong>
              </div>
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Flavour</span>
                <strong className="text-orange text-sm">{specs?.flavor}</strong>
              </div>
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Filling</span>
                <strong className="text-navy text-sm">{specs?.filling}</strong>
              </div>
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Shape</span>
                <strong className="text-navy text-sm">{specs?.shape}</strong>
              </div>
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Number of Tiers</span>
                <strong className="text-navy text-sm">{specs?.tiers}</strong>
              </div>
              <div className="p-3 bg-cream/40 rounded-xl border border-line/60">
                <span className="text-muted block text-[10px] font-bold uppercase">Dietary Requirements</span>
                <strong className="text-navy text-sm">{specs?.dietary_requirements}</strong>
              </div>
            </div>

            {specs?.cake_message && (
              <div className="p-3.5 bg-cream/60 rounded-xl border border-line/70 text-xs">
                <span className="text-muted font-bold block text-[10px] uppercase">Cake Plaque Message</span>
                <strong className="text-navy text-sm">"{specs.cake_message}"</strong>
              </div>
            )}

            {specs?.theme && (
              <div className="text-xs">
                <span className="text-muted font-bold block text-[10px] uppercase">Theme & Occasion Details</span>
                <p className="text-navy font-medium mt-0.5 leading-relaxed">{specs.theme}</p>
              </div>
            )}

            {specs?.special_instructions && (
              <div className="text-xs">
                <span className="text-muted font-bold block text-[10px] uppercase">Special Instructions</span>
                <p className="text-navy font-medium mt-0.5 leading-relaxed">{specs.special_instructions}</p>
              </div>
            )}

            {specs?.budget && (
              <div className="text-xs text-muted">
                Customer's Stated Budget: <strong className="text-navy">{formatPKR(Number(specs.budget))}</strong>
              </div>
            )}
          </section>

          {/* SECTION 2: Reference Images (ImageKit Gallery + Lightbox) */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <ImageIcon size={18} className="text-orange" /> Reference Cake Inspiration Photos
              </h2>
              <span className="text-xs font-bold text-muted bg-cream px-2.5 py-0.5 rounded-full border border-line">
                {images.length} Image(s)
              </span>
            </div>

            {images.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted bg-cream/30 rounded-2xl border border-line/60">
                No reference photos uploaded by the customer for this request.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img: any, idx: number) => (
                  <div
                    key={img.id || idx}
                    className="group relative aspect-square overflow-hidden rounded-2xl border border-line bg-cream shadow-xs cursor-pointer"
                    onClick={() => setLightboxSrc(img.url)}
                  >
                    <img
                      src={img.url}
                      alt={`Reference image ${idx + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-navy/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2">
                      <span className="text-[11px] font-bold bg-navy/80 px-2 py-0.5 rounded">View Preview</span>
                      <a
                        href={img.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] underline flex items-center gap-1 text-orange hover:text-white"
                      >
                        <Download size={10} /> Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: Customer & Delivery Details */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <MapPin size={18} className="text-orange" /> Customer & Delivery Details
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Customer Name</span>
                <strong className="text-navy text-sm flex items-center gap-1.5 mt-0.5">
                  <User size={14} className="text-orange" /> {request.customer_name}
                </strong>
              </div>

              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Phone Number</span>
                <a
                  href={`tel:${request.phone}`}
                  className="text-navy font-bold text-sm flex items-center gap-1.5 mt-0.5 hover:text-orange"
                >
                  <Phone size={14} className="text-orange" /> {request.phone}
                </a>
              </div>

              {request.email && (
                <div>
                  <span className="text-muted block text-[10px] font-bold uppercase">Email Address</span>
                  <a
                    href={`mailto:${request.email}`}
                    className="text-navy font-medium text-xs flex items-center gap-1.5 mt-0.5 hover:text-orange"
                  >
                    <Mail size={14} className="text-orange" /> {request.email}
                  </a>
                </div>
              )}

              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">City / Area</span>
                <strong className="text-navy text-xs mt-0.5 block">
                  {request.city}, {request.area}
                </strong>
              </div>

              <div className="sm:col-span-2">
                <span className="text-muted block text-[10px] font-bold uppercase">Complete Delivery Address</span>
                <p className="text-navy font-medium text-xs mt-0.5 leading-relaxed bg-cream/40 p-3 rounded-xl border border-line/60">
                  {request.delivery_address}
                </p>
              </div>

              {request.landmark && (
                <div>
                  <span className="text-muted block text-[10px] font-bold uppercase">Landmark</span>
                  <strong className="text-navy text-xs mt-0.5 block">{request.landmark}</strong>
                </div>
              )}

              <div>
                <span className="text-muted block text-[10px] font-bold uppercase">Preferred Delivery Schedule</span>
                <strong className="text-orange text-xs mt-0.5 block">
                  {specs?.delivery_date ? `${specs.delivery_date} at ${specs.delivery_time || "14:00"}` : "As Scheduled"}
                </strong>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Quotation, Payment, Status & Conversion */}
        <div className="space-y-6">
          {/* SECTION 4: Quotation Breakdown & Editor */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <Sparkles size={18} className="text-orange" /> Quotation Management
              </h2>
              <button
                onClick={() => setQuoteModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline cursor-pointer"
              >
                <FileText size={13} />
                <span>{quote ? "Edit Quote" : "Prepare Quote"}</span>
              </button>
            </div>

            {quote ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-cream/60 p-4 border border-line text-xs space-y-2 text-navy">
                  <div className="flex justify-between">
                    <span className="text-muted">Base Cake Price:</span>
                    <span className="font-bold">{formatPKR(quote.base_price)}</span>
                  </div>
                  {quote.design_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">Design & Art Charges:</span>
                      <span className="font-bold text-orange">+{formatPKR(quote.design_charges)}</span>
                    </div>
                  )}
                  {quote.tier_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">Tier Construction:</span>
                      <span className="font-bold text-orange">+{formatPKR(quote.tier_charges)}</span>
                    </div>
                  )}
                  {quote.extra_charges > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted">Extra Charges:</span>
                      <span className="font-bold text-orange">+{formatPKR(quote.extra_charges)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Delivery Fee:</span>
                    <span className="font-bold">+{formatPKR(quote.delivery_fee)}</span>
                  </div>
                  {quote.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount:</span>
                      <span className="font-bold">-{formatPKR(quote.discount)}</span>
                    </div>
                  )}
                  <div className="border-t border-line pt-2 flex justify-between font-extrabold text-sm text-navy">
                    <span>Final Quoted Price:</span>
                    <span className="text-orange font-black text-base">{formatPKR(quote.final_price)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line/60 pt-1.5 text-xs">
                    <span className="text-muted">Advance Deposit Required:</span>
                    <span className="font-bold text-navy">{formatPKR(quote.deposit_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted">Remaining Balance:</span>
                    <span className="font-extrabold text-navy">{formatPKR(quote.remaining_balance)}</span>
                  </div>
                </div>

                {quote.note && (
                  <div className="rounded-xl bg-orange/5 p-3 border border-orange/15 text-xs">
                    <span className="font-bold text-orange block text-[10px] uppercase">Quotation Note</span>
                    <p className="text-navy font-medium mt-0.5">{quote.note}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted font-bold">Quote Decision:</span>
                  <span className={`font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[11px] border ${
                    quote.status === "accepted" ? "bg-green-100 text-green-800 border-green-300" :
                    quote.status === "changes_requested" ? "bg-amber-100 text-amber-800 border-amber-300" :
                    quote.status === "declined" ? "bg-red-100 text-red-800 border-red-300" :
                    "bg-yellow-50 text-yellow-800 border-yellow-200"
                  }`}>
                    {quote.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted bg-cream/30 rounded-2xl border border-line/60 space-y-2">
                <p>No formal quotation has been prepared yet.</p>
                <button
                  onClick={() => setQuoteModalOpen(true)}
                  className="rounded-xl bg-orange px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-dark cursor-pointer"
                >
                  Prepare Quotation Now
                </button>
              </div>
            )}
          </section>

          {/* SECTION 5: Payment Management */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <CreditCard size={18} className="text-orange" /> Payment System
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Payment Method
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-semibold text-navy outline-none focus:border-orange capitalize"
                  >
                    {CUSTOM_CAKE_PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block font-bold text-navy">
                  Payment Status
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-semibold text-navy outline-none focus:border-orange capitalize"
                  >
                    {CUSTOM_CAKE_PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Amount Paid (PKR)
                  <input
                    type="number"
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    placeholder="e.g. 3000"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Transaction / Ref ID
                  <input
                    value={txRefInput}
                    onChange={(e) => setTxRefInput(e.target.value)}
                    placeholder="e.g. TID-12345"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-medium text-navy outline-none focus:border-orange"
                  />
                </label>
              </div>

              {/* Payment Proof Screenshot Preview if uploaded by customer */}
              {request.payment_proof_url && (
                <div className="p-3 bg-cream/50 rounded-xl border border-line/70 flex items-center justify-between">
                  <div>
                    <span className="text-muted block text-[10px] font-bold uppercase">Customer Payment Proof</span>
                    <span className="text-xs font-bold text-navy">Screenshot Attached</span>
                  </div>
                  <button
                    onClick={() => setLightboxSrc(request.payment_proof_url)}
                    className="inline-flex items-center gap-1 bg-navy text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-navy/80 cursor-pointer"
                  >
                    <Eye size={12} /> View Proof
                  </button>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSavePayment}
                  disabled={paymentSaving}
                  className="w-full rounded-xl bg-navy py-2.5 text-xs font-bold text-white hover:bg-navy/90 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {paymentSaving ? "Updating Payment..." : "Save Payment Settings"}
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6: Status Management & Convert to Order */}
          <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-4">
            <div className="border-b border-line pb-3">
              <h2 className="font-display text-lg font-bold text-navy flex items-center gap-2">
                <Layers size={18} className="text-orange" /> Status & Conversion
              </h2>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-3 text-xs">
              <label className="block font-bold text-navy">
                Change Lifecycle Status
                <select
                  value={statusSelect}
                  onChange={(e) => setStatusSelect(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-semibold text-navy outline-none focus:border-orange capitalize cursor-pointer"
                >
                  {CUSTOM_CAKE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] || s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block font-bold text-navy">
                Optional Audit / Customer Note
                <input
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Baking commenced in central kitchen"
                  className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2 text-xs font-medium text-navy outline-none focus:border-orange"
                />
              </label>

              <button
                type="submit"
                disabled={statusUpdating || statusSelect === request.status}
                className="w-full rounded-xl bg-orange py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-orange-dark transition-all disabled:opacity-50 cursor-pointer"
              >
                {statusUpdating ? "Updating..." : "Update Status & Log Event"}
              </button>
            </form>

            <div className="pt-3 border-t border-line">
              <span className="text-[10px] font-bold text-muted uppercase block mb-1.5">Storefront Order Sync</span>
              {request.linked_order_id ? (
                <div className="rounded-xl bg-green-50 p-3 border border-green-200 text-xs text-green-900 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold block">Converted to Store Order</span>
                    <span className="font-mono text-xs">#{request.linked_order?.order_number || request.linked_order_id}</span>
                  </div>
                  <Link
                    href="/admin/orders"
                    className="inline-flex items-center gap-1 bg-green-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-green-900"
                  >
                    Open Orders <ExternalLink size={12} />
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleConvertToOrder}
                  disabled={converting || !quote}
                  title={!quote ? "Prepare quotation first" : "Convert custom cake request to official storefront order"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 py-3 text-xs font-extrabold text-white shadow-md hover:bg-green-800 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>{converting ? "Converting to Order..." : "Convert to Store Order"}</span>
                </button>
              )}
            </div>
          </section>

          {/* SECTION 7: Status History Audit Log */}
          {request.history && request.history.length > 0 && (
            <section className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy flex items-center gap-1.5 border-b border-line pb-2">
                <Clock size={14} className="text-orange" /> Audit History & Status Changes
              </h3>
              <div className="divide-y divide-line/50 max-h-60 overflow-y-auto pr-1">
                {request.history.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-navy uppercase tracking-wider">
                        {STATUS_LABELS[h.new_status] || h.new_status.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted text-[10px]">
                        {new Date(h.created_at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {h.note && <p className="text-muted font-medium mt-0.5">{h.note}</p>}
                    <span className="text-[10px] text-muted block mt-0.5">
                      {new Date(h.created_at).toLocaleDateString("en-PK")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Edit Quotation Modal */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display text-xl font-bold text-navy flex items-center gap-2">
                <Sparkles size={18} className="text-orange" /> Itemized Custom Cake Quotation
              </h3>
              <button onClick={() => setQuoteModalOpen(false)} className="text-muted hover:text-navy cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-muted">
              Configure base cake, design charges, extra tiers, and delivery. Quotation is automatically calculated.
            </p>

            <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-bold text-navy">
                  Base Cake Price (PKR) *
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                    placeholder="e.g. 5000"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Design / Fondant Charges (PKR)
                  <input
                    type="number"
                    value={designCharges}
                    onChange={(e) => setDesignCharges(e.target.value)}
                    placeholder="e.g. 1500"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Extra Tier Charges (PKR)
                  <input
                    type="number"
                    value={tierCharges}
                    onChange={(e) => setTierCharges(e.target.value)}
                    placeholder="e.g. 1000"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Delivery Fee (PKR)
                  <input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="e.g. 250"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Discount (PKR)
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="e.g. 500"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange text-green-700"
                  />
                </label>

                <label className="block font-bold text-navy">
                  Advance Deposit Required (PKR)
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="e.g. 3000"
                    className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
                  />
                </label>
              </div>

              {/* Automatic Calculation Summary Box */}
              <div className="rounded-2xl bg-cream p-4 border border-line/80 text-xs space-y-1.5 text-navy">
                <div className="flex justify-between font-bold">
                  <span>Subtotal:</span>
                  <span>{formatPKR(liveCalc.base_price + liveCalc.design_charges + liveCalc.tier_charges + liveCalc.extra_charges + liveCalc.delivery_fee)}</span>
                </div>
                {liveCalc.discount > 0 && (
                  <div className="flex justify-between text-green-700 font-bold">
                    <span>Discount:</span>
                    <span>-{formatPKR(liveCalc.discount)}</span>
                  </div>
                )}
                <div className="border-t border-line pt-1.5 flex justify-between font-extrabold text-sm text-navy">
                  <span>Final Quoted Price:</span>
                  <span className="text-orange font-black text-base">{formatPKR(liveCalc.final_price)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted">Remaining Balance:</span>
                  <span className="font-extrabold text-navy">{formatPKR(liveCalc.remaining_balance)}</span>
                </div>
              </div>

              <label className="block font-bold text-navy">
                Quotation Notes for Customer
                <textarea
                  rows={2}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes handcrafted sugar flowers, custom message plaque, and dry-ice chilled delivery packaging."
                  className="mt-1 w-full rounded-xl border border-line bg-cream/40 p-2.5 text-xs font-medium text-navy outline-none focus:border-orange resize-none"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-muted hover:text-navy border border-line rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quoteSaving || liveCalc.final_price <= 0}
                  className="px-6 py-2.5 text-xs font-extrabold text-white bg-orange rounded-xl hover:bg-orange-dark shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {quoteSaving ? "Saving..." : "Save & Send Quotation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Size Image Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/85 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setLightboxSrc(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxSrc}
              alt="Full size preview"
              className="max-h-[80vh] w-auto rounded-2xl object-contain mx-auto"
            />
            <div className="mt-3 flex items-center justify-between px-2 text-xs">
              <a
                href={lightboxSrc}
                target="_blank"
                rel="noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 font-bold text-white hover:bg-orange-dark shadow-xs"
              >
                <Download size={14} /> Download Original Image
              </a>

              <button
                onClick={() => setLightboxSrc(null)}
                className="rounded-xl border border-line px-4 py-2 font-bold text-navy hover:bg-cream cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

