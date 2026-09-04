import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeDealStatus, getDealAnalytics } from "@/lib/deals";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getAdminDatabaseClient() {
  return createSupabaseAdminClient() || (await createSupabaseServerClient());
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await getAdminDatabaseClient();

    const { data: deal, error } = await supabase
      .from("deals")
      .select("*, deal_products(*)")
      .eq("id", id)
      .single();

    if (error || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const { data: dealProducts } = await supabase
      .from("deal_products")
      .select(
        `
        id, deal_id, product_id, variation_id, custom_deal_price, created_at,
        products (
          id, name, slug, sku, price, sale_price, stock_quantity, low_stock_threshold, is_published, featured_image, status,
          categories ( name )
        ),
        product_variations (
          id, name, sku, regular_price, sale_price, stock_quantity, attributes
        )
      `
      )
      .eq("deal_id", id);

    const analytics = await getDealAnalytics(id);
    const status = computeDealStatus(deal);

    return NextResponse.json({
      success: true,
      deal: {
        ...deal,
        discount_value: Number(deal.discount_value ?? 0),
        priority: Number(deal.priority ?? 1),
        status,
        deal_products: dealProducts || [],
        products_count: (dealProducts || []).length,
      },
      analytics,
    });
  } catch (error: any) {
    console.error("[API admin/deals/[id] GET] Server error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, deal_products, ...updates } = body;

    const supabase = await getAdminDatabaseClient();

    // 1. Quick actions
    if (action === "pause") {
      const { error } = await supabase.from("deals").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: "Deal paused successfully." });
    }

    if (action === "resume") {
      const { error } = await supabase.from("deals").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: "Deal resumed successfully." });
    }

    if (action === "end_now") {
      const { error } = await supabase.from("deals").update({ end_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: "Deal ended immediately." });
    }

    // 2. Full update
    if (updates.start_at && updates.end_at) {
      const startDate = new Date(updates.start_at);
      const endDate = new Date(updates.end_at);
      if (endDate <= startDate) {
        return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
      }
    }

    if (updates.slug) {
      updates.slug = slugify(updates.slug);
    }

    const { error: updateErr } = await supabase
      .from("deals")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Sync deal products if provided
    if (Array.isArray(deal_products)) {
      await supabase.from("deal_products").delete().eq("deal_id", id);
      if (deal_products.length > 0) {
        const itemsToInsert = deal_products.map((dp: any) => ({
          deal_id: id,
          product_id: dp.product_id,
          variation_id: dp.variation_id || null,
          custom_deal_price: dp.custom_deal_price ? Number(dp.custom_deal_price) : null,
        }));
        await supabase.from("deal_products").insert(itemsToInsert);
      }
    }

    return NextResponse.json({ success: true, message: "Deal updated successfully." });
  } catch (error: any) {
    console.error("[API admin/deals/[id] PATCH] Server error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update deal" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "duplicate";

    const supabase = await getAdminDatabaseClient();

    if (action === "duplicate") {
      const { data: original, error: origErr } = await supabase
        .from("deals")
        .select("*, deal_products(*)")
        .eq("id", id)
        .single();

      if (origErr || !original) {
        return NextResponse.json({ error: "Original deal not found." }, { status: 404 });
      }

      const dupName = `${original.name} (Copy)`;
      const dupSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

      const { data: dupDeal, error: dupErr } = await supabase
        .from("deals")
        .insert({
          name: dupName,
          slug: dupSlug,
          description: original.description,
          short_description: original.short_description,
          deal_type: original.deal_type,
          discount_value: original.discount_value,
          banner_image: original.banner_image,
          mobile_banner_image: original.mobile_banner_image,
          badge_text: original.badge_text,
          start_at: original.start_at,
          end_at: original.end_at,
          priority: original.priority,
          is_active: false, // Start copies in paused/draft state
          is_featured: false,
          max_quantity_per_customer: original.max_quantity_per_customer,
          total_quantity: original.total_quantity,
          min_quantity: original.min_quantity,
          min_cart_amount: original.min_cart_amount,
          max_discount_amount: original.max_discount_amount,
        })
        .select("id, slug")
        .single();

      if (dupErr || !dupDeal) {
        return NextResponse.json({ error: dupErr?.message || "Failed to duplicate deal." }, { status: 400 });
      }

      if (Array.isArray(original.deal_products) && original.deal_products.length > 0) {
        const dupItems = original.deal_products.map((dp: any) => ({
          deal_id: dupDeal.id,
          product_id: dp.product_id,
          variation_id: dp.variation_id,
          custom_deal_price: dp.custom_deal_price,
        }));
        await supabase.from("deal_products").insert(dupItems);
      }

      return NextResponse.json({
        success: true,
        message: "Deal duplicated successfully.",
        deal_id: dupDeal.id,
        slug: dupDeal.slug,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[API admin/deals/[id] POST] Server error:", error);
    return NextResponse.json({ error: error?.message || "Action failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await getAdminDatabaseClient();

    // 1. Delete associated deal products
    await supabase.from("deal_products").delete().eq("deal_id", id);

    // 2. Delete deal record
    const { error } = await supabase.from("deals").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Deal deleted successfully.",
    });
  } catch (error: any) {
    console.error("[API admin/deals/[id] DELETE] Server error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete deal" }, { status: 500 });
  }
}
