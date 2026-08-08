"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "@/components/storefront/cart-provider";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [payment, setPayment] = useState("cod");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [orderNumber, setOrderNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const deliveryFee = total > 3000 || total === 0 ? 0 : 250;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: Object.fromEntries(form.entries()),
          payment_method: payment,
          items: items.map(({ id, quantity, variationId }) => ({ product_id: id, variation_id: variationId, quantity })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Failed to place order. Please try again.");
        return;
      }

      setOrderNumber(data.order_number);
      clear();
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try placing your order again.");
    }
  }

  if (status === "success") {
    return (
      <div className="container-shell py-16 md:py-24">
        <div className="mx-auto max-w-xl rounded-[36px] bg-white p-8 sm:p-12 text-center shadow-xl border border-line/80">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green/10 text-green shadow-inner">
            <Check size={40} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-green">
            Order Confirmed & Placed
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy">
            Thank You For Your Order!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted font-medium">
            Your order number is <strong className="text-navy font-bold">{orderNumber}</strong>. We have received your order and our bakery team will prepare it fresh for delivery.
          </p>

          <div className="mt-8 rounded-2xl bg-cream p-5 border border-line/70 text-left text-xs space-y-2 text-navy/80">
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Order ID:</span>
              <span className="font-extrabold text-navy">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Payment Mode:</span>
              <span className="font-bold uppercase text-orange">{payment.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Status:</span>
              <span className="font-bold text-green">Placed & Pending Bakery Dispatch</span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/track-order?order=${orderNumber}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all"
            >
              <span>Track Order Progress</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-line py-4 text-sm font-bold text-navy hover:border-orange transition-all"
            >
              Back to Counter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Checkout Progress Header */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-4">
        <span className="text-orange">1 Delivery Info</span>
        <ChevronRight size={14} />
        <span className="text-orange">2 Payment</span>
        <ChevronRight size={14} />
        <span>3 Confirmation</span>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
        Checkout
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center border border-line/80">
          <p className="text-muted text-base">Your shopping basket is currently empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 font-bold text-orange hover:underline"
          >
            Browse Bakery Counter →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left Column: Delivery Info & Payment */}
          <section className="flex flex-col gap-6">
            {/* Step 1: Delivery Details */}
            <div className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
              <div className="flex items-center gap-3 border-b border-line/80 pb-5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-orange text-sm font-extrabold text-white">
                  1
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy">
                    Customer & Delivery Address
                  </h2>
                  <p className="text-xs text-muted font-medium">
                    No account required — guest checkout enabled.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field name="full_name" label="Full Name" placeholder="e.g. Ayesha Khan" required />
                <Field name="phone" label="Phone Number" type="tel" placeholder="03XX XXXXXXX" required />
                <Field name="email" label="Email Address (Optional)" type="email" placeholder="ayesha@example.com" />
                <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                  City <span className="text-orange">*</span>
                  <select
                    name="city"
                    defaultValue="Lahore"
                    required
                    className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Karachi">Karachi</option>
                  </select>
                </label>
                <Field name="area" label="Area / Town" placeholder="e.g. Gulberg III, DHA Phase 5" required />
                <Field name="landmark" label="Nearby Landmark" placeholder="e.g. Near Main Market" />
              </div>

              <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-navy">
                Complete Street Address <span className="text-orange">*</span>
                <textarea
                  name="address"
                  rows={3}
                  required
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                  placeholder="House number, street, block, sector and neighbourhood details..."
                />
              </label>

              <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-navy">
                Special Delivery Instructions (Optional)
                <textarea
                  name="instructions"
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium outline-none focus:border-orange focus:bg-white"
                  placeholder="Gate code, call before delivery, gift note on cake box, preferred delivery window..."
                />
              </label>
            </div>

            {/* Step 2: Payment Options */}
            <div className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
              <div className="flex items-center gap-3 border-b border-line/80 pb-5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-orange text-sm font-extrabold text-white">
                  2
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy">
                    Select Payment Method
                  </h2>
                  <p className="text-xs text-muted font-medium">
                    Choose your preferred payment method.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <PaymentOption
                  value="cod"
                  active={payment === "cod"}
                  onClick={setPayment}
                  title="Cash on Delivery (COD)"
                  description="Pay cash to our delivery agent when your fresh bakes arrive."
                />
                <PaymentOption
                  value="bank_transfer"
                  active={payment === "bank_transfer"}
                  onClick={setPayment}
                  title="Direct Bank Transfer"
                  description="Transfer to our official bank account. Order dispatched upon receipt."
                />
              </div>

              {payment === "bank_transfer" && (
                <div className="mt-4 rounded-2xl bg-orange/5 p-4 border border-orange/20 text-xs leading-relaxed text-navy">
                  <p className="font-bold text-orange">Bank Account Transfer Details:</p>
                  <p className="mt-1">Bank: Meezan Bank Ltd. | Title: Bake Mart Bazaar</p>
                  <p>Account No: 01010102938475 | IBAN: PK36MEZN0001010102938475</p>
                  <p className="mt-1 text-muted">
                    Please WhatsApp your transfer receipt to 0321-1234567 after placing the order.
                  </p>
                </div>
              )}
            </div>

            {status === "error" && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-200 text-xs font-bold text-red-700">
                {errorMessage}
              </div>
            )}
          </section>

          {/* Right Column: Order Review Sidebar */}
          <aside className="h-fit rounded-[28px] bg-white p-6 border border-line/80 shadow-md">
            <h2 className="font-display text-2xl font-bold text-navy border-b border-line pb-4">
              Order Review
            </h2>

            {/* Items Summary List */}
            <div className="mt-4 flex flex-col gap-3 border-b border-line pb-4 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs font-medium">
                  <div>
                    <p className="font-bold text-navy">{item.name}</p>
                    <p className="text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-extrabold text-navy">
                    {formatPKR((item.salePrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Calculation */}
            <div className="mt-4 flex flex-col gap-2 text-xs font-medium text-navy/80">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-bold text-navy">{formatPKR(total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted">Delivery Fee</span>
                <span className="font-bold">
                  {deliveryFee === 0 ? (
                    <span className="text-green font-extrabold">FREE</span>
                  ) : (
                    formatPKR(deliveryFee)
                  )}
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-line pt-4 flex justify-between items-baseline">
              <span className="font-display text-xl font-bold text-navy">Grand Total</span>
              <span className="font-display text-3xl font-extrabold text-orange">
                {formatPKR(total + deliveryFee)}
              </span>
            </div>

            {/* Submit Place Order Button */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/25 hover:bg-orange-dark transition-all disabled:opacity-60"
            >
              {status === "loading" ? (
                "Processing Order..."
              ) : (
                <>
                  <span>Place Order Now</span>
                  <LockKeyhole size={16} />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted font-medium">
              <ShieldCheck size={14} className="text-green" /> SSL Encrypted Checkout
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
      {label} {required && <span className="text-orange">*</span>}
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white"
      />
    </label>
  );
}

function PaymentOption({
  value,
  active,
  onClick,
  title,
  description,
}: {
  value: string;
  active: boolean;
  onClick: (value: string) => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`rounded-2xl border-2 p-5 text-left transition-all ${
        active
          ? "border-orange bg-orange/5 shadow-xs"
          : "border-line bg-cream/30 hover:border-navy/30"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
            active ? "border-orange bg-orange" : "border-muted"
          }`}
        >
          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className="font-bold text-navy text-sm">{title}</span>
      </div>
      <p className="mt-2 text-xs text-muted leading-relaxed font-medium">{description}</p>
    </button>
  );
}
