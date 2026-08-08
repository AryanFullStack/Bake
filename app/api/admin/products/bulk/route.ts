import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mediaService } from "@/lib/media/media-service";

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { action, ids, stockValue } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No product IDs provided for bulk action." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    if (action === "publish") {
      const { error } = await supabase
        .from("products")
        .update({ status: "published", is_published: true })
        .in("id", ids);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: `${ids.length} products published.` });
    }

    if (action === "draft") {
      const { error } = await supabase
        .from("products")
        .update({ status: "draft", is_published: false })
        .in("id", ids);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: `${ids.length} products moved to draft.` });
    }

    if (action === "stock_update") {
      const newStock = Number(stockValue) || 0;
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .in("id", ids);

      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: `Stock updated for ${ids.length} products.` });
    }

    if (action === "delete") {
      // Fetch associated images for disk cleanup before bulk deletion
      const { data: products } = await supabase
        .from("products")
        .select("featured_image, product_images(storage_path)")
        .in("id", ids);

      if (Array.isArray(products)) {
        for (const p of products) {
          if (p.featured_image) await mediaService.deleteImage(p.featured_image);
          if (Array.isArray(p.product_images)) {
            for (const img of p.product_images) {
              if (img.storage_path) await mediaService.deleteImage(img.storage_path);
            }
          }
        }
      }

      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: `${ids.length} products deleted.` });
    }

    return NextResponse.json({ error: "Invalid bulk action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bulk operation failed" }, { status: 500 });
  }
}
