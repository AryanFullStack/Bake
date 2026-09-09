import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at", { count: "exact" });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq("role", role);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: profiles, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const profileIds = (profiles || []).map((p) => p.id);

    // Fetch order totals for these profiles
    const totalsMap = new Map<string, { orders: number; spent: number }>();
    if (profileIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("user_id, total")
        .in("user_id", profileIds);

      for (const order of orders ?? []) {
        if (!order.user_id) continue;
        const current = totalsMap.get(order.user_id) ?? { orders: 0, spent: 0 };
        current.orders += 1;
        current.spent += Number(order.total || 0);
        totalsMap.set(order.user_id, current);
      }
    }

    // Fetch emails from auth admin if available
    const emailsMap = new Map<string, string>();
    const authAdmin = createSupabaseAdminClient();
    if (authAdmin && profileIds.length > 0) {
      try {
        const { data } = await authAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        for (const u of data.users) {
          if (u.email) emailsMap.set(u.id, u.email);
        }
      } catch {
        // ignore auth error
      }
    }

    const customers = (profiles || []).map((profile) => ({
      ...profile,
      email: emailsMap.get(profile.id),
      orders: totalsMap.get(profile.id)?.orders ?? 0,
      spent: totalsMap.get(profile.id)?.spent ?? 0,
    }));

    return NextResponse.json({
      success: true,
      customers,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch customers" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = z
    .object({
      id: z.string().uuid(),
      role: z.enum(["customer", "admin", "manager", "fulfilment"]),
    })
    .safeParse(await request.json());

  if (!parsed.success) return NextResponse.json({ error: "Invalid customer update" }, { status: 400 });

  const adminClient = createSupabaseAdminClient();
  const db = adminClient ?? (await createSupabaseServerClient());

  const { error } = await db.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (adminClient) {
    try {
      await adminClient.auth.admin.updateUserById(parsed.data.id, {
        user_metadata: { role: parsed.data.role },
        app_metadata: { role: parsed.data.role },
      });
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true });
}
