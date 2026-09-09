import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const statuses = [
  "submitted",
  "under_review",
  "quotation_prepared",
  "confirmation_required",
  "confirmed",
  "deposit_pending",
  "in_production",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "rejected",
] as const;

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("custom_cake_requests")
      .select("*, custom_cake_quotes(*)", { count: "exact" });

    if (search) {
      query = query.or(`request_number.ilike.%${search}%,customer_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: requests, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch custom cake requests" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(statuses).optional(),
      amount: z.coerce.number().nonnegative().optional(),
      deposit_amount: z.coerce.number().nonnegative().optional(),
      note: z.string().max(500).optional(),
    })
    .safeParse(await request.json());

  if (!parsed.success) return NextResponse.json({ error: "Invalid cake update" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: cake } = await supabase.from("custom_cake_requests").select("status").eq("id", parsed.data.id).single();
  if (!cake) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  if (parsed.data.status && parsed.data.status !== cake.status) {
    const { error } = await supabase.from("custom_cake_requests").update({ status: parsed.data.status }).eq("id", parsed.data.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await supabase.from("custom_cake_status_history").insert({
      request_id: parsed.data.id,
      old_status: cake.status,
      new_status: parsed.data.status,
      note: parsed.data.note ?? null,
      changed_by: admin.user.id,
    });
  }

  if (parsed.data.amount !== undefined) {
    await supabase.from("custom_cake_quotes").upsert(
      {
        request_id: parsed.data.id,
        amount: parsed.data.amount,
        deposit_amount: parsed.data.deposit_amount ?? null,
        note: parsed.data.note ?? null,
        status: "pending",
        created_by: admin.user.id,
      },
      { onConflict: "request_id" }
    );
  }

  return NextResponse.json({ ok: true });
}
