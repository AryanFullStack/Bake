"use client";

import { useState } from "react";
import { Cake, Clock, Phone, Sparkles, User } from "lucide-react";
import { formatPKR } from "@/lib/catalog";

const statuses = [
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

export function AdminCustomCakesManager({ initialRequests }: { initialRequests: any[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function updateStatus(id: string, status: string, amount?: string) {
    setUpdatingId(id);
    const response = await fetch("/api/admin/custom-cakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...(amount ? { amount } : {}) }),
    });
    setUpdatingId(null);

    if (response.ok) {
      setRequests(
        requests.map((request) => (request.id === id ? { ...request, status } : request))
      );
    }
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">
          Cake Studio Operations
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-navy">
          Custom Cake Consultation Requests
        </h1>
        <p className="mt-1 text-sm text-muted font-medium">
          {requests.length} requests in database • Manage status & prepare price quotations.
        </p>
      </div>

      <div className="grid gap-4">
        {requests.map((request: any) => (
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
                  <span className="rounded-full bg-navy px-3 py-1 text-xs font-bold text-white capitalize">
                    {request.status.replaceAll("_", " ")}
                  </span>
                </div>
                <h3 className="mt-3 font-bold text-navy text-lg flex items-center gap-2">
                  <User size={18} className="text-orange" />
                  <span>{request.customer_name}</span>
                  <span className="text-muted font-normal text-xs">({request.phone})</span>
                </h3>
                <p className="mt-1 text-xs text-muted font-medium">
                  Destination: {request.city}, {request.area} • Preferred Date:{" "}
                  <strong className="text-navy font-bold">{request.date ?? "ASAP"}</strong>
                </p>
              </div>

              {/* Status Selector & Quote Price Input */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="block text-[11px] font-bold text-muted uppercase">
                  Status:
                  <select
                    value={request.status}
                    onChange={(event) => updateStatus(request.id, event.target.value)}
                    className="mt-1 block rounded-xl border border-line bg-cream/50 px-3 py-2 text-xs font-bold text-navy outline-none focus:border-orange cursor-pointer"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[11px] font-bold text-muted uppercase">
                  Prepare Quote (PKR):
                  <input
                    type="number"
                    placeholder="Enter PKR amount"
                    className="mt-1 block w-36 rounded-xl border border-line bg-cream/50 px-3 py-2 text-xs font-bold text-navy outline-none focus:border-orange"
                    onBlur={(event) => {
                      if (event.target.value) {
                        updateStatus(request.id, "quoted", event.target.value);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Cake Specifications Box */}
            <div className="grid gap-3 sm:grid-cols-3 text-xs bg-cream/40 p-4 rounded-2xl border border-line/70">
              <div>
                <span className="text-muted font-bold block">Cake Type:</span>
                <span className="font-extrabold text-navy">{request.cake_type}</span>
              </div>
              <div>
                <span className="text-muted font-bold block">Size / Weight:</span>
                <span className="font-extrabold text-navy">{request.cake_size}</span>
              </div>
              <div>
                <span className="text-muted font-bold block">Flavour:</span>
                <span className="font-extrabold text-orange">{request.flavor}</span>
              </div>
              <div className="col-span-full">
                <span className="text-muted font-bold block">Theme / Design Brief:</span>
                <span className="font-medium text-navy/90">{request.theme ?? "No specific theme described"}</span>
              </div>
            </div>

            {request.custom_cake_quotes?.[0] && (
              <div className="rounded-xl bg-green/10 p-3.5 border border-green/20 text-xs font-bold text-green flex items-center gap-2">
                <Sparkles size={16} /> Official Quoted Price: {formatPKR(request.custom_cake_quotes[0].amount)}
              </div>
            )}
          </article>
        ))}

        {!requests.length && (
          <div className="rounded-[28px] bg-white p-12 text-center border border-line/80 text-sm text-muted">
            No custom cake requests have been submitted yet.
          </div>
        )}
      </div>
    </div>
  );
}
