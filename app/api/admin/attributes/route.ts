import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function GET() {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: attributes, error } = await supabase
      .from("global_attributes")
      .select("id, name, slug, display_type, description, sort_order, global_attribute_values(id, label, slug, swatch_color, swatch_image, sort_order, is_active)")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[API admin/attributes GET] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, attributes: attributes || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch attributes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, display_type = "button", description, values = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Attribute name is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const slug = slugify(name);

    // Upsert global attribute
    const { data: attr, error: attrErr } = await supabase
      .from("global_attributes")
      .upsert({ name, slug, display_type, description, updated_at: new Date().toISOString() }, { onConflict: "slug" })
      .select("id")
      .single();

    if (attrErr || !attr) {
      return NextResponse.json({ error: attrErr?.message || "Failed to save attribute" }, { status: 400 });
    }

    // Insert values if present
    if (Array.isArray(values) && values.length > 0) {
      const valInserts = values.map((val: any, idx: number) => ({
        attribute_id: attr.id,
        label: val.label,
        slug: val.slug || slugify(val.label),
        swatch_color: val.swatchColor || val.swatch_color || null,
        swatch_image: val.swatchImage || val.swatch_image || null,
        sort_order: val.sortOrder ?? idx,
        is_active: val.isActive !== false,
      }));

      await supabase.from("global_attribute_values").upsert(valInserts, { onConflict: "attribute_id,slug" });
    }

    return NextResponse.json({ success: true, attribute_id: attr.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save attribute" }, { status: 500 });
  }
}
