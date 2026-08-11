import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*, parent:parent_id(id, name, slug)")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, categories: categories || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, description, parent_id, icon_path, banner_path, sort_order = 0, is_published = true } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }

    const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const supabase = await createSupabaseServerClient();
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name,
        slug: cleanSlug,
        description,
        parent_id: parent_id || null,
        icon_path: icon_path || null,
        banner_path: banner_path || null,
        image_path: banner_path || icon_path || null,
        sort_order: Number(sort_order) || 0,
        is_active: is_published,
        is_published,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    if (updates.is_published !== undefined) {
      updates.is_active = updates.is_published;
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").update(updates).eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Category updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await assertAdminApi();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Category ID is required." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Category deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
