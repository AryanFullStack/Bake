import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, "Label is required").max(40),
  full_name: z.string().trim().min(2, "Full name is required").max(120),
  phone: z.string().trim().min(7, "Valid phone number required").max(30),
  city: z.string().trim().min(1, "City is required").max(100),
  area: z.string().trim().min(2, "Area is required").max(120),
  address: z.string().trim().min(5, "Complete address is required").max(500),
  landmark: z.string().trim().max(160).optional().or(z.literal("")),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  is_default: z.boolean().optional().default(false),
});

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error && error.message?.includes("is_default")) {
    const fallback = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ addresses: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(", ");
    return NextResponse.json({ error: msg || "Invalid address data" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to save an address" }, { status: 401 });
  }

  // Check existing count to make first address default
  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const shouldBeDefault = parsed.data.is_default || count === 0;

  if (shouldBeDefault) {
    try {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    } catch {}
  }

  const insertPayload: Record<string, any> = {
    user_id: user.id,
    label: parsed.data.label,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone.replace(/\s+/g, ""),
    city: parsed.data.city,
    area: parsed.data.area,
    address: parsed.data.address,
    landmark: parsed.data.landmark || null,
    instructions: parsed.data.instructions || null,
    is_default: shouldBeDefault,
  };

  let { data, error } = await supabase
    .from("addresses")
    .insert(insertPayload)
    .select()
    .single();

  if (error && error.message?.includes("is_default")) {
    delete insertPayload.is_default;
    const fallback = await supabase
      .from("addresses")
      .insert(insertPayload)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, address: data });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const parsed = addressSchema.extend({ id: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address parameters" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (parsed.data.is_default) {
    try {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    } catch {}
  }

  const updatePayload: Record<string, any> = {
    label: parsed.data.label,
    full_name: parsed.data.full_name,
    phone: parsed.data.phone.replace(/\s+/g, ""),
    city: parsed.data.city,
    area: parsed.data.area,
    address: parsed.data.address,
    landmark: parsed.data.landmark || null,
    instructions: parsed.data.instructions || null,
    is_default: parsed.data.is_default ?? false,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from("addresses")
    .update(updatePayload)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error && error.message?.includes("is_default")) {
    delete updatePayload.is_default;
    delete updatePayload.updated_at;
    const fallback = await supabase
      .from("addresses")
      .update(updatePayload)
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, address: data });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid address ID" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
