"use client";

import { useState } from "react";
import { Cake, Clock, Phone, Sparkles, User, FileText, ArrowRight, CheckCircle2, Image as ImageIcon, MapPin, AlertCircle } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { CustomCakeStatus } from "@/lib/types";

const statuses: CustomCakeStatus[] = [
  "submitted",
  "under_review",
  "quotation_prepared",
  "confirmation_required",
  "confirmed",
  "deposit_pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "rejected",
];

const statusColors: Record<string, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-purple-50 text-purple-700 border-purple-200",
  quotation_prepared: "bg-yellow-50 text-yellow-800 border-yellow-200",
  confirmation_required: "bg-amber-50 text-amber-800 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  deposit_pending: "bg-orange/10 text-orange border-orange/20",
  in_production: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-teal-50 text-teal-700 border-teal-200",
  out_for_delivery: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-green-100 text-green-900 border-green-300",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-rose-50 text-rose-800 border-rose-200",
};

export function AdminCustomCakesManager({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [activeQuoteModal, setActiveQuoteModal] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Quote Form State
  const [quoteAmount, setQuoteAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("250");
  const [quoteNote, setQuoteNote] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  async function updateStatus(id: string, status: string, amount?: string) {
    setUpdatingId(id);
    setActionSuccess("");
    try {
      const response = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, ...(amount ? { amount } : {}) }),
      });
      setUpdatingId(null);

      if (response.ok) {
        setRequests(requests.map((r) => (r.id === id ? { ...r, status } : r)));
        setActionSuccess(`Status updated to ${status.replace(/_/g, " ")}`);
      }
    } catch {
      setUpdatingId(null);
    }
  }

  async function handleSaveQuote() {
    if (!activeQuoteModal || !quoteAmount) return;
    setUpdatingId(activeQuoteModal.id);
    setActionSuccess("");

    try {
      const response = await fetch("/api/admin/custom-cakes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeQuoteModal.id,
          status: "quotation_prepared",
          amount: parseFloat(quoteAmount),
          deposit_amount: depositAmount ? parseFloat(depositAmount) : undefined,
          note: quoteNote.trim() || undefined,
        }),
      });

      setUpdatingId(null);
      if (response.ok) {
        setRequests(
          requests.map((r) =>
            r.id === activeQuoteModal.id
              ? {
                  ...r,
                  status: "quotation_prepared",
                  custom_cake_quotes: [{ amount: parseFloat(quoteAmount), deposit_amount: depositAmount ? parseFloat(depositAmount) : null }],
                }
              : r
          )
        );
        setActiveQuoteModal(null);
        setActionSuccess("Custom cake quotation saved & sent to customer");
      }
    } catch {
      setUpdatingId(null);
    }
  }

  async function handleConvertToOrder(request: any) {
    setConvertingId(request.id);
    setActionSuccess("");

    try {
      const response = await fetch("/api/admin/custom-cakes/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: request.id }),
      });

      const data = await response.json();
      setConvertingId(null);

      if (response.ok && data.order_number) {
        setRequests(
          requests.map((r) =>
            r.id === request.id ? { ...r, status: "confirmed", linked_order_id: data.order_id } : r
          )
        );
        setActionSuccess(`Successfully converted to Storefront Order #${data.order_number}!`);
      } else {
        alert(data.error || "Failed to convert custom cake to order.");
      }
    } catch {
      setConvertingId(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-6 min-w-0 overflow-x-hidden">
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange">Cake Studio Operations</p>
        <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">Custom Cake Consultation Requests</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
          {requests.length} custom cake consultations in database • Manage status, prepare formal quotations & convert to orders.
        </p>
      </div>

      {actionSuccess && (
        <div className="rounded-2xl bg-green-50 p-4 border border-green-200 text-xs font-bold text-green-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} /> {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess("")} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      <div className="grid gap-5">
        {requests.map((request: any) => {
          const quote = request.custom_cake_quotes?.[0];

          return (
            <article
              key={request.id}
              className="rounded-[28px] bg-white p-6 border border-line/80 shadow-xs flex flex-col gap-4"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start border-b border-line/70 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold text-orange bg-orange/10 px-3 py-1 rounded-full border border-orange/20">
                      {request.request_number}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border capitalize ${statusColors[request.status] || "bg-cream-deep text-navy"}`}>
                      {request.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="mt-3 font-bold text-navy text-lg flex items-center gap-2">
                    <User size={18} className="text-orange" />
                    <span>{request.customer_name}</span>
                    <span className="text-muted font-normal text-xs">({request.phone})</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-orange" />
                    <span>{request.city}, {request.area} — {request.delivery_address}</span>
                  </p>
                </div>

                {/* Controls & Quick Actions */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="block text-[11px] font-bold text-muted uppercase">
                    Status Badge
                    <select
                      value={request.status}
                      disabled={updatingId === request.id}
                      onChange={(e) => updateStatus(request.id, e.target.value)}
                      className="mt-1 block rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-navy outline-none focus:border-orange cursor-pointer capitalize"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setActiveQuoteModal(request);
                      setQuoteAmount(quote?.amount ? String(quote.amount) : "");
                      setDepositAmount(quote?.deposit_amount ? String(quote.deposit_amount) : "");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-cream/40 px-3.5 py-2.5 text-xs font-bold text-navy hover:border-orange hover:text-orange transition-all"
                  >
                    <FileText size={14} className="text-orange" />
                    {quote ? "Edit Quotation" : "Prepare Quote"}
                  </button>

                  <button
                    onClick={() => handleConvertToOrder(request)}
                    disabled={convertingId === request.id || !quote}
                    title={!quote ? "Prepare a quotation first" : "Convert to standard order"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-orange-dark disabled:opacity-50 transition-all"
                  >
                    <ArrowRight size={14} />
                    {convertingId === request.id ? "Converting..." : "Convert to Order"}
                  </button>
                </div>
              </div>

              {/* Specifications Box */}
              <div className="grid gap-3 sm:grid-cols-4 text-xs bg-cream/30 p-4 rounded-2xl border border-line/70">
                <div>
                  <span className="text-muted font-bold block text-[10px] uppercase">Cake Type</span>
                  <span className="font-extrabold text-navy">{request.cake_type}</span>
                </div>
                <div>
                  <span className="text-muted font-bold block text-[10px] uppercase">Size / Weight</span>
                  <span className="font-extrabold text-navy">{request.cake_size}</span>
                </div>
                <div>
                  <span className="text-muted font-bold block text-[10px] uppercase">Flavour</span>
                  <span className="font-extrabold text-orange">{request.flavor}</span>
                </div>
                <div>
                  <span className="text-muted font-bold block text-[10px] uppercase">Preferred Delivery</span>
                  <span className="font-bold text-navy">
                    {request.preferred_delivery_at ? new Date(request.preferred_delivery_at).toLocaleDateString("en-PK") : "ASAP"}
                  </span>
                </div>
                <div className="col-span-full pt-1 border-t border-line/50">
                  <span className="text-muted font-bold block text-[10px] uppercase">Design Brief & Theme</span>
                  <span className="font-semibold text-navy">{request.theme || "No theme description provided"}</span>
                </div>
              </div>

              {/* Quotation Details Banner */}
              {quote && (
                <div className="rounded-xl bg-green-50 p-4 border border-green-200 text-xs text-green-900 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-green-600" />
                    <div>
                      <p className="font-extrabold text-green-950">Official Quoted Price: {formatPKR(quote.amount)}</p>
                      {quote.deposit_amount && (
                        <p className="text-[11px] text-green-700">Advance Deposit Required: {formatPKR(quote.deposit_amount)}</p>
                      )}
                    </div>
                  </div>

                  {request.linked_order_id && (
                    <span className="inline-flex items-center gap-1 bg-navy text-white font-extrabold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                      <CheckCircle2 size={12} /> Converted to Order
                    </span>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {!requests.length && (
          <div className="rounded-[28px] bg-white p-12 text-center border border-line/80 text-sm text-muted">
            No custom cake consultation requests submitted yet.
          </div>
        )}
      </div>

      {/* Prepare Quotation Modal */}
      {activeQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-bold text-navy text-base">Prepare Custom Cake Quote</h3>
              <button onClick={() => setActiveQuoteModal(null)} className="text-muted hover:text-navy">✕</button>
            </div>

            <p className="text-xs text-muted">
              Request <strong className="text-navy">{activeQuoteModal.request_number}</strong> for <strong className="text-navy">{activeQuoteModal.customer_name}</strong>
            </p>

            <label className="block text-xs font-bold text-navy">
              Quotation Price (PKR) *
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="e.g. 8500"
                className="mt-1 w-full rounded-xl border border-line bg-cream/30 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
              />
            </label>

            <label className="block text-xs font-bold text-navy">
              Advance Deposit Amount (PKR)
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 3000"
                className="mt-1 w-full rounded-xl border border-line bg-cream/30 p-2.5 text-xs font-bold text-navy outline-none focus:border-orange"
              />
            </label>

            <label className="block text-xs font-bold text-navy">
              Special Baker Notes
              <textarea
                rows={2}
                value={quoteNote}
                onChange={(e) => setQuoteNote(e.target.value)}
                placeholder="Add notes about fondant art, tier breakdown..."
                className="mt-1 w-full rounded-xl border border-line bg-cream/30 p-2.5 text-xs font-medium outline-none focus:border-orange resize-none"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveQuoteModal(null)}
                className="px-4 py-2 text-xs font-bold text-muted hover:text-navy border border-line rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={!quoteAmount || updatingId === activeQuoteModal.id}
                className="px-5 py-2 text-xs font-bold text-white bg-orange rounded-xl hover:bg-orange-dark shadow-md"
              >
                Save & Notify Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
