import { NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await assertAdminApi();
    const adminClient = createSupabaseAdminClient();
    const supabase = adminClient ?? (await createSupabaseServerClient());

    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories:category_id(id, name, slug), product_variations(*), product_images(id, storage_path, sort_order)")
      .order("name", { ascending: true })
      .limit(500);

    if (error) {
      console.error("[API admin/deals/products GET] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const normalized = (products || []).map((p: any) => {
      const sortedImgs = (p.product_images || []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return {
        ...p,
        featured_image: p.featured_image || sortedImgs[0]?.storage_path || null,
      };
    });

    return NextResponse.json({ success: true, products: normalized });
  } catch (err: any) {
    console.error("[API admin/deals/products GET] Server error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch products" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
