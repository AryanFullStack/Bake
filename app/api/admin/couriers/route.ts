import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    const { data: couriers, error } = await dbClient
      .from("couriers")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ couriers: couriers ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch couriers" }, { status: 500 });
  }
}

const courierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Courier name is required").max(100),
  code: z.string().trim().min(2, "Code is required").max(50),
  website_url: z.string().trim().url().optional().or(z.literal("")).nullable(),
  tracking_url_template: z.string().trim().optional().or(z.literal("")).nullable(),
  phone: z.string().trim().optional().or(z.literal("")).nullable(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export async function POST(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const parsed = courierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid courier parameters", details: parsed.error.format() }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    const { data: courier, error } = await dbClient
      .from("couriers")
      .insert({
        name: parsed.data.name,
        code: parsed.data.code.toLowerCase().replace(/\s+/g, "_"),
        website_url: parsed.data.website_url || null,
        tracking_url_template: parsed.data.tracking_url_template || null,
        phone: parsed.data.phone || null,
        is_active: parsed.data.is_active,
        sort_order: parsed.data.sort_order,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, courier });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create courier" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Courier ID is required" }, { status: 400 });
    }

    const parsed = courierSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid courier payload" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.code !== undefined) updateData.code = parsed.data.code.toLowerCase().replace(/\s+/g, "_");
    if (parsed.data.website_url !== undefined) updateData.website_url = parsed.data.website_url || null;
    if (parsed.data.tracking_url_template !== undefined) updateData.tracking_url_template = parsed.data.tracking_url_template || null;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone || null;
    if (parsed.data.is_active !== undefined) updateData.is_active = parsed.data.is_active;
    if (parsed.data.sort_order !== undefined) updateData.sort_order = parsed.data.sort_order;

    const { data: courier, error } = await dbClient
      .from("couriers")
      .update(updateData)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, courier });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update courier" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing courier ID" }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const dbClient = createSupabaseAdminClient() ?? supabase;

    const { error } = await dbClient.from("couriers").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete courier" }, { status: 500 });
  }
}
