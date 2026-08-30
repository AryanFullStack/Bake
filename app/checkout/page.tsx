"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Edit2,
  LockKeyhole,
  MapPin,
  Plus,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { useCart } from "@/components/storefront/cart-provider";
import { PAKISTAN_CITIES, OTHER_CITY_OPTION, getCitySelectionState } from "@/lib/cities";

type SavedAddress = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  landmark?: string | null;
  instructions?: string | null;
  is_default: boolean;
};

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [payment, setPayment] = useState("cod");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [orderNumber, setOrderNumber] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Customer & saved address state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [isFormEditing, setIsFormEditing] = useState(true);

  // Form input fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [citySelect, setCitySelect] = useState<string>("Lahore");
  const [customCity, setCustomCity] = useState<string>("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");

  const deliveryFee = total >= 3000 || total === 0 ? 0 : 250;

  // Auto-load saved addresses for authenticated users
  useEffect(() => {
    async function loadAddresses() {
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          setIsLoggedIn(true);
          const data = await res.json();
          const list: SavedAddress[] = data.addresses ?? [];
          setSavedAddresses(list);

          if (list.length > 0) {
            const defaultAddr = list.find((a) => a.is_default) || list[0];
            setSelectedAddressId(defaultAddr.id);
            applyAddressFields(defaultAddr);
            setIsFormEditing(false);
          } else {
            setIsFormEditing(true);
          }
        } else if (res.status === 401) {
          setIsLoggedIn(false);
          setIsFormEditing(true);
        }
      } catch (e) {
        console.error("Failed to load saved addresses", e);
      }
    }

    loadAddresses();
  }, []);

  function applyAddressFields(addr: SavedAddress) {
    setFullName(addr.full_name || "");
    setPhone(addr.phone || "");
    const { selectValue, customCity: cust } = getCitySelectionState(addr.city || "");
    setCitySelect(selectValue);
    setCustomCity(cust);
    setArea(addr.area || "");
    setAddress(addr.address || "");
    setLandmark(addr.landmark || "");
    setInstructions(addr.instructions || "");
  }

  function handleAddressSelection(id: string) {
    if (id === "new") {
      setSelectedAddressId("new");
      setIsFormEditing(true);
      setFullName("");
      setPhone("");
      setCitySelect("Lahore");
      setCustomCity("");
      setArea("");
      setAddress("");
      setLandmark("");
      setInstructions("");
      return;
    }

    const addr = savedAddresses.find((a) => a.id === id);
    if (addr) {
      setSelectedAddressId(addr.id);
      applyAddressFields(addr);
      setIsFormEditing(false);
    }
  }

  const finalCity = citySelect === OTHER_CITY_OPTION ? customCity.trim() : citySelect.trim();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim() || !phone.trim() || !address.trim() || !area.trim() || !finalCity) {
      setStatus("error");
      setErrorMessage("Please complete all required delivery details.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            city: finalCity,
            area: area.trim(),
            address: address.trim(),
            landmark: landmark.trim(),
            instructions: instructions.trim(),
          },
          payment_method: payment,
          items: items.map(({ id, quantity, variationId }) => ({
            product_id: id,
            variation_id: variationId || null,
            quantity,
          })),
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
      setErrorMessage("Network error. Please check your connection and try again.");
    }
  }

  // Order Success View
  if (status === "success") {
    return (
      <div className="container-shell py-12 md:py-20">
        <div className="mx-auto max-w-2xl rounded-[36px] bg-white p-8 sm:p-12 text-center shadow-xl border border-line/80">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green/10 text-green shadow-inner">
            <Check size={40} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-green">
            Order Placed Successfully
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-navy">
            Thank You For Your Order!
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted font-medium">
            Order number <strong className="text-navy font-bold">{orderNumber}</strong> has been registered. Our bakery team is preparing your fresh order for dispatch.
          </p>

          <div className="mt-8 rounded-2xl bg-cream/60 p-6 border border-line/70 text-left text-xs space-y-3 text-navy">
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="font-semibold text-muted">Order ID:</span>
              <span className="font-extrabold text-navy text-sm">{orderNumber}</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="font-semibold text-muted">Recipient:</span>
              <span className="font-bold text-navy">{fullName} ({phone})</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="font-semibold text-muted">Delivery Address:</span>
              <span className="font-bold text-navy text-right">{address}, {area}, {finalCity}</span>
            </div>
            <div className="flex justify-between border-b border-line/50 pb-2">
              <span className="font-semibold text-muted">Payment Mode:</span>
              <span className="font-bold uppercase text-orange">{payment.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-muted">Initial Status:</span>
              <span className="font-bold text-green">Placed & Pending Dispatch</span>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href={`/track-order?order=${orderNumber}&phone=${encodeURIComponent(phone)}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-lg hover:bg-orange-dark transition-all"
            >
              <span>Track Live Status</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-line py-4 text-sm font-bold text-navy hover:border-orange transition-all"
            >
              Back to Bakery Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedAddrObj = savedAddresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="container-shell py-10 md:py-16">
      {/* Checkout Steps Header */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted mb-4">
        <span className="text-orange">1 Delivery Address</span>
        <ChevronRight size={14} />
        <span className="text-orange">2 Payment</span>
        <ChevronRight size={14} />
        <span>3 Confirmation</span>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy">
        Checkout
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-12 text-center border border-line/80">
          <ShoppingBag size={36} className="mx-auto text-muted mb-3" />
          <p className="text-muted text-base font-bold">Your shopping basket is empty.</p>
          <Link
            href="/shop"
            className="mt-4 inline-flex items-center gap-2 font-bold text-orange hover:underline"
          >
            Browse Bakery Counter →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Left Column: Delivery Address & Payment */}
          <section className="flex flex-col gap-6">
            {/* 1. DELIVERY ADDRESS SECTION */}
            <div className="rounded-[28px] bg-white p-6 sm:p-8 border border-line/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line/80 pb-5 gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-orange text-sm font-extrabold text-white">
                    1
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold text-navy">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-muted font-semibold mt-0.5">
                      Select a saved address or enter new delivery details.
                    </p>
                  </div>
                </div>

                {!isLoggedIn && (
                  <Link href="/login?next=/checkout" className="text-xs font-extrabold text-orange hover:underline self-start sm:self-center">
                    Sign in to use saved addresses
                  </Link>
                )}
              </div>

              {/* Logged in customer saved address selector / card */}
              {isLoggedIn && savedAddresses.length > 0 && (
                <div className="mt-6 mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-navy">
                      Your Saved Address
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddressSelection("new")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-orange hover:underline"
                    >
                      <Plus size={14} /> Add New Address
                    </button>
                  </div>

                  {/* Saved Address Cards */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleAddressSelection(addr.id)}
                          className={`cursor-pointer flex flex-col justify-between p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? "border-orange bg-orange/5 shadow-xs"
                              : "border-line/70 bg-cream/20 hover:border-navy/30"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-navy text-xs uppercase tracking-wider">
                                {addr.label} {addr.is_default && "• Default"}
                              </span>
                              <span
                                className={`h-4 w-4 rounded-full border-2 grid place-items-center ${
                                  isSelected ? "border-orange bg-orange" : "border-line"
                                }`}
                              >
                                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </span>
                            </div>
                            <p className="mt-2 font-bold text-navy text-sm">{addr.full_name}</p>
                            <p className="text-xs text-muted font-medium">{addr.phone}</p>
                            <p className="mt-1 text-xs text-navy/80 font-medium leading-relaxed">
                              {addr.address}, {addr.area}, {addr.city}
                            </p>
                            {addr.landmark && (
                              <p className="text-[11px] text-muted font-medium mt-0.5">
                                Nearby: {addr.landmark}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/50">
                            <span className="text-[11px] font-extrabold text-orange">
                              {isSelected ? "Selected Address" : "Click to select"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddressSelection(addr.id);
                                setIsFormEditing(true);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-orange"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Display compact summary card if saved address is selected and NOT editing */}
              {isLoggedIn && selectedAddressId !== "new" && !isFormEditing && selectedAddrObj ? (
                <div className="rounded-2xl border border-orange/40 bg-cream/40 p-5">
                  <div className="flex items-center justify-between border-b border-line/60 pb-3 mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
                      Saved Delivery Address Active
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFormEditing(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-navy border border-line hover:border-orange transition-colors"
                      >
                        <Edit2 size={13} /> Edit Address
                      </button>
                    </div>
                  </div>
                  <p className="font-extrabold text-navy text-base">{fullName}</p>
                  <p className="text-xs text-muted font-bold mt-0.5">{phone}</p>
                  <p className="mt-2 text-sm font-medium text-navy/90 leading-relaxed">
                    {address}, {area}, {finalCity}
                  </p>
                  {landmark && (
                    <p className="mt-1 text-xs text-muted font-medium">
                      <strong className="text-navy">Landmark:</strong> {landmark}
                    </p>
                  )}
                  {instructions && (
                    <p className="mt-1 text-xs text-muted font-medium italic">
                      <strong className="text-navy">Note:</strong> {instructions}
                    </p>
                  )}
                </div>
              ) : (
                /* Address Entry Form Fields */
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Full Name <span className="text-orange">*</span>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Ahmed Khan"
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Phone Number <span className="text-orange">*</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="0300XXXXXXX"
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Email Address (Optional)
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ahmed@example.com"
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      City <span className="text-orange">*</span>
                      <select
                        value={citySelect}
                        onChange={(e) => setCitySelect(e.target.value)}
                        required
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      >
                        {PAKISTAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Custom City text input when "Other / Enter City" is selected */}
                  {citySelect === OTHER_CITY_OPTION && (
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Enter Custom City Name <span className="text-orange">*</span>
                      <input
                        value={customCity}
                        onChange={(e) => setCustomCity(e.target.value)}
                        required
                        placeholder="Enter your city name (e.g. Hunza, Gwadar...)"
                        className="mt-2 w-full rounded-xl border border-orange/60 bg-white px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange"
                      />
                    </label>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Area / Town <span className="text-orange">*</span>
                      <input
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        required
                        placeholder="e.g. Mandian, Gulberg III, DHA Phase 5"
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      />
                    </label>

                    <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                      Nearby Landmark (Optional)
                      <input
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Main Market, Near Hospital"
                        className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-semibold text-navy outline-none focus:border-orange focus:bg-white"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Complete Street Address <span className="text-orange">*</span>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      required
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white"
                      placeholder="House number, street, block, sector..."
                    />
                  </label>

                  <label className="block text-xs font-bold uppercase tracking-wider text-navy">
                    Special Delivery Instructions (Optional)
                    <textarea
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-xl border border-line bg-cream/50 px-3.5 py-3 text-sm font-medium text-navy outline-none focus:border-orange focus:bg-white"
                      placeholder="Gate code, call before arrival, gift note..."
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 2. PAYMENT METHOD SECTION */}
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
                    Choose how you would like to pay for your order.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPayment("cod")}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    payment === "cod"
                      ? "border-orange bg-orange/5 shadow-xs"
                      : "border-line bg-cream/30 hover:border-navy/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                        payment === "cod" ? "border-orange bg-orange" : "border-muted"
                      }`}
                    >
                      {payment === "cod" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-bold text-navy text-sm">Cash on Delivery (COD)</span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed font-medium">
                    Pay cash to our courier upon fresh delivery.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayment("bank_transfer")}
                  className={`rounded-2xl border-2 p-5 text-left transition-all ${
                    payment === "bank_transfer"
                      ? "border-orange bg-orange/5 shadow-xs"
                      : "border-line bg-cream/30 hover:border-navy/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                        payment === "bank_transfer" ? "border-orange bg-orange" : "border-muted"
                      }`}
                    >
                      {payment === "bank_transfer" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="font-bold text-navy text-sm">Direct Bank Transfer</span>
                  </div>
                  <p className="mt-2 text-xs text-muted leading-relaxed font-medium">
                    Transfer directly to our bank account. Order dispatched upon receipt.
                  </p>
                </button>
              </div>

              {payment === "bank_transfer" && (
                <div className="mt-4 rounded-2xl bg-orange/5 p-4 border border-orange/20 text-xs leading-relaxed text-navy">
                  <p className="font-bold text-orange">Official Bank Account Details:</p>
                  <p className="mt-1">Bank: Meezan Bank Ltd. | Title: Bake Mart Bazaar</p>
                  <p>Account No: 01010102938475 | IBAN: PK36MEZN0001010102938475</p>
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
              Order Summary
            </h2>

            {/* Items Summary List */}
            <div className="mt-4 flex flex-col gap-3.5 border-b border-line pb-4 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.id}:${item.variationId ?? "base"}`}
                  className="flex gap-3 text-xs font-medium items-center"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-deep border border-line">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy truncate">{item.name}</p>
                    {item.variationTitle && item.variationTitle !== item.name && (
                      <p className="text-[11px] font-bold text-orange truncate">
                        {item.variationTitle}
                      </p>
                    )}
                    {item.variationAttributes && (
                      <p className="text-[10px] text-muted truncate">
                        {Object.entries(item.variationAttributes).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                    <p className="text-[11px] text-muted font-semibold mt-0.5">
                      Qty: {item.quantity} × {formatPKR(item.salePrice ?? item.price)}
                    </p>
                  </div>
                  <span className="font-extrabold text-navy text-xs shrink-0">
                    {formatPKR((item.salePrice ?? item.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
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

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-orange py-4 text-sm font-extrabold text-white shadow-xl shadow-orange/25 hover:bg-orange-dark transition-all disabled:opacity-60 cursor-pointer"
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
