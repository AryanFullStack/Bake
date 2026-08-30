"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/catalog";
import { ShieldCheck, User, Eye, Plus, MapPin, ShoppingBag, Cake, Clock, X, ChevronRight } from "lucide-react";
import { CreateOrderModal } from "./create-order-modal";

const roleColors: Record<string, string> = {
  customer: "bg-cream-deep text-navy",
  fulfilment: "bg-blue-50 text-blue-700",
  manager: "bg-purple-50 text-purple-700",
  admin: "bg-orange/10 text-orange",
};

export function AdminCustomersManager({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");

  const [activeCustomerDrawer, setActiveCustomerDrawer] = useState<any | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [prefilledCustomerForOrder, setPrefilledCustomerForOrder] = useState<any | null>(null);

  const filtered = query
    ? customers.filter((c) =>
        `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  async function updateRole(id: string, role: string) {
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (response.ok) {
      setCustomers(customers.map((c) => (c.id === id ? { ...c, role } : c)));
    }
  }

  async function openProfileDrawer(customer: any) {
    setActiveCustomerDrawer(customer);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/customers/details?user_id=${customer.id}`);
      const data = await res.json();
      setCustomerDetails(data);
    } catch {
      // ignore
    } finally {
      setLoadingDetails(false);
    }
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange">Customer Database</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-navy">Customers</h1>
          <p className="mt-1 text-sm text-muted font-medium">
            {customers.length} registered profiles · View customer spending, saved addresses & order history.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-[24px] bg-white p-5 border border-line/80 shadow-xs">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer name, email or phone number..."
          className="w-full max-w-sm rounded-xl border border-line bg-cream/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-[28px] bg-white p-5 border border-line/80 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted font-bold">
            <tr>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3 text-center">Total Orders</th>
              <th className="pb-3">Total Spent</th>
              <th className="pb-3">Joined Date</th>
              <th className="pb-3">Role</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {filtered.map((customer: any) => (
              <tr key={customer.id} className="hover:bg-cream/40 transition-colors">
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-navy/10 grid place-items-center shrink-0">
                      <User size={16} className="text-navy/60" />
                    </div>
                    <div>
                      <button
                        onClick={() => openProfileDrawer(customer)}
                        className="font-bold text-navy hover:text-orange text-left"
                      >
                        {customer.full_name || "Unnamed Customer"}
                      </button>
                      <p className="text-xs text-muted">{customer.email ?? "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-muted font-medium text-sm">{customer.phone ?? "—"}</td>
                <td className="py-4 text-center font-extrabold text-navy">{customer.orders}</td>
                <td className="py-4 font-extrabold text-navy">{formatPKR(customer.spent)}</td>
                <td className="py-4 text-xs text-muted font-medium">
                  {new Date(customer.created_at).toLocaleDateString("en-PK")}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    {customer.role === "admin" && <ShieldCheck size={14} className="text-orange" />}
                    <select
                      value={customer.role}
                      onChange={(e) => updateRole(customer.id, e.target.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold border-0 outline-none cursor-pointer capitalize ${
                        roleColors[customer.role] ?? "bg-cream-deep text-navy"
                      }`}
                    >
                      <option value="customer">Customer</option>
                      <option value="fulfilment">Fulfilment</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => openProfileDrawer(customer)}
                    className="p-2 rounded-xl border border-line text-muted hover:text-navy hover:bg-cream transition-colors"
                    title="View Customer Profile"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-8 text-center text-sm text-muted">
            No customers match your search criteria.
          </p>
        )}
      </div>

      {/* Customer Profile Drawer */}
      {activeCustomerDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-navy/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-6 flex flex-col gap-6 animate-in slide-in-from-right duration-200">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange">Customer Admin Profile</span>
                <h2 className="text-xl font-bold text-navy font-display">{activeCustomerDrawer.full_name || "Customer Profile"}</h2>
              </div>
              <button
                onClick={() => {
                  setActiveCustomerDrawer(null);
                  setCustomerDetails(null);
                }}
                className="p-2 rounded-xl border border-line text-muted hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-12 text-center text-sm text-muted font-medium">Loading customer data...</div>
            ) : customerDetails ? (
              <div className="space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 bg-cream/40 p-4 rounded-2xl border border-line">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Total Orders</span>
                    <span className="text-lg font-extrabold text-navy">{customerDetails.stats.total_orders}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Lifetime Spent</span>
                    <span className="text-lg font-extrabold text-orange">{formatPKR(customerDetails.stats.total_spent)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Pending Balance</span>
                    <span className="text-lg font-extrabold text-blue-600">{formatPKR(customerDetails.stats.pending_balance)}</span>
                  </div>
                </div>

                {/* Create Order Action */}
                <button
                  onClick={() => {
                    setPrefilledCustomerForOrder(activeCustomerDrawer);
                    setActiveCustomerDrawer(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-dark"
                >
                  <Plus size={15} /> Create Manual Order for this Customer
                </button>

                {/* Saved Addresses */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <MapPin size={14} className="text-orange" /> Saved Delivery Addresses ({customerDetails.addresses?.length ?? 0})
                  </h3>
                  <div className="space-y-2">
                    {customerDetails.addresses?.map((addr: any) => (
                      <div key={addr.id} className="p-3.5 rounded-xl border border-line bg-white text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-navy">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full border border-green/20">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-muted font-medium">{addr.address}</p>
                        <p className="text-muted text-[11px]">Area: <strong className="text-navy">{addr.area}</strong> • City: <strong className="text-navy">{addr.city}</strong></p>
                      </div>
                    ))}
                    {!customerDetails.addresses?.length && (
                      <p className="text-xs text-muted">No saved addresses on profile.</p>
                    )}
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-orange" /> Order History ({customerDetails.orders?.length ?? 0})
                  </h3>
                  <div className="divide-y divide-line/60 rounded-xl border border-line bg-white overflow-hidden text-xs">
                    {customerDetails.orders?.map((ord: any) => (
                      <div key={ord.id} className="p-3 flex items-center justify-between hover:bg-cream/20">
                        <div>
                          <p className="font-mono font-bold text-navy">{ord.order_number}</p>
                          <p className="text-[11px] text-muted">{new Date(ord.created_at).toLocaleDateString("en-PK")}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-navy">{formatPKR(ord.total)}</p>
                          <span className="text-[10px] font-bold uppercase text-orange">{ord.status.replace(/_/g, " ")}</span>
                        </div>
                      </div>
                    ))}
                    {!customerDetails.orders?.length && (
                      <p className="p-4 text-center text-xs text-muted">No orders found.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Prefilled Create Order Modal */}
      {prefilledCustomerForOrder && (
        <CreateOrderModal
          couriers={[]}
          onClose={() => setPrefilledCustomerForOrder(null)}
          onSuccess={() => setPrefilledCustomerForOrder(null)}
        />
      )}
    </div>
  );
}
