"use client";

import { Printer, X } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { AdminOrder } from "@/lib/types";

interface OrderInvoiceProps {
  order: AdminOrder;
  onClose: () => void;
}

export function OrderInvoice({ order, onClose }: OrderInvoiceProps) {
  function handlePrint() {
    window.print();
  }

  const createdDate = new Date(order.created_at).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const paymentRecord = order.payments?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between border-b border-line bg-cream/50 px-6 py-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange">Official Invoice</span>
            <h3 className="text-lg font-bold text-navy">Order #{order.order_number}</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-dark active:scale-95 transition-all"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-line text-muted hover:text-navy hover:bg-cream transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible print:bg-white text-navy font-sans">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-navy pb-8 gap-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logobake-01.png"
                  alt="Bake Mart Bazaar"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-orange uppercase">Artisan Bakery & Cake Studio</p>
                </div>
              </div>
              <div className="mt-3 text-xs leading-relaxed text-muted">
                <p>Gulberg III, Main Boulevard, Lahore, Pakistan</p>
                <p>Phone: +92 300 1234567 • Email: orders@bakemart.pk</p>
                <p>NTN: 8940217-4 • Web: www.bakemartbazaar.pk</p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className="inline-block rounded-lg bg-navy px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white">
                TAX INVOICE
              </span>
              <p className="mt-3 font-mono text-xl font-extrabold text-navy">#{order.order_number}</p>
              <p className="mt-1 text-xs text-muted font-medium">Date: <span className="font-bold text-navy">{createdDate}</span></p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange/10 px-3 py-1 text-xs font-bold text-orange border border-orange/20 capitalize">
                Status: {order.status.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-line pb-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted mb-2">Billed To (Customer)</p>
              <p className="font-bold text-navy text-sm">{order.customer_name}</p>
              <p className="text-xs text-muted font-medium mt-1">Phone: <span className="font-bold text-navy">{order.customer_phone}</span></p>
              {order.customer_email && (
                <p className="text-xs text-muted font-medium mt-0.5">Email: <span className="font-bold text-navy">{order.customer_email}</span></p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-muted mb-2">Delivery Destination</p>
              <p className="text-xs text-navy font-semibold leading-relaxed">
                {order.delivery_address}
              </p>
              <p className="text-xs text-muted mt-1">
                Area: <span className="font-bold text-navy">{order.area}</span> • City: <span className="font-bold text-navy">{order.city}</span>
              </p>
              {order.landmark && (
                <p className="text-xs text-muted mt-0.5">Landmark: <span className="font-semibold text-navy">{order.landmark}</span></p>
              )}
            </div>
          </div>

          {/* Ordered Products Table */}
          <div className="mt-8">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-navy text-[11px] uppercase tracking-wider text-muted font-bold">
                  <th className="py-3 pr-4">#</th>
                  <th className="py-3">Product Description & Variation</th>
                  <th className="py-3">SKU</th>
                  <th className="py-3 text-right">Unit Price</th>
                  <th className="py-3 text-center">Qty</th>
                  <th className="py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {(order.order_items ?? []).map((item, idx) => {
                  const varAttrs = item.variation_attributes
                    ? Object.entries(item.variation_attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")
                    : item.variation_title;

                  return (
                    <tr key={item.id || idx}>
                      <td className="py-4 pr-4 font-bold text-muted">{idx + 1}</td>
                      <td className="py-4">
                        <p className="font-bold text-navy text-sm">{item.product_name}</p>
                        {varAttrs && <p className="text-[11px] text-orange font-semibold mt-0.5">{varAttrs}</p>}
                      </td>
                      <td className="py-4 font-mono text-muted">{item.sku || "—"}</td>
                      <td className="py-4 text-right font-semibold text-navy">{formatPKR(item.unit_price)}</td>
                      <td className="py-4 text-center font-bold text-navy">{item.quantity}</td>
                      <td className="py-4 text-right font-extrabold text-navy">{formatPKR(item.line_total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary & Financial Breakdown */}
          <div className="mt-8 pt-6 border-t border-navy flex flex-col sm:flex-row justify-between gap-8">
            <div className="max-w-xs space-y-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-muted">Payment Information</p>
                <p className="text-xs font-bold text-navy mt-1 capitalize">Method: {order.payment_method.replace(/_/g, " ")}</p>
                <p className="text-xs font-semibold text-orange mt-0.5 capitalize">Status: {paymentRecord?.status || "Pending"}</p>
                {paymentRecord?.transaction_reference && (
                  <p className="text-xs text-muted mt-0.5">Ref: <span className="font-mono font-bold text-navy">{paymentRecord.transaction_reference}</span></p>
                )}
              </div>
              {order.courier_name && (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted">Courier & Tracking</p>
                  <p className="text-xs font-bold text-navy mt-1">{order.courier_name}</p>
                  {order.tracking_number && (
                    <p className="text-xs text-muted font-mono font-bold mt-0.5">CN: {order.tracking_number}</p>
                  )}
                </div>
              )}
            </div>

            <div className="w-full max-w-xs bg-cream/40 p-5 rounded-2xl border border-line space-y-2.5">
              <div className="flex justify-between text-xs font-medium text-muted">
                <span>Subtotal</span>
                <span className="font-bold text-navy">{formatPKR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs font-medium text-green">
                  <span>Discount</span>
                  <span className="font-bold">- {formatPKR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-medium text-muted">
                <span>Delivery Charges</span>
                <span className="font-bold text-navy">{order.delivery_fee === 0 ? "FREE" : formatPKR(order.delivery_fee)}</span>
              </div>
              <div className="border-t border-line pt-2.5 flex justify-between text-sm font-extrabold text-navy">
                <span>Total Amount</span>
                <span className="text-base font-black text-orange">{formatPKR(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Printable Footer */}
          <div className="mt-12 border-t border-line pt-6 text-center text-xs text-muted space-y-1">
            <p className="font-bold text-navy">Thank you for choosing Bake Mart Bazaar!</p>
            <p>Freshly baked artisan goods & customized cakes handcrafted with love in Pakistan.</p>
            <p className="text-[10px] text-muted/70 mt-2">Computer-generated tax invoice. No signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
