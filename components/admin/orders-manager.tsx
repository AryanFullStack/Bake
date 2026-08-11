"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Package, Search, Truck } from "lucide-react";
import { formatPKR } from "@/lib/catalog";

const statuses = [
  "placed",
  "confirmed",
  "processing",
  "baking",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

const statusColors: Record<string, string> = {
  placed: "bg-orange/10 text-orange",
  confirmed: "bg-blue-50 text-blue-600",
  processing: "bg-purple-50 text-purple-600",
  baking: "bg-yellow-50 text-yellow-700",
  ready: "bg-green/10 text-green",
  out_for_delivery: "bg-teal-50 text-teal-600",
  delivered: "bg-green/20 text-green-700",
  cancelled: "bg-red-50 text-red-600",
};

export function AdminOrdersManager({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const matchQuery = `${order.order_number} ${order.customer_name} ${order.customer_phone}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchStatus = statusFilter === "all" || order.status === statusFilter;
        return matchQuery && matchStatus;
      }),
    [orders, query, statusFilter]
  );

  async function update(id: string, status: string) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok) {
      setOrders(orders.map((order) => (order.id === id ? { ...order, status } : order)));
    }
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">
          Order Fulfillment Center
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-navy">Orders</h1>
        <p className="mt-1 text-sm text-muted font-medium">
          {orders.length} total orders in database. Status changes update customer tracking in real-time.
        </p>
      </div>

      {/* Filters Row */}
      <div className="rounded-[24px] bg-white p-5 border border-line/80 shadow-xs flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order number, customer or phone..."
            className="w-full rounded-xl border border-line bg-cream/50 py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", ...statuses.slice(0, 5)].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all capitalize ${
                statusFilter === s
                  ? "bg-navy text-white"
                  : "bg-cream-deep text-muted hover:bg-navy/10"
              }`}
            >
              {s === "all" ? `All (${orders.length})` : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-[28px] bg-white p-5 border border-line/80 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted font-bold">
            <tr>
              <th className="pb-3">Order / Date</th>
              <th className="pb-3">Customer & Address</th>
              <th className="pb-3">Items</th>
              <th className="pb-3">Total</th>
              <th className="pb-3">Payment Method</th>
              <th className="pb-3">Status Control</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filtered.map((order: any) => (
              <tr key={order.id} className="hover:bg-cream/40 transition-colors">
                <td className="py-4">
                  <p className="font-extrabold text-navy font-mono">{order.order_number}</p>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {new Date(order.created_at).toLocaleString("en-PK")}
                  </p>
                </td>
                <td className="py-4">
                  <p className="font-bold text-navy">{order.customer_name}</p>
                  <p className="text-xs text-muted font-medium">{order.customer_phone}</p>
                  <p className="text-xs text-muted max-w-xs truncate">
                    {order.city}, {order.area} – {order.delivery_address}
                  </p>
                </td>
                <td className="py-4 font-semibold text-navy text-center">
                  {order.order_items?.length ?? 0} items
                </td>
                <td className="py-4 font-extrabold text-navy">{formatPKR(order.total)}</td>
                <td className="py-4">
                  <p className="text-xs font-bold text-navy capitalize">
                    {order.payment_method?.replace("_", " ")}
                  </p>
                  <p className="text-[11px] text-orange font-bold">
                    {order.payments?.[0]?.status ?? "—"}
                  </p>
                </td>
                <td className="py-4">
                  <select
                    value={order.status}
                    onChange={(event) => update(order.id, event.target.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border-0 outline-none cursor-pointer capitalize ${
                      statusColors[order.status] ?? "bg-cream-deep text-navy"
                    }`}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-4 text-right">
                  <a
                    href={`/track-order?order=${order.order_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-orange hover:underline"
                  >
                    <Truck size={13} /> Track
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-8 text-center text-sm text-muted">
            No orders match your current search or filter.
          </p>
        )}
      </div>
    </div>
  );
}
