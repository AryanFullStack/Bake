"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  ArrowRight, CheckSquare, ChevronLeft, ChevronRight, Download, Filter, Plus,
  Printer, RefreshCcw, Search, ShoppingBag, Truck, X, Eye, Edit3, DollarSign, Clock, AlertCircle
} from "lucide-react";
import { formatPKR } from "@/lib/catalog";
import { AdminOrder, Courier, OrderStatus, PaymentStatus } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { OrderDetailsModal } from "./order-details-modal";
import { CreateOrderModal } from "./create-order-modal";
import { EditOrderModal } from "./edit-order-modal";
import { OrderInvoice } from "./order-invoice";
import { CourierManagerModal } from "./courier-manager-modal";
import { PaginationControls } from "@/components/pagination";

const statusColors: Record<string, string> = {
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

export function AdminOrdersManager({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [couriers, setCouriers] = useState<Courier[]>([]);

  const initialStats = useMemo(() => {
    if (!initialOrders || !initialOrders.length) return null;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    let totalOrders = initialOrders.length;
    let todayOrders = 0;
    let totalSales = 0;
    let todaySales = 0;
    let pendingOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;
    let pendingPayments = 0;

    for (const ord of initialOrders) {
      const ordTotal = Number(ord.total || 0);
      const isLive = !["cancelled", "returned"].includes(ord.status);
      const isToday = new Date(ord.created_at) >= startOfToday;

      if (isToday) todayOrders++;
      if (isLive) {
        totalSales += ordTotal;
        if (isToday) todaySales += ordTotal;
      }

      if (["placed", "confirmed", "processing", "baking", "ready"].includes(ord.status)) pendingOrders++;
      if (ord.status === "out_for_delivery") shippedOrders++;
      if (ord.status === "delivered") deliveredOrders++;

      const pStatus = Array.isArray(ord.payments) ? ord.payments[0]?.status : ord.payments?.status;
      if (pStatus === "pending" || pStatus === "pending_verification") pendingPayments++;
    }

    return {
      total_orders: totalOrders,
      today_orders: todayOrders,
      total_sales: totalSales,
      today_sales: todaySales,
      pending_orders: pendingOrders,
      shipped_orders: shippedOrders,
      delivered_orders: deliveredOrders,
      pending_payments: pendingPayments,
    };
  }, [initialOrders]);

  const [stats, setStats] = useState<any>(initialStats);
  const [totalCount, setTotalCount] = useState(initialOrders.length);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("created_at_desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, paymentStatusFilter, paymentMethodFilter, dateRangeFilter, customerTypeFilter, sortOption]);

  // Selection & Bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [bulkCourierId, setBulkCourierId] = useState("");
  const [performingBulk, setPerformingBulk] = useState(false);

  // Active Modals
  const [activeOrderDetails, setActiveOrderDetails] = useState<AdminOrder | null>(null);
  const [activeEditOrder, setActiveEditOrder] = useState<AdminOrder | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<AdminOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);

  // Fetch Couriers
  const fetchCouriers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/couriers");
      const data = await res.json();
      if (data.couriers) setCouriers(data.couriers);
    } catch {
      // ignore
    }
  }, []);

  // Fetch Orders & Stats from real database
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: query,
        status: statusFilter,
        payment_status: paymentStatusFilter,
        payment_method: paymentMethodFilter,
        date_range: dateRangeFilter,
        customer_type: customerTypeFilter,
        sort: sortOption,
        page: String(page),
        limit: String(pageSize),
      });

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
        setTotalCount(data.total_count ?? data.orders.length);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter, paymentStatusFilter, paymentMethodFilter, dateRangeFilter, customerTypeFilter, sortOption, page, pageSize]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime Supabase listener for new/updated orders
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("admin_orders_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Toggle selection
  function toggleSelectAll() {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Bulk Actions execution
  async function executeBulkStatus() {
    if (!selectedIds.length) return;
    setPerformingBulk(true);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_status",
          order_ids: selectedIds,
          status: bulkStatus,
        }),
      });
      setSelectedIds([]);
      fetchOrders();
    } catch {
      // ignore
    } finally {
      setPerformingBulk(false);
    }
  }

  async function executeBulkCourier() {
    if (!selectedIds.length || !bulkCourierId) return;
    setPerformingBulk(true);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_courier",
          order_ids: selectedIds,
          courier_id: bulkCourierId,
        }),
      });
      setSelectedIds([]);
      fetchOrders();
    } catch {
      // ignore
    } finally {
      setPerformingBulk(false);
    }
  }

  function exportSelectedCSV() {
    const selectedOrders = orders.filter((o) => selectedIds.includes(o.id));
    const csvRows = [
      ["Order Number", "Date", "Customer Name", "Phone", "Email", "City", "Area", "Items Count", "Total", "Payment Method", "Status", "Courier", "Tracking Number"],
      ...selectedOrders.map((o) => [
        o.order_number,
        new Date(o.created_at).toISOString(),
        `"${o.customer_name}"`,
        `"${o.customer_phone}"`,
        `"${o.customer_email || ""}"`,
        `"${o.city}"`,
        `"${o.area}"`,
        o.order_items?.length ?? 0,
        o.total,
        o.payment_method,
        o.status,
        `"${o.courier_name || ""}"`,
        `"${o.tracking_number || ""}"`,
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BakeMart_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-4 sm:p-6 md:p-10 flex flex-col gap-6 min-w-0 overflow-x-hidden">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange flex items-center gap-1.5">
            <ShoppingBag size={14} /> Database Order Management
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-4xl font-bold text-navy">Order Operations Hub</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted font-medium">
            Real-time synchronization with checkout. Total {totalCount} orders recorded in Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCourierModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-extrabold text-navy hover:border-orange hover:text-orange shadow-xs transition-all"
          >
            <Truck size={15} className="text-orange" /> Manage Couriers
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-xs font-extrabold text-white hover:bg-orange-dark shadow-md active:scale-95 transition-all"
          >
            <Plus size={15} /> Create Manual Order
          </button>
        </div>
      </div>

      {/* KPI Business Statistics Cards (12 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Total Sales</p>
          <p className="mt-1 font-display text-xl font-bold text-orange">{formatPKR(stats?.total_sales ?? 0)}</p>
          <p className="text-[11px] text-muted">{stats?.total_orders ?? 0} total orders</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Total Orders</p>
          <p className="mt-1 font-display text-xl font-bold text-navy">{stats?.total_orders ?? 0}</p>
          <p className="text-[11px] text-muted">All-time count</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Today's Sales</p>
          <p className="mt-1 font-display text-xl font-bold text-navy">{formatPKR(stats?.today_sales ?? 0)}</p>
          <p className="text-[11px] text-muted">{stats?.today_orders ?? 0} orders today</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Today's Orders</p>
          <p className="mt-1 font-display text-xl font-bold text-orange">{stats?.today_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Placed today</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Pending Orders</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-600">{stats?.pending_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Placed, Confirmed</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Processing</p>
          <p className="mt-1 font-display text-xl font-bold text-purple-600">{stats?.processing_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Baking / Preparing</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Ready Orders</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-600">{stats?.ready_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Packed & Ready</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Out For Delivery</p>
          <p className="mt-1 font-display text-xl font-bold text-teal-600">{stats?.shipped_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Active dispatches</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Delivered</p>
          <p className="mt-1 font-display text-xl font-bold text-green-700">{stats?.delivered_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Fulfilled successfully</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Cancelled</p>
          <p className="mt-1 font-display text-xl font-bold text-red-600">{stats?.cancelled_orders ?? 0}</p>
          <p className="text-[11px] text-muted">Voided / Returned</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Pending Payments</p>
          <p className="mt-1 font-display text-xl font-bold text-blue-600">{stats?.pending_payments ?? 0}</p>
          <p className="text-[11px] text-muted">Awaiting verification</p>
        </div>

        <div className="rounded-2xl bg-white p-4 border border-line/80 shadow-xs">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Refunded Amount</p>
          <p className="mt-1 font-display text-xl font-bold text-red-700">{formatPKR(stats?.refunded_amount ?? 0)}</p>
          <p className="text-[11px] text-muted">Cancelled orders value</p>
        </div>
      </div>

      {/* 0-Item Corrupted Records Warning Banner */}
      {orders.some(o => !o.order_items || o.order_items.length === 0) && (
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-amber-950">Data Integrity Notice — Corrupted Order Items Detected</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {orders.filter(o => !o.order_items || o.order_items.length === 0).length} existing historical order(s) (e.g. BM-15202, BM-33412) contain total amounts but missing item details due to legacy order creation errors. Total financial statistics remain 100% accurate. New order creation has been secured with atomic database transactions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: Search, Filter Tabs & Dropdowns */}
      <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs flex flex-col gap-4">
        {/* Search & Top Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search Order #, Customer Name, Phone, Email, Tracking CN..."
              className="w-full rounded-xl border border-line bg-cream/50 py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-orange focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none capitalize text-navy"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={dateRangeFilter}
              onChange={(e) => {
                setDateRangeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold outline-none text-navy"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
            </select>

            <button
              onClick={() => fetchOrders()}
              className="p-2.5 rounded-xl border border-line bg-cream/50 hover:bg-cream text-navy"
              title="Refresh Orders"
            >
              <RefreshCcw size={15} className={loading ? "animate-spin text-orange" : ""} />
            </button>
          </div>
        </div>

        {/* Order Status Tabs */}
        <div className="flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === "all" ? "bg-navy text-white shadow-xs" : "bg-cream/60 text-muted hover:bg-cream hover:text-navy"
            }`}
          >
            All ({stats?.total_orders ?? totalCount})
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all capitalize ${
                statusFilter === s ? "bg-navy text-white shadow-xs" : "bg-cream/60 text-muted hover:bg-cream hover:text-navy"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Bar (Visible when orders selected) */}
      {selectedIds.length > 0 && (
        <div className="rounded-2xl bg-navy text-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckSquare size={18} className="text-orange" />
            <span className="text-xs font-bold">{selectedIds.length} orders selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Status */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white capitalize outline-none"
              >
                {statuses.map((s) => (
                  <option key={s} value={s} className="text-navy">
                    Status: {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <button
                onClick={executeBulkStatus}
                disabled={performingBulk}
                className="rounded-xl bg-orange px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-dark"
              >
                Apply Status
              </button>
            </div>

            {/* Bulk Courier */}
            <div className="flex items-center gap-1.5">
              <select
                value={bulkCourierId}
                onChange={(e) => setBulkCourierId(e.target.value)}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white outline-none"
              >
                <option value="" className="text-navy">Assign Courier...</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id} className="text-navy">
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={executeBulkCourier}
                disabled={performingBulk || !bulkCourierId}
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30"
              >
                Assign
              </button>
            </div>

            {/* CSV Export */}
            <button
              onClick={exportSelectedCSV}
              className="inline-flex items-center gap-1 rounded-xl bg-white text-navy px-3 py-1.5 text-xs font-bold hover:bg-cream"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-2xl bg-white p-5 border border-line/80 shadow-xs overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-xs">
          <thead className="border-b border-line text-[10px] uppercase tracking-wider text-muted font-bold">
            <tr>
              <th className="pb-3 w-8">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedIds.length === orders.length}
                  onChange={toggleSelectAll}
                  className="rounded border-line text-orange focus:ring-orange cursor-pointer"
                />
              </th>
              <th className="pb-3">Order # & Date</th>
              <th className="pb-3">Customer & Destination</th>
              <th className="pb-3 text-center">Items</th>
              <th className="pb-3">Total Amount</th>
              <th className="pb-3">Payment Method & Status</th>
              <th className="pb-3">Order Status</th>
              <th className="pb-3">Courier & Tracking</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {orders.map((order) => {
              const isSelected = selectedIds.includes(order.id);
              const paymentRec = order.payments?.[0];

              return (
                <tr key={order.id} className={`hover:bg-cream/40 transition-colors ${isSelected ? "bg-orange/5" : ""}`}>
                  <td className="py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(order.id)}
                      className="rounded border-line text-orange focus:ring-orange cursor-pointer"
                    />
                  </td>

                  <td className="py-4">
                    <button
                      onClick={() => setActiveOrderDetails(order)}
                      className="font-extrabold text-navy font-mono text-xs hover:text-orange hover:underline text-left"
                    >
                      {order.order_number}
                    </button>
                    <p className="text-[11px] text-muted font-medium mt-0.5">
                      {new Date(order.created_at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </td>

                  <td className="py-4">
                    <p className="font-bold text-navy text-xs">{order.customer_name}</p>
                    <p className="text-[11px] text-muted font-medium">{order.customer_phone}</p>
                    <p className="text-[11px] text-muted max-w-xs truncate">
                      {order.city}, {order.area}
                    </p>
                  </td>

                  <td className="py-4 text-center font-bold text-navy">
                    {order.order_items?.length ?? 0}
                  </td>

                  <td className="py-4 font-extrabold text-navy">
                    {formatPKR(order.total)}
                  </td>

                  <td className="py-4">
                    <p className="font-bold text-navy capitalize text-[11px]">
                      {order.payment_method.replace(/_/g, " ")}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-extrabold text-orange uppercase tracking-wider">
                      {paymentRec?.status || "pending"}
                    </span>
                  </td>

                  <td className="py-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border capitalize ${statusColors[order.status]}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>

                  <td className="py-4">
                    {order.courier_name ? (
                      <div>
                        <p className="font-bold text-navy text-[11px]">{order.courier_name}</p>
                        <p className="font-mono text-[10px] text-muted font-semibold">{order.tracking_number || "No CN"}</p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted font-medium">Unassigned</span>
                    )}
                  </td>

                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActiveOrderDetails(order)}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-navy hover:bg-cream"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setActiveInvoiceOrder(order)}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-orange hover:bg-cream"
                        title="Print Invoice"
                      >
                        <Printer size={14} />
                      </button>
                      <button
                        onClick={() => setActiveEditOrder(order)}
                        className="p-1.5 rounded-lg border border-line text-muted hover:text-navy hover:bg-cream"
                        title="Edit Order"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!orders.length && !loading && (
          <div className="p-12 text-center text-sm text-muted space-y-2">
            <p className="font-bold text-navy">No orders match your current criteria.</p>
            <p className="text-xs">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {/* Pagination Bar */}
        <PaginationControls
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalCount}
          itemLabel="orders"
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          pageSizeOptions={[10, 15, 25, 50, 100]}
          className="mt-4"
        />
      </div>

      {/* Sub Modals */}
      {activeOrderDetails && (
        <OrderDetailsModal
          order={activeOrderDetails}
          couriers={couriers}
          onClose={() => setActiveOrderDetails(null)}
          onRefresh={() => {
            fetchOrders();
            if (activeOrderDetails) {
              fetch(`/api/admin/orders/${activeOrderDetails.id}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.order) setActiveOrderDetails(data.order);
                });
            }
          }}
          onOpenInvoice={(o) => setActiveInvoiceOrder(o)}
          onOpenEdit={(o) => setActiveEditOrder(o)}
        />
      )}

      {activeInvoiceOrder && (
        <OrderInvoice
          order={activeInvoiceOrder}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}

      {activeEditOrder && (
        <EditOrderModal
          order={activeEditOrder}
          couriers={couriers}
          onClose={() => setActiveEditOrder(null)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {showCreateModal && (
        <CreateOrderModal
          couriers={couriers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => fetchOrders()}
        />
      )}

      {showCourierModal && (
        <CourierManagerModal
          couriers={couriers}
          onClose={() => setShowCourierModal(false)}
          onRefresh={() => fetchCouriers()}
        />
      )}
    </div>
  );
}
