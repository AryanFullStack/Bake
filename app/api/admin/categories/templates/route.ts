import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Fallback recommended attribute templates per category keywords
const DEFAULT_CATEGORY_RECOMMENDATIONS: Record<string, Array<{ name: string; displayType: "button" | "color" | "image" | "radio"; values: string[] }>> = {
  cake: [
    { name: "Size", displayType: "button", values: ["1 Pound", "2 Pound", "3 Pound", "5 Pound"] },
    { name: "Flavor", displayType: "radio", values: ["Chocolate", "Vanilla", "Red Velvet", "Lotus Biscoff", "Salted Caramel"] },
    { name: "Shape", displayType: "button", values: ["Round", "Heart", "Square"] },
  ],
  watch: [
    { name: "Strap Color", displayType: "color", values: ["Black", "Brown", "Silver", "Gold", "Navy"] },
    { name: "Dial Color", displayType: "color", values: ["Black", "Blue", "White", "Green", "Silver"] },
    { name: "Strap Material", displayType: "button", values: ["Genuine Leather", "Stainless Steel", "Silicone", "Nylon"] },
  ],
  kitchen: [
    { name: "Color", displayType: "color", values: ["Matte Black", "White", "Stainless Steel", "Red", "Pastel Green"] },
    { name: "Size", displayType: "button", values: ["Small", "Medium", "Large"] },
    { name: "Capacity", displayType: "button", values: ["500ml", "1L", "1.5L", "2L"] },
  ],
  decoration: [
    { name: "Color", displayType: "color", values: ["Gold", "Silver", "Rose Gold", "Warm White", "Multi-Color"] },
    { name: "Size", displayType: "button", values: ["Small", "Medium", "Large", "Extra Large"] },
    { name: "Style", displayType: "button", values: ["Modern", "Vintage", "Minimalist", "Boho"] },
  ],
  gift: [
    { name: "Pack Size", displayType: "button", values: ["Single Pack", "Pack of 2", "Pack of 5", "Gift Box Deluxe"] },
    { name: "Color", displayType: "color", values: ["Red", "Pink", "Gold", "Black"] },
    { name: "Ribbon Type", displayType: "button", values: ["Satin", "Velvet", "Organza"] },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category_id");
    const categorySlug = searchParams.get("category_slug") || "";

    const supabase = await createSupabaseServerClient();

    let dbTemplates: any[] = [];
    if (categoryId) {
      const { data } = await supabase
        .from("category_attribute_templates")
        .select("id, name, slug, display_type, is_required, sort_order, default_values")
        .eq("category_id", categoryId)
        .order("sort_order");
      dbTemplates = data || [];
    }

    if (dbTemplates.length > 0) {
      return NextResponse.json({ success: true, templates: dbTemplates });
    }

    // Match keyword in slug/name
    const slugLower = categorySlug.toLowerCase();
    let matchedKey = "cake";
    for (const key of Object.keys(DEFAULT_CATEGORY_RECOMMENDATIONS)) {
      if (slugLower.includes(key)) {
        matchedKey = key;
        break;
      }
    }

    const recommendations = DEFAULT_CATEGORY_RECOMMENDATIONS[matchedKey] || DEFAULT_CATEGORY_RECOMMENDATIONS["cake"];

    return NextResponse.json({
      success: true,
      templates: recommendations.map((rec, idx) => ({
        name: rec.name,
        slug: rec.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        display_type: rec.displayType,
        is_required: true,
        sort_order: idx,
        default_values: rec.values.map(val => ({ label: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch category templates" }, { status: 500 });
  }
}
