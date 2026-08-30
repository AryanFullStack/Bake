import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const phone = searchParams.get("phone");

    if (!userId && !phone) {
      return NextResponse.json({ error: "User ID or phone is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    let profile: any = null;
    if (userId) {
      const { data } = await dbClient.from("profiles").select("*").eq("id", userId).maybeSingle();
      profile = data;
    }

    // Fetch saved addresses
    let addresses: any[] = [];
    if (userId) {
      const { data: addrs } = await dbClient.from("addresses").select("*").eq("user_id", userId);
      addresses = addrs ?? [];
    }

    // Fetch customer orders
    let ordersQuery = dbClient.from("orders").select("*, order_items(*), payments(*)");
    if (userId) {
      ordersQuery = ordersQuery.eq("user_id", userId);
    } else if (phone) {
      ordersQuery = ordersQuery.eq("customer_phone", phone.replace(/\s+/g, ""));
    }

    const { data: orders } = await ordersQuery.order("created_at", { ascending: false });

    // Fetch customer custom cake requests
    let customQuery = dbClient.from("custom_cake_requests").select("*, custom_cake_quotes(*)");
    if (userId) {
      customQuery = customQuery.eq("user_id", userId);
    } else if (phone) {
      customQuery = customQuery.eq("phone", phone.replace(/\s+/g, ""));
    }

    const { data: customCakes } = await customQuery.order("created_at", { ascending: false });

    const totalSpent = (orders ?? [])
      .filter((o) => !["cancelled", "returned"].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const pendingBalance = (orders ?? [])
      .filter((o) => {
        const pStat = Array.isArray(o.payments) ? o.payments[0]?.status : (o.payments as any)?.status;
        return pStat === "pending" || pStat === "pending_verification";
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return NextResponse.json({
      profile,
      addresses,
      orders: orders ?? [],
      custom_cakes: customCakes ?? [],
      stats: {
        total_orders: orders?.length ?? 0,
        total_spent: totalSpent,
        pending_balance: pendingBalance,
        cancelled_orders: orders?.filter((o) => o.status === "cancelled").length ?? 0,
        returned_orders: orders?.filter((o) => o.status === "returned").length ?? 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch customer profile" }, { status: 500 });
  }
}
