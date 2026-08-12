"use client";

import { useState } from "react";
import { Edit3, X, Save } from "lucide-react";
import { AdminOrder, Courier, PaymentStatus } from "@/lib/types";

interface EditOrderModalProps {
  order: AdminOrder;
  couriers: Courier[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditOrderModal({ order, couriers, onClose, onSuccess }: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone);
  const [customerEmail, setCustomerEmail] = useState(order.customer_email || "");
  const [city, setCity] = useState(order.city);
  const [area, setArea] = useState(order.area);
  const [address, setAddress] = useState(order.delivery_address);
  const [landmark, setLandmark] = useState(order.landmark || "");
  const [instructions, setInstructions] = useState(order.delivery_instructions || "");

  const paymentRecord = order.payments?.[0];
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(paymentRecord?.status || "pending");
  const [paymentNotes, setPaymentNotes] = useState(paymentRecord?.payment_notes || "");
  const [transactionRef, setTransactionRef] = useState(paymentRecord?.transaction_reference || "");

  const [courierId, setCourierId] = useState(order.courier_id || "");
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || "");
  const [deliveryNotes, setDeliveryNotes] = useState(order.delivery_notes || "");
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || "");

  const [discount, setDiscount] = useState(order.discount);
  const [deliveryFee, setDeliveryFee] = useState(order.delivery_fee);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: customerEmail.trim() || null,
          city: city.trim(),
          area: area.trim(),
          delivery_address: address.trim(),
          landmark: landmark.trim() || null,
          delivery_instructions: instructions.trim() || null,

          payment_status: paymentStatus,
          payment_notes: paymentNotes.trim() || null,
          transaction_reference: transactionRef.trim() || null,

          courier_id: courierId || null,
          tracking_number: trackingNumber.trim() || null,
          tracking_url: trackingUrl.trim() || null,
          delivery_notes: deliveryNotes.trim() || null,
          admin_notes: adminNotes.trim() || null,

          discount: Number(discount),
          delivery_fee: Number(deliveryFee),
        }),
      });

      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        setError(data.error || "Failed to update order");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setSaving(false);
      setError("Network error updating order");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-line bg-cream/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-orange" />
            <h3 className="text-lg font-bold text-navy">Edit Order #{order.order_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-line text-muted hover:text-navy hover:bg-cream transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Recipient Details */}
          <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange">Customer Delivery Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-bold text-navy">
                Name
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Phone
                <input
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Email
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                City
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Area
                <input
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Landmark
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-navy">
              Street Address
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
              />
            </label>

            <label className="block text-xs font-bold text-navy">
              Delivery Instructions
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange"
              />
            </label>
          </div>

          {/* Payment & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Payment Details</h4>
              <label className="block text-xs font-bold text-navy">
                Payment Status
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-navy">
                Transaction Reference
                <input
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Bank ref, TRX ID..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-navy">
                Payment Notes
                <input
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Notes..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </label>
            </div>

            <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Courier & Logistics</h4>
              <label className="block text-xs font-bold text-navy">
                Courier Service
                <select
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
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
                Tracking Number
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="CN number"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </label>

              <label className="block text-xs font-bold text-navy">
                Custom Tracking URL
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </label>
            </div>
          </div>

          {/* Financial Adjustments & Admin Notes */}
          <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange">Financial Adjustments & Staff Notes</h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-navy">
                Discount (PKR)
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-green outline-none"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Delivery Fee (PKR)
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-navy">
              Internal Admin Notes (Private staff note)
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Staff notes recorded for audit trail..."
                className="mt-1 w-full rounded-xl border border-line bg-white p-3 text-xs font-semibold outline-none focus:border-orange resize-none"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-muted hover:text-navy"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-6 py-2 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark disabled:opacity-60 transition-all"
            >
              <Save size={14} /> {saving ? "Saving Changes..." : "Save Order Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
