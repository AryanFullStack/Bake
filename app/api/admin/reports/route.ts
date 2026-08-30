import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("date_range") || "last_30_days";

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    const now = new Date();
    let startDate = new Date(now.valueOf() - 30 * 24 * 60 * 60 * 1000);

    if (dateRange === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (dateRange === "yesterday") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    } else if (dateRange === "last_7_days") {
      startDate = new Date(now.valueOf() - 7 * 24 * 60 * 60 * 1000);
    }

    // Fetch orders within date range
    const { data: orders } = await dbClient
      .from("orders")
      .select("*, order_items(*), payments(*), couriers(*)")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    // Fetch custom cake requests
    const { data: customCakes } = await dbClient
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)")
      .gte("created_at", startDate.toISOString());

    // Aggregate sales by date
    const salesByDay: Record<string, { sales: number; count: number }> = {};
    const statusCounts: Record<string, number> = {};
    const paymentStatusCounts: Record<string, number> = {};
    const topProductsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const courierPerformance: Record<string, { name: string; count: number; total: number }> = {};

    let totalSales = 0;
    let totalOrders = orders?.length ?? 0;
    let cancelledCount = 0;

    for (const ord of orders ?? []) {
      const dayKey = new Date(ord.created_at).toISOString().slice(0, 10);
      const ordTotal = Number(ord.total || 0);
      const isLive = !["cancelled", "returned"].includes(ord.status);

      if (!salesByDay[dayKey]) salesByDay[dayKey] = { sales: 0, count: 0 };
      salesByDay[dayKey].count++;

      if (isLive) {
        salesByDay[dayKey].sales += ordTotal;
        totalSales += ordTotal;
      } else {
        cancelledCount++;
      }

      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;

      const pStatus = Array.isArray(ord.payments) ? ord.payments[0]?.status : (ord.payments as any)?.status;
      if (pStatus) {
        paymentStatusCounts[pStatus] = (paymentStatusCounts[pStatus] || 0) + 1;
      }

      if (ord.courier_name) {
        if (!courierPerformance[ord.courier_name]) courierPerformance[ord.courier_name] = { name: ord.courier_name, count: 0, total: 0 };
        courierPerformance[ord.courier_name].count++;
        courierPerformance[ord.courier_name].total += ordTotal;
      }

      for (const item of ord.order_items ?? []) {
        const prodName = item.product_name;
        if (!topProductsMap[prodName]) topProductsMap[prodName] = { name: prodName, quantity: 0, revenue: 0 };
        topProductsMap[prodName].quantity += item.quantity;
        topProductsMap[prodName].revenue += Number(item.line_total || 0);
      }
    }

    const topProducts = Object.values(topProductsMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const courierStats = Object.values(courierPerformance);

    // Custom cake total quoted value
    let customCakeRevenue = 0;
    for (const cake of customCakes ?? []) {
      const q = Array.isArray(cake.custom_cake_quotes) ? cake.custom_cake_quotes[0] : cake.custom_cake_quotes;
      if (q) customCakeRevenue += Number(q.amount || 0);
    }

    return NextResponse.json({
      summary: {
        total_sales: totalSales,
        total_orders: totalOrders,
        cancelled_orders: cancelledCount,
        custom_cake_revenue: customCakeRevenue,
        average_order_value: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
      },
      sales_by_day: salesByDay,
      status_counts: statusCounts,
      payment_status_counts: paymentStatusCounts,
      top_products: topProducts,
      courier_performance: courierStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate report" }, { status: 500 });
  }
}
