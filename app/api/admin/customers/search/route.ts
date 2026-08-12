import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, role, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Optionally fetch default address for each customer profile
  const customerIds = (profiles ?? []).map((p) => p.id);
  let addressesMap: Record<string, any> = {};

  if (customerIds.length > 0) {
    const { data: addresses } = await supabase
      .from("addresses")
      .select("*")
      .in("user_id", customerIds)
      .order("created_at", { ascending: false });

    if (addresses) {
      for (const addr of addresses) {
        if (!addressesMap[addr.user_id]) {
          addressesMap[addr.user_id] = addr;
        }
      }
    }
  }

  const customers = (profiles ?? []).map((p) => ({
    ...p,
    default_address: addressesMap[p.id] || null,
  }));

  return NextResponse.json({ customers });
}
