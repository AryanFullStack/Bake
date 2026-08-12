import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const status = searchParams.get("status") || "all";
  const paymentStatus = searchParams.get("payment_status") || "all";
  const paymentMethod = searchParams.get("payment_method") || "all";
  const dateRange = searchParams.get("date_range") || "all";
  const customerType = searchParams.get("customer_type") || "all";
  const sort = searchParams.get("sort") || "created_at_desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));

  const supabase = await createSupabaseServerClient();

  // 1. Calculate overall stats across all orders in database
  const { data: allOrdersForStats } = await supabase
    .from("orders")
    .select("id, total, status, payment_method, created_at, payments(status)");

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  let totalOrdersCount = 0;
  let todayOrdersCount = 0;
  let totalSalesAmount = 0;
  let todaySalesAmount = 0;
  let pendingOrdersCount = 0;
  let confirmedOrdersCount = 0;
  let processingOrdersCount = 0;
  let shippedOrdersCount = 0;
  let deliveredOrdersCount = 0;
  let cancelledOrdersCount = 0;
  let returnedOrdersCount = 0;
  let pendingPaymentsCount = 0;

  if (allOrdersForStats) {
    totalOrdersCount = allOrdersForStats.length;
    for (const ord of allOrdersForStats) {
      const ordTotal = Number(ord.total || 0);
      const isLive = !["cancelled", "returned"].includes(ord.status);
      const isToday = ord.created_at >= startOfToday;

      if (isToday) todayOrdersCount++;
      if (isLive) {
        totalSalesAmount += ordTotal;
        if (isToday) todaySalesAmount += ordTotal;
      }

      if (["placed", "confirmed", "processing", "baking", "ready"].includes(ord.status)) pendingOrdersCount++;
      if (ord.status === "confirmed") confirmedOrdersCount++;
      if (["processing", "baking", "ready"].includes(ord.status)) processingOrdersCount++;
      if (ord.status === "out_for_delivery") shippedOrdersCount++;
      if (ord.status === "delivered") deliveredOrdersCount++;
      if (ord.status === "cancelled") cancelledOrdersCount++;
      if (ord.status === "returned") returnedOrdersCount++;

      const pStatus = ord.payments?.[0]?.status;
      if (pStatus === "pending" || pStatus === "pending_verification") {
        pendingPaymentsCount++;
      }
    }
  }

  const averageOrderValue = totalOrdersCount > 0 ? Math.round(totalSalesAmount / totalOrdersCount) : 0;

  // 2. Build filtered query for table display
  let query = supabase
    .from("orders")
    .select("*, order_items(*), payments(*), order_status_history(*, profiles(full_name, role)), couriers(*)", { count: "exact" });

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,customer_email.ilike.%${search}%,tracking_number.ilike.%${search}%`
    );
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (paymentMethod !== "all") {
    query = query.eq("payment_method", paymentMethod);
  }

  if (customerType === "registered") {
    query = query.not("user_id", "is", null);
  } else if (customerType === "guest") {
    query = query.is("user_id", null);
  }

  if (dateRange === "today") {
    query = query.gte("created_at", startOfToday);
  } else if (dateRange === "yesterday") {
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
    query = query.gte("created_at", yesterday).lt("created_at", startOfToday);
  } else if (dateRange === "last_7_days") {
    const last7 = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", last7);
  } else if (dateRange === "last_30_days") {
    const last30 = new Date(now.valueOf() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", last30);
  }

  if (sort === "created_at_asc") {
    query = query.order("created_at", { ascending: true });
  } else if (sort === "total_desc") {
    query = query.order("total", { ascending: false });
  } else if (sort === "total_asc") {
    query = query.order("total", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data: rawOrders, count: totalCount, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Post-filter payment status if filter specified
  let orders = rawOrders ?? [];
  if (paymentStatus !== "all") {
    orders = orders.filter((o: any) => o.payments?.[0]?.status === paymentStatus);
  }

  return NextResponse.json({
    orders,
    total_count: totalCount ?? orders.length,
    page,
    limit,
    stats: {
      total_orders: totalOrdersCount,
      today_orders: todayOrdersCount,
      total_sales: totalSalesAmount,
      today_sales: todaySalesAmount,
      pending_orders: pendingOrdersCount,
      confirmed_orders: confirmedOrdersCount,
      processing_orders: processingOrdersCount,
      shipped_orders: shippedOrdersCount,
      delivered_orders: deliveredOrdersCount,
      cancelled_orders: cancelledOrdersCount,
      returned_orders: returnedOrdersCount,
      pending_payments: pendingPaymentsCount,
      average_order_value: averageOrderValue,
    },
  });
}

const bulkActionSchema = z.object({
  action: z.enum(["bulk_status", "bulk_courier", "bulk_payment_status"]),
  order_ids: z.array(z.string().uuid()).min(1),
  status: z.enum(["placed", "confirmed", "processing", "baking", "ready", "out_for_delivery", "delivered", "cancelled", "returned"]).optional(),
  courier_id: z.string().optional(),
  payment_status: z.enum(["pending", "pending_verification", "paid", "failed", "refunded"]).optional(),
  note: z.string().optional(),
});

export async function PATCH(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();

    // If single order update payload passed (legacy support)
    if (body.id && !body.action) {
      const supabase = await createSupabaseServerClient();
      const { data: order } = await supabase.from("orders").select("status").eq("id", body.id).single();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

      if (body.status && body.status !== order.status) {
        await supabase.from("orders").update({ status: body.status }).eq("id", body.id);
        await supabase.from("order_status_history").insert({
          order_id: body.id,
          old_status: order.status,
          new_status: body.status,
          note: body.note ?? null,
          changed_by: admin.user.id,
        });
      }
      if (body.payment_status) {
        await supabase.from("payments").update({
          status: body.payment_status,
          verified_by: body.payment_status === "paid" ? admin.user.id : null,
          verified_at: body.payment_status === "paid" ? new Date().toISOString() : null,
        }).eq("order_id", body.id);
      }
      return NextResponse.json({ ok: true });
    }

    // Bulk actions
    const parsed = bulkActionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid bulk update" }, { status: 400 });

    const supabase = await createSupabaseServerClient();

    if (parsed.data.action === "bulk_status" && parsed.data.status) {
      for (const orderId of parsed.data.order_ids) {
        const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).single();
        if (current) {
          await supabase.from("orders").update({ status: parsed.data.status }).eq("id", orderId);
          await supabase.from("order_status_history").insert({
            order_id: orderId,
            old_status: current.status,
            new_status: parsed.data.status,
            note: parsed.data.note || `Bulk status update to ${parsed.data.status.replace("_", " ")}`,
            changed_by: admin.user.id,
          });
        }
      }
    } else if (parsed.data.action === "bulk_courier" && parsed.data.courier_id) {
      const { data: courier } = await supabase.from("couriers").select("name").eq("id", parsed.data.courier_id).single();
      await supabase.from("orders").update({
        courier_id: parsed.data.courier_id,
        courier_name: courier?.name || null,
      }).in("id", parsed.data.order_ids);
    } else if (parsed.data.action === "bulk_payment_status" && parsed.data.payment_status) {
      await supabase.from("payments").update({
        status: parsed.data.payment_status,
        verified_by: parsed.data.payment_status === "paid" ? admin.user.id : null,
        verified_at: parsed.data.payment_status === "paid" ? new Date().toISOString() : null,
      }).in("order_id", parsed.data.order_ids);
    }

    return NextResponse.json({ ok: true, updated_count: parsed.data.order_ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Bulk update failed" }, { status: 500 });
  }
}
