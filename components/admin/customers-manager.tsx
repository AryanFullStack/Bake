"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/catalog";
import { ShieldCheck, User } from "lucide-react";

const roleColors: Record<string, string> = {
  customer: "bg-cream-deep text-navy",
  fulfilment: "bg-blue-50 text-blue-700",
  manager: "bg-purple-50 text-purple-700",
  admin: "bg-orange/10 text-orange",
};

export function AdminCustomersManager({ initialCustomers }: { initialCustomers: any[] }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");

  const filtered = query
    ? customers.filter((c) =>
        `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  async function update(id: string, role: string) {
    const response = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    if (response.ok) {
      setCustomers(customers.map((customer) => (customer.id === id ? { ...customer, role } : customer)));
    }
  }

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-orange">Customer Database</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-navy">Customers</h1>
        <p className="mt-1 text-sm text-muted font-medium">
          {customers.length} registered profiles · Guest order customers are visible in Orders
        </p>
      </div>

      {/* Search */}
      <div className="rounded-[24px] bg-white p-5 border border-line/80 shadow-xs">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone..."
          className="w-full max-w-sm rounded-xl border border-line bg-cream/50 px-4 py-2.5 text-sm font-medium outline-none focus:border-orange focus:bg-white transition-colors"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-[28px] bg-white p-5 border border-line/80 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted font-bold">
            <tr>
              <th className="pb-3">Customer</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3 text-center">Orders</th>
              <th className="pb-3">Total Spent</th>
              <th className="pb-3">Joined</th>
              <th className="pb-3">Role</th>
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
                      <p className="font-bold text-navy">{customer.full_name || "Unnamed"}</p>
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
                      onChange={(event) => update(customer.id, event.target.value)}
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
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && (
          <p className="p-8 text-center text-sm text-muted">
            No customers match your search.
          </p>
        )}
      </div>
    </div>
  );
}
