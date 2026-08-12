import { NextResponse } from "next/server";
import { z } from "zod";
import { assertAdminApi } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await assertAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("couriers")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ couriers: data ?? [] });
}

const courierSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  code: z.string().trim().min(2).toLowerCase(),
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
      return NextResponse.json({ error: "Invalid courier details" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const payload = {
      name: parsed.data.name,
      code: parsed.data.code,
      website_url: parsed.data.website_url || null,
      tracking_url_template: parsed.data.tracking_url_template || null,
      phone: parsed.data.phone || null,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    };

    if (parsed.data.id) {
      const { data, error } = await supabase
        .from("couriers")
        .update(payload)
        .eq("id", parsed.data.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ courier: data });
    } else {
      const { data, error } = await supabase
        .from("couriers")
        .insert(payload)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ courier: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to save courier" }, { status: 500 });
  }
}
