"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, UserCheck, UserPlus, X, ShoppingBag, Check } from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { Courier, PaymentMethod, PaymentStatus } from "@/lib/types";

interface CreateOrderModalProps {
  couriers: Courier[];
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderCartItem {
  product_id: string;
  variation_id?: string | null;
  product_name: string;
  variation_title?: string | null;
  sku?: string | null;
  unit_price: number;
  quantity: number;
  stock_quantity?: number;
}

export function CreateOrderModal({ couriers, onClose, onSuccess }: CreateOrderModalProps) {
  // Customer mode: 'guest' | 'registered'
  const [customerMode, setCustomerMode] = useState<"guest" | "registered">("guest");
  const [customerQuery, setCustomerQuery] = useState("");
  const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Customer form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Lahore");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [instructions, setInstructions] = useState("");

  // Product Search & Items Cart
  const [productQuery, setProductQuery] = useState("");
  const [foundProducts, setFoundProducts] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [cartItems, setCartItems] = useState<OrderCartItem[]>([]);

  // Financials & Payment
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(250);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [courierId, setCourierId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Live Customer Search
  useEffect(() => {
    if (customerMode !== "registered" || !customerQuery.trim()) {
      setFoundCustomers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingCustomers(true);
      try {
        const res = await fetch(`/api/admin/customers/search?q=${encodeURIComponent(customerQuery)}`);
        const data = await res.json();
        setFoundCustomers(data.customers || []);
      } catch {
        // ignore
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerQuery, customerMode]);

  // Live Product Search
  useEffect(() => {
    if (!productQuery.trim()) {
      setFoundProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingProducts(true);
      try {
        const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(productQuery)}`);
        const data = await res.json();
        setFoundProducts(data.products || []);
      } catch {
        // ignore
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  function selectRegisteredCustomer(c: any) {
    setSelectedCustomer(c);
    setFullName(c.full_name || "");
    setPhone(c.phone || "");
    if (c.default_address) {
      setCity(c.default_address.city || "Lahore");
      setArea(c.default_address.area || "");
      setAddress(c.default_address.address || "");
      setLandmark(c.default_address.landmark || "");
    }
    setFoundCustomers([]);
  }

  function addProductToCart(p: any, varItem?: any) {
    const isVar = p.product_type === "variable" && varItem;
    const unitPrice = isVar
      ? Number(varItem.sale_price ?? varItem.regular_price)
      : Number(p.sale_price ?? p.price);
    const varTitle = isVar ? varItem.title || varItem.name : undefined;
    const sku = isVar ? varItem.sku || p.sku : p.sku;
    const varId = isVar ? varItem.id : undefined;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.product_id === p.id && (i.variation_id ?? null) === (varId ?? null)
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [
        ...prev,
        {
          product_id: p.id,
          variation_id: varId,
          product_name: p.name,
          variation_title: varTitle,
          sku,
          unit_price: unitPrice,
          quantity: 1,
          stock_quantity: isVar ? varItem.stock_quantity : p.stock_quantity,
        },
      ];
    });
  }

  function removeCartItem(idx: number) {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItemQuantity(idx: number, qty: number) {
    if (qty < 1) return;
    setCartItems((prev) => {
      const copy = [...prev];
      copy[idx].quantity = qty;
      return copy;
    });
  }

  function updateItemPrice(idx: number, price: number) {
    if (price < 0) return;
    setCartItems((prev) => {
      const copy = [...prev];
      copy[idx].unit_price = price;
      return copy;
    });
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Auto delivery fee check
  useEffect(() => {
    if (subtotal >= 3000 || subtotal === 0) {
      setDeliveryFee(0);
    } else {
      setDeliveryFee(250);
    }
  }, [subtotal]);

  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !address.trim() || !area.trim() || !city.trim()) {
      setError("Please complete all required customer delivery information.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add at least one product to the order.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            user_id: selectedCustomer?.id || null,
            full_name: fullName.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            city: city.trim(),
            area: area.trim(),
            address: address.trim(),
            landmark: landmark.trim() || null,
            instructions: instructions.trim() || null,
          },
          items: cartItems.map((i) => ({
            product_id: i.product_id,
            variation_id: i.variation_id || undefined,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          discount: Number(discount),
          delivery_fee: Number(deliveryFee),
          courier_id: courierId || null,
          tracking_number: trackingNumber.trim() || null,
          admin_notes: adminNotes.trim() || null,
        }),
      });

      const data = await response.json();
      setSaving(false);

      if (!response.ok) {
        setError(data.error || "Failed to create order");
      } else {
        onSuccess();
        onClose();
      }
    } catch {
      setSaving(false);
      setError("Network error submitting manual order");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-cream/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange" />
            <h3 className="text-lg font-bold text-navy">Create Manual Customer Order</h3>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white border border-line text-muted hover:text-navy hover:bg-cream transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Customer Section */}
          <div className="p-5 rounded-2xl border border-line/80 bg-cream/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange">Customer Delivery Details</h4>
              <div className="flex rounded-xl bg-cream-deep p-1">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("guest");
                    setSelectedCustomer(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    customerMode === "guest" ? "bg-white text-navy shadow-xs" : "text-muted hover:text-navy"
                  }`}
                >
                  <UserPlus size={13} /> Guest Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("registered")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    customerMode === "registered" ? "bg-white text-navy shadow-xs" : "text-muted hover:text-navy"
                  }`}
                >
                  <UserCheck size={13} /> Registered Customer
                </button>
              </div>
            </div>

            {/* Registered Customer Search */}
            {customerMode === "registered" && (
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Search registered user by name or phone..."
                  className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
                {searchingCustomers && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-bold">
                    Searching...
                  </span>
                )}
                {foundCustomers.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-line bg-white shadow-xl max-h-48 overflow-y-auto divide-y divide-line/60">
                    {foundCustomers.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selectRegisteredCustomer(c)}
                        className="w-full p-3 text-left hover:bg-cream/40 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-navy text-xs">{c.full_name}</p>
                          <p className="text-[11px] text-muted">{c.phone}</p>
                        </div>
                        <span className="text-[10px] font-extrabold text-orange bg-orange/10 px-2 py-0.5 rounded-full">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs font-bold text-navy">
                Full Name *
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Customer Full Name"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Phone Number *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                City *
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lahore"
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Area / Town *
                <input
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Gulberg III, DHA Phase 5..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>

              <label className="text-xs font-bold text-navy">
                Landmark
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Near Main Market..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
                />
              </label>
            </div>

            <label className="block text-xs font-bold text-navy">
              Street Address *
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Building #, Street name..."
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
              />
            </label>

            <label className="block text-xs font-bold text-navy">
              Delivery Instructions
              <input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Call before arrival, leave at gate..."
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-orange transition-all"
              />
            </label>
          </div>

          {/* Product Search & Cart Table */}
          <div className="p-5 rounded-2xl border border-line/80 bg-white space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange">Select Products</h4>

            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search real database catalog by product name or SKU..."
                className="w-full rounded-xl border border-line bg-cream/50 py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-orange focus:bg-white transition-all"
              />
              {searchingProducts && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted font-bold">
                  Searching catalog...
                </span>
              )}

              {/* Product Search Results Dropdown */}
              {foundProducts.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-2xl border border-line bg-white shadow-2xl max-h-64 overflow-y-auto divide-y divide-line/60">
                  {foundProducts.map((p) => (
                    <div key={p.id} className="p-3 hover:bg-cream/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-navy text-xs">{p.name}</p>
                          <p className="text-[11px] text-muted">SKU: {p.sku || "N/A"} • Stock: {p.stock_quantity}</p>
                        </div>
                        {p.product_type !== "variable" && (
                          <button
                            type="button"
                            onClick={() => {
                              addProductToCart(p);
                              setFoundProducts([]);
                              setProductQuery("");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-orange px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-orange-dark"
                          >
                            <Plus size={13} /> Add ({formatPKR(p.sale_price ?? p.price)})
                          </button>
                        )}
                      </div>

                      {/* Variations list */}
                      {p.product_type === "variable" && p.product_variations?.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-orange/30 space-y-1.5">
                          {p.product_variations.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between text-xs py-0.5">
                              <span className="font-semibold text-navy">
                                {v.title || v.name} ({formatPKR(v.sale_price ?? v.regular_price)}) – Stock: {v.stock_quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  addProductToCart(p, v);
                                  setFoundProducts([]);
                                  setProductQuery("");
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1 text-[11px] font-bold text-white hover:bg-navy/80"
                              >
                                <Plus size={12} /> Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Table */}
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream/60 border-b border-line text-[10px] font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Unit Price (PKR)</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-cream/30">
                      <td className="p-3 font-semibold text-navy">
                        <p className="font-bold">{item.product_name}</p>
                        {item.variation_title && <p className="text-[11px] text-orange">{item.variation_title}</p>}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 rounded-lg border border-line px-2 py-1 font-mono text-xs font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value, 10) || 1)}
                          className="w-16 rounded-lg border border-line px-2 py-1 font-mono text-xs font-bold text-center"
                        />
                      </td>
                      <td className="p-3 text-right font-extrabold text-navy">
                        {formatPKR(item.unit_price * item.quantity)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeCartItem(idx)}
                          className="p-1.5 text-muted hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!cartItems.length && (
                <p className="p-6 text-center text-xs text-muted font-medium">
                  No products added yet. Search and select products above.
                </p>
              )}
            </div>
          </div>

          {/* Payment, Courier & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-2xl border border-line/80 bg-cream/30">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange">Payment & Courier</h4>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-navy">
                  Payment Method
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none capitalize"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card / POS</option>
                    <option value="cash">Cash Over Counter</option>
                  </select>
                </label>

                <label className="text-xs font-bold text-navy">
                  Payment Status
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="pending_verification">Pending Verification</option>
                    <option value="paid">Paid</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold text-navy">
                  Assign Courier
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

                <label className="text-xs font-bold text-navy">
                  Tracking Number
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="CN Number"
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-navy">
                Internal Admin Notes
                <input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private staff notes (not visible to customer)..."
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold outline-none"
                />
              </label>
            </div>

            {/* Totals Summary */}
            <div className="bg-white p-4 rounded-xl border border-line flex flex-col justify-between space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">Summary Calculation</h4>
              <div className="space-y-2 text-xs font-medium text-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-navy">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Discount (PKR)</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-line px-2 py-1 font-mono text-xs font-bold text-right text-green"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>Delivery Charges (PKR)</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-24 rounded-lg border border-line px-2 py-1 font-mono text-xs font-bold text-right"
                  />
                </div>
                <div className="border-t border-line pt-2.5 flex justify-between items-center text-sm font-extrabold text-navy">
                  <span>Final Total</span>
                  <span className="text-lg font-black text-orange">{formatPKR(total)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !cartItems.length}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-6 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-orange-dark disabled:opacity-60 transition-all"
                >
                  {saving ? "Creating Order..." : "Create Order"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
