"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, Download, Calendar, TrendingUp, Package, Truck, DollarSign, RefreshCcw } from "lucide-react";
import { formatPKR } from "@/lib/catalog";

export function AdminReportsManager() {
  const [dateRange, setDateRange] = useState("last_30_days");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?date_range=${dateRange}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ["Report Type", "Metric / Product", "Count / Quantity", "Sales Value (PKR)"],
      ["Summary", "Total Sales", data.summary.total_orders, data.summary.total_sales],
      ["Summary", "Custom Cake Quoted Sales", "-", data.summary.custom_cake_revenue],
      ["Summary", "Average Order Value", "-", data.summary.average_order_value],
      ...data.top_products.map((p: any) => ["Top Product", `"${p.name}"`, p.quantity, p.revenue]),
      ...data.courier_performance.map((c: any) => ["Courier Performance", `"${c.name}"`, c.count, c.total]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `BakeMart_Business_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-6 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange flex items-center gap-1.5">
            <BarChart3 size={14} /> Executive Analytics
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">Business Reports & Sales Intelligence</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
            Real-time analytics for sales, top products, courier dispatch performance, and custom cakes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-bold text-navy outline-none"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
          </select>

          <button
            onClick={exportCSV}
            disabled={!data}
            className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-orange-dark disabled:opacity-50"
          >
            <Download size={14} /> Export Report CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Period Sales Revenue</p>
          <p className="mt-1 font-display text-2xl font-bold text-orange">{formatPKR(data?.summary?.total_sales ?? 0)}</p>
          <p className="text-xs text-muted mt-1">{data?.summary?.total_orders ?? 0} total orders</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Average Order Value</p>
          <p className="mt-1 font-display text-2xl font-bold text-navy">{formatPKR(data?.summary?.average_order_value ?? 0)}</p>
          <p className="text-xs text-muted mt-1">Per transaction average</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Custom Cake Sales</p>
          <p className="mt-1 font-display text-2xl font-bold text-green-700">{formatPKR(data?.summary?.custom_cake_revenue ?? 0)}</p>
          <p className="text-xs text-muted mt-1">Quoted studio sales</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Cancelled Orders</p>
          <p className="mt-1 font-display text-2xl font-bold text-red-600">{data?.summary?.cancelled_orders ?? 0}</p>
          <p className="text-xs text-muted mt-1">Voided transactions</p>
        </div>
      </div>

      {/* Main Grid: Top Selling Products & Courier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="p-6 rounded-2xl bg-white border border-line/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <Package size={16} className="text-orange" /> Top 10 Bestselling Products
          </h3>
          <div className="divide-y divide-line/60">
            {data?.top_products?.map((p: any, idx: number) => (
              <div key={p.name} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-cream-deep grid place-items-center font-bold text-navy text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-navy">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-navy">{formatPKR(p.revenue)}</p>
                  <p className="text-[11px] text-muted">{p.quantity} units sold</p>
                </div>
              </div>
            ))}
            {!data?.top_products?.length && (
              <p className="p-6 text-center text-xs text-muted">No product sales recorded in period.</p>
            )}
          </div>
        </div>

        {/* Courier Performance */}
        <div className="p-6 rounded-2xl bg-white border border-line/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <Truck size={16} className="text-orange" /> Courier Fulfillment Breakdown
          </h3>
          <div className="divide-y divide-line/60">
            {data?.courier_performance?.map((c: any) => (
              <div key={c.name} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-navy">{c.name}</p>
                  <p className="text-[11px] text-muted">{c.count} dispatches handled</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-navy">{formatPKR(c.total)}</p>
                </div>
              </div>
            ))}
            {!data?.courier_performance?.length && (
              <p className="p-6 text-center text-xs text-muted">No courier dispatches recorded in period.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
