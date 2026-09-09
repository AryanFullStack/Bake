import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { computeDealStatus, getAdminDealsSummary } from "@/lib/deals";

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

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";
    const dealTypeFilter = searchParams.get("deal_type") || "";

    const supabase = await getAdminDatabaseClient();

    let query = supabase
      .from("deals")
      .select("*, deal_products(id, product_id, variation_id, custom_deal_price)", { count: "exact" })
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,badge_text.ilike.%${search}%`);
    }

    if (dealTypeFilter) {
      query = query.eq("deal_type", dealTypeFilter);
    }

    const { data: rawDeals, count, error } = await query;

    if (error) {
      console.error("[API admin/deals GET] Database query error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const now = new Date();
    let deals = (rawDeals ?? []).map((d: any) => {
      const computedStatus = computeDealStatus(d, now);
      return {
        ...d,
        discount_value: Number(d.discount_value ?? 0),
        priority: Number(d.priority ?? 1),
        status: computedStatus,
        products_count: (d.deal_products ?? []).length,
      };
    });

    if (statusFilter) {
      deals = deals.filter((d: any) => d.status === statusFilter);
    }

    const totalCount = deals.length;
    const summary = await getAdminDealsSummary();

    if (pageParam) {
      const page = parseInt(pageParam, 10) || 1;
      const limit = parseInt(limitParam || "15", 10);
      const from = (page - 1) * limit;
      const paginatedDeals = deals.slice(from, from + limit);

      return NextResponse.json({
        success: true,
        summary,
        total: totalCount,
        deals: paginatedDeals,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary,
      total: totalCount,
      deals,
    });
  } catch (error: any) {
    console.error("[API admin/deals GET] Unexpected server error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      slug,
      description,
      short_description,
      deal_type = "percentage",
      discount_value = 0,
      banner_image,
      mobile_banner_image,
      badge_text,
      start_at,
      end_at,
      priority = 1,
      is_active = true,
      is_featured = false,
      max_quantity_per_customer,
      total_quantity,
      min_quantity,
      min_cart_amount,
      max_discount_amount,
      deal_products = [],
    } = body;

    if (!name || !start_at || !end_at) {
      return NextResponse.json({ error: "Deal name, start date, and end date are required." }, { status: 400 });
    }

    const startDate = new Date(start_at);
    const endDate = new Date(end_at);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid start or end date/time format." }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: "End date must be after the start date." }, { status: 400 });
    }

    const cleanSlug = slugify(slug || name);
    const supabase = await getAdminDatabaseClient();

    // Check slug uniqueness
    const { data: existing } = await supabase.from("deals").select("id").eq("slug", cleanSlug).maybeSingle();
    const finalSlug = existing ? `${cleanSlug}-${Date.now().toString().slice(-4)}` : cleanSlug;

    // 1. Insert Deal record
    const { data: deal, error: dealErr } = await supabase
      .from("deals")
      .insert({
        name,
        slug: finalSlug,
        description: description || null,
        short_description: short_description || null,
        deal_type,
        discount_value: Number(discount_value) || 0,
        banner_image: banner_image || null,
        mobile_banner_image: mobile_banner_image || null,
        badge_text: badge_text || null,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        priority: Math.max(1, Number(priority) || 1),
        is_active: Boolean(is_active),
        is_featured: Boolean(is_featured),
        max_quantity_per_customer: max_quantity_per_customer ? Number(max_quantity_per_customer) : null,
        total_quantity: total_quantity ? Number(total_quantity) : null,
        min_quantity: min_quantity ? Number(min_quantity) : null,
        min_cart_amount: min_cart_amount ? Number(min_cart_amount) : null,
        max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
      })
      .select("id, slug")
      .single();

    if (dealErr || !deal) {
      console.error("[API admin/deals POST] Deal insertion failed:", dealErr);
      return NextResponse.json({ error: dealErr?.message || "Failed to create deal." }, { status: 400 });
    }

    // 2. Insert Deal Products if provided
    if (Array.isArray(deal_products) && deal_products.length > 0) {
      const productsToInsert = deal_products.map((item: any) => ({
        deal_id: deal.id,
        product_id: item.product_id,
        variation_id: item.variation_id || null,
        custom_deal_price: item.custom_deal_price ? Number(item.custom_deal_price) : null,
      }));

      const { error: dpErr } = await supabase.from("deal_products").insert(productsToInsert);
      if (dpErr) {
        console.error("[API admin/deals POST] Deal products insertion warning:", dpErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Deal created successfully.",
      deal_id: deal.id,
      slug: deal.slug,
    });
  } catch (error: any) {
    console.error("[API admin/deals POST] Unexpected error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create deal" }, { status: 500 });
  }
}
