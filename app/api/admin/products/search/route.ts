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
    .from("products")
    .select("*, product_variations(*), product_images(storage_path, sort_order)")
    .eq("is_published", true)
    .order("name")
    .limit(30);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data: products, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ products: products ?? [] });
}
