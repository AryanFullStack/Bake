"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, Edit3, ExternalLink, Mail, Phone, Printer, ShieldCheck,
  Truck, User, X, MessageSquare, AlertCircle, FileText, ChevronRight, Eye, RefreshCw
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { AdminOrder, Courier, OrderStatus, PaymentStatus } from "@/lib/types";

interface OrderDetailsModalProps {
  order: AdminOrder;
  couriers: Courier[];
  onClose: () => void;
  onRefresh: () => void;
  onOpenInvoice: (order: AdminOrder) => void;
  onOpenEdit: (order: AdminOrder) => void;
}

const statusColors: Record<OrderStatus, string> = {
  placed: "bg-orange/10 text-orange border-orange/20",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  baking: "bg-yellow-50 text-yellow-800 border-yellow-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  out_for_delivery: "bg-teal-50 text-teal-700 border-teal-200",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  returned: "bg-amber-50 text-amber-800 border-amber-200",
};

const statuses: OrderStatus[] = [
  "placed",
  "confirmed",
  "processing",
  "baking",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

export function OrderDetailsModal({
  order,
  couriers,
  onClose,
  onRefresh,
  onOpenInvoice,
  onOpenEdit,
}: OrderDetailsModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const paymentRecord = order.payments?.[0];
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(paymentRecord?.status || "pending");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const [selectedCourierId, setSelectedCourierId] = useState(order.courier_id || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [updatingCourier, setUpdatingCourier] = useState(false);

  const [adminNotes, setAdminNotes] = useState(order.admin_notes || "");
  const [updatingNotes, setUpdatingNotes] = useState(false);

  const [viewReceipt, setViewReceipt] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const createdDate = new Date(order.created_at).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  async function handleStatusUpdate(newStatus: OrderStatus) {
    setUpdatingStatus(true);
    setActionSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          status_note: statusNote.trim() || undefined,
        }),
      });

      setUpdatingStatus(false);
      if (response.ok) {
        setSelectedStatus(newStatus);
        setStatusNote("");
        setActionSuccess(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
        onRefresh();
      }
    } catch {
      setUpdatingStatus(false);
    }
  }

  async function handlePaymentUpdate(newPaymentStatus: PaymentStatus) {
    setUpdatingPayment(true);
    setActionSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: newPaymentStatus,
        }),
      });

      setUpdatingPayment(false);
      if (response.ok) {
        setPaymentStatus(newPaymentStatus);
        setActionSuccess(`Payment status updated to ${newPaymentStatus.replace(/_/g, " ")}`);
        onRefresh();
      }
    } catch {
      setUpdatingPayment(false);
    }
  }

  async function handleCourierSave() {
    setUpdatingCourier(true);
    setActionSuccess("");

    const matchedCourier = couriers.find((c) => c.id === selectedCourierId);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courier_id: selectedCourierId || null,
          courier_name: matchedCourier?.name || null,
          tracking_number: trackingNumber.trim() || null,
        }),
      });

      setUpdatingCourier(false);
      if (response.ok) {
        setActionSuccess("Courier and tracking information saved");
        onRefresh();
      }
    } catch {
      setUpdatingCourier(false);
    }
  }

  async function handleNotesSave() {
    setUpdatingNotes(true);
    setActionSuccess("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_notes: adminNotes.trim() || null,
        }),
      });

      setUpdatingNotes(false);
      if (response.ok) {
        setActionSuccess("Internal staff notes saved");
        onRefresh();
      }
    } catch {
      setUpdatingNotes(false);
    }
  }

  const phoneClean = order.customer_phone.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${phoneClean.startsWith("0") ? "92" + phoneClean.slice(1) : phoneClean}`;
  const trackingLink = `/track-order?order=${order.order_number}&phone=${order.customer_phone}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-line bg-cream/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border capitalize ${statusColors[order.status]}`}>
              {order.status.replace(/_/g, " ")}
            </span>
            <div>
              <h2 className="text-xl font-display font-bold text-navy flex items-center gap-2">
                Order #{order.order_number}
              </h2>
              <p className="text-xs text-muted font-medium">Placed on {createdDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenInvoice(order)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-navy hover:border-orange hover:text-orange shadow-xs"
            >
              <Printer size={14} /> Print Invoice
            </button>

            <button
              onClick={() => onOpenEdit(order)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-dark"
            >
              <Edit3 size={14} /> Edit Order
            </button>

            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-line text-muted hover:text-navy hover:bg-cream transition-colors ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {actionSuccess && (
          <div className="bg-green-50 px-6 py-2 border-b border-green-200 text-xs font-bold text-green-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} /> {actionSuccess}
            </span>
            <button onClick={() => setActionSuccess("")} className="text-green-800 text-xs font-bold">Dismiss</button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Grid: Left Details + Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
            {/* Left Main Column */}
            <div className="space-y-6">
              {/* Customer & Address Card */}
              <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-orange flex items-center gap-1.5">
                    <User size={14} /> Customer Information & Shipping
                  </h3>
                  <span className="text-[11px] font-bold text-navy bg-white px-2.5 py-1 rounded-full border border-line">
                    {order.user_id ? "Registered Account" : "Guest Customer"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-extrabold text-navy text-sm">{order.customer_name}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted font-semibold">
                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="text-orange" />
                        <span className="text-navy">{order.customer_phone}</span>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-[10px] font-extrabold text-green bg-green/10 px-2 py-0.5 rounded-md hover:underline"
                        >
                          WhatsApp
                        </a>
                      </p>
                      {order.customer_email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={13} className="text-orange" />
                          <a href={`mailto:${order.customer_email}`} className="text-navy hover:underline">
                            {order.customer_email}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-line text-xs space-y-1">
                    <p className="font-bold text-navy uppercase text-[10px] tracking-wider text-muted">Delivery Address</p>
                    <p className="font-semibold text-navy leading-snug">{order.delivery_address}</p>
                    <p className="text-muted font-medium">Area: <span className="text-navy font-bold">{order.area}</span> • City: <span className="text-navy font-bold">{order.city}</span></p>
                    {order.landmark && <p className="text-muted">Landmark: <span className="text-navy">{order.landmark}</span></p>}
                    {order.delivery_instructions && (
                      <p className="text-orange font-medium mt-1 bg-orange/5 p-2 rounded-lg border border-orange/10">
                        Note: {order.delivery_instructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Customer Lifetime Insights */}
                {order.customer_stats && (
                  <div className="pt-3 border-t border-line/60 flex flex-wrap items-center justify-between text-xs text-muted gap-2">
                    <span>
                      Customer Order History: <strong className="text-navy">{order.customer_stats.total_orders} total orders</strong>
                    </span>
                    <span>
                      Lifetime Spend: <strong className="text-orange">{formatPKR(order.customer_stats.total_spent)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Ordered Items Table (Historical Snapshot) */}
              <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Ordered Products Snapshot ({order.order_items?.length ?? 0} items)
                  </h3>
                  <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full border border-green/20">
                    Price Snapshot Retained
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-line text-[10px] font-bold uppercase tracking-wider text-muted">
                      <tr>
                        <th className="pb-2">Item</th>
                        <th className="pb-2">SKU</th>
                        <th className="pb-2 text-right">Unit Price</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {(order.order_items ?? []).map((item) => (
                        <tr key={item.id} className="hover:bg-cream/20">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {item.image_path ? (
                                <img
                                  src={item.image_path}
                                  alt={item.product_name}
                                  className="h-10 w-10 rounded-lg object-cover border border-line"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-cream-deep grid place-items-center text-muted text-[10px]">
                                  No Img
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-navy text-xs">{item.product_name}</p>
                                {item.variation_title && (
                                  <p className="text-[11px] text-orange font-semibold">{item.variation_title}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-muted">{item.sku || "—"}</td>
                          <td className="py-3 text-right font-semibold text-navy">{formatPKR(item.unit_price)}</td>
                          <td className="py-3 text-center font-bold text-navy">{item.quantity}</td>
                          <td className="py-3 text-right font-extrabold text-navy">{formatPKR(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Final Totals */}
                <div className="pt-4 border-t border-line flex flex-col items-end space-y-1.5 text-xs text-muted">
                  <div className="flex justify-between w-48">
                    <span>Subtotal</span>
                    <span className="font-bold text-navy">{formatPKR(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between w-48 text-green">
                      <span>Discount</span>
                      <span className="font-bold">- {formatPKR(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between w-48">
                    <span>Delivery Fee</span>
                    <span className="font-bold text-navy">{order.delivery_fee === 0 ? "FREE" : formatPKR(order.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-sm font-extrabold text-navy border-t border-line pt-2">
                    <span>Total Amount</span>
                    <span className="text-base font-black text-orange">{formatPKR(order.total)}</span>
                  </div>
                </div>
              </div>

              {/* Status Change Workflow Controls */}
              <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange">Update Order Workflow Status</h3>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusUpdate(s)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all capitalize ${
                        selectedStatus === s
                          ? "bg-navy text-white border-navy shadow-xs"
                          : "bg-white text-navy border-line hover:border-orange"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Reason or note for status update (recorded in audit log)..."
                    className="flex-1 rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-orange"
                  />
                  <button
                    onClick={() => handleStatusUpdate(selectedStatus)}
                    disabled={updatingStatus}
                    className="rounded-xl bg-orange px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-dark disabled:opacity-60"
                  >
                    {updatingStatus ? "Saving..." : "Apply Status"}
                  </button>
                </div>
              </div>

              {/* Order Status History Audit Trail */}
              <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Audit History Timeline</h3>
                <div className="space-y-3 pl-2">
                  {(order.order_status_history ?? []).map((h, idx) => (
                    <div key={h.id || idx} className="relative flex gap-3 text-xs border-l-2 border-orange/40 pl-4 py-1">
                      <span className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-orange"></span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy capitalize">
                            {h.old_status ? `${h.old_status.replace(/_/g, " ")} → ` : ""}
                            {h.new_status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-muted">
                            {new Date(h.created_at).toLocaleString("en-PK")}
                          </span>
                        </div>
                        {h.note && <p className="text-muted font-medium mt-0.5">{h.note}</p>}
                        {h.profiles?.full_name && (
                          <p className="text-[10px] text-orange font-bold mt-0.5">By: {h.profiles.full_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {!order.order_status_history?.length && (
                    <p className="text-xs text-muted">No history entries recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">
              {/* Payment Section */}
              <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Payment Management</h3>
                <div className="space-y-2 text-xs">
                  <p className="text-muted">Method: <strong className="text-navy capitalize">{order.payment_method.replace(/_/g, " ")}</strong></p>
                  <p className="text-muted">Current Status: <strong className="text-orange capitalize">{paymentStatus}</strong></p>
                  {paymentRecord?.transaction_reference && (
                    <p className="text-muted">Transaction Ref: <strong className="text-navy font-mono">{paymentRecord.transaction_reference}</strong></p>
                  )}
                </div>

                {/* Quick Payment Status buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={() => handlePaymentUpdate("paid")}
                    disabled={updatingPayment}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-green/10 text-green border border-green/20 hover:bg-green hover:text-white transition-all"
                  >
                    Mark Paid
                  </button>
                  <button
                    onClick={() => handlePaymentUpdate("pending_verification")}
                    disabled={updatingPayment}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    Pending Verify
                  </button>
                  <button
                    onClick={() => handlePaymentUpdate("failed")}
                    disabled={updatingPayment}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white transition-all"
                  >
                    Mark Failed
                  </button>
                </div>
              </div>

              {/* Courier & Tracking Assignment */}
              <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-orange">Courier & Tracking</h3>

                <label className="block text-xs font-bold text-navy">
                  Assigned Courier
                  <select
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="">Unassigned</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-navy">
                  Tracking CN Number
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter consignment #"
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono font-bold outline-none"
                  />
                </label>

                <button
                  onClick={handleCourierSave}
                  disabled={updatingCourier}
                  className="w-full rounded-xl bg-orange px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-dark disabled:opacity-60 transition-all"
                >
                  {updatingCourier ? "Saving..." : "Save Courier Info"}
                </button>

                <a
                  href={trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold text-orange hover:underline pt-1"
                >
                  <ExternalLink size={13} /> View Customer Tracking Page
                </a>
              </div>

              {/* Staff Notes */}
              <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Internal Admin Notes</h3>
                <p className="text-[11px] text-muted">Never shown to customer. Staff internal comments.</p>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add private staff notes..."
                  className="w-full rounded-xl border border-line bg-cream/30 p-3 text-xs font-semibold outline-none focus:border-orange resize-none"
                />
                <button
                  onClick={handleNotesSave}
                  disabled={updatingNotes}
                  className="rounded-xl border border-line bg-white px-4 py-1.5 text-xs font-bold text-navy hover:border-orange hover:text-orange"
                >
                  {updatingNotes ? "Saving..." : "Save Internal Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
